import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireAdminAuth } from "@/lib/auth"

export async function PUT(
  request: NextRequest,
  { params }: { params: { shipmentId: string } }
) {
  try {
    // Verify admin authentication
    const admin = await requireAdminAuth(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    const { status } = await request.json()
    const { shipmentId } = params

    const validStatuses = [
      'PROCESSING', 'IN_TRANSIT', 'IN_CUSTOMS', 'OUT_FOR_DELIVERY', 
      'DELIVERED', 'ON_HOLD', 'EXCEPTION'
    ]

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Update shipment status in database
    const result = await query(
      `UPDATE shipments 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING id, tracking_number, status`,
      [status, shipmentId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 })
    }

    const shipment = result.rows[0]

    // Create tracking checkpoint for status change
    await query(
      `INSERT INTO tracking_checkpoints (shipment_id, status, location, timestamp, notes, created_at)
       VALUES ($1, $2, $3, NOW(), $4, NOW())`,
      [
        shipmentId, 
        status, 
        'Admin Update', 
        `Status updated by admin: ${admin.name}`
      ]
    )

    return NextResponse.json({
      success: true,
      shipment: {
        id: shipment.id,
        trackingNumber: shipment.tracking_number,
        status: shipment.status,
      },
    })
  } catch (error) {
    console.error('Error updating shipment status:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}