"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { SHELL_COLORS, SHELL_LAYOUT } from "@/lib/project/designTokens"

const NAV_ITEM_COUNT = 6

export function ProjectWorkspaceSkeleton() {
  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden lg:flex-row"
      style={{ backgroundColor: SHELL_COLORS.mainBg }}
      aria-busy
      aria-label="Cargando proyecto"
    >
      <div className="relative z-40 shrink-0 bg-white lg:hidden">
        <div className="flex h-20 items-center justify-between gap-3 px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <Skeleton className="size-9 shrink-0 rounded-[10px]" />
            <div className="min-w-0 space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="size-6 rounded-[8px]" />
            <Skeleton className="size-10 rounded-full" />
          </div>
        </div>
      </div>

      <div
        className="box-border hidden h-full min-h-0 shrink-0 flex-col py-3 pl-3 lg:flex"
        style={{
          width: `calc(${SHELL_LAYOUT.sidebarWidth} + ${SHELL_LAYOUT.sidebarMargin})`,
        }}
      >
        <aside className="flex h-full w-[254px] flex-col overflow-hidden rounded-[24px] bg-[#fefcfb] shadow-[0_0_39px_4px_rgba(0,0,0,0.08)]">
          <div className="border-b border-[#dadada] p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Skeleton className="size-9 shrink-0 rounded-[10px]" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-[85%]" />
                  <Skeleton className="h-3 w-[70%]" />
                </div>
              </div>
              <Skeleton className="size-6 shrink-0 rounded-[8px]" />
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-1 px-3 py-4">
            {Array.from({ length: NAV_ITEM_COUNT }, (_, index) => (
              <Skeleton key={index} className="h-10 w-full rounded-[10px]" />
            ))}
          </div>

          <div className="border-t border-[#dadada] p-3">
            <div className="flex items-center gap-3 rounded-[10px] bg-[#f9f9fb] p-3">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3.5 w-[75%]" />
                <Skeleton className="h-3 w-[55%]" />
              </div>
              <Skeleton className="size-6 shrink-0 rounded-[8px]" />
            </div>
          </div>
        </aside>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <main className="min-h-0 flex-1 overflow-hidden px-4 pt-4 lg:px-6 lg:pt-6">
          <div
            className="mx-auto flex w-full flex-col gap-6"
            style={{ maxWidth: SHELL_LAYOUT.contentMaxWidth }}
          >
            <div className="space-y-3">
              <Skeleton className="h-10 w-[min(100%,320px)] rounded-[12px]" />
              <Skeleton className="h-5 w-[min(100%,220px)] rounded-[8px]" />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className="h-28 rounded-[16px]" />
              ))}
            </div>

            <Skeleton className="h-[420px] w-full rounded-[16px]" />
          </div>
        </main>
      </div>
    </div>
  )
}
