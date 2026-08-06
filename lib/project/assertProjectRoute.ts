"use server"

import { notFound } from "next/navigation"

import { requireAuthenticatedUser } from "@/lib/authHelpers"
import { isReservedProjectRouteSegment } from "@/lib/project/reservedRouteSegments"
import { createClient } from "@/utils/supabase/server"

export async function assertProjectRoute(projectId: string) {
  const user = await requireAuthenticatedUser()

  const id = projectId.trim()
  if (!id || isReservedProjectRouteSegment(id)) {
    notFound()
  }

  const supabase = await createClient()

  // Verificar que el proyecto existe
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, company_id")
    .eq("id", id)
    .maybeSingle()

  if (projectError || !project) {
    notFound()
  }

  // Acceso por membresía explícita al proyecto
  const { data: membership } = await supabase
    .from("project_members")
    .select("id")
    .eq("project_id", id)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle()

  if (membership) return { projectId: id }

  // Acceso por ser owner/admin de la empresa del proyecto
  if (project.company_id) {
    const { data: companyAccess } = await supabase
      .from("company_members")
      .select("id")
      .eq("company_id", project.company_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .in("role", ["owner", "admin"])
      .maybeSingle()

    if (companyAccess) return { projectId: id }
  }

  notFound()
}
