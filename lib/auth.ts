// Authentication utilities

import { cookies } from "next/headers"

const SESSION_COOKIE_NAME = "mse_session"
const SESSION_COOKIE_MAX_AGE = 86400 * 7 // 7 days

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_COOKIE_MAX_AGE,
  })
}

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function getCurrentUser() {
  const token = await getSessionToken()
  if (!token) return null

  try {
    // In production, verify JWT properly
    // This is a mock - implement with real JWT verification
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString())
    return payload
  } catch {
    return null
  }
}
