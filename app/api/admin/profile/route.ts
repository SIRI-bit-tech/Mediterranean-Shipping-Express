import { type NextRequest, NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication using secure cookie
    const user = await requireAdminAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    // Return user profile data (no sensitive information like password_hash)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    })
  } catch (error) {
    console.error('Admin profile error:', error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}