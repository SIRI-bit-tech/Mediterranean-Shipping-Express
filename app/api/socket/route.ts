import { NextResponse } from "next/server"

// This route exists to satisfy Next.js routing requirements
// The actual Socket.IO functionality is handled in lib/socket-server.ts and server.js

export async function GET() {
  return NextResponse.json({ 
    message: "Socket.IO server is running",
    status: "active" 
  })
}
