"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { BACKOFFICE_SHELL } from "@/lib/backoffice/designTokens"

const NAV_ITEM_COUNT = 5

export function BackofficeShellSkeleton() {
  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden lg:flex-row"
      style={{ backgroundColor: BACKOFFICE_SHELL.mainBg }}
      aria-busy
      aria-label="Cargando backoffice"
    >
      <div
        className="relative z-40 shrink-0 lg:hidden"
        style={{ backgroundColor: BACKOFFICE_SHELL.sidebarBg }}
      >
        <div
          className="flex h-14 items-center justify-between gap-3 border-b px-4"
          style={{ borderColor: BACKOFFICE_SHELL.sidebarBorder }}
        >
          <Skeleton tone="dark" className="h-4 w-24" />
          <Skeleton tone="dark" className="size-9 rounded-lg" />
        </div>
      </div>

      <aside className="hidden h-full min-h-0 w-[220px] shrink-0 flex-col overflow-hidden lg:flex">
        <div
          className="flex h-full flex-col"
          style={{ backgroundColor: BACKOFFICE_SHELL.sidebarBg }}
        >
          <div
            className="border-b px-[18px] pb-[21px] pt-5"
            style={{ borderColor: BACKOFFICE_SHELL.sidebarBorder }}
          >
            <Skeleton tone="dark" className="h-5 w-28" />
          </div>

          <div className="flex flex-1 flex-col gap-1 px-2.5 py-3">
            {Array.from({ length: NAV_ITEM_COUNT }, (_, index) => (
              <Skeleton key={index} tone="dark" className="h-10 w-full rounded-lg" />
            ))}
          </div>

          <div
            className="border-t px-2.5 py-3"
            style={{ borderColor: BACKOFFICE_SHELL.sidebarBorder }}
          >
            <div className="flex items-center gap-2.5 px-2.5 py-2">
              <Skeleton tone="dark" className="size-8 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton tone="dark" className="h-3.5 w-[70%]" />
                <Skeleton tone="dark" className="h-3 w-[85%]" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-h-0 min-w-0 flex-1 overflow-hidden px-6 py-10 lg:px-12">
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-9 w-[min(100%,240px)] rounded-[12px]" />
            <Skeleton className="h-5 w-[min(100%,360px)] rounded-[8px]" />
          </div>

          <Skeleton className="h-24 w-full rounded-[14px]" />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-28 rounded-[14px]" />
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-64 rounded-[14px]" />
            <Skeleton className="h-64 rounded-[14px]" />
          </div>
        </div>
      </main>
    </div>
  )
}
