import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest, { params }: { params: Promise<{ trackingNumber: string }> }) {
  try {
    const { trackingNumber } = await params

    // Get tracking checkpoints from database
    const result = await query(
      `SELECT tc.status, tc.location, tc.city, tc.country, tc.timestamp, tc.notes
       FROM tracking_checkpoints tc
       JOIN shipments s ON tc.shipment_id = s.id
       WHERE s.tracking_number = $1 AND s.deleted_at IS NULL
       ORDER BY tc.timestamp DESC`,
      [trackingNumber]
    )

    const timeline = result.rows.map(checkpoint => ({
      event: formatStatusEvent(checkpoint.status),
      location: checkpoint.city && checkpoint.country ? 
        `${checkpoint.city}, ${checkpoint.country}` : 
        checkpoint.location,
      timestamp: checkpoint.timestamp,
      status: normalizeStatusForFrontend(checkpoint.status),
      details: checkpoint.notes || getStatusDescription(checkpoint.status),
    }))

    return NextResponse.json({
      success: true,
      data: timeline,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('Timeline error', error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve timeline",
      },
      { status: 500 },
    )
  }
}

function formatStatusEvent(status: string): string {
  const statusMap: Record<string, string> = {
    'PROCESSING': 'Shipment Initiated',
    'IN_TRANSIT': 'In Transit',
    'IN_CUSTOMS': 'Customs Processing',
    'OUT_FOR_DELIVERY': 'Out for Delivery',
    'DELIVERED': 'Package Delivered',
    'ON_HOLD': 'Shipment On Hold',
    'EXCEPTION': 'Delivery Exception',
  }
  return statusMap[status] || status
}

function normalizeStatusForFrontend(status: string): string {
  // Convert database status to frontend-expected format
  const statusMap: Record<string, string> = {
    'PROCESSING': 'processing',
    'IN_TRANSIT': 'in-transit',
    'IN_CUSTOMS': 'in-customs',
    'OUT_FOR_DELIVERY': 'out-for-delivery',
    'DELIVERED': 'completed',
    'ON_HOLD': 'on-hold',
    'EXCEPTION': 'exception',
  }
  return statusMap[status] || status.toLowerCase().replace('_', '-')
}

function getStatusDescription(status: string): string {
  const descriptionMap: Record<string, string> = {
    'PROCESSING': 'Package received and processed',
    'IN_TRANSIT': 'Package is in transit to destination',
    'IN_CUSTOMS': 'Package is being processed by customs',
    'OUT_FOR_DELIVERY': 'Package is out for delivery',
    'DELIVERED': 'Package has been delivered',
    'ON_HOLD': 'Package is temporarily on hold',
    'EXCEPTION': 'Delivery exception occurred',
  }
  return descriptionMap[status] || 'Status updated'
}
