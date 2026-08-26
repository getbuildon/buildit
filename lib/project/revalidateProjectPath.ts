import { revalidatePath } from "next/cache"

import { projectHref } from "@/lib/project/routes"

export function revalidateProjectPath(projectId: string, segment?: string) {
  revalidatePath(projectHref(projectId, segment))
}
