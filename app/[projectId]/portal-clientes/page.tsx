import { assertProjectSectionAccess } from "@/lib/project/projectAccess"
import { getPortalClientesData, getPortalClientesPreviewContext } from "./actions"
import { PortalClientesView } from "./PortalClientesView"

type PageProps = {
  params: Promise<{ projectId: string }>
}

export default async function PortalClientesPage({ params }: PageProps) {
  const { projectId } = await params
  await assertProjectSectionAccess(projectId, "portal-clientes")
  const [data, previewContext] = await Promise.all([
    getPortalClientesData(projectId),
    getPortalClientesPreviewContext(projectId),
  ])

  return (
    <PortalClientesView
      projectId={projectId}
      initialData={data}
      previewContext={previewContext}
    />
  )
}
