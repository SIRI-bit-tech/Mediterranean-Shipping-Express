import { NextRequest } from "next/server"
import { query } from "@/lib/db"
import { verifyToken as verifyJWT, JWTPayload } from "@/lib/jwt"

export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'CUSTOMER' | 'DRIVER' | 'ADMIN'
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    // Verify the JWT token using cryptographic verification
    const decoded: JWTPayload | null = await verifyJWT(token)
    
    if (!decoded) {
      return null
    }

    // Verify user exists in database and get current user data
    const result = await query(
      'SELECT id, name, email, role FROM users WHERE id = $1 AND is_active = true',
      [decoded.id]
    )

    if (result.rows.length === 0) {
      return null
    }

    const user = result.rows[0] as AuthUser

    // Verify that the role in the token matches the database
    // This prevents privilege escalation if someone tries to modify the token
    if (user.role !== decoded.role) {
      console.warn(`Role mismatch for user ${user.id}: token=${decoded.role}, db=${user.role}`)
      return null
    }

    return user
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