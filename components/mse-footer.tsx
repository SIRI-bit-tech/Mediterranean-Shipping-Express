"use client"

import Link from "next/link"
import { Mail, Phone, MapPin } from "lucide-react"

export function MSEFooter() {
  return (
    <footer className="bg-black text-white border-t border-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold text-yellow-500 mb-4">MSE</h3>
            <p className="text-gray-400 text-sm">
              Mediterranean Shipping Express - Your trusted global logistics partner
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/track" className="hover:text-yellow-500 transition">
                  Track Package
                </Link>
              </li>
              <li>
                <Link href="/ship" className="hover:text-yellow-500 transition">
                  Ship Package
                </Link>
              </li>
              <li>
                <Link href="/rates" className="hover:text-yellow-500 transition">
                  Rates
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/about" className="hover:text-yellow-500 transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-yellow-500 transition">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-yellow-500 transition">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-yellow-500" />
                <span>+1-800-MSE-SHIP</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-yellow-500" />
                <span>support@mse.com</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-yellow-500" />
                <span>Global Network</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">© 2026 Mediterranean Shipping Express. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-gray-400 text-sm hover:text-yellow-500 transition">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 text-sm hover:text-yellow-500 transition">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
