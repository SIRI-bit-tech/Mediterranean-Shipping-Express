import type { NextRequest } from "next/server"
import { apiSuccess, apiError } from "@/lib/api-utils"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return apiError("Not authenticated", {
        status: 401,
        code: "NOT_AUTHENTICATED",
      })
    }

    return apiSuccess({ user }, 200)
  } catch (error) {
    return apiError("Session check failed", {
      status: 500,
      code: "SESSION_ERROR",
    })
  }
}
