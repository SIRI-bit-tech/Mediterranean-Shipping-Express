/**
 * Secure logging utility that prevents sensitive data from reaching browser console
 * Only logs appropriate information based on environment
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogContext {
  userId?: string
  sessionId?: string
  action?: string
  [key: string]: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isServer = typeof window === 'undefined'

  /**
   * Log info messages - only in development and server-side
   */
  info(message: string, context?: LogContext) {
    if (this.isDevelopment && this.isServer) {
      console.log(`[INFO] ${message}`, context ? this.sanitizeContext(context) : '')
    }
  }

  /**
   * Log warnings - always logged but sanitized
   */
  warn(message: string, context?: LogContext) {
    if (this.isServer) {
      console.warn(`[WARN] ${message}`, context ? this.sanitizeContext(context) : '')
    }
  }

  /**
   * Log errors - always logged but sanitized
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
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
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment && this.isServer) {
      console.log(`[DEBUG] ${message}`, context ? this.sanitizeContext(context) : '')
    }
  }

  /**
   * Sanitize context to remove sensitive information
   */
  private sanitizeContext(context: LogContext): LogContext {
    const sanitized = { ...context }
    
    // Remove sensitive fields
    delete sanitized.password
    delete sanitized.token
    delete sanitized.secret
    delete sanitized.apiKey
    
    // Truncate user IDs for privacy
    if (sanitized.userId && sanitized.userId !== 'anonymous') {
      sanitized.userId = sanitized.userId.substring(0, 8) + '...'
    }
    
    return sanitized
  }

  /**
   * Log successful operations - minimal logging
   */
  success(message: string) {
    if (this.isDevelopment && this.isServer) {
      console.log(`[SUCCESS] ${message}`)
    }
  }
}

export const logger = new Logger()