import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { transformShipmentRows, ShipmentRow } from "@/lib/shipment-utils"

export async function GET(request: NextRequest) {
  try {
    // Verify user authentication
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch user's shipments from database
    const result = await query(
      `SELECT id, tracking_number, user_id, origin_address_id, destination_address_id, 
              driver_id, status, transport_mode, current_location, current_city, 
              current_country, current_latitude, current_longitude, 
              estimated_delivery_date, actual_delivery_date, weight, dimensions, 
              description, package_value, special_handling, on_hold_reason, 
              is_international, customs_status, created_at, updated_at
       FROM shipments 
       WHERE user_id = $1 AND deleted_at IS NULL 
       ORDER BY created_at DESC`,
      [user.id]
    )

    const shipments = transformShipmentRows(result.rows as ShipmentRow[])

    return NextResponse.json({
      success: true,
      shipments,
    })
  } catch (error) {
    console.error('Error fetching user shipments:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}