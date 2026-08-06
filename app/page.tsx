import { LandingDemoSection } from "@/components/landing/LandingDemoSection"
import { LandingFaqSection } from "@/components/landing/LandingFaqSection"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { LandingHeader } from "@/components/landing/LandingHeader"
import { LandingHero } from "@/components/landing/LandingHero"
import { LandingPricingSection } from "@/components/landing/LandingPricingSection"
import { LandingSolutionsSection } from "@/components/landing/LandingSolutionsSection"

export default function LandingPage() {
  return (
    <div className="landing-page min-h-screen overflow-x-hidden bg-background text-foreground">
      <LandingHeader />
      <div className="hidden lg:block">
        <LandingHero />
      </div>
      <LandingSolutionsSection />
      <LandingPricingSection />
      <LandingDemoSection />
      <LandingFaqSection />
      <LandingFooter />
    </div>
  )
}
