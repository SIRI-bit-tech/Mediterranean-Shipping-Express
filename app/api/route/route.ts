import { type NextRequest, NextResponse } from "next/server"
import { handleAPIError, ValidationError } from "@/lib/api-errors"
import { graphHopperService } from "@/lib/graphhopper-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { start, end, profile = 'car' } = body

    // Validate required fields
    if (!start || !end) {
      throw new ValidationError("Start and end coordinates are required")
    }

    // Validate coordinate format
    if (typeof start.latitude !== 'number' || typeof start.longitude !== 'number' ||
        typeof end.latitude !== 'number' || typeof end.longitude !== 'number') {
      throw new ValidationError("Invalid coordinate format")
    }

    // Use GraphHopper to calculate route
    const result = await graphHopperService.getRoute(start, end, profile)

    if (!result) {
      return NextResponse.json({
        success: false,
        error: "Could not calculate route",
        data: null
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        coordinates: result.coordinates,
        distance: result.distance,
        duration: result.duration,
        instructions: result.instructions
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Route calculation API error:', error)
    const { statusCode, response } = handleAPIError(error)
    return NextResponse.json(response, { status: statusCode })
  }
}