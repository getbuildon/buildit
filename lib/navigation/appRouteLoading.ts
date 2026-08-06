export type AppRouteLoadingType = "home" | "project" | "backoffice" | "company"

const RESERVED_TOP_LEVEL_SEGMENTS = new Set([
  "home",
  "login",
  "recovery-password",
  "perfil",
])

export function normalizeAppPath(path: string) {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1)
  }

  return path
}

export function getAppRouteLoadingType(href: string): AppRouteLoadingType | null {
  const path = normalizeAppPath(href)

  if (path === "/home") {
    return "home"
  }

  if (path === "/backoffice" || path.startsWith("/backoffice/")) {
    return "backoffice"
  }

  if (path === "/company/new" || path.startsWith("/company/")) {
    return "company"
  }

  const segments = path.split("/").filter(Boolean)
  if (segments.length === 0) {
    return null
  }

  if (RESERVED_TOP_LEVEL_SEGMENTS.has(segments[0])) {
    return null
  }

  return "project"
}

export function hasReachedAppRoute(pathname: string, href: string) {
  const current = normalizeAppPath(pathname)
  const target = normalizeAppPath(href)
  const targetType = getAppRouteLoadingType(target)

  if (targetType === "home") {
    return current === "/home"
  }

  if (targetType === "backoffice") {
    if (target === "/backoffice") {
      return current.startsWith("/backoffice")
    }

    return current === target || current.startsWith(`${target}/`)
  }

  if (targetType === "company") {
    return current === target || current.startsWith(`${target}/`)
  }

  if (targetType === "project") {
    if (current === target) {
      return true
    }

    const targetDepth = target.split("/").filter(Boolean).length
    if (targetDepth === 1) {
      return false
    }

    return current.startsWith(`${target}/`)
  }

  return current === target
}

/** @deprecated Use hasReachedAppRoute */
export function isSameAppRoute(pathname: string, href: string) {
  return hasReachedAppRoute(pathname, href)
}
