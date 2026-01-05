"use client"

export function GlobalReachSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black text-white">
      <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div>
          <p className="text-yellow-500 font-semibold mb-2 text-sm">GLOBAL NETWORK</p>
          <h2 className="text-4xl font-bold mb-4">Connecting The World</h2>
          <p className="text-gray-300 mb-8 leading-relaxed">
            With strategically located hubs across the Mediterranean, Europe, Americas, and Asia, we ensure your cargo
            reaches its destination efficiently.
          </p>

          <div className="flex gap-12">
            <div>
              <div className="text-3xl font-bold text-yellow-500 mb-2">200+</div>
              <div className="text-sm text-gray-400">Countries Served</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-500 mb-2">45+</div>
              <div className="text-sm text-gray-400">Distribution Hubs</div>
            </div>
          </div>
        </div>

        {/* Right - Map Visualization */}
        <div className="relative h-80 rounded-lg overflow-hidden bg-gray-900">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&h=400&fit=crop')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-black/40"></div>
          </div>

          {/* Animated dots for hubs */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full h-full">
              {/* Milan Hub */}
              <div className="absolute top-1/4 left-1/3 w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
              {/* New York Hub */}
              <div
                className="absolute top-1/3 right-1/4 w-4 h-4 bg-yellow-500 rounded-full animate-pulse"
                style={{ animationDelay: "0.5s" }}
              ></div>
              {/* Singapore Hub */}
              <div
                className="absolute bottom-1/4 right-1/3 w-4 h-4 bg-yellow-500 rounded-full animate-pulse"
                style={{ animationDelay: "1s" }}
              ></div>
            </div>
          </div>

          {/* Label */}
          <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur px-4 py-2 rounded-lg text-sm font-semibold text-white">
            Live Traffic: Active
          </div>
        </div>
      </div>
    </section>
  )
}
