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
 * List of sensitive field names to remove or redact
 */
const SENSITIVE_FIELDS = new Set([
  'password',
  'token',
  'secret',
  'apiKey',
  'accessToken',
  'refreshToken',
  'sessionToken',
  'authToken',
  'privateKey',
  'secretKey',
  'apiSecret',
  'clientSecret',
  'authorization',
  'auth'
])

/**
 * Deep sanitization helper that recursively walks objects and arrays
 * @param obj - The object to sanitize
 * @param visited - Set to track visited objects (prevents cycles)
 * @returns Sanitized copy of the object
 */
function deepSanitize(obj: any, visited: WeakSet<object> = new WeakSet()): any {
  // Handle null, undefined, or primitive types
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj
  }

  // Prevent infinite recursion from circular references
  if (visited.has(obj)) {
    return '[Circular Reference]'
  }
  visited.add(obj)

  // Handle Date objects
  if (obj instanceof Date) {
    return new Date(obj.getTime())
  }

  // Handle RegExp objects
  if (obj instanceof RegExp) {
    return new RegExp(obj)
  }

  // Handle Buffer objects (Node.js)
  if (typeof Buffer !== 'undefined' && obj instanceof Buffer) {
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
      const sanitizedKey = typeof key === 'string' && SENSITIVE_FIELDS.has(key.toLowerCase()) 
        ? '[REDACTED_KEY]' 
        : deepSanitize(key, visited)
      const sanitizedValue = typeof key === 'string' && SENSITIVE_FIELDS.has(key.toLowerCase())
        ? '[REDACTED]'
        : deepSanitize(value, visited)
      sanitizedMap.set(sanitizedKey, sanitizedValue)
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
  const sanitized: Record<string, any> = {}
  
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
}

/**
 * Sanitize context to remove sensitive information
 * @param context - The context object to sanitize
 * @returns Sanitized context object, or the original value if falsy/non-object
 */
export function sanitizeContext(context: LogContext): LogContext
export function sanitizeContext(context: null): null
export function sanitizeContext(context: undefined): undefined
export function sanitizeContext(context: LogContext | null | undefined): LogContext | null | undefined {
  if (!context || typeof context !== 'object') {
    return context
  }

  return deepSanitize(context) as LogContext
}

export type { LogContext }