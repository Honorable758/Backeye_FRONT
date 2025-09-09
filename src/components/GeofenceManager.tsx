import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Shield, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Geofence {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  radius: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function GeofenceManager() {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGeofence, setEditingGeofence] = useState<Geofence | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadGeofences();
  }, []);

  const loadGeofences = async () => {
    try {
      const { data, error } = await supabase
        .from('geofences')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGeofences(data || []);
    } catch (error) {
      console.error('Error loading geofences:', error);
      toast.error('Failed to load geofences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGeofence = async (geofenceData: {
    name: string;
    type: string;
    latitude: number;
    longitude: number;
    radius: number;
  }) => {
    try {
      const { error } = await supabase
        .from('geofences')
        .insert([{
          ...geofenceData,
          is_active: true,
        }]);

      if (error) throw error;
      
      toast.success('Geofence added successfully');
      setShowAddModal(false);
      loadGeofences();
    } catch (error) {
      console.error('Error adding geofence:', error);
      toast.error('Failed to add geofence');
    }
  };

  const handleUpdateGeofence = async (geofenceId: string, updates: Partial<Geofence>) => {
    try {
      const { error } = await supabase
        .from('geofences')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', geofenceId);

      if (error) throw error;
      
      toast.success('Geofence updated successfully');
      setEditingGeofence(null);
      loadGeofences();
    } catch (error) {
      console.error('Error updating geofence:', error);
      toast.error('Failed to update geofence');
    }
  };

  const handleDeleteGeofence = async (geofenceId: string) => {
    if (!confirm('Are you sure you want to delete this geofence?')) return;

    try {
      const { error } = await supabase
        .from('geofences')
        .delete()
        .eq('id', geofenceId);

      if (error) throw error;
      
      toast.success('Geofence deleted successfully');
      loadGeofences();
    } catch (error) {
      console.error('Error deleting geofence:', error);
      toast.error('Failed to delete geofence');
    }
  };

  const toggleGeofenceStatus = async (geofenceId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('geofences')
        .update({ is_active: !isActive, updated_at: new Date().toISOString() })
        .eq('id', geofenceId);

      if (error) throw error;
      
      toast.success(`Geofence ${!isActive ? 'activated' : 'deactivated'}`);
      loadGeofences();
    } catch (error) {
      console.error('Error toggling geofence status:', error);
      toast.error('Failed to update geofence status');
    }
  };

  const getGeofenceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'garage':
        return Shield;
      case 'hot_zone':
        return AlertTriangle;
      case 'safe_zone':
        return Shield;
      default:
        return MapPin;
    }
  };

  const getGeofenceColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'garage':
        return 'text-blue-600 bg-blue-100';
      case 'hot_zone':
        return 'text-red-600 bg-red-100';
      case 'safe_zone':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-purple-600 bg-purple-100';
    }
  };

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
        <h2 className="text-2xl font-bold text-gray-900">Geofence Management</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Geofence
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {geofences.map((geofence) => {
          const Icon = getGeofenceIcon(geofence.type);
          const colorClass = getGeofenceColor(geofence.type);
          
          return (
            <div key={geofence.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${colorClass} mr-3`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{geofence.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{geofence.type.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleGeofenceStatus(geofence.id, geofence.is_active)}
                    className={`w-10 h-6 rounded-full transition-colors ${
                      geofence.is_active ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      geofence.is_active ? 'translate-x-5' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Coordinates:</span>
                  <span className="text-gray-900">
                    {geofence.latitude.toFixed(6)}, {geofence.longitude.toFixed(6)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Radius:</span>
                  <span className="text-gray-900">{geofence.radius}m</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status:</span>
                  <span className={`font-medium ${
                    geofence.is_active ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {geofence.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setEditingGeofence(geofence)}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => handleDeleteGeofence(geofence.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {geofences.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Geofences</h3>
          <p className="text-gray-600 mb-4">
            Create your first geofence to start monitoring specific areas.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Add Geofence
          </button>
        </div>
      )}

      {/* Add Geofence Modal */}
      {showAddModal && (
        <GeofenceModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddGeofence}
        />
      )}

      {/* Edit Geofence Modal */}
      {editingGeofence && (
        <GeofenceModal
          geofence={editingGeofence}
          onClose={() => setEditingGeofence(null)}
          onSave={(data) => handleUpdateGeofence(editingGeofence.id, data)}
        />
      )}
    </div>
  );
}

function GeofenceModal({ 
  geofence,
  onClose, 
  onSave 
}: { 
  geofence?: Geofence;
  onClose: () => void; 
  onSave: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    name: geofence?.name || '',
    type: geofence?.type || 'custom',
    latitude: geofence?.latitude || 0,
    longitude: geofence?.longitude || 0,
    radius: geofence?.radius || 100,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const geofenceTypes = [
    { value: 'garage', label: 'Garage' },
    { value: 'hot_zone', label: 'Hot Zone' },
    { value: 'safe_zone', label: 'Safe Zone' },
    { value: 'custom', label: 'Custom' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {geofence ? 'Edit Geofence' : 'Add New Geofence'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              {geofenceTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Radius (meters)
            </label>
            <input
              type="number"
              min="1"
              value={formData.radius}
              onChange={(e) => setFormData({ ...formData, radius: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              {geofence ? 'Update' : 'Add'} Geofence
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}