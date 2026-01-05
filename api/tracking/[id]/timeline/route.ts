import type { NextRequest } from "next/server"
import { apiSuccess, apiError } from "@/lib/api-utils"
import type { TrackingCheckpoint } from "@/types/tracking"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!id) {
      return apiError("Shipment ID required", {
        status: 400,
        code: "MISSING_SHIPMENT_ID",
      })
    }

    // In production:
    // 1. Query database for all tracking checkpoints
    // 2. Order by timestamp descending
    // 3. Include location, status, and notes

    const mockTimeline: TrackingCheckpoint[] = [
      {
        id: "checkpoint_1",
        shipmentId: id,
        status: "IN_TRANSIT",
        location: "Distribution Center",
        city: "London",
        country: "United Kingdom",
        latitude: 51.5074,
        longitude: -0.1278,
        timestamp: new Date(),
      },
      {
        id: "checkpoint_2",
        shipmentId: id,
        status: "PROCESSING",
        location: "Origin Facility",
        city: "Paris",
        country: "France",
        latitude: 48.8566,
        longitude: 2.3522,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    ]

    return apiSuccess(
      {
        shipmentId: id,
        checkpoints: mockTimeline,
      },
      200,
    )
  } catch (error) {
    return apiError("Timeline retrieval failed", {
      status: 500,
      code: "TIMELINE_ERROR",
    })
  }
}
