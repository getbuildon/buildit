"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { LayoutDashboard, X } from "lucide-react"

import { getHomeBackofficeAccess } from "@/app/home/actions"
import { cn } from "@/lib/utils"

export function BackofficeAccessCallout() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    void getHomeBackofficeAccess().then((canAccess) => {
      setVisible(canAccess)
    })
  }, [])

  if (!visible) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4 sm:bottom-6">
      <div
        role="status"
        className="pointer-events-auto flex w-full max-w-xl items-center rounded-xl py-3 pl-3.5 pr-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white sm:py-3.5 sm:pl-4 sm:pr-1.5 sm:text-[15px]"
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
          onClick={() => setVisible(false)}
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
