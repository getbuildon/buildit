"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { SHELL_COLORS, SHELL_LAYOUT } from "@/lib/project/designTokens"

const NAV_ITEM_COUNT = 2

export function CompanyWorkspaceSkeleton() {
  return (
    <div
      className="fixed inset-0 flex min-h-screen"
      style={{ backgroundColor: SHELL_COLORS.mainBg }}
      aria-busy
      aria-label="Cargando empresa"
    >
      <aside
        className="sticky top-3 my-3 ml-3 hidden shrink-0 flex-col overflow-hidden sm:flex"
        style={{
          width: "254px",
          height: "calc(100vh - 24px)",
          backgroundColor: "#fefcfb",
          borderRadius: "24px",
          boxShadow: "0 0 39px 4px rgba(0,0,0,0.08)",
        }}
      >
        <div className="border-b border-[#dadada] p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 shrink-0 rounded-[10px]" />
            <Skeleton className="h-4 flex-1 rounded-[6px]" />
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

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 p-6">
          <div
            className="mx-auto w-full space-y-6"
            style={{ maxWidth: SHELL_LAYOUT.contentMaxWidth }}
          >
            <Skeleton className="h-9 w-[min(100%,280px)] rounded-[12px]" />
            <Skeleton className="h-48 w-full rounded-[16px]" />
            <Skeleton className="h-48 w-full rounded-[16px]" />
          </div>
        </main>
      </div>
    </div>
  )
}
