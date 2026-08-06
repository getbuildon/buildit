"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function PerfilPageSkeleton() {
  return (
    <div
      className="fixed inset-0 min-h-screen bg-[#f8f9fa] px-6 py-10"
      aria-busy
      aria-label="Cargando perfil"
    >
      <div className="mx-auto w-full max-w-[720px] space-y-6">
        <Skeleton className="h-6 w-24 rounded-[8px]" />

        <div className="space-y-2">
          <Skeleton className="h-8 w-40 rounded-[10px]" />
          <Skeleton className="h-5 w-72 max-w-full rounded-[8px]" />
        </div>

        <div className="space-y-[22px]">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="rounded-[16px] border border-[#edeef0] bg-white p-[21px] shadow-[0_0_5px_rgba(243,103,31,0.08)]"
            >
              <Skeleton className="mb-4 h-6 w-48 rounded-[8px]" />
              <div className="space-y-4">
                <Skeleton className="h-[42px] w-full rounded-[10px]" />
                <Skeleton className="h-[42px] w-full rounded-[10px]" />
                {index === 0 ? (
                  <div className="flex items-center gap-4">
                    <Skeleton className="size-16 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-[42px] w-full rounded-[10px]" />
                      <Skeleton className="h-[42px] w-full rounded-[10px]" />
                    </div>
                  </div>
                ) : null}
                <Skeleton className="h-11 w-36 rounded-[10px]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
