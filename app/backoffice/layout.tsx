import type { ReactNode } from "react"

import { getProfileData } from "@/app/project/[projectId]/perfil/actions"
import { BackofficeShellFromPromise } from "@/components/backoffice-shell/BackofficeShell"
import { requireBackofficeUser } from "@/lib/auth/backofficeAccess"
import {
  toSidebarUserProfile,
  type SidebarUserProfile,
} from "@/lib/profile/sidebarUserProfile"

type BackofficeLayoutProps = {
  children: ReactNode
}

async function loadBackofficeUserProfile(): Promise<SidebarUserProfile> {
  const user = await requireBackofficeUser()
  const profileData = await getProfileData()
  const userProfile = toSidebarUserProfile(profileData, user.email)
  userProfile.roleLabel = "Administración"
  return userProfile
}

export default function BackofficeLayout({ children }: BackofficeLayoutProps) {
  const userProfilePromise = loadBackofficeUserProfile()

  return (
    <BackofficeShellFromPromise userProfilePromise={userProfilePromise}>
      {children}
    </BackofficeShellFromPromise>
  )
}
