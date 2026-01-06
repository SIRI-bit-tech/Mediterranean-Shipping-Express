import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify driver authentication
    const user = await requireAuth(request)
    if (!user || user.role !== 'DRIVER') {
      return NextResponse.json({ error: "Unauthorized - Driver access required" }, { status: 401 })
    }

    const { id } = await params

    // Fetch delivery details with addresses
    const result = await query(
      `SELECT s.id, s.tracking_number, s.user_id, s.origin_address_id, s.destination_address_id, 
              s.driver_id, s.status, s.transport_mode, s.current_location, s.current_city, 
              s.current_country, s.current_latitude, s.current_longitude, 
              s.estimated_delivery_date, s.actual_delivery_date, s.weight, s.dimensions, 
              s.description, s.package_value, s.special_handling, s.on_hold_reason, 
              s.is_international, s.customs_status, s.created_at, s.updated_at,
              u.name as customer_name, u.phone as customer_phone,
              dest.street as dest_street, dest.city as dest_city, dest.state as dest_state,
              dest.country as dest_country, dest.postal_code as dest_postal_code,
              dest.latitude as dest_latitude, dest.longitude as dest_longitude
       FROM shipments s
       JOIN users u ON s.user_id = u.id
       JOIN addresses dest ON s.destination_address_id = dest.id
       WHERE s.id = $1 AND s.driver_id = $2 AND s.deleted_at IS NULL`,
      [id, user.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Delivery not found or not assigned to you" }, { status: 404 })
    }

    const delivery = result.rows[0]

    const response = {
      id: delivery.id,
      trackingNumber: delivery.tracking_number,
      userId: delivery.user_id,
      originAddressId: delivery.origin_address_id,
      destinationAddressId: delivery.destination_address_id,
      driverId: delivery.driver_id,
      status: delivery.status,
      transportMode: delivery.transport_mode,
      currentLocation: delivery.current_location,
      currentCity: delivery.current_city,
      currentCountry: delivery.current_country,
      currentLatitude: delivery.current_latitude,
      currentLongitude: delivery.current_longitude,
      estimatedDeliveryDate: delivery.estimated_delivery_date,
      actualDeliveryDate: delivery.actual_delivery_date,
      weight: delivery.weight,
      dimensions: delivery.dimensions,
      description: delivery.description,
      packageValue: delivery.package_value,
      specialHandling: delivery.special_handling,
      onHoldReason: delivery.on_hold_reason,
      isInternational: delivery.is_international,
      customsStatus: delivery.customs_status,
      createdAt: delivery.created_at,
      updatedAt: delivery.updated_at,
      customer: {
        name: delivery.customer_name,
        phone: delivery.customer_phone,
      },
      destinationAddress: {
        street: delivery.dest_street,
        city: delivery.dest_city,
        state: delivery.dest_state,
        country: delivery.dest_country,
        postalCode: delivery.dest_postal_code,
        latitude: delivery.dest_latitude,
        longitude: delivery.dest_longitude,
      },
    }

    return NextResponse.json({
      success: true,
      delivery: response,
    })
  } catch (error) {
    console.error('Error fetching delivery details:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}