/**
 * Shared logging utilities
 * Common sanitization logic used by both CommonJS and ES module logger implementations
 */

/**
 * Sanitize context to remove sensitive information
 * @param {Object} context - The context object to sanitize
 * @returns {Object} - Sanitized context object
 */
function sanitizeContext(context) {
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

// Export for both CommonJS and ES modules
module.exports = { sanitizeContext }
module.exports.sanitizeContext = sanitizeContext