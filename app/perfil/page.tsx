import { MiPerfil } from "@/components/perfil/MiPerfil"

export default function PerfilStandalonePage() {
  return (
    <div className="min-h-dvh bg-canvas px-(--layout-margin) py-block text-ink">
      <div className="mx-auto w-full max-w-page">
        <MiPerfil showBackButton />
      </div>
    </div>
  )
}
