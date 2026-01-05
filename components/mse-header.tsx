"use client"

import Link from "next/link"
import { Menu, X, Package } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export function MSEHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-black">
            <Package className="h-6 w-6" />
            <span className="hidden sm:inline">MSE</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/track" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
              Track
            </Link>
            <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
              Dashboard
            </Link>
            <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
              About
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="hidden sm:inline-flex text-black hover:bg-gray-100" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button className="bg-black text-white hover:bg-gray-900" asChild>
              <Link href="/signup">Get Started</Link>
            </Button>

            {/* Mobile Menu Toggle */}
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-gray-100 py-4 space-y-3">
            <Link href="/track" className="block text-sm font-medium text-gray-600 hover:text-black py-2">
              Track Package
            </Link>
            <Link href="/dashboard" className="block text-sm font-medium text-gray-600 hover:text-black py-2">
              Dashboard
            </Link>
            <Link href="/about" className="block text-sm font-medium text-gray-600 hover:text-black py-2">
              About Us
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
