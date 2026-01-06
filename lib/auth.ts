import { NextRequest } from "next/server"
import { query } from "@/lib/db"

export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'CUSTOMER' | 'DRIVER' | 'ADMIN'
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    // Decode the base64 token
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))
    
    // Check if token is expired
    if (decoded.exp && decoded.exp < Date.now()) {
      return null
    }

    // Verify user exists in database
    const result = await query(
      'SELECT id, name, email, role FROM users WHERE id = $1 AND is_active = true',
      [decoded.id]
    )

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0] as AuthUser
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

export async function requireAuth(request: NextRequest): Promise<AuthUser | null> {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.replace("Bearer ", "")
  return await verifyToken(token)
}

export async function requireAdminAuth(request: NextRequest): Promise<AuthUser | null> {
  const user = await requireAuth(request)
  if (!user || user.role !== 'ADMIN') {
    return null
  }
  return user
}