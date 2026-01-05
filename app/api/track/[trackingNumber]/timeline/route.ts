import { type NextRequest, NextResponse } from "next/server"

const timelineDatabase: Record<string, any[]> = {
  "1Z999AA10123456784": [
    {
      event: "Arrived at Sort Facility",
      location: "New York, NY",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: "completed",
      details: "Package sorted and ready for delivery",
    },
    {
      event: "Departed Logistics Hub",
      location: "Milan, IT",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      status: "completed",
      details: "Package left Milan facility for international transit",
    },
    {
      event: "Processed at Origin",
      location: "Milan, IT",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000 - 6 * 60 * 60 * 1000).toISOString(),
      status: "completed",
      details: "Package received and processed",
    },
    {
      event: "Shipment Initiated",
      location: "Milan, IT",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000 - 8 * 60 * 60 * 1000).toISOString(),
      status: "completed",
      details: "Shipment created and label generated",
    },
  ],
}

export async function GET(request: NextRequest, { params }: { params: { trackingNumber: string } }) {
  try {
    const { trackingNumber } = params

    const timeline = timelineDatabase[trackingNumber] || []

    return NextResponse.json({
      success: true,
      data: timeline,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Timeline error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve timeline",
      },
      { status: 500 },
    )
  }
}
