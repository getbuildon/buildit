import type { ReactNode } from "react"

import { getProfileData } from "@/app/[projectId]/perfil/actions"
import { BackofficeShell } from "@/components/backoffice-shell/BackofficeShell"
import { requireBackofficeUser } from "@/lib/auth/backofficeAccess"
import { toSidebarUserProfile } from "@/lib/profile/sidebarUserProfile"

type BackofficeLayoutProps = {
  children: ReactNode
}

export default async function BackofficeLayout({ children }: BackofficeLayoutProps) {
  const user = await requireBackofficeUser()
  const profileData = await getProfileData()
  const userProfile = toSidebarUserProfile(profileData, user.email)
  userProfile.roleLabel = "Administración"

  return <BackofficeShell userProfile={userProfile}>{children}</BackofficeShell>
}
