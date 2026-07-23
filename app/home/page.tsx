"use client"

import { useEffect, useState } from "react"
import { AddProjectCard } from "@/components/projects/AddProjectCard"
import { ProjectCard } from "@/components/projects/ProjectCard"
import { CompanyHomeButton } from "@/components/company/CompanyHomeButton"
import { UserMenu } from "@/components/user/UserMenu"
import { useAuth } from "@/context/AuthContextSupabase"
import withAuth from "@/hoc/withAuth"
import {
  HOME_COLORS,
  HOME_GRADIENT,
  HOME_TYPE,
} from "@/lib/home/designTokens"
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
    return (
      <div
        className="relative flex min-h-screen flex-col items-center justify-center px-6 py-8 text-white sm:px-10"
        style={{ backgroundImage: HOME_GRADIENT }}
      >
        <div>Cargando...</div>
      </div>
    )
  }

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center px-6 py-8 text-white sm:px-10"
      style={{ backgroundImage: HOME_GRADIENT }}
    >
      <div className="absolute top-6 right-6 flex items-center gap-3">
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
      </div>

      <div className="flex w-full max-w-4xl flex-col items-center">
        <header className="flex w-full flex-col items-center gap-3 text-center">
          <h1 className={`font-recoleta ${HOME_TYPE.greeting}`}>
            ¡Bienvenido, {displayName}! 👋
          </h1>
          {projects.length === 0 ? (
            <p className={HOME_TYPE.question} style={{ color: HOME_COLORS.subtitle }}>
              {canCreateProjects
                ? "Creá tu primer proyecto."
                : "No tenés proyectos asignados."}
            </p>
          ) : null}
        </header>

        <div className="mt-12 flex w-full flex-wrap justify-center gap-6 sm:px-16">
          {projects.map((project) => (
            <ProjectCard key={project.projectId} project={project} />
          ))}
          {canCreateProjects ? <AddProjectCard /> : null}
        </div>
      </div>
    </div>
  )
}

export default withAuth(HomePage)
