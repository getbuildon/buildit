import Link from "next/link"
import { redirect } from "next/navigation"

import { RegisterConfirmView } from "@/components/auth/RegisterConfirmView"
import { REGISTER_CONFIRM_PATH } from "@/lib/auth/registerConfirmPath"
import { createAdminClient } from "@/utils/supabase/admin"
import { createClient } from "@/utils/supabase/server"

export default async function RegisterConfirmPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(REGISTER_CONFIRM_PATH)}`,
    )
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("first_name, last_name, email")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f7] px-6">
        <div className="max-w-md rounded-[16px] border border-[#edeef0] bg-white p-8 text-center shadow-[0_0_39px_4px_rgba(0,0,0,0.08)]">
          <h1 className="font-recoleta text-[24px] text-[#272a2d]">
            No pudimos cargar tu cuenta
          </h1>
          <p className="mt-3 text-[14px] leading-[1.4] text-[#43484e]">
            El enlace expiró o no coincide con tu sesión. Abrí el correo de
            invitación nuevamente o pedí ayuda al administrador.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex text-[14px] text-[#ff7433] underline underline-offset-2"
          >
            Ir al inicio de sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <RegisterConfirmView
      firstName={profile.first_name ?? ""}
      lastName={profile.last_name ?? ""}
      email={profile.email}
    />
  )
}
