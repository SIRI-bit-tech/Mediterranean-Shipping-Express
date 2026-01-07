"use client"

import Link from "next/link"
import { Menu, X, Package, User, LogOut } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export function MSEHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Check for authentication by calling a protected endpoint
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/shipments", {
          credentials: 'include',
          headers: {
            "Content-Type": "application/json"
          }
        })

        if (response.ok) {
          const data = await response.json()
          setIsAuthenticated(true)
          // We could get user info from the response or make a separate call
          // For now, just set authenticated state
        }
      } catch (error) {
        // Not authenticated or error occurred
        setIsAuthenticated(false)
        setUser(null)
      }
    }

    checkAuth()
  }, [])

  const handleLogout = async () => {
    try {
      // Call logout endpoint to clear server-side cookies
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: 'include'
      })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setIsAuthenticated(false)
      setUser(null)
      window.location.href = "/"
    }
  }

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
            {isAuthenticated ? (
              <>
                {user?.role === 'DRIVER' ? (
                  <>
                    <Link href="/driver" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
                      Driver Dashboard
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
                      Dashboard
                    </Link>
                    <Link href="/ship" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
                      Ship
                    </Link>
                  </>
                )}
              </>
            ) : (
              <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
                About
              </Link>
            )}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>Welcome, {user?.name}</span>
                </div>
                <Button 
                  variant="ghost" 
                  className="text-black hover:bg-gray-100 gap-2" 
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="hidden sm:inline-flex text-black hover:bg-gray-100" asChild>
                  <Link href="/auth/login">Login</Link>
                </Button>
                <Button className="bg-black text-white hover:bg-gray-900" asChild>
                  <Link href="/auth/register">Get Started</Link>
                </Button>
              </>
            )}

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
            {isAuthenticated ? (
              <>
                {user?.role === 'DRIVER' ? (
                  <>
                    <Link href="/driver" className="block text-sm font-medium text-gray-600 hover:text-black py-2">
                      Driver Dashboard
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/dashboard" className="block text-sm font-medium text-gray-600 hover:text-black py-2">
                      Dashboard
                    </Link>
                    <Link href="/ship" className="block text-sm font-medium text-gray-600 hover:text-black py-2">
                      Ship Package
                    </Link>
                  </>
                )}
                <button 
                  onClick={handleLogout}
                  className="block text-sm font-medium text-gray-600 hover:text-black py-2 w-full text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link href="/about" className="block text-sm font-medium text-gray-600 hover:text-black py-2">
                About Us
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
