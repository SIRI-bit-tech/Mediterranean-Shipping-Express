// API utility functions for request/response handling

import { NextResponse } from "next/server"

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
  let result = "1Z"
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function createJWT(payload: Record<string, unknown>, expiresIn = "24h"): string {
  // In production, use jsonwebtoken library with proper signing
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64")
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString("base64")
  const signature = Buffer.from("signature").toString("base64")
  return `${header}.${body}.${signature}`
}

export function verifyJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString())
    return payload
  } catch {
    return null
  }
}
