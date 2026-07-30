import { ProjectCardSkeleton } from "@/components/projects/ProjectCardSkeleton"
import { HomePageLayout } from "@/components/home/HomePageLayout"
import { Skeleton } from "@/components/ui/skeleton"
import { HOME_LAYOUT } from "@/lib/home/designTokens"

const SKELETON_CARD_COUNT = 3

export function HomePageSkeleton() {
  return (
    <HomePageLayout
      ariaBusy
      ariaLabel="Cargando proyectos"
      topBar={
        <>
          <Skeleton tone="dark" className="h-10 w-[min(100%,120px)] rounded-full sm:w-[136px]" />
          <Skeleton tone="dark" className="size-10 shrink-0 rounded-full" />
        </>
      }
    >
      <header className={HOME_LAYOUT.header}>
        <Skeleton tone="dark" className="h-9 w-[min(100%,280px)] rounded-[12px] sm:h-10 sm:w-[300px]" />
        <Skeleton tone="dark" className="h-5 w-[min(100%,200px)] rounded-[8px] sm:h-6" />
      </header>

      <div className={HOME_LAYOUT.projectGrid}>
        {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
          <ProjectCardSkeleton key={index} />
        ))}
      </div>
    </HomePageLayout>
  )
}
