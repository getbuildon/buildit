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
    .select("id")
    .eq("id", id)
    .maybeSingle()

  if (projectError || !project) {
    throw new Error("Project not found")
  }

  // Verificar que el usuario es miembro del proyecto
  const { data: membership, error: memberError } = await supabase
    .from("project_members")
    .select("id")
    .eq("project_id", id)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle()

  if (memberError || !membership) {
    throw new Error("Access denied")
  }

  return { projectId: id }
}
