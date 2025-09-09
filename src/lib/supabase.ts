import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          role: 'admin' | 'client';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          role: 'admin' | 'client';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          role?: 'admin' | 'client';
          created_at?: string;
          updated_at?: string;
        };
      };
      devices: {
        Row: {
          device_id: string;
          phone_number: string;
          last_seen: string;
          battery_level: number;
          is_online: boolean;
          created_at: string;
          updated_at: string;
          device_type: string;
          id: string;
          client_id: string | null;
        };
        Insert: {
          device_id: string;
          phone_number: string;
          last_seen?: string;
          battery_level?: number;
          is_online?: boolean;
          created_at?: string;
          updated_at?: string;
          device_type: string;
          id?: string;
          client_id?: string | null;
        };
        Update: {
          device_id?: string;
          phone_number?: string;
          last_seen?: string;
          battery_level?: number;
          is_online?: boolean;
          created_at?: string;
          updated_at?: string;
          device_type?: string;
          id?: string;
          client_id?: string | null;
        };
      };
      location_data: {
        Row: {
          id: number;
          device_id: string;
          latitude: number;
          longitude: number;
          accuracy: number;
          timestamp: string;
          battery_level: number;
          created_at: string;
          device_type: string;
        };
        Insert: {
          id?: number;
          device_id: string;
          latitude: number;
          longitude: number;
          accuracy: number;
          timestamp: string;
          battery_level: number;
          created_at?: string;
          device_type: string;
        };
        Update: {
          id?: number;
          device_id?: string;
          latitude?: number;
          longitude?: number;
          accuracy?: number;
          timestamp?: string;
          battery_level?: number;
          created_at?: string;
          device_type?: string;
        };
      };
      geofences: {
        Row: {
          id: string;
          name: string;
          type: string;
          latitude: number;
          longitude: number;
          radius: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: string;
          latitude: number;
          longitude: number;
          radius: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          latitude?: number;
          longitude?: number;
          radius?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          device_id: string;
          geofence_id: string;
          type: string;
          message: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          device_id: string;
          geofence_id: string;
          type: string;
          message: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          device_id?: string;
          geofence_id?: string;
          type?: string;
          message?: string;
          is_read?: boolean;
          created_at?: string;
        };
      };
    };
  };
};