import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { name, email, company, adminCode, password } = await request.json()

    if (!name || !email || !company || !adminCode || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    // Verify admin code from environment
    const validAdminCode = process.env.ADMIN_CODE
    if (!validAdminCode || adminCode !== validAdminCode) {
      return NextResponse.json({ error: "Invalid admin code" }, { status: 401 })
    }

    // Check if admin already exists
    const existingAdmin = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    )

    if (existingAdmin.rows.length > 0) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create admin in database
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, is_verified, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, name, email, role, is_verified, is_active, created_at`,
      [name.trim(), email.toLowerCase(), passwordHash, 'ADMIN', true, true]
    )

    const admin = result.rows[0]

    // Generate token
    const token = Buffer.from(JSON.stringify({ 
      id: admin.id, 
      role: admin.role,
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    })).toString("base64")

    return NextResponse.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    })
  } catch (error) {
    console.error('Admin registration error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
