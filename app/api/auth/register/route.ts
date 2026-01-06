import { type NextRequest, NextResponse } from "next/server"
import { handleAPIError, ValidationError, ConflictError } from "@/lib/api-errors"
import { query } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      throw new ValidationError("Name, email, and password are required")
    }

    if (name.trim().length < 2) {
      throw new ValidationError("Name must be at least 2 characters long")
    }

    if (!email.includes("@") || !email.includes(".")) {
      throw new ValidationError("Please enter a valid email address")
    }

    if (password.length < 8) {
      throw new ValidationError("Password must be at least 8 characters")
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    )

    if (existingUser.rows.length > 0) {
      throw new ConflictError("An account with this email already exists")
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user in database
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, is_verified, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, name, email, role, is_verified, is_active, created_at`,
      [name.trim(), email.toLowerCase(), passwordHash, 'CUSTOMER', false, true]
    )

    const user = result.rows[0]

    // Generate simple token (in production, use proper JWT)
    const token = Buffer.from(JSON.stringify({ 
      id: user.id, 
      role: user.role,
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    })).toString('base64')

    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.is_verified,
          isActive: user.is_active,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Registration error:', error)
    const { statusCode, response } = handleAPIError(error)
    return NextResponse.json(response, { status: statusCode })
  }
}
