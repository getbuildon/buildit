import {
  ACCESO_EQUIPO_PATH,
  PORTAL_CLIENTE_PATH,
  type LoginAudience,
} from "@/lib/auth/loginAudience"
import { parseProjectPath, projectHref } from "@/lib/project/routes"

const TEAM_ONLY_PREFIXES = [
  "/home",
  "/projects",
  "/company",
  "/admin",
  "/backoffice",
  "/perfil",
] as const

function isTeamOnlyPath(pathname: string) {
  return TEAM_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

function isClientAllowedProjectRest(rest: string) {
  return (
    rest === "mi-unidad" ||
    rest.startsWith("mi-unidad/") ||
    rest === "perfil" ||
    rest.startsWith("perfil/")
  )
}

export function audienceRedirectPath(
  pathname: string,
  audience: LoginAudience | null,
): string | null {
  if (pathname === "/login" || pathname.startsWith("/login/")) {
    return ACCESO_EQUIPO_PATH
  }

  if (audience === "cliente") {
    if (isTeamOnlyPath(pathname)) return PORTAL_CLIENTE_PATH

    const project = parseProjectPath(pathname)
    if (project && !isClientAllowedProjectRest(project.rest)) {
      return projectHref(project.projectId, "mi-unidad")
    }
  }

  if (audience === "equipo") {
    if (pathname === PORTAL_CLIENTE_PATH || pathname.startsWith(`${PORTAL_CLIENTE_PATH}/`)) {
      return "/home"
    }

    const project = parseProjectPath(pathname)
    if (project && (project.rest === "mi-unidad" || project.rest.startsWith("mi-unidad/"))) {
      return projectHref(project.projectId)
    }
  }

  return null
}
