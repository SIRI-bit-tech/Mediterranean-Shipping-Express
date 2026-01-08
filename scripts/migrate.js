#!/usr/bin/env node

/**
 * Run all pending migrations
 */

const { runMigration } = require('./run-migration')
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
    
    console.log(`Found ${migrationFiles.length} migration(s) to run:`)
    migrationFiles.forEach(file => console.log(`  - ${file}`))
    console.log('')
    
    for (const file of migrationFiles) {
      await runMigration(file)
    }
    
    console.log('\n🎉 All migrations completed successfully!')
    
  } catch (error) {
    console.error('Migration process failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  runAllMigrations()
}

module.exports = { runAllMigrations }