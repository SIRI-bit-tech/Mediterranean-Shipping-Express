import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Verify user authentication and get user data
    const user = await requireAuth(request)
    
    if (!user) {
      return NextResponse.json({ 
        error: "Unauthorized - Authentication required" 
      }, { status: 401 })
    }

    // Return authenticated user data
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Auth me endpoint error:', error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}