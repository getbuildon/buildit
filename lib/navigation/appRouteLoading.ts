import {
  isProjectDashboardPath,
  parseProjectPath,
} from "@/lib/project/routes"

export type AppRouteLoadingType =
  | "home"
  | "project"
  | "backoffice"
  | "company"
  | "perfil"
  | "create-project"

export function normalizeAppPath(path: string) {
  const withoutQuery = path.split("?")[0] ?? path
  if (withoutQuery.length > 1 && withoutQuery.endsWith("/")) {
    return withoutQuery.slice(0, -1)
  }

  return withoutQuery
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

  if (path === "/perfil") {
    return "perfil"
  }

  if (path === "/projects/new") {
    return "create-project"
  }

  const project = parseProjectPath(path)
  if (project?.rest === "perfil" || project?.rest.startsWith("perfil/")) {
    return "perfil"
  }

  if (project) {
    return "project"
  }

  return null
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

  if (targetType === "perfil") {
    return current === target
  }

  if (targetType === "create-project") {
    return current.startsWith("/projects/new")
  }

  if (targetType === "project") {
    if (current === target) {
      return true
    }

    if (isProjectDashboardPath(target)) {
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
