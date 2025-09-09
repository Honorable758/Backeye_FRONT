import React, { useState, useEffect } from 'react';
import { MapPin, Settings, Bell, Battery, Wifi, WifiOff } from 'lucide-react';
import { MapView } from './MapView';
import { GeofenceManager } from './GeofenceManager';
import { AlertsPanel } from './AlertsPanel';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Device {
  id: string;
  device_id: string;
  phone_number: string;
  device_type: string;
  is_online: boolean;
  battery_level: number;
  last_seen: string;
}

export function ClientDashboard() {
  const [activeTab, setActiveTab] = useState<'map' | 'geofences' | 'alerts'>('map');
  const [devices, setDevices] = useState<Device[]>([]);
  const { user, signOut } = useAuth();

  useEffect(() => {
    loadDevices();
  }, [user]);

  const loadDevices = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('client_id', user.id);

      if (error) throw error;
      setDevices(data || []);
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  };

  const tabs = [
    { id: 'map' as const, label: 'Live Map', icon: MapPin },
    { id: 'geofences' as const, label: 'Geofences', icon: Settings },
    { id: 'alerts' as const, label: 'Alerts', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <MapPin className="w-8 h-8 text-indigo-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Vehicle Tracker</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
              <button
                onClick={signOut}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Device Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {devices.map((device) => (
            <div key={device.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {device.device_id}
                </h3>
                {device.is_online ? (
                  <Wifi className="w-5 h-5 text-green-500" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-500" />
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status</span>
                  <span className={`text-xs font-medium ${
                    device.is_online ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {device.is_online ? 'Online' : 'Offline'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Battery</span>
                  <div className="flex items-center">
                    <Battery className={`w-4 h-4 mr-1 ${
                      device.battery_level > 20 ? 'text-green-500' : 'text-red-500'
                    }`} />
                    <span className="text-xs font-medium">{device.battery_level}%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Type</span>
                  <span className="text-xs font-medium text-gray-900">
                    {device.device_type}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Last Seen</span>
                  <span className="text-xs text-gray-600">
                    {new Date(device.last_seen).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {devices.length === 0 && (
            <div className="col-span-full bg-white rounded-lg shadow-sm p-8 text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Devices Assigned</h3>
              <p className="text-gray-600">
                Contact your administrator to assign devices to your account.
              </p>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'map' && <MapView />}
            {activeTab === 'geofences' && <GeofenceManager />}
            {activeTab === 'alerts' && <AlertsPanel />}
          </div>
        </div>
      </div>
    </div>
  );
}