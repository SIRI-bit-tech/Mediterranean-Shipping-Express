import { Pool } from 'pg'

// Configure SSL settings for production database connections
function getSSLConfig() {
  if (process.env.NODE_ENV !== 'production') {
    return false
  }

  // Check if SSL verification should be explicitly disabled (NOT RECOMMENDED)
  // This should only be used in development/testing environments with self-signed certs
  if (process.env.DB_SSL_DISABLE_VERIFICATION === 'true') {
    console.warn('⚠️  WARNING: Database SSL certificate verification is DISABLED. This is insecure and should not be used in production!')
    return { rejectUnauthorized: false }
  }

  // Default secure SSL configuration
  const sslConfig: any = {
    rejectUnauthorized: true, // Enable certificate validation
  }

  // Load CA certificate from environment if provided
  if (process.env.DB_SSL_CA) {
    // Direct CA certificate content
    sslConfig.ca = process.env.DB_SSL_CA
  } else if (process.env.DB_SSL_CA_B64) {
    // Base64-encoded CA certificate
    try {
      sslConfig.ca = Buffer.from(process.env.DB_SSL_CA_B64, 'base64').toString('utf-8')
    } catch (error) {
      console.error('Failed to decode DB_SSL_CA_B64:', error)
      throw new Error('Invalid base64-encoded CA certificate')
    }
  }

  // For cloud providers like Neon, Supabase, etc., they typically provide their own CA
  // If no explicit CA is provided, rely on the system's trusted CA store
  return sslConfig
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: getSSLConfig(),
})

export { pool }

export async function query(text: string, params?: any[]) {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result
  } finally {
    client.release()
  }
}