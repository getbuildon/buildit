import { notFound } from "next/navigation"
import type { ReactNode } from "react"
import { getProfileData } from "@/app/[projectId]/perfil/actions"
import { CompanyWorkspace } from "@/components/company-shell/CompanyWorkspace"
import { getCompanyById } from "@/lib/company/getCompanies"
import { formatCompanyRole } from "@/lib/company/formatCompanyRole"
import { toSidebarUserProfile } from "@/lib/profile/sidebarUserProfile"

type CompanyLayoutProps = {
  children: ReactNode
  params: Promise<{ companyId: string }>
}

export default async function CompanyLayout({ children, params }: CompanyLayoutProps) {
  const { companyId } = await params
  const company = await getCompanyById(companyId)

  if (!company) {
    notFound()
  }

  const profileData = await getProfileData()
  const userProfile = toSidebarUserProfile(profileData)
  userProfile.roleLabel = formatCompanyRole(company.role)

  return (
    <CompanyWorkspace company={company} userProfile={userProfile}>
      {children}
    </CompanyWorkspace>
  )
}
