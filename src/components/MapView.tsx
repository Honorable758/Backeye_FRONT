import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Device {
  id: string;
  device_id: string;
  phone_number: string;
  device_type: string;
  is_online: boolean;
  battery_level: number;
  client_id: string | null;
}

interface LocationData {
  id: number;
  device_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  battery_level: number;
  device_type: string;
}

interface Geofence {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  radius: number;
  is_active: boolean;
}

export function MapView() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const geofenceCirclesRef = useRef<Map<string, google.maps.Circle>>(new Map());
  const [devices, setDevices] = useState<Device[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const { user } = useAuth();

  console.log('Supabase client:', supabase);
console.log('Auth user:', user);

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current) return;

      try {
        // Check if Google Maps API key is available
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        console.log('Google Maps API Key:', apiKey ? 'Present' : 'Missing');
        if (!apiKey) {
          setMapError('Google Maps API key is not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file.');
          setIsLoading(false);
          return;
        }

        const loader = new Loader({
          apiKey: apiKey,
          version: 'weekly',
          libraries: ['places'],
        });

        console.log('Loading Google Maps...');
        await loader.load();
        console.log('Google Maps loaded successfully');

        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 40.7128, lng: -74.0060 }, // Default to NYC
          zoom: 12,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });

        mapInstanceRef.current = map;
        
        await loadDevicesAndLocations();
        await loadGeofences();
      } catch (error) {
        console.error('Error initializing map:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setMapError(`Failed to load map: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    initializeMap();

    // Set up real-time subscriptions
    const locationSubscription = supabase
      .channel('location_updates')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'location_data' },
        (payload) => {
          updateDeviceLocation(payload.new as LocationData);
        }
      )
      .subscribe();

    return () => {
      locationSubscription.unsubscribe();
    };
  }, []);

  const loadDevicesAndLocations = async () => {
    try {
      let devicesQuery = supabase.from('devices').select('*');
      
      // If user is a client, only show their devices
      if (user?.role === 'client') {
        devicesQuery = devicesQuery.eq('client_id', user.id);
      }

      const { data: devicesData, error: devicesError } = await devicesQuery;

      if (devicesError) throw devicesError;

      setDevices(devicesData || []);

      // Load latest locations for each device
      for (const device of devicesData || []) {
        const { data: locationData } = await supabase
          .from('location_data')
          .select('*')
          .eq('device_id', device.device_id)
          .order('timestamp', { ascending: false })
          .limit(1);

        if (locationData && locationData.length > 0) {
          updateDeviceLocation(locationData[0]);
        }
      }
    } catch (error) {
      console.error('Error loading devices:', error);
      toast.error('Failed to load devices');
    }
  };

  const loadGeofences = async () => {
    try {
      const { data: geofencesData, error } = await supabase
        .from('geofences')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      setGeofences(geofencesData || []);
      
      // Clear existing geofence circles
      geofenceCirclesRef.current.forEach(circle => circle.setMap(null));
      geofenceCirclesRef.current.clear();

      // Add geofence circles to map
      geofencesData?.forEach(geofence => {
        if (mapInstanceRef.current) {
          const circle = new google.maps.Circle({
            strokeColor: getGeofenceColor(geofence.type),
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: getGeofenceColor(geofence.type),
            fillOpacity: 0.15,
            map: mapInstanceRef.current,
            center: { lat: geofence.latitude, lng: geofence.longitude },
            radius: geofence.radius,
          });

          // Add info window for geofence
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div class="p-2">
                <h3 class="font-semibold text-gray-900">${geofence.name}</h3>
                <p class="text-sm text-gray-600">Type: ${geofence.type}</p>
                <p class="text-sm text-gray-600">Radius: ${geofence.radius}m</p>
              </div>
            `,
          });

          circle.addListener('click', () => {
            infoWindow.setPosition({ lat: geofence.latitude, lng: geofence.longitude });
            infoWindow.open(mapInstanceRef.current);
          });

          geofenceCirclesRef.current.set(geofence.id, circle);
        }
      });
    } catch (error) {
      console.error('Error loading geofences:', error);
      toast.error('Failed to load geofences');
    }
  };

  const updateDeviceLocation = (locationData: LocationData) => {
    if (!mapInstanceRef.current) return;

    const device = devices.find(d => d.device_id === locationData.device_id);
    if (!device) return;

    const position = { lat: locationData.latitude, lng: locationData.longitude };
    
    // Remove existing marker
    const existingMarker = markersRef.current.get(device.device_id);
    if (existingMarker) {
      existingMarker.setMap(null);
    }

    // Create new marker
    const marker = new google.maps.Marker({
      position,
      map: mapInstanceRef.current,
      title: device.device_id,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: device.is_online ? '#10B981' : '#EF4444',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
      },
    });

    // Add info window
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div class="p-3">
          <h3 class="font-semibold text-gray-900 mb-2">${device.device_id}</h3>
          <div class="space-y-1 text-sm">
            <p class="flex items-center">
              <span class="w-2 h-2 rounded-full mr-2 ${device.is_online ? 'bg-green-500' : 'bg-red-500'}"></span>
              ${device.is_online ? 'Online' : 'Offline'}
            </p>
            <p class="text-gray-600">Battery: ${locationData.battery_level}%</p>
            <p class="text-gray-600">Type: ${device.device_type}</p>
            <p class="text-gray-600">Last Update: ${new Date(locationData.timestamp).toLocaleString()}</p>
            <p class="text-gray-600">Accuracy: ${locationData.accuracy}m</p>
          </div>
        </div>
      `,
    });

    marker.addListener('click', () => {
      infoWindow.open(mapInstanceRef.current, marker);
    });

    markersRef.current.set(device.device_id, marker);

    // Center map on first device location
    if (markersRef.current.size === 1) {
      mapInstanceRef.current.setCenter(position);
    }
  };

  const getGeofenceColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'garage':
        return '#3B82F6'; // Blue
      case 'hot_zone':
        return '#EF4444'; // Red
      case 'safe_zone':
        return '#10B981'; // Green
      default:
        return '#8B5CF6'; // Purple
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center p-8">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Map Loading Error</h3>
          <p className="text-gray-600 mb-4">{mapError}</p>
          <button
            onClick={() => {
              setMapError(null);
              setIsLoading(true);
              window.location.reload();
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Retry Loading Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full h-96 rounded-lg shadow-lg" />
      
      {devices.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-90 rounded-lg">
          <div className="text-center">
            <p className="text-gray-600 mb-2">No devices found</p>
            <p className="text-sm text-gray-500">
              {user?.role === 'client' 
                ? 'Contact your administrator to assign devices to your account'
                : 'Add devices in the admin panel to start tracking'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}