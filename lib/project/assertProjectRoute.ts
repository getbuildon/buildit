"use server"

import { createClient } from "@/utils/supabase/server"
import { requireAuthenticatedUser } from "@/lib/authHelpers"

export async function assertProjectRoute(projectId: string) {
  const user = await requireAuthenticatedUser()

  const id = projectId.trim()
  if (!id) {
    throw new Error("Invalid project route")
  }

  const supabase = await createClient()

  // Verificar que el proyecto existe
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, company_id")
    .eq("id", id)
    .maybeSingle()

  if (projectError || !project) {
    throw new Error("Project not found")
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

  throw new Error("Access denied")
}
