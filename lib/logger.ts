/**
 * Secure logging utility that prevents sensitive data from reaching browser console
 * Only logs appropriate information based on environment
 */

import { sanitizeContext, type LogContext } from './logger-utils'

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isServer = typeof window === 'undefined'

  /**
   * Log info messages - only in development and server-side
   */
  info(message: string, context?: LogContext) {
    if (this.isDevelopment && this.isServer) {
      console.log(`[INFO] ${message}`, context ? sanitizeContext(context) : '')
    }
  }

  /**
   * Log warnings - always logged but sanitized
   */
  warn(message: string, context?: LogContext) {
    if (this.isServer) {
      console.warn(`[WARN] ${message}`, context ? sanitizeContext(context) : '')
    }
  }

  /**
   * Log errors - always logged but sanitized
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
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
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment && this.isServer) {
      console.log(`[DEBUG] ${message}`, context ? sanitizeContext(context) : '')
    }
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