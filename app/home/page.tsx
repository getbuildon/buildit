"use client"

import { useEffect, useState } from "react"
import { ProjectCard } from "@/components/projects/ProjectCard"
import { BackofficeAccessCallout } from "@/components/home/BackofficeAccessCallout"
import { HomePageLayout } from "@/components/home/HomePageLayout"
import { HomePageSkeleton } from "@/components/home/HomePageSkeleton"
import { CompanyHomeButton } from "@/components/company/CompanyHomeButton"
import { UserMenu } from "@/components/user/UserMenu"
import { useAuth } from "@/context/AuthContextSupabase"
import withAuth from "@/hoc/withAuth"
import { HOME_COLORS, HOME_LAYOUT } from "@/lib/home/designTokens"
import { getProfileData } from "@/app/[projectId]/perfil/actions"
import { listUserProjects } from "@/lib/projects/listUserProjects"
import { getProfileName } from "@/lib/projects/getProfileName"
import { getUserCompanies, type CompanyData } from "@/lib/company/getCompanies"
import { displayNameFromEmail } from "@/lib/projects/mockProjects"
import type { UserProjectListItem } from "@/lib/projects/types"

function canManageCompanyProjects(companies: CompanyData[]): boolean {
  return companies.some((company) => company.role === "owner" || company.role === "admin")
}

function HomePage() {
  const { user } = useAuth()
  const [companies, setCompanies] = useState<CompanyData[]>([])
  const [projects, setProjects] = useState<UserProjectListItem[]>([])
  const [displayName, setDisplayName] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const [profileName, companiesData, profileData, userProjects] = await Promise.all([
        getProfileName(),
        getUserCompanies(),
        getProfileData(),
        listUserProjects(),
      ])
      setDisplayName(profileName || displayNameFromEmail(user?.email) || "")
      if (profileData) {
        setFirstName(profileData.first_name)
        setLastName(profileData.last_name)
        setAvatarUrl(profileData.avatar_url)
      }
      setCompanies(companiesData)
      setProjects(userProjects)
      setLoading(false)
    }
    loadData()
  }, [user?.email])

  const primaryCompany = companies[0] ?? null
  const canCreateProjects = canManageCompanyProjects(companies)

  if (loading) {
    return <HomePageSkeleton />
  }

  return (
    <HomePageLayout
      topBar={
        <>
          {primaryCompany ? (
            <CompanyHomeButton
              companyId={primaryCompany.id}
              companyName={primaryCompany.name}
            />
          ) : null}
          <UserMenu
            displayName={displayName}
            firstName={firstName}
            lastName={lastName}
            email={user?.email}
            avatarUrl={avatarUrl}
          />
        </>
      }
    >
      <header className={HOME_LAYOUT.header}>
        <h1 className={HOME_LAYOUT.greeting}>¡Bienvenido, {displayName}! 👋</h1>
        {projects.length === 0 ? (
          <p className={HOME_LAYOUT.question} style={{ color: HOME_COLORS.subtitle }}>
            {canCreateProjects
              ? "Creá tu primer proyecto."
              : "No tenés proyectos asignados."}
          </p>
        ) : null}
      </header>

      <div className={HOME_LAYOUT.projectGrid}>
        {projects.map((project) => (
          <ProjectCard key={project.projectId} project={project} />
        ))}
      </div>

      <BackofficeAccessCallout />
    </HomePageLayout>
  )
}

export default withAuth(HomePage)
