"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { LogOut } from "lucide-react"
import { AddProjectCard } from "@/components/projects/AddProjectCard"
import { ProjectCard } from "@/components/projects/ProjectCard"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContextSupabase"
import withAuth from "@/hoc/withAuth"
import {
  HOME_COLORS,
  HOME_GRADIENT,
  HOME_TYPE,
} from "@/lib/home/designTokens"
import { listUserProjects } from "@/lib/projects/listUserProjects"
import { getProfileName } from "@/lib/projects/getProfileName"
import { displayNameFromEmail } from "@/lib/projects/mockProjects"
import type { UserProjectListItem } from "@/lib/projects/types"

function HomePage() {
  const router = useRouter()
  const { logOut, user } = useAuth()
  const [projects, setProjects] = useState<UserProjectListItem[]>([])
  const [displayName, setDisplayName] = useState("")

  useEffect(() => {
    const loadData = async () => {
      const [profileName] = await Promise.all([
        getProfileName(),
        listUserProjects().then(setProjects),
      ])
      setDisplayName(profileName || displayNameFromEmail(user?.email) || "")
    }
    loadData()
  }, [user?.email])

  const handleLogout = async () => {
    await logOut()
    router.replace("/login")
    router.refresh()
  }

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center px-6 py-8 text-white sm:px-10"
      style={{ backgroundImage: HOME_GRADIENT }}
    >
      <div className="absolute top-6 right-6">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
        >
          <LogOut className="size-4" />
          Cerrar sesión
        </Button>
      </div>

      <div className="flex w-full max-w-[896px] flex-col items-center">
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
