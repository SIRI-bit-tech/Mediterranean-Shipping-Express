// Utility functions for shipment data transformation

export interface ShipmentRow {
  id: string
  tracking_number: string
  user_id: string
  origin_address_id: string
  destination_address_id: string
  driver_id: string | null
  status: string
  transport_mode: string
  current_location: string | null
  current_city: string | null
  current_country: string | null
  current_latitude: number | null
  current_longitude: number | null
  estimated_delivery_date: string | null
  actual_delivery_date: string | null
  weight: number | null
  dimensions: string | null
  description: string | null
  package_value: number | null
  special_handling: string | null
  on_hold_reason: string | null
  is_international: boolean
  customs_status: string | null
  created_at: string
  updated_at: string
}

export interface ShipmentResponse {
  id: string
  trackingNumber: string
  userId: string
  originAddressId: string
  destinationAddressId: string
  driverId: string | null
  status: string
  transportMode: string
  currentLocation: string | null
  currentCity: string | null
  currentCountry: string | null
  currentLatitude: number | null
  currentLongitude: number | null
  estimatedDeliveryDate: string | null
  actualDeliveryDate: string | null
  weight: number | null
  dimensions: string | null
  description: string | null
  packageValue: number | null
  specialHandling: string | null
  onHoldReason: string | null
  isInternational: boolean
  customsStatus: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Transforms a shipment database row from snake_case to camelCase format
 * @param shipment - Raw shipment data from database with snake_case fields
 * @returns Transformed shipment data with camelCase fields
 */
export function transformShipmentRow(shipment: ShipmentRow): ShipmentResponse {
  return {
    id: shipment.id,
    trackingNumber: shipment.tracking_number,
    userId: shipment.user_id,
    originAddressId: shipment.origin_address_id,
    destinationAddressId: shipment.destination_address_id,
    driverId: shipment.driver_id,
    status: shipment.status,
    transportMode: shipment.transport_mode,
    currentLocation: shipment.current_location,
    currentCity: shipment.current_city,
    currentCountry: shipment.current_country,
    currentLatitude: shipment.current_latitude,
    currentLongitude: shipment.current_longitude,
    estimatedDeliveryDate: shipment.estimated_delivery_date,
    actualDeliveryDate: shipment.actual_delivery_date,
    weight: shipment.weight,
    dimensions: shipment.dimensions,
    description: shipment.description,
    packageValue: shipment.package_value,
    specialHandling: shipment.special_handling,
    onHoldReason: shipment.on_hold_reason,
    isInternational: shipment.is_international,
    customsStatus: shipment.customs_status,
    createdAt: shipment.created_at,
    updatedAt: shipment.updated_at,
  }
}

/**
 * Transforms an array of shipment database rows from snake_case to camelCase format
 * @param shipments - Array of raw shipment data from database
 * @returns Array of transformed shipment data with camelCase fields
 */
export function transformShipmentRows(shipments: ShipmentRow[]): ShipmentResponse[] {
  return shipments.map(transformShipmentRow)
}