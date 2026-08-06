"use client"

import { useEffect, type ReactNode } from "react"

import { ProjectNavigationProvider } from "@/components/project-shell/ProjectNavigationContext"

type ProjectShellProps = {
  children: ReactNode
}

export function ProjectShell({ children }: ProjectShellProps) {
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const previousHtmlOverflow = html.style.overflow
    const previousBodyOverflow = body.style.overflow

    html.style.overflow = "hidden"
    body.style.overflow = "hidden"

    return () => {
      html.style.overflow = previousHtmlOverflow
      body.style.overflow = previousBodyOverflow
    }
  }, [])

  return (
    <ProjectNavigationProvider>
      <div
        data-project-shell
        className="fixed inset-0 flex overflow-hidden"
      >
        {children}
      </div>
    </ProjectNavigationProvider>
  )
}
