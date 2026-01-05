"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

const carouselSlides = [
  {
    title: "Made Simple",
    subtitle: "Fast, secure, and reliable logistics at your fingertips",
    image: "/hero-slide-1.jpg",
    cta: "Track Package",
  },
  {
    title: "Global Reach",
    subtitle: "Delivering excellence to 180+ countries worldwide",
    image: "/hero-slide-2.jpg",
    cta: "Learn More",
  },
  {
    title: "Real-Time Updates",
    subtitle: "Know exactly where your package is, every moment",
    image: "/hero-slide-3.jpg",
    cta: "Start Shipping",
  },
]

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [trackingId, setTrackingId] = useState("")

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % carouselSlides.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length)

  const handleTrack = () => {
    if (trackingId.trim()) {
      window.location.href = `/track?id=${encodeURIComponent(trackingId)}`
    }
  }

  const slide = carouselSlides[currentSlide]

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Carousel Images */}
      <div className="absolute inset-0">
        {carouselSlides.map((s, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              idx === currentSlide ? "opacity-100" : "opacity-0"
            }`}
            style={{
              backgroundImage: `url(${s.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center text-white">
        <h1 className="text-5xl md:text-6xl font-bold mb-4 text-yellow-400">{slide.title}</h1>
        <p className="text-lg md:text-xl mb-8 text-gray-100 max-w-2xl mx-auto">{slide.subtitle}</p>

        {/* Tracking Input */}
        <div className="flex gap-3 mb-12 max-w-lg mx-auto">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Enter Tracking ID"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTrack()}
              className="w-full pl-12 pr-4 py-3 rounded-lg bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          <Button onClick={handleTrack} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8">
            Track Package
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-8 max-w-md mx-auto">
          <div className="bg-black/30 backdrop-blur rounded-lg p-4">
            <div className="text-3xl font-bold text-yellow-400 mb-1">200+</div>
            <div className="text-sm text-gray-100">Carriers Served</div>
          </div>
          <div className="bg-black/30 backdrop-blur rounded-lg p-4">
            <div className="text-3xl font-bold text-yellow-400 mb-1">1M+</div>
            <div className="text-sm text-gray-100">Packages Delivered</div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 p-2 rounded-full transition-all"
      >
        <ChevronLeft className="h-6 w-6 text-white" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 p-2 rounded-full transition-all"
      >
        <ChevronRight className="h-6 w-6 text-white" />
      </button>

      {/* Carousel Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
        {carouselSlides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === currentSlide ? "bg-yellow-400 w-8" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </section>
  )
}
