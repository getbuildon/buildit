"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, ChevronDown, LayoutDashboard, LogOut, Monitor, Moon, Plus, Sun, UserCircle, X, type LucideIcon } from "lucide-react"
import { useEffect, useState, useSyncExternalStore, type MouseEvent, type ReactNode } from "react"

import { Avatar } from "@/library/atoms/avatar/Avatar"
import { Button } from "@/library/atoms/button/Button"
import { Icon } from "@/library/atoms/icon/Icon"
import { Link as LinkDeTexto } from "@/library/atoms/link/Link"
import { Skeleton } from "@/library/atoms/skeleton/Skeleton"
import { installFocusModality } from "@/library/foundations/focus/modality"
import { HomeLayout } from "@/library/layouts/home/HomeLayout"
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from "@/library/molecules/menu/Menu"
import { ProjectCard, ProjectCardSkeleton } from "@/library/organisms/project-card/ProjectCard"

import type { HomeCompanyOption, HomeShellData } from "@/app/home/actions"
import { useAppRouteNavigation } from "@/components/navigation/AppRouteLoadingProvider"
import { useAuth } from "@/context/AuthContextSupabase"
import { switchToClientPortal } from "@/lib/auth/loginAccess"
import { writeLoginAudienceCookie } from "@/lib/auth/loginAudience"
import { postLogoutPath } from "@/lib/auth/postLogout"
import { formatCompanyRole } from "@/lib/company/formatCompanyRole"
import { projectDashboardHref } from "@/lib/project/routes"
import { elegirTema, escucharTema, temaGuardado, type Tema } from "@/lib/tema"
import type { ProjectHomeProgress } from "@/lib/projects/homeProjectProgress"
import type { HomeProjectListItem } from "@/lib/projects/types"

/**
 * El inicio de la app armado con la librería BuildOn: es «Pantallas/Inicio» del catálogo
 * con los datos de verdad. Los datos los trae app/home/page.tsx; acá solo se dibuja.
 */

const CANTIDAD_DE_ESQUELETOS = 3
const BACKOFFICE_HREF = "/backoffice/dashboard"
const PERFIL_HREF = "/perfil"
const CREAR_OBRA_HREF = "/projects/new"

const hrefDeEmpresa = (companyId: string) => `/company/${companyId}/suscripciones`

/** Un link de Next que pasa por la navegación de la app (muestra el esqueleto de destino). */
function useIrA() {
  const { navigate } = useAppRouteNavigation()
  return (href: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    event.preventDefault()
    navigate(href)
  }
}

/* ------------------------------------------------------------------ Barra de arriba */

function BotonPortalClientes() {
  const { navigate } = useAppRouteNavigation()
  const [yendo, setYendo] = useState(false)

  const ir = async () => {
    if (yendo) return
    setYendo(true)
    const resultado = await switchToClientPortal()
    if (!resultado.ok) {
      setYendo(false)
      return
    }
    writeLoginAudienceCookie("cliente")
    navigate(resultado.redirectTo)
  }

  return (
    <Button variant="earth" size="compact" disabled={yendo} onClick={() => void ir()}>
      Portal Clientes
    </Button>
  )
}

function MenuDeEmpresa({ empresa, empresas }: { empresa: { id: string; name: string }; empresas: HomeCompanyOption[] }) {
  const { navigate } = useAppRouteNavigation()
  const irA = useIrA()

  if (empresas.length <= 1) {
    const href = hrefDeEmpresa(empresa.id)
    return (
      <Button asChild variant="earth" size="compact" className="max-w-30 sm:max-w-56">
        <Link href={href} onClick={irA(href)}>
          <span className="truncate">{empresa.name}</span>
        </Link>
      </Button>
    )
  }

  return (
    <Menu>
      <MenuTrigger asChild>
        <Button
          variant="earth"
          size="compact"
          className="max-w-30 sm:max-w-56"
          aria-label={`Empresa: ${empresa.name}. Cambiar de empresa`}
        >
          <span className="truncate">{empresa.name}</span>
          <Icon icon={ChevronDown} size="xs" />
        </Button>
      </MenuTrigger>
      <MenuContent className="min-w-56">
        <MenuLabel>Empresas</MenuLabel>
        {empresas.map((opcion) => (
          <MenuItem key={opcion.id} className="h-auto py-compact" onSelect={() => navigate(hrefDeEmpresa(opcion.id))}>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-label">{opcion.name}</span>
              <span className="text-meta text-ink-muted">{formatCompanyRole(opcion.role)}</span>
            </span>
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  )
}

function MenuDeUsuario({ nombre, avatarUrl }: { nombre: string; avatarUrl: string | null }) {
  const { logOut } = useAuth()
  const router = useRouter()
  const { navigate } = useAppRouteNavigation()

  const salir = async () => {
    const destino = postLogoutPath()
    await logOut()
    router.replace(destino)
    router.refresh()
  }

  return (
    <Menu>
      <MenuTrigger asChild>
        <button
          type="button"
          aria-label={`Menú de ${nombre}`}
          className="focus-ring motion-color flex shrink-0 cursor-pointer items-center gap-related rounded-control py-related pr-related pl-related text-on-earth-muted hover:bg-earth-veil hover:text-on-earth data-[state=open]:bg-earth-veil data-[state=open]:text-on-earth sm:gap-compact sm:pr-compact"
        >
          <Avatar name={nombre} src={avatarUrl} size="sm" tone="naranja" />
          <span className="hidden max-w-30 truncate text-label sm:inline">{nombre}</span>
          <Icon icon={ChevronDown} size="xs" />
        </button>
      </MenuTrigger>
      <MenuContent className="min-w-48">
        <div className="flex flex-col gap-compact px-compact pt-compact pb-snug">
          <Avatar name={nombre} src={avatarUrl} size="md" tone="naranja" />
          <p className="text-label">{nombre}</p>
        </div>
        <MenuSeparator />
        <MenuItem icon={UserCircle} onSelect={() => navigate(PERFIL_HREF)}>
          Editar perfil
        </MenuItem>
        <MenuItem icon={LogOut} onSelect={() => void salir()}>
          Cerrar sesión
        </MenuItem>
      </MenuContent>
    </Menu>
  )
}

const OPCIONES_DE_TEMA: { tema: Tema; nombre: string; icono: LucideIcon }[] = [
  { tema: "claro", nombre: "Claro", icono: Sun },
  { tema: "oscuro", nombre: "Oscuro", icono: Moon },
  { tema: "sistema", nombre: "Como el dispositivo", icono: Monitor },
]

/** Modo claro, oscuro o el del dispositivo. Mismo estilo que el botón del usuario. */
function SelectorDeTema() {
  const tema = useSyncExternalStore(escucharTema, temaGuardado, () => "claro" as Tema)
  const actual = OPCIONES_DE_TEMA.find((opcion) => opcion.tema === tema) ?? OPCIONES_DE_TEMA[0]!

  return (
    <Menu>
      <MenuTrigger asChild>
        <button
          type="button"
          aria-label={`Modo de color: ${actual.nombre}. Cambiar`}
          className="focus-ring motion-color grid size-control-compact shrink-0 cursor-pointer place-items-center rounded-control text-on-earth-muted hover:bg-earth-veil hover:text-on-earth data-[state=open]:bg-earth-veil data-[state=open]:text-on-earth"
        >
          <Icon icon={actual.icono} />
        </button>
      </MenuTrigger>
      <MenuContent className="min-w-48">
        <MenuLabel>Modo de color</MenuLabel>
        {OPCIONES_DE_TEMA.map((opcion) => (
          <MenuItem
            key={opcion.tema}
            icon={opcion.icono}
            role="menuitemradio"
            aria-checked={opcion.tema === tema}
            onSelect={() => elegirTema(opcion.tema)}
          >
            <span className="flex-1">{opcion.nombre}</span>
            {opcion.tema === tema ? <Icon icon={Check} size="xs" className="text-action-text" /> : null}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  )
}

/* ------------------------------------------------------------------ Barra de abajo */

function AvisoDelBackoffice() {
  const [visible, setVisible] = useState(true)
  const irA = useIrA()
  if (!visible) return null
  return (
    <div role="status" className="flex w-full max-w-xl items-center gap-snug text-body text-on-earth-muted animate-enter">
      <Icon icon={LayoutDashboard} className="shrink-0" />
      <p className="min-w-0 flex-1">
        Como administrador de BuildOn, podés acceder al{" "}
        <LinkDeTexto asChild tone="ink" className="text-on-earth decoration-on-earth-muted">
          <Link href={BACKOFFICE_HREF} onClick={irA(BACKOFFICE_HREF)}>
            backoffice
          </Link>
        </LinkDeTexto>
        .
      </p>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Cerrar aviso"
        className="focus-ring motion-color grid size-8 shrink-0 cursor-pointer place-items-center rounded-control text-on-earth-muted hover:bg-earth-veil hover:text-on-earth"
      >
        <Icon icon={X} />
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ Pantalla */

function useFocoVisible() {
  useEffect(() => installFocusModality(), [])
}

function ListaDeObras({ children }: { children: ReactNode }) {
  return (
    <ul
      className="mt-8 flex w-full flex-wrap justify-center gap-group pb-16 sm:mt-10 sm:gap-5 sm:pb-20 md:mt-12 md:pb-24"
      aria-label="Tus obras"
    >
      {children}
    </ul>
  )
}

/** El inicio mientras carga: la misma pantalla con lugares vacíos. Sin textos de «Cargando…». */
export function EsqueletoDeInicio() {
  useFocoVisible()
  return (
    <HomeLayout
      busy
      header={
        <>
          <Skeleton className="h-control-compact w-28 bg-earth-veil sm:w-36" />
          <Skeleton shape="circle" className="size-avatar-sm bg-earth-veil" />
        </>
      }
    >
      <Skeleton className="h-10 w-64 max-w-full bg-earth-veil sm:w-80" />
      <ListaDeObras>
        {Array.from({ length: CANTIDAD_DE_ESQUELETOS }, (_, i) => (
          <li key={i} className="flex w-full max-w-60 sm:w-60">
            <ProjectCardSkeleton />
          </li>
        ))}
      </ListaDeObras>
    </HomeLayout>
  )
}

export type PantallaDeInicioProps = {
  email: string | undefined
  /** undefined mientras no hay nada para mostrar (ni del servidor ni guardado). */
  shell: HomeShellData | null | undefined
  shellPendiente: boolean
  projects: HomeProjectListItem[]
  projectsPendiente: boolean
  progress: Record<string, ProjectHomeProgress> | undefined
  /** Aviso bajo las tarjetas (falló el progreso, sin conexión…). */
  aviso: string | null
  /** No hay nada para mostrar y falló: se ofrece reintentar. */
  error: { mensaje: string; reintentar: () => void } | null
}

export function PantallaDeInicio({
  email,
  shell,
  shellPendiente,
  projects,
  projectsPendiente,
  progress,
  aviso,
  error,
}: PantallaDeInicioProps) {
  useFocoVisible()
  const irA = useIrA()

  if (error) {
    return (
      <HomeLayout>
        <div role="alert" className="flex flex-col items-center gap-block text-center">
          <p className="text-body">{error.mensaje}</p>
          <Button variant="earth" onClick={error.reintentar}>
            Reintentar
          </Button>
        </div>
      </HomeLayout>
    )
  }

  if (shellPendiente) return <EsqueletoDeInicio />

  const nombre = shell?.displayName || email?.split("@")[0] || ""
  const primerNombre = shell?.firstName?.trim() || nombre.split(/\s+/)[0] || ""
  const empresa = shell?.manageableCompanies[0] ?? shell?.primaryCompany ?? null
  const sinObras = !projectsPendiente && projects.length === 0
  const puedeCrear = Boolean(shell?.canCreateProjects)

  return (
    <HomeLayout
      header={
        <>
          {shell?.hasClientAccess ? <BotonPortalClientes /> : null}
          {empresa ? <MenuDeEmpresa empresa={empresa} empresas={shell?.manageableCompanies ?? []} /> : null}
          <SelectorDeTema />
          <MenuDeUsuario nombre={nombre} avatarUrl={shell?.avatarUrl ?? null} />
        </>
      }
      footer={shell?.canSeeBackoffice ? <AvisoDelBackoffice /> : null}
      busy={projectsPendiente}
    >
      <div className="flex w-full max-w-reading flex-col items-center gap-compact px-related text-center sm:gap-snug">
        <h1 className="text-welcome">
          ¡Hola, {primerNombre}! <span aria-hidden>👋</span>
        </h1>
        {sinObras ? (
          <p className="text-welcome-lede">
            {puedeCrear
              ? "Creá tu primera obra."
              : "No tenés obras asignadas. Cuando te sumen a una, va a aparecer acá."}
          </p>
        ) : null}
      </div>

      {sinObras && puedeCrear ? (
        <Button asChild size="large" className="mt-block">
          <Link href={CREAR_OBRA_HREF} onClick={irA(CREAR_OBRA_HREF)}>
            <Icon icon={Plus} /> Crear obra
          </Link>
        </Button>
      ) : null}

      <ListaDeObras>
        {projectsPendiente
          ? Array.from({ length: CANTIDAD_DE_ESQUELETOS }, (_, i) => (
              <li key={i} className="flex w-full max-w-60 sm:w-60">
                <ProjectCardSkeleton />
              </li>
            ))
          : projects.map((obra) => {
              const borrador = obra.status === "draft"
              const href = borrador
                ? `/projects/new?projectId=${obra.projectId}`
                : projectDashboardHref(obra.projectId)
              const avance = progress?.[obra.projectId]
              return (
                <li key={obra.projectId} className="flex w-full max-w-60 sm:w-60">
                  <ProjectCard
                    name={obra.name}
                    address={obra.address}
                    logoUrl={obra.companyLogoUrl}
                    floors={obra.floors}
                    draft={borrador}
                    progress={avance?.generalProgressPercent}
                    weeklyDelta={avance ? avance.weeklyProgressDelta : progress ? null : undefined}
                    link={
                      <Link href={href} onClick={irA(href)}>
                        {obra.name}
                      </Link>
                    }
                  />
                </li>
              )
            })}
      </ListaDeObras>

      {aviso ? (
        <p role="status" className="-mt-12 text-center text-body text-on-earth-muted">
          {aviso}
        </p>
      ) : null}
    </HomeLayout>
  )
}
