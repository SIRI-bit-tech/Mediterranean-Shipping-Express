import { type NextRequest, NextResponse } from "next/server"
import { handleAPIError, ValidationError, ConflictError } from "@/lib/api-errors"

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

    // Mock check for existing user - replace with: SELECT id FROM users WHERE email = $1
    // This uses idx_users_email for optimal performance
    const userExists = false // In production, query database

    if (userExists) {
      throw new ConflictError("An account with this email already exists")
    }

    // Mock user creation - in production with database
    const user = {
      id: `user_${Date.now()}`,
      name,
      email,
      role: "CUSTOMER",
      createdAt: new Date(),
    }

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
      },
      { status: 201 },
    )
  } catch (error) {
    const { statusCode, response } = handleAPIError(error)
    return NextResponse.json(response, { status: statusCode })
  }
}
