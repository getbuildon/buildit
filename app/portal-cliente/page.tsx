import { redirect } from "next/navigation"

import { getFirstClientProjectId } from "@/lib/auth/loginAccess"
import { ACCESO_CLIENTES_PATH } from "@/lib/auth/loginAudience"
import { clearLoginAudience, getLoginAudience } from "@/lib/auth/loginAudienceActions"
import { getAuthenticatedUserOrNull } from "@/lib/authHelpers"
import { projectHref } from "@/lib/project/routes"
import { createClient } from "@/utils/supabase/server"

export default async function PortalClientePage() {
  const user = await getAuthenticatedUserOrNull()
  if (!user) {
    redirect(ACCESO_CLIENTES_PATH)
  }

  const audience = await getLoginAudience()

  if (audience !== "cliente") {
    redirect("/home")
  }

  const projectId = await getFirstClientProjectId(user.id)
  if (!projectId) {
    const supabase = await createClient()
    await supabase.auth.signOut()
    await clearLoginAudience()
    redirect(ACCESO_CLIENTES_PATH)
  }

  redirect(projectHref(projectId, "mi-unidad"))
}
