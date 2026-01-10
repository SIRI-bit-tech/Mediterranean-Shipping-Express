/**
 * Secure logging utility that prevents sensitive data from reaching browser console
 * Only logs appropriate information based on environment
 * CommonJS version for server.js compatibility
 */

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
      console.log(`[INFO] ${message}`, context ? this.sanitizeContext(context) : '')
    }
  }

  /**
   * Log warnings - always logged but sanitized
   */
  warn(message, context) {
    if (this.isServer) {
      console.warn(`[WARN] ${message}`, context ? this.sanitizeContext(context) : '')
    }
  }

  /**
   * Log errors - always logged but sanitized
   */
  error(message, error, context) {
    if (this.isServer) {
      console.error(`[ERROR] ${message}`, {
        error: error instanceof Error ? error.message : String(error),
        context: context ? this.sanitizeContext(context) : undefined
      })
    }
  }

  /**
   * Debug logging - only in development
   */
  debug(message, context) {
    if (this.isDevelopment && this.isServer) {
      console.log(`[DEBUG] ${message}`, context ? this.sanitizeContext(context) : '')
    }
  }

  /**
   * Sanitize context to remove sensitive information
   */
  sanitizeContext(context) {
    const sanitized = { ...context }
    
    // Remove sensitive fields
    delete sanitized.password
    delete sanitized.token
    delete sanitized.secret
    delete sanitized.apiKey
    
    // Truncate user IDs for privacy
    if (sanitized.userId && sanitized.userId !== 'anonymous') {
      if (sanitized.userId.length > 8) {
        sanitized.userId = sanitized.userId.substring(0, 8) + '...'
      }
      // If length <= 8, leave sanitized.userId unchanged
    }
    
    return sanitized
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