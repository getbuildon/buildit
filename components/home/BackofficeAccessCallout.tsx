"use client"

import { useCallback, useState } from "react"
import Link from "next/link"
import { LayoutDashboard, X } from "lucide-react"

import { useAppRouteNavigation } from "@/components/navigation/AppRouteLoadingProvider"
import { HOME_LAYOUT } from "@/lib/home/designTokens"
import { cn } from "@/lib/utils"

const BACKOFFICE_DASHBOARD_HREF = "/backoffice/dashboard"

type BackofficeAccessCalloutProps = {
  canAccess: boolean
}

export function BackofficeAccessCallout({ canAccess }: BackofficeAccessCalloutProps) {
  const { navigate } = useAppRouteNavigation()
  const [closing, setClosing] = useState(false)
  const [visible, setVisible] = useState(true)

  const handleClose = useCallback(() => {
    setClosing(true)
  }, [])

  const handleAnimationEnd = useCallback(
    (event: React.AnimationEvent<HTMLElement>) => {
      if (event.currentTarget !== event.target) return
      if (!closing) return
      setVisible(false)
    },
    [closing],
  )

  if (!canAccess || !visible) return null

  return (
    <footer className={HOME_LAYOUT.pageFooter}>
      <div className={HOME_LAYOUT.pageFooterInner}>
        <div
          role="status"
          onAnimationEnd={handleAnimationEnd}
          className={cn(
            "flex w-full max-w-xl items-center rounded-xl py-1 text-sm font-medium text-white/85 sm:text-[15px]",
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
    </footer>
  )
}
