import { lockLandingHeader } from "@/lib/landing/landingHeaderLock"

function isVisibleSection(element: HTMLElement) {
  return element.getClientRects().length > 0
}

export function scrollToLandingSection(sectionId: string) {
  const marked = document.querySelectorAll<HTMLElement>(
    `[data-landing-section="${sectionId}"]`,
  )
  const visibleMarked = Array.from(marked).find(isVisibleSection)
  const target = visibleMarked ?? document.getElementById(sectionId)

  if (!target) return

  lockLandingHeader()
  target.scrollIntoView({
    behavior: "smooth",
    block: "start",
  })
}
