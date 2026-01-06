import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireAdminAuth } from "@/lib/auth"
import { transformShipmentRows, ShipmentRow } from "@/lib/shipment-utils"

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await requireAdminAuth(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    // Parse pagination parameters from URL
    const { searchParams } = request.nextUrl
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const offsetParam = searchParams.get('offset')

    // Validate and set defaults for pagination
    const page = Math.max(1, parseInt(pageParam || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(limitParam || '50', 10))) // Default 50, max 100
    const offset = offsetParam ? Math.max(0, parseInt(offsetParam, 10)) : (page - 1) * limit

    // Get total count for pagination metadata
    const countResult = await query(
      'SELECT COUNT(*) as total FROM shipments WHERE deleted_at IS NULL'
    )
    const total = parseInt(countResult.rows[0]?.total || '0', 10)
    const totalPages = Math.ceil(total / limit)

    // Fetch paginated shipments from database
    const result = await query(
      `SELECT id, tracking_number, user_id, origin_address_id, destination_address_id, 
              driver_id, status, transport_mode, current_location, current_city, 
              current_country, current_latitude, current_longitude, 
              estimated_delivery_date, actual_delivery_date, weight, dimensions, 
              description, package_value, special_handling, on_hold_reason, 
              is_international, customs_status, created_at, updated_at
       FROM shipments 
       WHERE deleted_at IS NULL 
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    )

    const shipments = transformShipmentRows(result.rows as ShipmentRow[])

    return NextResponse.json({
      success: true,
      shipments,
      pagination: {
        page,
        limit,
        offset,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    })
  } catch (error) {
    console.error('Error fetching shipments:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}