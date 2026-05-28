import Link from "next/link"
import { Building2, TrendingUp } from "lucide-react"
import type { UserProjectListItem } from "@/lib/projects/types"
import { projectDashboardHref } from "@/lib/project/routes"
import {
  HOME_COLORS,
  HOME_TYPE,
  PROJECT_CARD,
  PROJECT_ICON_GRADIENT,
  PROJECT_PROGRESS_GRADIENT,
} from "@/lib/home/designTokens"

type ProjectCardProps = {
  project: UserProjectListItem
}

export function ProjectCard({ project }: ProjectCardProps) {
  const href = projectDashboardHref(project.projectId)

  return (
    <Link
      href={href}
      className="block shrink-0 rounded-[16px] bg-white text-left shadow-[0_20px_12.5px_rgba(0,0,0,0.1),0_8px_5px_rgba(0,0,0,0.1)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
      style={{ width: PROJECT_CARD.width, height: PROJECT_CARD.height }}
    >
      <div className="flex h-full flex-col px-6 pt-8 pb-6">
        <div className="flex items-start justify-between">
          <div
            className="flex size-12 items-center justify-center rounded-[14px] shadow-[0_10px_7.5px_rgba(0,0,0,0.1),0_4px_3px_rgba(0,0,0,0.1)]"
            style={{ backgroundImage: PROJECT_ICON_GRADIENT }}
          >
            <Building2 className="size-6 text-white" aria-hidden />
          </div>

          <div
            className="flex h-6 items-center gap-1 rounded-[10px] px-2 py-1"
            style={{ backgroundColor: HOME_COLORS.progressBadgeBg }}
          >
            <TrendingUp
              className="size-3.5"
              style={{ color: HOME_COLORS.progressBadge }}
              aria-hidden
            />
            <span
              className={HOME_TYPE.progressBadge}
              style={{ color: HOME_COLORS.progressBadge }}
            >
              {project.progressPercent}%
            </span>
          </div>
        </div>

        <h3
          className={`${HOME_TYPE.projectName} mt-4`}
          style={{ color: HOME_COLORS.cardTitle }}
        >
          {project.name}
        </h3>

        <p
          className={`${HOME_TYPE.projectAddress} mt-1`}
          style={{ color: HOME_COLORS.cardAddress }}
        >
          {project.address}
        </p>

        <div className="mt-auto flex items-end justify-between border-t border-[#f1f5f9] pt-4">
          <div>
            <p className={HOME_TYPE.statLabel} style={{ color: HOME_COLORS.cardMuted }}>
              Pisos
            </p>
            <p className={HOME_TYPE.statValue} style={{ color: HOME_COLORS.cardStat }}>
              {project.floors}
            </p>
          </div>

          <div className="w-16">
            <p className={HOME_TYPE.statLabel} style={{ color: HOME_COLORS.cardMuted }}>
              Progreso
            </p>
            <div
              className="mt-0.5 h-1.5 overflow-hidden rounded-full"
              style={{ backgroundColor: HOME_COLORS.progressTrack }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${project.progressPercent}%`,
                  backgroundImage: PROJECT_PROGRESS_GRADIENT,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
