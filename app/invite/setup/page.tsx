import Link from "next/link"
import { redirect } from "next/navigation"
import { InviteSetupView } from "@/components/invite/InviteSetupView"
import { getInvitationSetupData } from "./actions"
import { createClient } from "@/utils/supabase/server"

type PageProps = {
  searchParams: Promise<{ invitation?: string }>
}

export default async function InviteSetupPage({ searchParams }: PageProps) {
  const { invitation: invitationId } = await searchParams
  const id = invitationId?.trim()

  if (!id) {
    redirect("/login")
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/invite/setup?invitation=${id}`)}`)
  }

  const setupData = await getInvitationSetupData(id)

  if (!setupData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f7] px-6">
        <div className="max-w-md rounded-[16px] border border-[#edeef0] bg-white p-8 text-center shadow-[0_0_39px_4px_rgba(0,0,0,0.08)]">
          <h1 className="font-recoleta text-[24px] text-[#272a2d]">Invitación no válida</h1>
          <p className="mt-3 text-[14px] leading-[1.4] text-[#43484e]">
            El enlace expiró, ya fue usado o no coincide con tu sesión. Abrí el correo de
            invitación nuevamente o pedí una nueva invitación al administrador del proyecto.
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

  return <InviteSetupView data={setupData} />
}
