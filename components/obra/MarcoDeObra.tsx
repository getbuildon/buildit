"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ArrowRightLeft,
  BadgeCheck,
  Building2,
  ChevronDown,
  ClipboardList,
  Contact,
  Globe,
  House,
  LayoutDashboard,
  LogOut,
  Menu as IconoMenu,
  Settings,
  UserCircle,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"
import { useEffect, type MouseEvent, type ReactNode } from "react"

import { Avatar } from "@/library/atoms/avatar/Avatar"
import { Badge } from "@/library/atoms/badge/Badge"
import { IconButton } from "@/library/atoms/button/IconButton"
import { Icon } from "@/library/atoms/icon/Icon"
import { Tooltip } from "@/library/atoms/tooltip/Tooltip"
import { installFocusModality } from "@/library/foundations/focus/modality"
import { WorkspaceLayout } from "@/library/layouts/workspace/WorkspaceLayout"
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/library/molecules/menu/Menu"
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/library/organisms/sheet/Sheet"
import { Sidebar, SidebarItem, SidebarSection } from "@/library/organisms/sidebar/Sidebar"

import { useAppRouteNavigation } from "@/components/navigation/AppRouteLoadingProvider"
import { useProjectAccess } from "@/components/project-shell/ProjectAccessProvider"
import { ProjectMetaProvider } from "@/components/project-shell/ProjectMetaProvider"
import {
  ProjectMobileMenuProvider,
  useProjectMobileMenu,
} from "@/components/project-shell/ProjectMobileMenuContext"
import {
  matchesProjectNavHref,
  useProjectNavigation,
} from "@/components/project-shell/ProjectNavigationContext"
import type { ProjectNavIconId } from "@/components/project-shell/ProjectNavIcons"
import { useAuth } from "@/context/AuthContextSupabase"
import { postLogoutPath } from "@/lib/auth/postLogout"
import { getAllowedProjectNavItems, isProjectNavActive } from "@/lib/project/navigation"
import { projectHref } from "@/lib/project/routes"
import type { SidebarUserProfile } from "@/lib/profile/sidebarUserProfile"
import type { UserProjectListItem } from "@/lib/projects/types"

/**
 * El marco de todas las pantallas de una obra, armado con la librería BuildOn: menú
 * lateral flotante desde 1024 px y, abajo de eso, la barra con la obra y el menú que baja
 * desde arriba. Es «Pantallas/Obra» (como hoy) del catálogo con los datos de verdad.
 */

const ICONOS: Record<ProjectNavIconId, LucideIcon> = {
  dashboard: LayoutDashboard,
  "mi-unidad": House,
  "trabajo-diario": ClipboardList,
  certificaciones: BadgeCheck,
  equipo: Users,
  clientes: Contact,
  configuracion: Settings,
  "portal-clientes": Globe,
}

type DatosDelMarco = {
  project: UserProjectListItem
  userProfile: SidebarUserProfile
}

/* ------------------------------------------------------------------ Piezas */

function MarcaDeLaEmpresa({ logoUrl }: { logoUrl: string | null | undefined }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-control bg-action text-action-ink">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- logos de afuera, sin optimizar
        <img src={logoUrl} alt="" className="size-full object-cover" />
      ) : (
        <Icon icon={Building2} />
      )}
    </span>
  )
}

function IdentidadDeLaObra({ project }: { project: UserProjectListItem }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-snug">
      <MarcaDeLaEmpresa logoUrl={project.companyLogoUrl} />
      <div className="flex min-w-0 flex-col">
        <p className="truncate text-label font-semibold">{project.organizationName || "Organización"}</p>
        <p className="truncate text-meta">{project.name}</p>
      </div>
    </div>
  )
}

/** Volver al inicio para elegir otra obra. Los clientes no lo tienen. */
function CambiarDeObra() {
  const { navigate } = useAppRouteNavigation()
  const { loginAudience } = useProjectAccess()
  if (loginAudience === "cliente") return null
  return (
    <Tooltip content="Cambiar de obra">
      <Link
        href="/home"
        aria-label="Cambiar de obra"
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey) return
          event.preventDefault()
          navigate("/home")
        }}
        className="focus-ring motion-color grid size-6 shrink-0 place-items-center rounded-compact bg-canvas-track text-ink-subtle hover:text-ink-muted"
      >
        <Icon icon={ArrowRightLeft} size="xs" />
      </Link>
    </Tooltip>
  )
}

function useSalir() {
  const { logOut } = useAuth()
  const router = useRouter()
  return async () => {
    const destino = postLogoutPath()
    await logOut()
    router.replace(destino)
    router.refresh()
  }
}

function MenuDelUsuario({ project, userProfile }: DatosDelMarco) {
  const { navigate } = useAppRouteNavigation()
  const salir = useSalir()
  return (
    <div className="flex items-center gap-snug rounded-control bg-canvas-sunken p-snug">
      <Avatar name={userProfile.fullName} src={userProfile.avatarUrl} size="sm" tone="naranja" />
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate text-label font-semibold">{userProfile.fullName}</p>
        <p className="truncate text-meta">{userProfile.roleLabel}</p>
      </div>
      <Menu>
        <MenuTrigger asChild>
          <button
            type="button"
            aria-label="Menú de usuario"
            className="focus-ring motion-color motion-press group/trigger grid size-6 shrink-0 cursor-pointer place-items-center rounded-compact bg-canvas-track text-ink hover:bg-surface-pressed data-[state=open]:bg-canvas-inverse data-[state=open]:text-ink-inverse"
          >
            <Icon
              icon={ChevronDown}
              size="xs"
              className="transition-transform duration-(--duration-base) group-data-[state=open]/trigger:rotate-180"
            />
          </button>
        </MenuTrigger>
        <MenuContent side="top" className="w-48">
          <div className="flex flex-col border-b border-line px-compact pt-compact pb-snug">
            <p className="truncate text-label">{userProfile.fullName}</p>
            {userProfile.email ? <p className="truncate text-meta text-ink-muted">{userProfile.email}</p> : null}
            {userProfile.roleLabel ? <Badge className="mt-compact self-start">{userProfile.roleLabel}</Badge> : null}
          </div>
          <MenuItem icon={UserCircle} className="mt-related" onSelect={() => navigate(projectHref(project.projectId, "perfil"))}>
            Mi Perfil
          </MenuItem>
          <MenuItem icon={LogOut} tone="danger" onSelect={() => void salir()}>
            Cerrar sesión
          </MenuItem>
        </MenuContent>
      </Menu>
    </div>
  )
}

/** Las secciones a las que la persona tiene acceso. Marca la actual (o a la que se está yendo). */
function Secciones({ projectId, alNavegar }: { projectId: string; alNavegar?: () => void }) {
  const pathname = usePathname()
  const { permissions, loginAudience } = useProjectAccess()
  const { navigate, pendingHref } = useProjectNavigation()
  const items = getAllowedProjectNavItems(permissions, loginAudience)

  return (
    <SidebarSection>
      {items.map((item) => {
        const href = projectHref(projectId, item.segment || undefined)
        const activa = pendingHref ? matchesProjectNavHref(pendingHref, href) : isProjectNavActive(pathname, projectId, item.segment)
        const ir = (event: MouseEvent<HTMLAnchorElement>) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey) return
          event.preventDefault()
          alNavegar?.()
          if (!activa) navigate(href)
        }
        return (
          <SidebarItem key={item.segment || "dashboard"} asChild icon={ICONOS[item.icon]} active={activa}>
            <Link href={href} onClick={ir}>
              {item.label}
            </Link>
          </SidebarItem>
        )
      })}
    </SidebarSection>
  )
}

function MenuLateral(datos: DatosDelMarco) {
  return (
    <Sidebar
      variant="floating"
      label="Secciones de la obra"
      header={
        <>
          <IdentidadDeLaObra project={datos.project} />
          <CambiarDeObra />
        </>
      }
      footer={<MenuDelUsuario {...datos} />}
    >
      <Secciones projectId={datos.project.projectId} />
    </Sidebar>
  )
}

/** Celular y tablet: barra de 80 con la obra; el menú baja desde arriba. */
function BarraDelCelular({ project, userProfile }: DatosDelMarco) {
  const { isOpen, setOpen } = useProjectMobileMenu()
  const { navigate } = useAppRouteNavigation()
  const salir = useSalir()
  const pathname = usePathname()

  // Al cambiar de sección o pasar a pantalla grande, el menú se cierra.
  useEffect(() => setOpen(false), [pathname, setOpen])
  useEffect(() => {
    const grande = window.matchMedia("(min-width: 1024px)")
    const cerrar = () => grande.matches && setOpen(false)
    grande.addEventListener("change", cerrar)
    return () => grande.removeEventListener("change", cerrar)
  }, [setOpen])

  const fila = (boton: ReactNode) => (
    <div className="flex h-20 items-center justify-between gap-snug px-block">
      <IdentidadDeLaObra project={project} />
      <div className="flex shrink-0 items-center gap-compact">
        <CambiarDeObra />
        {boton}
      </div>
    </div>
  )

  return (
    <div className="relative bg-canvas-raised">
      <Sheet open={isOpen} onOpenChange={setOpen}>
        {fila(
          <SheetTrigger asChild>
            <IconButton icon={IconoMenu} label="Abrir menú" tooltip={false} size="large" />
          </SheetTrigger>,
        )}
        <SheetContent side="top" title="Menú de la obra" hideHeader className="bg-canvas-raised shadow-near">
          {fila(
            <SheetClose asChild>
              <IconButton icon={X} label="Cerrar menú" tooltip={false} size="large" />
            </SheetClose>,
          )}
          <nav aria-label="Secciones de la obra" className="flex flex-col px-block pt-group pb-block">
            <Secciones projectId={project.projectId} alNavegar={() => setOpen(false)} />
            <div className="mt-group flex flex-col gap-related border-t border-line pt-group">
              <div className="mb-compact flex items-center gap-snug rounded-control bg-canvas-sunken p-snug">
                <Avatar name={userProfile.fullName} src={userProfile.avatarUrl} size="sm" tone="naranja" />
                <div className="flex min-w-0 flex-col">
                  <p className="truncate text-label font-semibold">{userProfile.fullName}</p>
                  <p className="truncate text-meta">{userProfile.roleLabel}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  navigate(projectHref(project.projectId, "perfil"))
                }}
                className="focus-ring state-veil flex min-h-10 cursor-pointer items-center gap-snug rounded-control px-snug text-label text-ink"
              >
                <Icon icon={UserCircle} className="text-ink-muted" /> Mi Perfil
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  void salir()
                }}
                className="focus-ring flex min-h-10 cursor-pointer items-center gap-snug rounded-control px-snug text-label text-fn-danger hover:bg-fn-danger-canvas"
              >
                <Icon icon={LogOut} /> Cerrar sesión
              </button>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}

/* ------------------------------------------------------------------ Marco */

export function MarcoDeObra({ project, userProfile, children }: DatosDelMarco & { children: ReactNode }) {
  useEffect(() => installFocusModality(), [])
  // Precarga el inicio (Next lo guarda 5 minutos): volver a «Cambiar de obra» no espera al servidor.
  const router = useRouter()
  useEffect(() => router.prefetch("/home"), [router])
  const datos = { project, userProfile }
  return (
    <ProjectMobileMenuProvider>
      <WorkspaceLayout className="w-full" sidebar={<MenuLateral {...datos} />} topbar={<BarraDelCelular {...datos} />}>
        <ProjectMetaProvider value={{ id: project.projectId, name: project.name }}>{children}</ProjectMetaProvider>
      </WorkspaceLayout>
    </ProjectMobileMenuProvider>
  )
}
