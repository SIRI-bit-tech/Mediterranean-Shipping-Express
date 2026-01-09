#!/usr/bin/env node

/**
 * Database Migration Runner
 * Applies SQL migration files to the database
 */

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Simple .env file loader
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '..', '.env')
    const envContent = fs.readFileSync(envPath, 'utf8')
    
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim()
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim()
          process.env[key.trim()] = value
        }
      }
    })
  } catch (error) {
    console.warn('Could not load .env file:', error.message)
  }
}

// Load environment variables
loadEnvFile()

// Database configuration with better error handling
const getDatabaseConfig = () => {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
  
  if (!connectionString) {
    throw new Error('DATABASE_URL or POSTGRES_URL environment variable is required')
  }
  
  // Parse the connection string to ensure password is handled correctly
  try {
    const url = new URL(connectionString)
    return {
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      // Explicitly set connection parameters to avoid parsing issues
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1), // Remove leading slash
      user: url.username,
      password: url.password,
    }
  } catch (error) {
    console.error('Error parsing DATABASE_URL:', error.message)
    // Fallback to just using the connection string
    return {
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    }
  }
}

const pool = new Pool(getDatabaseConfig())

// Ensure migrations table exists
async function ensureMigrationsTable(client) {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `)
  } catch (error) {
    console.error('Failed to create migrations table:', error.message)
    throw error
  }
}

async function runMigration(migrationFile) {
  const client = await pool.connect()
  
  try {
    // Ensure migrations table exists
    await ensureMigrationsTable(client)
    
    // Check if migration has already been executed
    const existingMigration = await client.query(
      'SELECT filename FROM migrations WHERE filename = $1',
      [migrationFile]
    )
    
    if (existingMigration.rows.length > 0) {
      console.log(`⏭️  Migration already executed: ${migrationFile}`)
      return false // Indicate migration was not executed (already done)
    }
    
    console.log(`Running migration: ${migrationFile}`)
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', migrationFile)
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`)
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Execute the migration in a transaction
    await client.query('BEGIN')
    
    try {
      // Execute the migration SQL
      await client.query(migrationSQL)
      
      // Record the migration as executed
      await client.query(
        'INSERT INTO migrations (filename) VALUES ($1)',
        [migrationFile]
      )
      
      await client.query('COMMIT')
      console.log(`✅ Migration completed: ${migrationFile}`)
      return true // Indicate migration was executed successfully
      
    } catch (migrationError) {
      await client.query('ROLLBACK')
      throw migrationError
    }
    
  } catch (error) {
    console.error(`❌ Migration failed: ${migrationFile}`)
    console.error('Error:', error.message)
    throw error
  } finally {
    client.release()
  }
}

async function main() {
  try {
    const migrationFile = process.argv[2]
    
    if (!migrationFile) {
      console.error('Usage: node run-migration.js <migration-file>')
      console.error('Example: node run-migration.js 001_add_addresses_unique_constraint.sql')
      process.exit(1)
    }
    
    // Test database connection first
    console.log('Testing database connection...')
    const testClient = await pool.connect()
    await testClient.query('SELECT 1')
    testClient.release()
    console.log('✅ Database connection successful')
    
    const wasExecuted = await runMigration(migrationFile)
    
    if (wasExecuted) {
      console.log('🎉 Migration completed successfully!')
    } else {
      console.log('✅ Migration was already executed!')
    }
    
  } catch (error) {
    console.error('Migration failed:', error.message)
    console.error('Full error:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

if (require.main === module) {
  main()
}

// Function to close the pool connection (for use by migrate.js)
async function closePool() {
  await pool.end()
}

module.exports = { runMigration, closePool }