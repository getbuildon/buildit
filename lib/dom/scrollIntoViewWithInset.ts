const DEFAULT_EXTRA_BOTTOM = 32

/** Altura visible de barras fijas/sticky en la parte inferior del viewport. */
export function getViewportBottomInset(): number {
  let inset = 0

  for (const element of document.querySelectorAll<HTMLElement>(
    "[data-viewport-bottom-inset]",
  )) {
    if (element.getAttribute("aria-hidden") === "true") continue

    const style = window.getComputedStyle(element)
    if (style.display === "none" || style.visibility === "hidden") continue

    const rect = element.getBoundingClientRect()
    if (rect.height <= 0) continue

    if (rect.top < window.innerHeight) {
      inset = Math.max(inset, window.innerHeight - rect.top)
    }
  }

  return inset
}

function getScrollableAncestors(element: HTMLElement): HTMLElement[] {
  const scrollables: HTMLElement[] = []
  let node: HTMLElement | null = element.parentElement

  while (node) {
    const style = window.getComputedStyle(node)
    const overflowY = style.overflowY
    const canScrollY =
      (overflowY === "auto" ||
        overflowY === "scroll" ||
        overflowY === "overlay") &&
      node.scrollHeight > node.clientHeight + 1

    if (canScrollY) scrollables.push(node)
    node = node.parentElement
  }

  const root = document.scrollingElement
  if (root instanceof HTMLElement && !scrollables.includes(root)) {
    scrollables.push(root)
  }

  return scrollables
}

function isElementFullyVisible(
  elementRect: DOMRect,
  effectiveTop: number,
  effectiveBottom: number,
) {
  return (
    elementRect.top >= effectiveTop && elementRect.bottom <= effectiveBottom
  )
}

/**
 * Desplaza hacia abajo solo lo necesario para que el elemento quede visible,
 * reservando espacio inferior para barras sticky/fixed del viewport.
 * Nunca desplaza hacia arriba.
 */
export function scrollIntoViewWithBottomInset(
  element: HTMLElement,
  options?: { extraBottom?: number; behavior?: ScrollBehavior },
) {
  const extraBottom = options?.extraBottom ?? DEFAULT_EXTRA_BOTTOM
  const behavior = options?.behavior ?? "smooth"
  const bottomLimit = window.innerHeight - getViewportBottomInset() - extraBottom

  for (const container of getScrollableAncestors(element)) {
    const elementRect = element.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    const effectiveBottom = Math.min(containerRect.bottom, bottomLimit)
    const effectiveTop = containerRect.top

    if (isElementFullyVisible(elementRect, effectiveTop, effectiveBottom)) {
      continue
    }

    if (elementRect.bottom <= effectiveBottom) {
      continue
    }

    const delta = elementRect.bottom - effectiveBottom

    if (behavior === "smooth") {
      container.scrollBy({ top: delta, behavior: "smooth" })
    } else {
      container.scrollTop += delta
    }
  }
}
