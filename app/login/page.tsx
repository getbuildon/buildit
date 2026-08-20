import { redirect } from "next/navigation"

import { ACCESO_EQUIPO_PATH } from "@/lib/auth/loginAudience"

export default function LoginRedirectPage() {
  redirect(ACCESO_EQUIPO_PATH)
}
