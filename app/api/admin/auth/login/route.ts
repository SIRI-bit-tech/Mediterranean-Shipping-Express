import { type NextRequest, NextResponse } from "next/server"
import { handleAPIError, ValidationError, UnauthorizedError } from "@/lib/api-errors"
import { query } from "@/lib/db"
import { signToken } from "@/lib/jwt"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { email, password, adminCode } = await request.json()

    if (!email || !password || !adminCode) {
      throw new ValidationError("Email, password, and admin code are required")
    }

    if (!email.includes("@")) {
      throw new ValidationError("Please enter a valid email address")
    }

    if (password.length < 8) {
      throw new ValidationError("Password must be at least 8 characters")
    }

    // Verify admin code from environment
    const validAdminCode = process.env.ADMIN_CODE
    if (!validAdminCode || adminCode !== validAdminCode) {
      throw new UnauthorizedError()
    }

    // Find admin user in database
    const result = await query(
      'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = $1 AND role = $2 AND is_active = true',
      [email.toLowerCase(), 'ADMIN']
    )

    if (result.rows.length === 0) {
      throw new UnauthorizedError()
    }

    const admin = result.rows[0]

    // Verify password
    const passwordValid = await bcrypt.compare(password, admin.password_hash)
    if (!passwordValid) {
      throw new UnauthorizedError()
    }

    // Generate signed JWT token
    const token = await signToken({
      id: admin.id,
      role: admin.role,
      email: admin.email
    }, '24h')

    // Create response with secure cookie
    const response = NextResponse.json(
      {
        success: true,
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      },
      { status: 200 },
    )

    // Set secure, httpOnly cookie with the token
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours in seconds
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Admin login error:', error)
    const { statusCode, response } = handleAPIError(error)
    return NextResponse.json(response, { status: statusCode })
  }
}
