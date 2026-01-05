import type { NextRequest } from "next/server"
import { apiSuccess, apiError } from "@/lib/api-utils"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, phone, role = "CUSTOMER" } = body

    // Validation
    if (!email || !password || !name) {
      return apiError("Missing required fields", {
        status: 400,
        code: "MISSING_FIELDS",
      })
    }

    if (password.length < 8) {
      return apiError("Password must be at least 8 characters", {
        status: 400,
        code: "WEAK_PASSWORD",
      })
    }

    // In production:
    // 1. Check if user already exists
    // 2. Hash password with bcrypt
    // 3. Create user in database
    // 4. Generate JWT token
    // 5. Return success with token and user data

    const mockUser = {
      id: "user_" + Math.random().toString(36).substr(2, 9),
      email,
      name,
      phone,
      role,
      isVerified: false,
      createdAt: new Date(),
    }

    const mockToken = Buffer.from(
      JSON.stringify({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      }),
    ).toString("base64")

    return apiSuccess(
      {
        user: mockUser,
        token: mockToken,
      },
      201,
    )
  } catch (error) {
    return apiError("Registration failed", { status: 500, code: "REGISTRATION_ERROR" })
  }
}
