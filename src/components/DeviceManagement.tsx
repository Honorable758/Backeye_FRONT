import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Smartphone, Battery, Wifi, WifiOff, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Device {
  id: string;
  device_id: string;
  phone_number: string;
  device_type: string;
  is_online: boolean;
  battery_level: number;
  last_seen: string;
  client_id: string | null;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  email: string;
  role: string;
}

export function DeviceManagement() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);

  useEffect(() => {
    loadDevices();
    loadUsers();
  }, []);

  const loadDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDevices(data || []);
    } catch (error) {
      console.error('Error loading devices:', error);
      toast.error('Failed to load devices');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('role', 'client');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleAddDevice = async (deviceData: {
    device_id: string;
    phone_number: string;
    device_type: string;
    client_id?: string;
  }) => {
    try {
      const { error } = await supabase
        .from('devices')
        .insert([{
          device_id: deviceData.device_id,
          phone_number: deviceData.phone_number,
          device_type: deviceData.device_type,
          client_id: deviceData.client_id || null,
          is_online: false,
          battery_level: 100,
          last_seen: new Date().toISOString(),
        }]);

      if (error) throw error;
      
      toast.success('Device added successfully');
      setShowAddModal(false);
      loadDevices();
    } catch (error) {
      console.error('Error adding device:', error);
      toast.error('Failed to add device');
    }
  };

  const handleUpdateDevice = async (deviceId: string, updates: Partial<Device>) => {
    try {
      const { error } = await supabase
        .from('devices')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', deviceId);

      if (error) throw error;
      
      toast.success('Device updated successfully');
      setEditingDevice(null);
      loadDevices();
    } catch (error) {
      console.error('Error updating device:', error);
      toast.error('Failed to update device');
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to delete this device?')) return;

    try {
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', deviceId);

      if (error) throw error;
      
      toast.success('Device deleted successfully');
      loadDevices();
    } catch (error) {
      console.error('Error deleting device:', error);
      toast.error('Failed to delete device');
    }
  };

  const getClientEmail = (clientId: string | null) => {
    if (!clientId) return 'Unassigned';
    const user = users.find(u => u.id === clientId);
    return user ? user.email : 'Unknown';
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
        <h2 className="text-2xl font-bold text-gray-900">Device Management</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Device
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Device
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned To
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Seen
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {devices.map((device) => (
              <tr key={device.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{device.device_id}</div>
                      <div className="text-sm text-gray-500">{device.phone_number}</div>
                      <div className="text-xs text-gray-400">{device.device_type}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {device.is_online ? (
                      <Wifi className="w-4 h-4 text-green-500" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-xs font-medium ${
                      device.is_online ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {device.is_online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div className="flex items-center mt-1">
                    <Battery className={`w-4 h-4 mr-1 ${
                      device.battery_level > 20 ? 'text-green-500' : 'text-red-500'
                    }`} />
                    <span className="text-xs text-gray-600">{device.battery_level}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {getClientEmail(device.client_id)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(device.last_seen).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setEditingDevice(device)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteDevice(device.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Device Modal */}
      {showAddModal && (
        <AddDeviceModal
          users={users}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddDevice}
        />
      )}

      {/* Edit Device Modal */}
      {editingDevice && (
        <EditDeviceModal
          device={editingDevice}
          users={users}
          onClose={() => setEditingDevice(null)}
          onUpdate={handleUpdateDevice}
        />
      )}
    </div>
  );
}

function AddDeviceModal({ 
  users,
  onClose, 
  onAdd 
}: { 
  users: User[];
  onClose: () => void; 
  onAdd: (deviceData: { device_id: string; phone_number: string; device_type: string; client_id?: string }) => void;
}) {
  const [formData, setFormData] = useState({
    device_id: '',
    phone_number: '',
    device_type: 'GPS Tracker',
    client_id: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      ...formData,
      client_id: formData.client_id || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Device</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Device ID
            </label>
            <input
              type="text"
              value={formData.device_id}
              onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Device Type
            </label>
            <input
              type="text"
              value={formData.device_type}
              onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign to Client (Optional)
            </label>
            <select
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </select>
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
              Add Device
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditDeviceModal({ 
  device,
  users,
  onClose, 
  onUpdate 
}: { 
  device: Device;
  users: User[];
  onClose: () => void; 
  onUpdate: (deviceId: string, updates: Partial<Device>) => void;
}) {
  const [formData, setFormData] = useState({
    device_id: device.device_id,
    phone_number: device.phone_number,
    device_type: device.device_type,
    client_id: device.client_id || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(device.id, {
      ...formData,
      client_id: formData.client_id || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Device</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Device ID
            </label>
            <input
              type="text"
              value={formData.device_id}
              onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Device Type
            </label>
            <input
              type="text"
              value={formData.device_type}
              onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign to Client
            </label>
            <select
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </select>
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
              Update Device
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}