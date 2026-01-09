#!/usr/bin/env node

/**
 * Schema Runner - Executes the database schema SQL file
 * Usage: node scripts/run-schema.js
 */

const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

// Database configuration
function getDatabaseConfig() {
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL or POSTGRES_URL environment variable is required')
  }
  
  return {
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  }
}

async function runSchema() {
  const pool = new Pool(getDatabaseConfig())
  
  try {
    console.log('🔗 Testing database connection...')
    await pool.query('SELECT 1')
    console.log('✅ Database connection successful')
    
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql')
    console.log(`📖 Reading schema file: ${schemaPath}`)
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`)
    }
    
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8')
    
    console.log('🚀 Executing database schema...')
    
    // Execute the schema SQL in a transaction
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(schemaSQL)
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
    
    console.log('✅ Database schema executed successfully!')
    console.log('🎉 Schema setup complete!')
    
  } catch (error) {
    console.error('❌ Schema execution failed:', error.message)
    console.error('Full error:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Run the schema
if (require.main === module) {
  runSchema()
}

module.exports = { runSchema }