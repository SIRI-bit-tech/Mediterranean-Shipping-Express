/**
 * Shared logging utilities
 * Common sanitization logic used by both CommonJS and ES module logger implementations
 */

/**
 * List of sensitive field names to remove or redact (stored in lowercase for matching)
 */
const SENSITIVE_FIELDS = new Set([
  'password',
  'token',
  'secret',
  'apikey',
  'accesstoken',
  'refreshtoken',
  'sessiontoken',
  'authtoken',
  'privatekey',
  'secretkey',
  'apisecret',
  'clientsecret',
  'authorization',
  'auth'
])

/**
 * Deep sanitization helper that recursively walks objects and arrays
 * @param {any} obj - The object to sanitize
 * @param {WeakSet} visited - Set to track current recursion path (prevents cycles)
 * @returns {any} - Sanitized copy of the object
 */
function deepSanitize(obj, visited = new WeakSet()) {
  // Handle null, undefined, or primitive types
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj
  }

  // Prevent infinite recursion from circular references (true cycles only)
  if (visited.has(obj)) {
    return '[Circular Reference]'
  }

  // Add to current recursion path
  visited.add(obj)
  
  try {
    // Handle Date objects
    if (obj instanceof Date) {
      return new Date(obj.getTime())
    }

    // Handle RegExp objects
    if (obj instanceof RegExp) {
      return new RegExp(obj)
    }

    // Handle Buffer objects (Node.js) - type-agnostic detection
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer && Buffer.isBuffer(obj)) {
      return '[Buffer]'
    } else if (obj && obj.constructor && obj.constructor.name === 'Buffer') {
      // Fallback: constructor name check for environments without Buffer.isBuffer
      return '[Buffer]'
    }

    // Handle ArrayBuffer and TypedArrays
    if (obj instanceof ArrayBuffer) {
      return '[ArrayBuffer]'
    }
    
    if (ArrayBuffer.isView(obj)) {
      return '[TypedArray]'
    }

    // Handle Map objects
    if (obj instanceof Map) {
      const sanitizedMap = new Map()
      for (const [key, value] of obj.entries()) {
        // Preserve original key, only sanitize non-string or non-sensitive keys
        const sanitizedKeyPreserved = typeof key === 'string' && SENSITIVE_FIELDS.has(key.toLowerCase())
          ? key  // Keep original sensitive string key
          : deepSanitize(key, visited)  // Sanitize non-string or non-sensitive keys
        
        // Only redact value if key is a sensitive string
        const sanitizedValueRedacted = typeof key === 'string' && SENSITIVE_FIELDS.has(key.toLowerCase())
          ? '[REDACTED]'  // Redact value for sensitive string keys
          : deepSanitize(value, visited)  // Normal sanitization for other values
        
        sanitizedMap.set(sanitizedKeyPreserved, sanitizedValueRedacted)
      }
      return sanitizedMap
    }

    // Handle Set objects
    if (obj instanceof Set) {
      const sanitizedSet = new Set()
      for (const value of obj.values()) {
        sanitizedSet.add(deepSanitize(value, visited))
      }
      return sanitizedSet
    }

    // Handle Error objects
    if (obj instanceof Error) {
      return {
        name: obj.name,
        message: obj.message,
        stack: obj.stack
      }
    }

    // Handle Arrays
    if (Array.isArray(obj)) {
      return obj.map(item => deepSanitize(item, visited))
    }

    // Handle plain objects and other object types
    const sanitized = {}
    
    for (const [key, value] of Object.entries(obj)) {
      // Check if the key is sensitive
      if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]'
      } else if (key === 'userId' && typeof value === 'string' && value !== 'anonymous') {
        // Special handling for userId truncation
        if (value.length > 8) {
          sanitized[key] = value.substring(0, 8) + '...'
        } else {
          sanitized[key] = value
        }
      } else {
        // Recursively sanitize nested objects
        sanitized[key] = deepSanitize(value, visited)
      }
    }

    return sanitized
  } finally {
    // Remove from current recursion path to allow shared references
    visited.delete(obj)
  }
}

/**
 * Sanitize context to remove sensitive information
 * @param {Object|null|undefined} context - The context object to sanitize
 * @returns {Object|null|undefined} - Sanitized context object, or the original value if falsy/non-object
 */
function sanitizeContext(context) {
  if (!context || typeof context !== 'object') {
    return context
  }

  return deepSanitize(context)
}

// Export for both CommonJS and ES modules
module.exports = { sanitizeContext }
module.exports.sanitizeContext = sanitizeContext