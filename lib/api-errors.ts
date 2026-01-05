export class APIError extends Error {
  constructor(
    public statusCode: number,
    public userMessage: string,
    public internalMessage: string,
  ) {
    super(internalMessage)
    this.name = "APIError"
  }
}

export class ValidationError extends APIError {
  constructor(userMessage: string) {
    super(400, userMessage, userMessage)
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string) {
    super(404, `${resource} not found`, `${resource} not found`)
  }
}

export class UnauthorizedError extends APIError {
  constructor() {
    super(401, "Unauthorized access", "Unauthorized access")
  }
}

export class ForbiddenError extends APIError {
  constructor() {
    super(403, "Access denied", "Access denied")
  }
}

export class ConflictError extends APIError {
  constructor(userMessage: string) {
    super(409, userMessage, userMessage)
  }
}

export class InternalServerError extends APIError {
  constructor(internalMessage: string) {
    super(500, "An error occurred processing your request", internalMessage)
  }
}

// Safe error response - never exposes stack traces or internal details
export function handleAPIError(error: unknown) {
  if (error instanceof APIError) {
    console.error(`[API] ${error.name}: ${error.internalMessage}`)
    return {
      statusCode: error.statusCode,
      response: {
        success: false,
        message: error.userMessage,
      },
    }
  }

  if (error instanceof SyntaxError) {
    console.error("[API] Invalid JSON:", error.message)
    return {
      statusCode: 400,
      response: {
        success: false,
        message: "Invalid request format",
      },
    }
  }

  console.error("[API] Unexpected error:", error instanceof Error ? error.message : String(error))
  return {
    statusCode: 500,
    response: {
      success: false,
      message: "An error occurred processing your request",
    },
  }
}
