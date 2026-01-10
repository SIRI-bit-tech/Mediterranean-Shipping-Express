/**
 * Shared logging utilities
 * Common sanitization logic used by both CommonJS and ES module logger implementations
 */

interface LogContext {
  userId?: string
  sessionId?: string
  action?: string
  [key: string]: any
}

/**
 * Sanitize context to remove sensitive information
 * @param context - The context object to sanitize
 * @returns Sanitized context object
 */
export function sanitizeContext(context: LogContext): LogContext {
  if (!context || typeof context !== 'object') {
    return context
  }

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

export type { LogContext }