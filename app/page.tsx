import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BRAND_NAME } from "@/lib/brand"

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.18),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(59,130,246,0.08),transparent_40%)]" />

      <main className="relative z-10 flex max-w-2xl flex-col items-center text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          {BRAND_NAME}
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Seguimiento de obra para desarrolladoras
        </h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          Esqueleto del proyecto listo. Próximo paso: pantallas de login y registro según Figma.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/login">Iniciar sesión</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/register">Registrarse</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
