import { notFound } from "next/navigation"
import { assertUnitDetailAccess } from "@/lib/project/projectAccess"
import { UnitDetailView } from "../../components/UnitDetailView"
import { getUnitDetailData } from "../actions"

type PageProps = {
  params: Promise<{ projectId: string; unitId: string }>
}

export default async function UnitDetailPage({ params }: PageProps) {
  const { projectId, unitId } = await params
  await assertUnitDetailAccess(projectId, unitId)
  const data = await getUnitDetailData(projectId, unitId)
  if (!data) notFound()

  return <UnitDetailView projectId={projectId} data={data} />
}
