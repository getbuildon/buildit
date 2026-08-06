import { LandingHeader } from "@/components/landing/LandingHeader"
import { LandingHero } from "@/components/landing/LandingHero"
import { LandingPricingSection } from "@/components/landing/LandingPricingSection"
import { LandingSolutionsSection } from "@/components/landing/LandingSolutionsSection"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />
      <LandingHero />
      <LandingSolutionsSection />
      <LandingPricingSection />
    </div>
  )
}
