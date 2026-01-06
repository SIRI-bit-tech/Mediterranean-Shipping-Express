import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Verify driver authentication
    const user = await requireAuth(request)
    if (!user || user.role !== 'DRIVER') {
      return NextResponse.json({ error: "Unauthorized - Driver access required" }, { status: 401 })
    }

    // Fetch driver's assigned deliveries
    const result = await query(
      `SELECT id, tracking_number, user_id, origin_address_id, destination_address_id, 
              driver_id, status, transport_mode, current_location, current_city, 
              current_country, current_latitude, current_longitude, 
              estimated_delivery_date, actual_delivery_date, weight, dimensions, 
              description, package_value, special_handling, on_hold_reason, 
              is_international, customs_status, created_at, updated_at
       FROM shipments 
       WHERE driver_id = $1 AND deleted_at IS NULL 
       ORDER BY estimated_delivery_date ASC`,
      [user.id]
    )

    const deliveries = result.rows.map(shipment => ({
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
    }))

    return NextResponse.json({
      success: true,
      deliveries,
    })
  } catch (error) {
    console.error('Error fetching driver deliveries:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}