import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { transformShipmentRows, ShipmentRow } from "@/lib/shipment-utils"

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

    const deliveries = transformShipmentRows(result.rows as ShipmentRow[])

    return NextResponse.json({
      success: true,
      deliveries,
    })
  } catch (error) {
    console.error('Error fetching driver deliveries:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}