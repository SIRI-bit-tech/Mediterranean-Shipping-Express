import { MSEHeader } from "@/components/mse-header"
import { MSEFooter } from "@/components/mse-footer"
import { HeroCarousel } from "@/components/hero-carousel"
import { ServicesSection } from "@/components/services-section"
import { HowItWorks } from "@/components/how-it-works"
import { GlobalReachSection } from "@/components/global-reach-section"
import { CTASection } from "@/components/cta-section"

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <MSEHeader />
      <HeroCarousel />
      <ServicesSection />
      <HowItWorks />
      <GlobalReachSection />
      <CTASection />
      <MSEFooter />
    </main>
  )
}
