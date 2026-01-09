// API utility functions for request/response handling

import { NextResponse } from "next/server"
import { signToken, verifyToken, JWTPayload } from "@/lib/jwt"

export interface ApiErrorOptions {
  status?: number
  code?: string
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status },
  )
}

export function apiError(message: string, options: ApiErrorOptions = {}) {
  const { status = 400, code = "API_ERROR" } = options
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
    },
    { status },
  )
}

export function apiPaginated<T>(data: T[], page: number, limit: number, total: number, status = 200) {
  const totalPages = Math.ceil(total / limit)
  return NextResponse.json(
    {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    },
    { status },
  )
}

export function validateRequest(method: string, allowedMethods: string[]) {
  if (!allowedMethods.includes(method)) {
    return apiError("Method not allowed", { status: 405, code: "METHOD_NOT_ALLOWED" })
  }
  return null
}

export function generateTrackingNumber(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = "MSE-"
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Use secure JWT implementation from lib/jwt
export async function createJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>, expiresIn = "24h"): Promise<string> {
  return await signToken(payload, expiresIn)
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  return await verifyToken(token)
}
