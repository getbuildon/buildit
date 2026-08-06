import { LandingActionsProvider } from "@/components/landing/LandingActionsProvider"
import { LandingDemoSection } from "@/components/landing/LandingDemoSection"
import { LandingFaqSection } from "@/components/landing/LandingFaqSection"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { LandingHeader } from "@/components/landing/LandingHeader"
import { LandingHeroDesktop } from "@/components/landing/LandingHeroDesktop"
import { LandingProblemSection } from "@/components/landing/LandingProblemSection"
import { LandingPricingSection } from "@/components/landing/LandingPricingSection"
import { LandingSolutionsSection } from "@/components/landing/LandingSolutionsSection"

export default function LandingPage() {
  return (
    <LandingActionsProvider>
    <div className="landing-page min-h-screen overflow-x-hidden bg-background text-foreground">
      <LandingHeader />
      <div className="hidden lg:block">
        <LandingHeroDesktop />
        <LandingProblemSection />
      </div>
      <LandingSolutionsSection />
      <LandingPricingSection />
      <LandingDemoSection />
      <LandingFaqSection />
      <LandingFooter />
    </div>
    </LandingActionsProvider>
  )
}
