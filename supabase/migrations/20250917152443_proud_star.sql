/*
  # Create Demo Users

  1. New Records
    - Add admin demo user (admin@demo.com / admin123)
    - Add client demo user (client@demo.com / client123)
  
  2. Security
    - Users will be able to authenticate with these credentials
    - Admin user has admin role, client user has viewer role
*/

-- Insert demo admin user
INSERT INTO users (email, password_hash, role) 
VALUES ('admin@demo.com', 'admin123', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert demo client user  
INSERT INTO users (email, password_hash, role)
VALUES ('client@demo.com', 'client123', 'viewer')
ON CONFLICT (email) DO NOTHING;