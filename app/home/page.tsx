"use client"

import { useRouter } from "next/navigation"
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
import { getUserCompanies } from "@/lib/company/getCompanies"
import { displayNameFromEmail } from "@/lib/projects/mockProjects"
import type { UserProjectListItem } from "@/lib/projects/types"

function HomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [companies, setCompanies] = useState<any[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [projects, setProjects] = useState<UserProjectListItem[]>([])
  const [displayName, setDisplayName] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const [profileName, companiesData, profileData] = await Promise.all([
        getProfileName(),
        getUserCompanies(),
        getProfileData(),
      ])
      setDisplayName(profileName || displayNameFromEmail(user?.email) || "")
      if (profileData) {
        setFirstName(profileData.first_name)
        setLastName(profileData.last_name)
        setAvatarUrl(profileData.avatar_url)
      }
      setCompanies(companiesData)

      if (companiesData.length > 0) {
        setSelectedCompanyId(companiesData[0].id)
      }
      setLoading(false)
    }
    loadData()
  }, [user?.email])

  useEffect(() => {
    if (selectedCompanyId) {
      const loadProjects = async () => {
        const allProjects = await listUserProjects()
        const filtered = allProjects.filter(
          (p) => p.company_id === selectedCompanyId
        )
        setProjects(filtered)
      }
      loadProjects()
    }
  }, [selectedCompanyId])

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

  if (companies.length === 0) {
    return (
      <div
        className="relative flex min-h-screen flex-col items-center justify-center px-6 py-8 text-white sm:px-10"
        style={{ backgroundImage: HOME_GRADIENT }}
      >
        <div className="absolute top-6 right-6">
          <UserMenu
            displayName={displayName}
            firstName={firstName}
            lastName={lastName}
            email={user?.email}
            avatarUrl={avatarUrl}
          />
        </div>

        <div className="flex w-full max-w-4xl flex-col items-center text-center">
          <h1 className={`font-recoleta ${HOME_TYPE.greeting}`}>
            Bienvenido a BuildOn 🏢
          </h1>
          <p className={HOME_TYPE.question} style={{ color: HOME_COLORS.subtitle }}>
            No tienes empresas aún. Crea una para comenzar.
          </p>
          <button
            onClick={() => router.push("/company/new")}
            style={{
              marginTop: "24px",
              padding: "12px 24px",
              borderRadius: "10px",
              backgroundColor: "#ff7433",
              color: "#ffffff",
              border: "none",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Crear Empresa
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center px-6 py-8 text-white sm:px-10"
      style={{ backgroundImage: HOME_GRADIENT }}
    >
      <div className="absolute top-6 right-6 flex items-center gap-3">
        {selectedCompanyId ? (
          <CompanyHomeButton
            companyId={selectedCompanyId}
            companyName={companies.find((c) => c.id === selectedCompanyId)?.name ?? "Mi empresa"}
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
          {projects.length === 0 && (
            <p className={HOME_TYPE.question} style={{ color: HOME_COLORS.subtitle }}>
              Creá tu primer proyecto.
            </p>
          )}
        </header>

        <div className="mt-12 flex w-full flex-wrap justify-center gap-6 sm:px-16">
          {projects.map((project) => (
            <ProjectCard key={project.projectId} project={project} />
          ))}
          <AddProjectCard />
        </div>
      </div>
    </div>
  )
}

export default withAuth(HomePage)
