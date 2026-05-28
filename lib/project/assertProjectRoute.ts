"use server"

import { requireAuthenticatedUser } from "@/lib/authHelpers"

export async function assertProjectRoute(projectId: string) {
  await requireAuthenticatedUser()

  const id = projectId.trim()
  if (!id) {
    throw new Error("Invalid project route")
  }

  return { projectId: id }
}
