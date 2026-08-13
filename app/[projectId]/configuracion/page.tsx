import { assertProjectSectionAccess } from "@/lib/project/projectAccess"
import { createClient } from "@/utils/supabase/server"
import { loadProjectPlanSurfaceLimit } from "@/lib/company/projectSubscriptionLimits"
import { getProjectBasics } from "./actions"
import { ConfiguracionView } from "./ConfiguracionView"

type PageProps = {
  params: Promise<{ projectId: string }>
}

export default async function ConfiguracionPage({ params }: PageProps) {
  const { projectId } = await params
  await assertProjectSectionAccess(projectId, "configuracion")
  const project = await getProjectBasics(projectId)
  if (!project) return null

  const supabase = await createClient()
  const planSurfaceLimit = await loadProjectPlanSurfaceLimit(supabase, projectId)

  return (
    <ConfiguracionView
      project={project}
      planSurfaceMaxM2={planSurfaceLimit?.surfaceMaxM2 ?? null}
    />
  )
}
