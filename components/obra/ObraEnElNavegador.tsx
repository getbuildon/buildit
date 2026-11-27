"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { AlertTriangle, ArrowLeft, SearchX } from "lucide-react"
import { useEffect, useMemo, type ReactNode } from "react"

import { Button } from "@/library/atoms/button/Button"
import { Icon } from "@/library/atoms/icon/Icon"
import { EmptyState } from "@/library/molecules/empty-state/EmptyState"

import { MarcoDeObra } from "@/components/obra/MarcoDeObra"
import { ProjectAccessProvider } from "@/components/project-shell/ProjectAccessProvider"
import { ProjectWorkspaceSkeleton } from "@/components/project-shell/ProjectWorkspaceSkeleton"
import { useAuth } from "@/context/AuthContextSupabase"
import { claves, FRESCO_MS } from "@/lib/api/claves"
import type { Arranque, ObraDelArranque } from "@/lib/api/tipos"
import { useLectura } from "@/lib/api/useLectura"
import { getLoginAudienceFromDocument, loginPathForAudience } from "@/lib/auth/loginAudience"
import type { ProjectAccessContext } from "@/lib/project/projectAccessContext"
import type { ProjectPermissions } from "@/lib/project/projectPermissions"
import type { CompanyProjectAccessRole, ProjectAccessSource } from "@/lib/project/resolveProjectAccess"
import type { SidebarUserProfile } from "@/lib/profile/sidebarUserProfile"
import { getUserInitials } from "@/lib/profile/userInitials"
import type { ProjectUserType } from "@/lib/projects/createProjectDraft"
import type { UserProjectListItem } from "@/lib/projects/types"

/**
 * El marco de la obra armado en el navegador, sin pedirle nada al servidor de Next.
 *
 * Antes, al entrar a una obra el servidor hacía cinco consultas (que existe, que no es
 * borrador, permisos, perfil y rol) antes de mostrar nada. Todo eso ya está en el
 * «arranque» del servidor de datos, que el Inicio guarda en el dispositivo: la obra abre
 * al instante con esa copia, sin señal también, y se revalida de fondo.
 */

const TIPO: Record<ObraDelArranque["acceso"]["tipo"], ProjectUserType> = {
  owner: "Owner",
  admin: "Admin",
  supervisor: "Supervisor",
  operador: "Operador",
  cliente: "Cliente",
}

/** Lo mismo que arma el servidor con getProjectAccessContext, a partir del arranque. */
function accesoDesde(obra: ObraDelArranque): ProjectAccessContext {
  const loginAudience = getLoginAudienceFromDocument() ?? "equipo"
  const { tipo, permisos, unidades } = obra.acceso
  const userType = TIPO[tipo]
  const sources: ProjectAccessSource[] = []
  if (tipo === "owner" || tipo === "admin") sources.push(permisos.configureProject === true ? "company" : "project")
  else if (tipo === "cliente") sources.push("client")
  else sources.push("project")
  return {
    userType,
    projectUserType: tipo === "cliente" ? null : userType,
    companyRole: (tipo === "owner" || tipo === "admin" ? tipo : null) as CompanyProjectAccessRole | null,
    sources,
    permissions: permisos as ProjectPermissions,
    assignedUnitIds: unidades,
    loginAudience,
  }
}

function perfilDesde(arranque: Arranque, obra: ObraDelArranque): SidebarUserProfile {
  const { persona } = arranque
  const nombre = persona.nombre?.trim() ?? ""
  const apellido = persona.apellido?.trim() ?? ""
  const email = persona.email ?? ""
  return {
    firstName: nombre,
    lastName: apellido,
    fullName: [nombre, apellido].filter(Boolean).join(" ") || email.split("@")[0] || "Usuario",
    initials: getUserInitials(nombre, apellido, email) || "U",
    roleLabel: obra.rol ?? (obra.acceso.tipo === "cliente" ? "Cliente" : TIPO[obra.acceso.tipo]),
    email,
    avatarUrl: persona.avatarUrl,
  }
}

function obraDesde(obra: ObraDelArranque): UserProjectListItem {
  return {
    projectId: obra.id,
    company_id: obra.empresa?.id ?? "",
    organizationName: obra.empresa?.nombre ?? "",
    companyLogoUrl: obra.empresa?.logoUrl ?? null,
    name: obra.nombre,
    address: obra.direccion ?? "",
    floors: obra.pisos,
    units: 0,
    status: obra.estado as UserProjectListItem["status"],
    generalProgressPercent: 0,
    weeklyProgressDelta: 0,
  }
}

function PantallaCompleta({ children }: { children: ReactNode }) {
  return <div className="fixed inset-0 flex items-center justify-center bg-canvas px-(--layout-margin) text-ink">{children}</div>
}

const volverAlInicio = (
  <Button asChild variant="outline">
    <Link href="/home">
      <Icon icon={ArrowLeft} size="xs" /> Volver al inicio
    </Link>
  </Button>
)

export function ObraEnElNavegador({ children }: { children: ReactNode }) {
  const { projectId } = useParams<{ projectId: string }>()
  const router = useRouter()
  const { user, loading } = useAuth()
  const userId = user?.id ?? ""

  // La misma lectura (y la misma copia) que el Inicio: si ya entraste, abre al instante.
  const arranque = useLectura<Arranque>({
    clave: claves.arranque(userId),
    ruta: "/arranque",
    userId,
    frescoMs: FRESCO_MS.arranque,
  })
  const datos = arranque.data
  const obra = datos?.obras.find((o) => o.id === projectId) ?? null

  const valores = useMemo(
    () => (datos && obra ? { acceso: accesoDesde(obra), proyecto: obraDesde(obra), perfil: perfilDesde(datos, obra) } : null),
    [datos, obra],
  )

  const sinSesion = !loading && !user
  const esBorrador = obra?.estado === "draft"
  useEffect(() => {
    if (sinSesion) router.replace(loginPathForAudience(getLoginAudienceFromDocument() ?? "equipo"))
    else if (esBorrador) router.replace(`/projects/new?projectId=${projectId}`)
  }, [sinSesion, esBorrador, projectId, router])

  // Que el service worker guarde la página de esta obra: así abre sin señal desde cero.
  const obraValida = Boolean(valores)
  useEffect(() => {
    if (!obraValida || typeof navigator === "undefined") return
    navigator.serviceWorker?.controller?.postMessage({ tipo: "guardarObra", obraId: projectId })
  }, [obraValida, projectId])

  if (loading || sinSesion || esBorrador) return <ProjectWorkspaceSkeleton />

  if (!datos) {
    if (arranque.isError) {
      return (
        <PantallaCompleta>
          <EmptyState
            icon={AlertTriangle}
            title="No pudimos abrir la obra"
            description="Puede ser un problema de conexión. Probá de nuevo en un momento."
            action={
              <div className="flex flex-wrap justify-center gap-compact">
                <Button variant="outline" onClick={() => void arranque.refetch()}>
                  Reintentar
                </Button>
                {volverAlInicio}
              </div>
            }
          />
        </PantallaCompleta>
      )
    }
    return <ProjectWorkspaceSkeleton />
  }

  if (!obra || !valores) {
    // Puede ser una obra recién creada que la copia todavía no tiene: se espera la lectura.
    if (arranque.isFetching) return <ProjectWorkspaceSkeleton />
    return (
      <PantallaCompleta>
        <EmptyState
          icon={SearchX}
          title="No encontramos esta obra"
          description="Puede que ya no exista o que no tengas acceso. Si te sumaron hace poco, probá de nuevo con señal."
          action={volverAlInicio}
        />
      </PantallaCompleta>
    )
  }

  return (
    <ProjectAccessProvider value={valores.acceso}>
      <MarcoDeObra project={valores.proyecto} userProfile={valores.perfil}>
        {children}
      </MarcoDeObra>
    </ProjectAccessProvider>
  )
}
