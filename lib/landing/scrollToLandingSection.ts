import { lockLandingHeader } from "@/lib/landing/landingHeaderLock"

function isVisibleSection(element: HTMLElement) {
  return element.getClientRects().length > 0
}

function getLandingHeaderHeight() {
  const header = document.querySelector<HTMLElement>("[data-landing-header]")
  return header?.offsetHeight ?? 80
}

function getSectionScrollTop(target: HTMLElement) {
  const targetTop = window.scrollY + target.getBoundingClientRect().top
  return Math.max(0, targetTop - getLandingHeaderHeight())
}

export function scrollToLandingSection(sectionId: string) {
  const marked = document.querySelectorAll<HTMLElement>(
    `[data-landing-section="${sectionId}"]`,
  )
  const visibleMarked = Array.from(marked).find(isVisibleSection)
  const target = visibleMarked ?? document.getElementById(sectionId)

  if (!target) return

  lockLandingHeader()
  window.scrollTo({
    top: getSectionScrollTop(target),
    behavior: "smooth",
  })
}
