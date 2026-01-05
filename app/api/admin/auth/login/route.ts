import { type NextRequest, NextResponse } from "next/server"
import { handleAPIError, ValidationError, UnauthorizedError } from "@/lib/api-errors"

export async function POST(request: NextRequest) {
  try {
    const { email, password, adminCode } = await request.json()

    if (!email || !password || !adminCode) {
      throw new ValidationError("Email, password, and admin code are required")
    }

    if (!email.includes("@")) {
      throw new ValidationError("Please enter a valid email address")
    }

    if (password.length < 10) {
      throw new ValidationError("Password must be at least 10 characters")
    }

    // Mock admin verification - replace with:
    // SELECT id, name, email, company, role FROM users WHERE email = $1 AND role = 'ADMIN' AND is_active = true AND deleted_at IS NULL
    // This uses idx_users_email_active and role filtering for optimal performance
    const admin = {
      id: "admin_123",
      name: "Admin User",
      email: email,
      company: "MSE Logistics",
      role: "ADMIN",
      createdAt: new Date(),
    }

    // Mock admin code verification - replace with actual validation
    const adminCodeValid = adminCode === "ADMIN_2024"

    if (!adminCodeValid) {
      throw new UnauthorizedError()
    }

    const token = Buffer.from(JSON.stringify({ id: admin.id, role: "ADMIN" })).toString("base64")

    return NextResponse.json(
      {
        success: true,
        token,
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          company: admin.company,
          role: admin.role,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    const { statusCode, response } = handleAPIError(error)
    return NextResponse.json(response, { status: statusCode })
  }
}
