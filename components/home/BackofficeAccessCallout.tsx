"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { LayoutDashboard, X } from "lucide-react"

import { getHomeBackofficeAccess } from "@/app/home/actions"
import { cn } from "@/lib/utils"

const ENTER_DELAY_MS = 2000
const ANIMATION_MS = 320

export function BackofficeAccessCallout() {
  const [canAccess, setCanAccess] = useState<boolean | null>(null)
  const [delayElapsed, setDelayElapsed] = useState(false)
  const [render, setRender] = useState(false)
  const [shown, setShown] = useState(false)

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

    setRender(true)

    const frame = window.requestAnimationFrame(() => {
      setShown(true)
    })

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [canAccess, delayElapsed])

  const handleClose = useCallback(() => {
    setShown(false)

    window.setTimeout(() => {
      setRender(false)
    }, ANIMATION_MS)
  }, [])

  if (!render) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4 sm:bottom-6">
      <div
        role="status"
        className={cn(
          "pointer-events-auto flex w-full max-w-xl items-center rounded-xl py-3 pl-3.5 pr-2 text-sm font-medium text-white/85 transition-[transform,opacity] hover:bg-white/10 hover:text-white sm:py-3.5 sm:pl-4 sm:pr-1.5 sm:text-[15px]",
          shown
            ? "translate-y-0 opacity-100 ease-out"
            : "translate-y-6 opacity-0 ease-in",
        )}
        style={{ transitionDuration: `${ANIMATION_MS}ms` }}
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
              href="/backoffice/dashboard"
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
