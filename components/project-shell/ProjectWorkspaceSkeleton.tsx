"use client"

import { Skeleton } from "@/library/atoms/skeleton/Skeleton"
import { WorkspaceLayout } from "@/library/layouts/workspace/WorkspaceLayout"
import { Sidebar, SidebarSection } from "@/library/organisms/sidebar/Sidebar"
import { ResumenDeObraCargando } from "@/components/obra/ResumenDeObra"

const CANTIDAD_DE_SECCIONES = 6

/** La obra mientras se abre: el mismo marco de la librería (MarcoDeObra) con lugares vacíos. */
export function ProjectWorkspaceSkeleton() {
  const identidad = (
    <div className="flex min-w-0 flex-1 items-center gap-snug">
      <Skeleton className="size-9 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-related">
        <Skeleton shape="text" className="w-24 text-label" />
        <Skeleton shape="text" className="w-32 text-meta" />
      </div>
    </div>
  )
  return (
    <div className="fixed inset-0 flex" aria-busy aria-label="Cargando la obra">
      <WorkspaceLayout
        className="w-full"
        sidebar={
          <Sidebar
            variant="floating"
            label="Secciones de la obra"
            header={identidad}
            footer={<Skeleton className="h-14" />}
          >
            <SidebarSection>
              {Array.from({ length: CANTIDAD_DE_SECCIONES }, (_, i) => (
                <li key={i}>
                  <Skeleton className="h-10" />
                </li>
              ))}
            </SidebarSection>
          </Sidebar>
        }
        topbar={<div className="flex h-20 items-center gap-snug bg-canvas-raised px-block">{identidad}</div>}
      >
        <ResumenDeObraCargando />
      </WorkspaceLayout>
    </div>
  )
}
