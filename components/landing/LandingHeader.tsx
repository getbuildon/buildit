import { LandingHeaderDesktop } from "@/components/landing/LandingHeaderDesktop"
import { LandingHeaderMobile } from "@/components/landing/LandingHeaderMobile"

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 bg-background">
      <div className="lg:hidden">
        <LandingHeaderMobile />
      </div>
      <div className="hidden lg:block">
        <LandingHeaderDesktop />
      </div>
    </header>
  )
}
