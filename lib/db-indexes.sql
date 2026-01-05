-- Enhanced indexes for performance and preventing N+1 queries
-- Run this migration after schema.sql

-- User queries optimization
CREATE INDEX idx_users_email_active ON users(email, is_active);
CREATE INDEX idx_users_role_active ON users(role, is_active);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Shipment queries optimization
CREATE INDEX idx_shipments_user_id_status ON shipments(user_id, status);
CREATE INDEX idx_shipments_driver_id_status ON shipments(driver_id, status);
CREATE INDEX idx_shipments_status_created_at ON shipments(status, created_at DESC);
CREATE INDEX idx_shipments_tracking_number_deleted ON shipments(tracking_number, deleted_at);
CREATE INDEX idx_shipments_estimated_delivery ON shipments(estimated_delivery_date);

-- Address queries optimization
CREATE INDEX idx_addresses_user_id_default ON addresses(user_id, is_default);

-- Tracking checkpoints optimization
CREATE INDEX idx_tracking_checkpoints_shipment_created ON tracking_checkpoints(shipment_id, created_at DESC);
CREATE INDEX idx_tracking_checkpoints_created_at ON tracking_checkpoints(created_at DESC);

-- Notifications optimization
CREATE INDEX idx_notifications_user_id_is_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_shipment_id ON notifications(shipment_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Sessions optimization
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at_user ON sessions(expires_at, user_id);

-- Delivery proofs optimization
CREATE INDEX idx_delivery_proofs_shipment_id ON delivery_proofs(shipment_id);
CREATE INDEX idx_delivery_proofs_driver_id ON delivery_proofs(driver_id);

-- Partial indexes for common queries
CREATE INDEX idx_shipments_active ON shipments(id, status) WHERE deleted_at IS NULL AND status != 'DELIVERED';
CREATE INDEX idx_notifications_unread ON notifications(user_id, created_at) WHERE is_read = false;
CREATE INDEX idx_users_active_verified ON users(id) WHERE is_active = true AND is_verified = true;
