import React, { useState } from 'react';
import { Users, Smartphone, MapPin, Settings, Bell, Shield } from 'lucide-react';
import { MapView } from './MapView';
import { UserManagement } from './UserManagement';
import { DeviceManagement } from './DeviceManagement';
import { GeofenceManager } from './GeofenceManager';
import { AlertsPanel } from './AlertsPanel';
import { useAuth } from '../contexts/AuthContext';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'map' | 'users' | 'devices' | 'geofences' | 'alerts'>('map');
  const { user, signOut } = useAuth();

  const tabs = [
    { id: 'map' as const, label: 'Live Map', icon: MapPin },
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'devices' as const, label: 'Devices', icon: Smartphone },
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
              <Shield className="w-8 h-8 text-indigo-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
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
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'devices' && <DeviceManagement />}
            {activeTab === 'geofences' && <GeofenceManager />}
            {activeTab === 'alerts' && <AlertsPanel />}
          </div>
        </div>
      </div>
    </div>
  );
}