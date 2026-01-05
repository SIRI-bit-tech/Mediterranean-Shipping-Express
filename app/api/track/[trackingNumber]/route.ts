import { type NextRequest, NextResponse } from "next/server"
import { handleAPIError, ValidationError, NotFoundError } from "@/lib/api-errors"

const trackingDatabase: Record<string, any> = {
  "1Z999AA10123456784": {
    trackingNumber: "1Z999AA10123456784",
    status: "IN_TRANSIT",
    estimatedDelivery: "Oct 24",
    carrier: "MSE Express Air",
    originCity: "Milan",
    destinationCity: "New York",
    currentLocation: "Milan, IT",
    weight: "4.5 kg",
    dimensions: "30 × 20 × 15 cm",
    service: "MSE Priority Air",
    lastUpdate: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    origin: "MSE Logistics Hub, Milan, Italy",
    destination: "123 Fashion Ave, NY 10018",
  },
}

export async function GET(request: NextRequest, { params }: { params: { trackingNumber: string } }) {
  try {
    const { trackingNumber } = params

    if (!trackingNumber || trackingNumber.trim().length === 0) {
      throw new ValidationError("Tracking number is required")
    }

    // In production: SELECT * FROM shipments WHERE tracking_number = $1 AND deleted_at IS NULL
    // This uses idx_shipments_tracking_number_deleted for optimal performance
    const shipment = trackingDatabase[trackingNumber]

    if (!shipment) {
      throw new NotFoundError("Shipment")
    }

    return NextResponse.json({
      success: true,
      data: shipment,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const { statusCode, response } = handleAPIError(error)
    return NextResponse.json(response, { status: statusCode })
  }
}
