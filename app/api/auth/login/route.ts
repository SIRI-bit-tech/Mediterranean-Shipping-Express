import { type NextRequest, NextResponse } from "next/server"
import { handleAPIError, ValidationError, UnauthorizedError } from "@/lib/api-errors"
import { query } from "@/lib/db"
import { signToken } from "@/lib/jwt"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberMe } = await request.json()

    if (!email || !password) {
      throw new ValidationError("Email and password are required")
    }

    if (!email.includes("@")) {
      throw new ValidationError("Please enter a valid email address")
    }

    // Find user in database
    const result = await query(
      'SELECT id, name, email, password_hash, role, is_verified, is_active FROM users WHERE email = $1 AND is_active = true',
      [email.toLowerCase()]
    )

    if (result.rows.length === 0) {
      throw new UnauthorizedError()
    }

    const user = result.rows[0]

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash)
    if (!passwordValid) {
      throw new UnauthorizedError()
    }

    // Generate signed JWT token
    const token = await signToken({
      id: user.id,
      role: user.role,
      email: user.email
    }, rememberMe ? '30d' : '24h')

    // Update last login
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    )

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
        },
        rememberMe,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Login error:', error)
    const { statusCode, response } = handleAPIError(error)
    return NextResponse.json(response, { status: statusCode })
  }
}
