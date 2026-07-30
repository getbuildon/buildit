import { Skeleton } from "@/components/ui/skeleton"
import { HOME_LAYOUT } from "@/lib/home/designTokens"
import { cn } from "@/lib/utils"

type ProjectCardSkeletonProps = {
  className?: string
}

export function ProjectCardSkeleton({ className }: ProjectCardSkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "block shrink-0 rounded-[16px] border border-white/15 bg-white/10 backdrop-blur-[2px]",
        HOME_LAYOUT.projectCardSize,
        className,
      )}
    >
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-4">
          <div className="flex h-12 items-start justify-between">
            <Skeleton tone="dark" className="size-12 rounded-[14px]" />
            <Skeleton tone="dark" className="h-6 w-14 rounded-[10px]" />
          </div>

          <div className="flex flex-col gap-2.5">
            <Skeleton tone="dark" className="h-[18px] w-[88%] rounded-[6px]" />
            <Skeleton tone="dark" className="h-3 w-[62%] rounded-[6px]" />
          </div>
        </div>

        <div className="flex items-start justify-between border-t border-white/10 pt-3">
          <div className="flex flex-col gap-2">
            <Skeleton tone="dark" className="h-3 w-9 rounded-[4px]" />
            <Skeleton tone="dark" className="h-4 w-5 rounded-[4px]" />
          </div>

          <div className="flex w-[72px] flex-col gap-2">
            <Skeleton tone="dark" className="h-3 w-full rounded-[4px]" />
            <Skeleton tone="dark" className="h-1.5 w-full rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
