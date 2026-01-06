"use client"

import Link from "next/link"
import { Shield, User, LogOut, Settings, BarChart3, Users, Package } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface User {
  id: string
  name: string
  email: string
  role: 'CUSTOMER' | 'DRIVER' | 'ADMIN'
}

export function AdminHeader() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch("/api/admin/profile", {
          credentials: 'include' // Include httpOnly cookies
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user) {
            setUser(data.user)
          }
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [])

  const handleLogout = async () => {
    try {
      // Call logout endpoint to clear server-side cookies
      await fetch("/api/admin/auth/logout", {
        method: "POST",
        credentials: 'include'
      })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Clear any remaining client-side cookies as fallback
      document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      window.location.href = "/"
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/admin" className="flex items-center gap-2 font-bold text-xl text-black">
            <Shield className="h-6 w-6 text-yellow-600" />
            <span>MSE Admin</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/admin" 
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </Link>
            <Link 
              href="/admin/shipments" 
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition-colors"
            >
              <Package className="h-4 w-4" />
              Shipments
            </Link>
            <Link 
              href="/admin/users" 
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition-colors"
            >
              <Users className="h-4 w-4" />
              Users
            </Link>
            <Link 
              href="/admin/settings" 
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition-colors"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </nav>

          {/* Admin Info & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>
                {loading ? 'Loading...' : `Admin: ${user?.name || 'Administrator'}`}
              </span>
            </div>
            <Button 
              variant="ghost" 
              className="text-black hover:bg-gray-100 gap-2" 
              onClick={handleLogout}
              disabled={loading}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}