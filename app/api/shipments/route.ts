import { type NextRequest, NextResponse } from "next/server"
import { handleAPIError, ValidationError } from "@/lib/api-errors"

// Mock database - in production, connect to real database
const shipments: Record<string, any> = {}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data.senderName || !data.senderEmail || !data.recipientName || !data.recipientAddress) {
      throw new ValidationError("Missing required shipment details")
    }

    const trackingNumber = `1Z${Math.random().toString(36).substring(2, 12).toUpperCase()}${Math.random().toString(36).substring(2, 3).toUpperCase()}`

    const shipment = {
      id: trackingNumber,
      trackingNumber,
      senderName: data.senderName,
      senderCompany: data.senderCompany,
      senderEmail: data.senderEmail,
      senderPhone: data.senderPhone,
      senderAddress: data.senderAddress,
      recipientName: data.recipientName,
      recipientEmail: data.recipientEmail,
      recipientPhone: data.recipientPhone,
      recipientAddress: data.recipientAddress,
      weight: data.weight,
      dimensions: data.dimensions,
      description: data.description,
      serviceType: data.serviceType,
      estimatedCost: data.estimatedCost,
      status: "PROCESSING",
      createdAt: new Date().toISOString(),
      estimatedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      currentLocation: "Origin Facility",
      timeline: [
        {
          event: "Shipment Initiated",
          location: "Origin Facility",
          timestamp: new Date().toISOString(),
          status: "PROCESSING",
        },
      ],
    }

    shipments[trackingNumber] = shipment

    return NextResponse.json(
      {
        success: true,
        data: shipment,
        message: "Shipment created successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    const { statusCode, response } = handleAPIError(error)
    return NextResponse.json(response, { status: statusCode })
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    if (page < 1 || limit < 1 || limit > 100) {
      throw new ValidationError("Invalid pagination parameters")
    }

    // In production: SELECT id, tracking_number, status, created_at FROM shipments
    // WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT $2 OFFSET $3
    // This uses idx_shipments_user_id_status and idx_shipments_created_at for optimal performance
    const shipmentList = Object.values(shipments)
    const start = (page - 1) * limit
    const paginatedShipments = shipmentList.slice(start, start + limit)

    return NextResponse.json({
      success: true,
      data: paginatedShipments,
      pagination: {
        page,
        limit,
        total: shipmentList.length,
        pages: Math.ceil(shipmentList.length / limit),
      },
    })
  } catch (error) {
    const { statusCode, response } = handleAPIError(error)
    return NextResponse.json(response, { status: statusCode })
  }
}
