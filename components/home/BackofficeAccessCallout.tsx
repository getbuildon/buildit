"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { LayoutDashboard, X } from "lucide-react"

import { getHomeBackofficeAccess } from "@/app/home/actions"
import { useAppRouteNavigation } from "@/components/navigation/AppRouteLoadingProvider"
import { cn } from "@/lib/utils"

const BACKOFFICE_DASHBOARD_HREF = "/backoffice/dashboard"

const ENTER_DELAY_MS = 2000

export function BackofficeAccessCallout() {
  const { navigate } = useAppRouteNavigation()
  const [canAccess, setCanAccess] = useState<boolean | null>(null)
  const [delayElapsed, setDelayElapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    const delayTimer = window.setTimeout(() => {
      setDelayElapsed(true)
    }, ENTER_DELAY_MS)

    void getHomeBackofficeAccess().then((access) => {
      setCanAccess(access)
    })

    return () => {
      window.clearTimeout(delayTimer)
    }
  }, [])

  useEffect(() => {
    if (canAccess !== true || !delayElapsed) return

    setMounted(true)
  }, [canAccess, delayElapsed])

  const handleClose = useCallback(() => {
    setClosing(true)
  }, [])

  const handleAnimationEnd = useCallback(
    (event: React.AnimationEvent<HTMLDivElement>) => {
      if (event.currentTarget !== event.target) return
      if (!closing) return

      setMounted(false)
    },
    [closing],
  )

  if (!mounted) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4 sm:bottom-6">
      <div
        role="status"
        onAnimationEnd={handleAnimationEnd}
        className={cn(
          "pointer-events-auto flex w-full max-w-xl items-center rounded-xl py-3 pl-3.5 pr-2 text-sm font-medium text-white/85 hover:bg-white/10 hover:text-white sm:py-3.5 sm:pl-4 sm:pr-1.5 sm:text-[15px]",
          closing ? "backoffice-callout-exit" : "backoffice-callout-enter",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <LayoutDashboard
            className="size-[18px] shrink-0 text-white/70"
            strokeWidth={1.75}
            aria-hidden
          />
          <p className="min-w-0 leading-[1.5]">
            Como administrador de BuildOn, podés acceder al{" "}
            <Link
              href={BACKOFFICE_DASHBOARD_HREF}
              onClick={(event) => {
                event.preventDefault()
                navigate(BACKOFFICE_DASHBOARD_HREF)
              }}
              className="text-white/85 underline decoration-white/20 underline-offset-2 transition-colors hover:text-white hover:decoration-white/40"
            >
              backoffice
            </Link>
            .
          </p>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className={cn(
            "ml-2 grid size-8 shrink-0 place-items-center rounded-lg text-white/70 transition-colors",
            "hover:bg-white/10 hover:text-white",
          )}
          aria-label="Cerrar aviso"
        >
          <X className="size-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  )
}
