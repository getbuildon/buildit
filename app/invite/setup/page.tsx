import Link from "next/link"
import { redirect } from "next/navigation"
import { InviteConfirmView } from "@/components/invite/InviteConfirmView"
import { InviteSetupView } from "@/components/invite/InviteSetupView"
import { getInvitationAcceptContext } from "./actions"

type PageProps = {
  searchParams: Promise<{ invitation?: string; token?: string }>
}

function InvalidInvitation() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f7] px-6">
      <div className="max-w-md rounded-[16px] border border-[#edeef0] bg-white p-8 text-center shadow-[0_0_39px_4px_rgba(0,0,0,0.08)]">
        <h1 className="font-recoleta text-[24px] text-[#272a2d]">Invitación no válida</h1>
        <p className="mt-3 text-[14px] leading-[1.4] text-[#43484e]">
          El enlace expiró, ya fue usado o no coincide con tu sesión. Abrí el correo de
          invitación nuevamente o pedí una nueva invitación al administrador del proyecto.
        </p>
        <Link
          href="/acceso-equipo"
          className="mt-6 inline-flex text-[14px] text-[#ff7433] underline underline-offset-2"
        >
          Ir al inicio de sesión
        </Link>
      </div>
    </div>
  )
}

function WrongAccount({ email }: { email: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f7] px-6">
      <div className="max-w-md rounded-[16px] border border-[#edeef0] bg-white p-8 text-center shadow-[0_0_39px_4px_rgba(0,0,0,0.08)]">
        <h1 className="font-recoleta text-[24px] text-[#272a2d]">Sesión incorrecta</h1>
        <p className="mt-3 text-[14px] leading-[1.4] text-[#43484e]">
          Esta invitación es para {email}. Cerrá sesión e ingresá con ese correo para
          aceptarla.
        </p>
        <Link
          href="/acceso-equipo"
          className="mt-6 inline-flex text-[14px] text-[#ff7433] underline underline-offset-2"
        >
          Ir al inicio de sesión
        </Link>
      </div>
    </div>
  )
}

export default async function InviteSetupPage({ searchParams }: PageProps) {
  const { invitation: invitationId, token } = await searchParams
  const id = invitationId?.trim()
  const rawToken = token?.trim()

  if (!id || !rawToken) {
    return <InvalidInvitation />
  }

  const context = await getInvitationAcceptContext(id, rawToken)

  if (context.status === "invalid") {
    return <InvalidInvitation />
  }

  if (context.status === "wrong_account") {
    return <WrongAccount email={context.email} />
  }

  if (context.status === "login_required") {
    redirect(`/acceso-equipo?next=${encodeURIComponent(context.nextPath)}`)
  }

  if (context.mode === "confirm") {
    return <InviteConfirmView data={context.data} />
  }

  return <InviteSetupView data={context.data} />
}
