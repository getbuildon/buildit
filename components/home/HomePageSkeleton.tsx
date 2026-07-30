import { ProjectCardSkeleton } from "@/components/projects/ProjectCardSkeleton"
import { Skeleton } from "@/components/ui/skeleton"
import { HOME_GRADIENT } from "@/lib/home/designTokens"

const SKELETON_CARD_COUNT = 3

export function HomePageSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Cargando proyectos"
      className="relative flex min-h-screen flex-col items-center justify-center px-6 py-8 text-white sm:px-10"
      style={{ backgroundImage: HOME_GRADIENT }}
    >
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <Skeleton tone="dark" className="h-10 w-[136px] rounded-full" />
        <Skeleton tone="dark" className="size-10 shrink-0 rounded-full" />
      </div>

      <div className="flex w-full max-w-4xl flex-col items-center">
        <header className="flex w-full flex-col items-center gap-3">
          <Skeleton tone="dark" className="h-10 w-[min(100%,300px)] rounded-[12px]" />
          <Skeleton tone="dark" className="h-6 w-[min(100%,200px)] rounded-[8px]" />
        </header>

        <div className="mt-12 flex w-full flex-wrap justify-center gap-6 sm:px-16">
          {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
            <ProjectCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  )
}
