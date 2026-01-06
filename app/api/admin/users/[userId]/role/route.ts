import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireAdminAuth } from "@/lib/auth"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Verify admin authentication
    const admin = await requireAdminAuth(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    const { role } = await request.json()
    const { userId } = await params

    if (!role || !['CUSTOMER', 'DRIVER', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Prevent admin from demoting themselves
    if (String(admin.id) === String(userId) && role !== 'ADMIN') {
      return NextResponse.json({ error: "Cannot change your own admin role" }, { status: 400 })
    }

    // Update user role in database
    const result = await query(
      `UPDATE users 
       SET role = $1, updated_at = NOW() 
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING id, name, email, role`,
      [role, userId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = result.rows[0]

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}