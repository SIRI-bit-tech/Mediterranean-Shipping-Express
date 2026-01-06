import { jwtVerify, SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
)

export interface JWTPayload {
  id: string
  role: 'CUSTOMER' | 'DRIVER' | 'ADMIN'
  email: string
  iat?: number
  exp?: number
}

export async function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>, expiresIn: string = '24h'): Promise<string> {
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET)
  
  return jwt
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ['HS256']
    })
    
    // Validate that the payload has the required fields
    if (
      typeof payload.id === 'string' &&
      typeof payload.role === 'string' &&
      typeof payload.email === 'string' &&
      ['CUSTOMER', 'DRIVER', 'ADMIN'].includes(payload.role)
    ) {
      // Create a new object with the validated fields to avoid type conflicts
      return {
        id: payload.id as string,
        role: payload.role as 'CUSTOMER' | 'DRIVER' | 'ADMIN',
        email: payload.email as string,
        iat: payload.iat,
        exp: payload.exp
      }
    }
    
    return null
  } catch (error) {
    console.error('JWT verification error:', error)
    return null
  }
}