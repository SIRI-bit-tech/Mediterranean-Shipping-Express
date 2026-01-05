import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { name, email, company, adminCode, password } = await request.json()

    if (!name || !email || !company || !adminCode || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (password.length < 10) {
      return NextResponse.json({ error: "Password must be at least 10 characters" }, { status: 400 })
    }

    if (adminCode.length < 6) {
      return NextResponse.json({ error: "Admin code must be at least 6 characters" }, { status: 400 })
    }

    // Mock database query - replace with actual database
    const admin = {
      id: `admin_${Date.now()}`,
      name,
      email,
      company,
      role: "ADMIN",
      createdAt: new Date(),
    }

    // Mock JWT token - replace with actual JWT generation
    const token = Buffer.from(JSON.stringify({ id: admin.id, role: "ADMIN" })).toString("base64")

    return NextResponse.json({
      success: true,
      token,
      admin,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
