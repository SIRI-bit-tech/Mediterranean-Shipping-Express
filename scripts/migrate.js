#!/usr/bin/env node

/**
 * Run all pending migrations
 */

const { runMigration, closePool } = require('./run-migration')
const fs = require('fs')
const path = require('path')

async function runAllMigrations() {
  try {
    const migrationsDir = path.join(__dirname, 'migrations')
    
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found.')
      return
    }
    
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort() // Run migrations in order
    
    if (migrationFiles.length === 0) {
      console.log('No migration files found.')
      return
    }
    
    console.log(`Found ${migrationFiles.length} migration(s):`)
    migrationFiles.forEach(file => console.log(`  - ${file}`))
    console.log('')
    
    let executedCount = 0
    for (const file of migrationFiles) {
      try {
        const wasExecuted = await runMigration(file)
        // Count only newly executed migrations
        if (wasExecuted === true) {
          executedCount++
        }
      } catch (error) {
        console.error(`Failed to execute migration ${file}:`, error.message)
        throw error // Propagate error to stop migration process
      }
    }
    
    if (executedCount > 0) {
      console.log(`\n🎉 ${executedCount} new migration(s) completed successfully!`)
    } else {
      console.log('\n✅ All migrations are up to date!')
    }
    
  } catch (error) {
    console.error('Migration process failed:', error.message)
    process.exit(1)
  } finally {
    // Always close the database pool
    try {
      await closePool()
    } catch (closeError) {
      console.error('Error closing database pool:', closeError.message)
    }
  }
}

if (require.main === module) {
  runAllMigrations()
}

module.exports = { runAllMigrations }