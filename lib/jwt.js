// CommonJS wrapper for JWT functions to be used by server.js
const { jwtVerify, SignJWT } = require('jose')
const { randomBytes } = require('crypto')

// Ensure JWT_SECRET is properly configured
function getJWTSecret() {
  const secret = process.env.JWT_SECRET
  
  if (secret) {
    return new TextEncoder().encode(secret)
  }
  
  // Only allow fallback in development with a strong random value
  if (process.env.NODE_ENV !== 'production') {
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

async function signToken(payload, expiresIn = '24h') {
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET)
  
  return jwt
}

async function verifyToken(token) {
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
        id: payload.id,
        role: payload.role,
        email: payload.email,
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

module.exports = {
  signToken,
  verifyToken
}