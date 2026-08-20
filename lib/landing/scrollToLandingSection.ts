function isVisibleSection(element: HTMLElement) {
  return element.getClientRects().length > 0
}

export function scrollToLandingSection(sectionId: string) {
  const marked = document.querySelectorAll<HTMLElement>(
    `[data-landing-section="${sectionId}"]`,
  )
  const visibleMarked = Array.from(marked).find(isVisibleSection)
  const target = visibleMarked ?? document.getElementById(sectionId)

  target?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  })
}
