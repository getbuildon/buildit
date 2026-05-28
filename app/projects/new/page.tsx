"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContextSupabase"
import withAuth from "@/hoc/withAuth"
import { HOME_GRADIENT } from "@/lib/home/designTokens"
import { LOGIN_COLORS } from "@/lib/login/designTokens"

function NewProjectPage() {
  const router = useRouter()
  const { authMode } = useAuth()

  return (
    <div
      className="flex min-h-screen items-center justify-center px-6 py-12 text-white"
      style={{ backgroundImage: HOME_GRADIENT }}
    >
      <div className="w-full max-w-lg rounded-[16px] border border-[#e2e8f0] bg-white p-8 text-center shadow-[0_20px_12.5px_rgba(0,0,0,0.1),0_8px_5px_rgba(0,0,0,0.1)]">
        <h1
          className="text-xl font-semibold tracking-[-0.45px]"
          style={{ color: LOGIN_COLORS.title }}
        >
          Nueva obra
        </h1>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: LOGIN_COLORS.cardDescription }}>
          El flujo de alta estará disponible cuando definamos el modelo en Supabase.
          {authMode === "mock" ? " Por ahora es un placeholder." : ""}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            type="button"
            variant="outline"
            className="border-[#e2e8f0] text-[#1d293d] hover:bg-[#f8fafc]"
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-4" />
            Volver
          </Button>
          <Button asChild className="bg-[#155dfc] text-white hover:bg-[#155dfc]/90">
            <Link href="/home">Ir a mis obras</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default withAuth(NewProjectPage)
