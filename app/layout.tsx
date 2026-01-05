import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Mediterranean Shipping Express - Global Logistics Platform",
  description:
    "Professional courier and logistics platform for international shipping, real-time tracking, and fleet management",
  generator: "MSE Platform",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Mediterranean Shipping Express",
    description: "Professional courier and logistics platform",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-white text-black">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
