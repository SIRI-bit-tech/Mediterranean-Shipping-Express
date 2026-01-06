import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireAdminAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await requireAdminAuth(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    // Fetch all users from database
    const result = await query(
      `SELECT id, name, email, role, is_verified, is_active, created_at, updated_at 
       FROM users 
       WHERE deleted_at IS NULL 
       ORDER BY created_at DESC`
    )

    const users = result.rows.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.is_verified,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }))

    return NextResponse.json({
      success: true,
      users,
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}