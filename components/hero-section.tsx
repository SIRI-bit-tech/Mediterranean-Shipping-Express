"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Globe, Zap, Shield } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-white via-white to-gray-50">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-96 h-96 bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-black rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full mb-8 border border-gray-200">
          <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
          <span className="text-sm font-medium text-gray-700">Trusted by 50,000+ businesses globally</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-7xl font-bold text-black mb-6 tracking-tight">
          Global Logistics.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-600">
            Simplified.
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          Ship packages anywhere in the world with real-time tracking, instant updates, and premium logistics solutions.
          From local to international, we've got you covered.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button size="lg" className="bg-black text-white hover:bg-gray-900 px-8 gap-2" asChild>
            <Link href="/ship">
              Ship Now
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-gray-300 text-black hover:bg-gray-50 px-8 bg-transparent"
            asChild
          >
            <Link href="/track">Track Package</Link>
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Globe className="h-6 w-6 text-yellow-600" />
            </div>
            <h3 className="font-semibold text-black">Global Coverage</h3>
            <p className="text-sm text-gray-600">Shipping to 180+ countries worldwide</p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Zap className="h-6 w-6 text-yellow-600" />
            </div>
            <h3 className="font-semibold text-black">Real-Time Updates</h3>
            <p className="text-sm text-gray-600">Live tracking with minute-by-minute updates</p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Shield className="h-6 w-6 text-yellow-600" />
            </div>
            <h3 className="font-semibold text-black">Secure & Insured</h3>
            <p className="text-sm text-gray-600">Full protection for your valuable shipments</p>
          </div>
        </div>
      </div>
    </section>
  )
}
