import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, Clock, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Alert {
  id: string;
  device_id: string;
  geofence_id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface AlertWithDetails extends Alert {
  geofence_name?: string;
  device_name?: string;
}

export function AlertsPanel() {
  const [alerts, setAlerts] = useState<AlertWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const { user } = useAuth();

  useEffect(() => {
    loadAlerts();
    
    // Set up real-time subscription for new alerts
    const alertsSubscription = supabase
      .channel('alerts_updates')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'alerts' },
        (payload) => {
          const newAlert = payload.new as Alert;
          toast.error(`New Alert: ${newAlert.message}`);
          loadAlerts(); // Reload to get full details
        }
      )
      .subscribe();

    return () => {
      alertsSubscription.unsubscribe();
    };
  }, [user]);

  const loadAlerts = async () => {
    try {
      let query = supabase.from('alerts').select('*');
      
      // If user is a client, only show alerts for their devices
      if (user?.role === 'client') {
        const { data: userDevices } = await supabase
          .from('devices')
          .select('device_id')
          .eq('client_id', user.id);
        
        if (userDevices && userDevices.length > 0) {
          const deviceIds = userDevices.map(d => d.device_id);
          query = query.in('device_id', deviceIds);
        } else {
          // No devices assigned to this client
          setAlerts([]);
          setIsLoading(false);
          return;
        }
      }

      const { data: alertsData, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich alerts with geofence and device names
      const enrichedAlerts = await Promise.all(
        (alertsData || []).map(async (alert) => {
          const [geofenceResult, deviceResult] = await Promise.all([
            supabase.from('geofences').select('name').eq('id', alert.geofence_id).single(),
            supabase.from('devices').select('device_id').eq('device_id', alert.device_id).single()
          ]);

          return {
            ...alert,
            geofence_name: geofenceResult.data?.name || 'Unknown Geofence',
            device_name: deviceResult.data?.device_id || alert.device_id,
          };
        })
      );

      setAlerts(enrichedAlerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
      toast.error('Failed to load alerts');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) throw error;
      
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, is_read: true } : alert
      ));
    } catch (error) {
      console.error('Error marking alert as read:', error);
      toast.error('Failed to update alert');
    }
  };

  const markAllAsRead = async () => {
    try {
      let query = supabase.from('alerts').update({ is_read: true }).eq('is_read', false);
      
      // If user is a client, only update alerts for their devices
      if (user?.role === 'client') {
        const { data: userDevices } = await supabase
          .from('devices')
          .select('device_id')
          .eq('client_id', user.id);
        
        if (userDevices && userDevices.length > 0) {
          const deviceIds = userDevices.map(d => d.device_id);
          query = query.in('device_id', deviceIds);
        }
      }

      const { error } = await query;

      if (error) throw error;
      
      setAlerts(alerts.map(alert => ({ ...alert, is_read: true })));
      toast.success('All alerts marked as read');
    } catch (error) {
      console.error('Error marking all alerts as read:', error);
      toast.error('Failed to update alerts');
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'geofence_violation':
        return AlertTriangle;
      case 'device_offline':
        return Clock;
      case 'low_battery':
        return Bell;
      default:
        return Bell;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'geofence_violation':
        return 'text-red-600 bg-red-100';
      case 'device_offline':
        return 'text-yellow-600 bg-yellow-100';
      case 'low_battery':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unread') return !alert.is_read;
    if (filter === 'read') return alert.is_read;
    return true;
  });

  const unreadCount = alerts.filter(alert => !alert.is_read).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">Alerts</h2>
          {unreadCount > 0 && (
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'unread' | 'read')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Alerts</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {filteredAlerts.map((alert) => {
          const Icon = getAlertIcon(alert.type);
          const colorClass = getAlertColor(alert.type);
          
          return (
            <div
              key={alert.id}
              className={`bg-white rounded-lg shadow-sm border p-4 ${
                !alert.is_read ? 'border-l-4 border-l-red-500' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {alert.type.replace('_', ' ').toUpperCase()}
                      </h3>
                      {!alert.is_read && (
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span>{alert.device_name}</span>
                      </div>
                      <div className="flex items-center">
                        <span>Geofence: {alert.geofence_name}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{new Date(alert.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {!alert.is_read && (
                  <button
                    onClick={() => markAsRead(alert.id)}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'unread' ? 'No Unread Alerts' : 
             filter === 'read' ? 'No Read Alerts' : 'No Alerts'}
          </h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? 'All alerts will appear here when they are generated.'
              : `No ${filter} alerts at the moment.`
            }
          </p>
        </div>
      )}
    </div>
  );
}