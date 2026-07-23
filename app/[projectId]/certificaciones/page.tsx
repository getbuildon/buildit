import { assertProjectSectionAccess } from "@/lib/project/projectAccess"
import { getProjectById } from "@/lib/projects/listUserProjects"
import { getCertificacionesData } from "./actions"
import { CertificacionesView } from "./CertificacionesView"

type PageProps = {
  params: Promise<{ projectId: string }>
}

export default async function CertificacionesPage({ params }: PageProps) {
  const { projectId } = await params
  await assertProjectSectionAccess(projectId, "certificaciones")
  const project = await getProjectById(projectId)
  if (!project) return null

  const data = await getCertificacionesData(projectId)
  if (!data) return null

  return <CertificacionesView projectId={projectId} initialData={data} />
}
