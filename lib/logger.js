/**
 * Secure logging utility that prevents sensitive data from reaching browser console
 * Only logs appropriate information based on environment
 * CommonJS version for server.js compatibility
 */

const { sanitizeContext } = require('./logger-utils')

class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
    this.isServer = typeof window === 'undefined'
  }

  /**
   * Log info messages - only in development and server-side
   */
  info(message, context) {
    if (this.isDevelopment && this.isServer) {
      console.log(`[INFO] ${message}`, context ? sanitizeContext(context) : '')
    }
  }

  /**
   * Log warnings - always logged but sanitized
   */
  warn(message, context) {
    if (this.isServer) {
      console.warn(`[WARN] ${message}`, context ? sanitizeContext(context) : '')
    }
  }

  /**
   * Log errors - always logged but sanitized
   */
  error(message, error, context) {
    if (this.isServer) {
      console.error(`[ERROR] ${message}`, {
        error: error instanceof Error ? error.message : String(error),
        context: context ? sanitizeContext(context) : undefined
      })
    }
  }

  /**
   * Debug logging - only in development
   */
  debug(message, context) {
    if (this.isDevelopment && this.isServer) {
      console.log(`[DEBUG] ${message}`, context ? sanitizeContext(context) : '')
    }
  }

  /**
   * Log successful operations - minimal logging
   */
  success(message) {
    if (this.isDevelopment && this.isServer) {
      console.log(`[SUCCESS] ${message}`)
    }
  }
}

const logger = new Logger()

module.exports = { logger }