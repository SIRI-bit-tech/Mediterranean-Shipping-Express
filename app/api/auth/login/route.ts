import { type NextRequest, NextResponse } from "next/server"
import { handleAPIError, ValidationError } from "@/lib/api-errors"

export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberMe } = await request.json()

    if (!email || !password) {
      throw new ValidationError("Email and password are required")
    }

    if (!email.includes("@")) {
      throw new ValidationError("Please enter a valid email address")
    }

    // Mock database query - replace with actual database
    // In production: SELECT id, name, email, role, is_verified FROM users WHERE email = $1 AND is_active = true AND deleted_at IS NULL
    // This uses idx_users_email_active for optimal performance
    const user = {
      id: "user_123",
      name: "John Doe",
      email: email,
      role: "CUSTOMER",
      isVerified: true,
      createdAt: new Date(),
    }

    // Mock JWT token - replace with actual JWT generation
    const token = Buffer.from(JSON.stringify({ id: user.id, role: "CUSTOMER" })).toString("base64")

    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        rememberMe,
      },
      { status: 200 },
    )
  } catch (error) {
    const { statusCode, response } = handleAPIError(error)
    return NextResponse.json(response, { status: statusCode })
  }
}
