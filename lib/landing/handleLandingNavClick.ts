import { scrollToLandingSection } from "@/lib/landing/scrollToLandingSection"

export function handleLandingNavClick(
  event: React.MouseEvent<HTMLAnchorElement>,
  sectionId: string,
  onNavigate?: () => void,
) {
  onNavigate?.()
  event.preventDefault()

  if (sectionId === "inicio") {
    window.scrollTo({ top: 0, behavior: "smooth" })
    return
  }

  scrollToLandingSection(sectionId)
}
