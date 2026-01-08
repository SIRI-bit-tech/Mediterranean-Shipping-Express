-- Package Management Requests Table
CREATE TABLE IF NOT EXISTS package_requests (
    id SERIAL PRIMARY KEY,
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('HOLD', 'REDIRECT', 'RESCHEDULE', 'RETURN', 'INTERCEPT')),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED')),
    
    -- Request details (JSON for flexibility)
    request_data JSONB NOT NULL DEFAULT '{}',
    
    -- Common fields
    reason TEXT,
    customer_notes TEXT,
    admin_notes TEXT,
    
    -- Approval workflow
    requested_by VARCHAR(50) NOT NULL CHECK (requested_by IN ('CUSTOMER', 'ADMIN', 'SYSTEM')),
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Create indexes for package_requests
CREATE INDEX IF NOT EXISTS idx_package_requests_shipment ON package_requests(shipment_id);
CREATE INDEX IF NOT EXISTS idx_package_requests_user ON package_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_package_requests_status ON package_requests(status);
CREATE INDEX IF NOT EXISTS idx_package_requests_type ON package_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_package_requests_created ON package_requests(created_at);

-- Pickup Locations Table
CREATE TABLE IF NOT EXISTS pickup_locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('SERVICE_CENTER', 'PARTNER_STORE', 'LOCKER', 'POST_OFFICE')),
    
    -- Address
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    country VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    
    -- Coordinates
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Operating details
    phone VARCHAR(20),
    email VARCHAR(255),
    operating_hours JSONB, -- {"monday": "9:00-17:00", "tuesday": "9:00-17:00", ...}
    capacity INTEGER DEFAULT 100,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for pickup_locations
CREATE INDEX IF NOT EXISTS idx_pickup_locations_city ON pickup_locations(city);
CREATE INDEX IF NOT EXISTS idx_pickup_locations_active ON pickup_locations(is_active);
CREATE INDEX IF NOT EXISTS idx_pickup_locations_type ON pickup_locations(type);

-- Insert some default pickup locations
INSERT INTO pickup_locations (name, type, street, city, state, country, postal_code, latitude, longitude, phone, operating_hours) VALUES
('MSE Downtown Service Center', 'SERVICE_CENTER', '123 Main Street', 'New York', 'NY', 'US', '10001', 40.7589, -73.9851, '+1-555-0101', '{"monday": "8:00-18:00", "tuesday": "8:00-18:00", "wednesday": "8:00-18:00", "thursday": "8:00-18:00", "friday": "8:00-18:00", "saturday": "9:00-15:00", "sunday": "closed"}'),
('MSE Airport Hub', 'SERVICE_CENTER', '456 Airport Blvd', 'Los Angeles', 'CA', 'US', '90045', 33.9425, -118.4081, '+1-555-0102', '{"monday": "6:00-22:00", "tuesday": "6:00-22:00", "wednesday": "6:00-22:00", "thursday": "6:00-22:00", "friday": "6:00-22:00", "saturday": "8:00-20:00", "sunday": "8:00-20:00"}'),
('Partner Store - QuickMart', 'PARTNER_STORE', '789 Commerce Ave', 'Chicago', 'IL', 'US', '60601', 41.8781, -87.6298, '+1-555-0103', '{"monday": "7:00-23:00", "tuesday": "7:00-23:00", "wednesday": "7:00-23:00", "thursday": "7:00-23:00", "friday": "7:00-23:00", "saturday": "7:00-23:00", "sunday": "8:00-22:00"}');

-- Package Request History Table (for audit trail)
CREATE TABLE IF NOT EXISTS package_request_history (
    id SERIAL PRIMARY KEY,
    package_request_id INTEGER NOT NULL REFERENCES package_requests(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for package_request_history
CREATE INDEX IF NOT EXISTS idx_package_request_history_request ON package_request_history(package_request_id);
CREATE INDEX IF NOT EXISTS idx_package_request_history_created ON package_request_history(created_at);