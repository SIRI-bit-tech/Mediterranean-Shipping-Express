import { jwtVerify, SignJWT } from 'jose'
import { randomBytes } from 'crypto'

// Ensure JWT_SECRET is properly configured
function getJWTSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  
  if (secret) {
    return new TextEncoder().encode(secret)
  }
  
  // Only allow fallback in development with a strong random value
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️  JWT_SECRET not set in development - using random secret (tokens will not persist across restarts)')
    return randomBytes(32) // 256-bit random secret
  }
  
  // Fail hard in production if JWT_SECRET is missing
  throw new Error(
    'JWT_SECRET environment variable is required for production. ' +
    'Please set a strong, random secret (minimum 32 characters) in your environment variables.'
  )
}

const JWT_SECRET = getJWTSecret()

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