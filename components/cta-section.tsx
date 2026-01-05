"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-yellow-500">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">Ready to Move the World?</h2>
        <p className="text-lg text-black/80 mb-10 max-w-2xl mx-auto">
          Join thousands of businesses who trust MSE for their critical logistics needs. Fast, secure, and reliable
          shipping starts here.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="bg-black text-white hover:bg-gray-900 px-8" asChild>
            <Link href="/signup">Create Free Account</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-black bg-transparent text-black hover:bg-black/10 px-8"
            asChild
          >
            <Link href="/track">Track a Package</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
