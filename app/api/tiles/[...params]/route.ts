import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ params: string[] }> }
) {
  try {
    const resolvedParams = await params
    const [z, x, y] = resolvedParams.params
    
    // Validate parameters
    if (!z || !x || !y) {
      return new NextResponse('Invalid tile parameters', { status: 400 })
    }

    const tileUrl = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`
    
    const response = await fetch(tileUrl, {
      headers: {
        'User-Agent': 'MSE-Tracking-App/1.0'
      }
    })

    if (!response.ok) {
      return new NextResponse('Tile not found', { status: 404 })
    }

    const imageBuffer = await response.arrayBuffer()

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    console.error('Tile proxy error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}