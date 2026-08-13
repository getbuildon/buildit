import { redirect } from "next/navigation"
import { assertProjectSectionAccess } from "@/lib/project/projectAccess"
import { getProfileData } from "@/app/[projectId]/perfil/actions"
import { toSidebarUserProfile } from "@/lib/profile/sidebarUserProfile"
import { getMiUnidadPageData } from "./actions"
import { MiUnidadView } from "./MiUnidadView"

type PageProps = {
  params: Promise<{ projectId: string }>
}

export default async function MiUnidadPage({ params }: PageProps) {
  const { projectId } = await params
  await assertProjectSectionAccess(projectId, "mi-unidad")

  const [data, profileData] = await Promise.all([
    getMiUnidadPageData(projectId),
    getProfileData(projectId),
  ])

  if (!data) {
    redirect(`/${projectId}`)
  }

  const userProfile = toSidebarUserProfile(profileData)
  const greetingName =
    userProfile.firstName.trim() ||
    userProfile.fullName.split(" ")[0] ||
    "Cliente"

  return (
    <MiUnidadView
      projectId={projectId}
      data={data}
      greetingName={greetingName}
    />
  )
}
