import { lockLandingHeader } from "@/lib/landing/landingHeaderLock"
import { scrollToLandingSection } from "@/lib/landing/scrollToLandingSection"

const MENU_CLOSE_BEFORE_SCROLL_MS = 300

function goToLandingSection(sectionId: string) {
  if (sectionId === "inicio") {
    lockLandingHeader()
    window.scrollTo({ top: 0, behavior: "smooth" })
    return
  }

  scrollToLandingSection(sectionId)
}

export function handleLandingNavClick(
  event: React.MouseEvent<HTMLAnchorElement>,
  sectionId: string,
  onNavigate?: () => void,
) {
  event.preventDefault()
  onNavigate?.()

  if (onNavigate) {
    window.setTimeout(
      () => goToLandingSection(sectionId),
      MENU_CLOSE_BEFORE_SCROLL_MS,
    )
    return
  }

  goToLandingSection(sectionId)
}
