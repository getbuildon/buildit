"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const REDIRECT_SECONDS = 4

type CreateProjectSuccessPanelProps = {
  projectId: string
  projectName: string
}

const CONFETTI = Array.from({ length: 28 }, (_, index) => ({
  id: index,
  left: `${(index * 31 + 7) % 100}%`,
  delay: `${(index % 9) * 0.08}s`,
  duration: `${1.1 + (index % 6) * 0.12}s`,
  size: 6 + (index % 4) * 2,
  color: index % 3 === 0 ? "#00c950" : index % 3 === 1 ? "#155dfc" : "#fbbf24",
}))

export function CreateProjectSuccessPanel({
  projectId,
  projectName,
}: CreateProjectSuccessPanelProps) {
  const router = useRouter()
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS)
  const [tickKey, setTickKey] = useState(0)

  const goToProject = useCallback(() => {
    router.push(`/${projectId}`)
    router.refresh()
  }, [router, projectId])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    if (secondsLeft <= 0) {
      goToProject()
      return
    }

    const timer = window.setTimeout(() => {
      setSecondsLeft((current) => current - 1)
      setTickKey((current) => current + 1)
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [secondsLeft, goToProject])

  const progress = ((REDIRECT_SECONDS - secondsLeft) / REDIRECT_SECONDS) * 100

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-labelledby="create-project-victory-title"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-[6px] animate-[victory-fade-in_0.35s_ease-out_forwards]"
        aria-hidden
      />

      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {CONFETTI.map((piece) => (
          <span
            key={piece.id}
            className="absolute top-0 rounded-full opacity-90"
            style={{
              left: piece.left,
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.color,
              animation: `confetti-fall ${piece.duration} ease-in ${piece.delay} infinite`,
            }}
          />
        ))}
      </div>

      <div
        className={cn(
          "relative w-full max-w-[440px] overflow-hidden rounded-[20px] border border-white/10 px-6 py-8 text-center shadow-2xl sm:px-8 sm:py-10",
          "animate-[victory-pop_0.6s_cubic-bezier(0.34,1.56,0.64,1)_forwards]",
          "bg-gradient-to-b from-[#1e293b] to-[#0f172a]",
        )}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#00c950]/20 to-transparent"
          aria-hidden
        />

        <div
          className="relative mx-auto flex size-[72px] items-center justify-center rounded-full bg-[#00c950] shadow-[0_0_40px_rgba(0,201,80,0.45)] animate-[victory-glow_1.8s_ease-in-out_infinite]"
          aria-hidden
        >
          <Zap className="size-9 fill-white text-white" />
        </div>

        <p className="relative mt-6 text-[13px] font-semibold uppercase tracking-[0.2em] text-[#00c950]">
          Obra creada
        </p>

        <h2
          id="create-project-victory-title"
          className="relative mt-2 text-[40px] font-bold leading-none tracking-[-0.04em] text-white sm:text-[48px]"
        >
          ¡Arrancó!
        </h2>

        <p className="relative mt-4 truncate text-[20px] font-medium leading-7 tracking-[-0.02em] text-white/95">
          {projectName}
        </p>

        <p className="relative mt-1 text-[14px] leading-5 text-white/55">
          Te llevamos a la obra en unos segundos
        </p>

        <div className="relative mt-8">
          <div className="h-2 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-[#00c950] transition-[width] duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progreso de entrada a la obra"
            />
          </div>

          <p className="mt-3 text-[14px] leading-5 text-white/60">
            Entrando en{" "}
            <span
              key={tickKey}
              className="inline-block min-w-[1.25rem] text-[22px] font-bold tabular-nums leading-none text-white animate-[countdown-tick_0.45s_ease-out]"
            >
              {secondsLeft}
            </span>
            s
          </p>
        </div>

        <Button
          type="button"
          onClick={goToProject}
          className="relative mt-6 h-[50px] w-full rounded-[12px] bg-[#00c950] text-[16px] font-semibold text-white hover:bg-[#00b848] active:scale-[0.98] transition-transform"
        >
          Entrar ahora
          <ArrowRight className="size-4" aria-hidden />
        </Button>

        <Link
          href="/home"
          className="relative mt-4 inline-block text-[14px] font-medium text-white/45 transition-colors hover:text-white/75"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
