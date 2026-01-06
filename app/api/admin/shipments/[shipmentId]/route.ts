import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireAdminAuth } from "@/lib/auth"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  try {
    // Verify admin authentication
    const admin = await requireAdminAuth(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    const { shipmentId } = await params

    // Soft delete shipment (set deleted_at timestamp)
    const result = await query(
      `UPDATE shipments 
       SET deleted_at = NOW(), updated_at = NOW() 
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [shipmentId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Shipment deleted successfully",
    })
  } catch (error) {
    console.error('Error deleting shipment:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}