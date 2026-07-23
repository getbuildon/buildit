import Link from "next/link"
import { Building2, TrendingUp } from "lucide-react"
import type { UserProjectListItem } from "@/lib/projects/types"
import { projectDashboardHref } from "@/lib/project/routes"
import {
  HOME_COLORS,
  HOME_TYPE,
  HOME_WEEKLY_PROGRESS_TOOLTIP,
  PROJECT_CARD,
  PROJECT_CARD_SHADOW,
  PROJECT_ICON_GRADIENT,
  PROJECT_ICON_SHADOW,
  PROJECT_PROGRESS_GRADIENT,
} from "@/lib/home/designTokens"

type ProjectCardProps = {
  project: UserProjectListItem
}

function formatWeeklyDelta(delta: number): string {
  return `${delta}%`
}

export function ProjectCard({ project }: ProjectCardProps) {
  const href = projectDashboardHref(project.projectId)
  const generalProgress = project.generalProgressPercent
  const weeklyDelta = project.weeklyProgressDelta
  const weeklyBadgeColor =
    weeklyDelta >= 0 ? HOME_COLORS.progressBadge : "#ce2c31"
  const weeklyBadgeBg =
    weeklyDelta >= 0 ? HOME_COLORS.progressBadgeBg : "#feebec"

  return (
    <Link
      href={href}
      className="block shrink-0 rounded-[16px] bg-white text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
      style={{
        width: PROJECT_CARD.width,
        minHeight: PROJECT_CARD.minHeight,
        boxShadow: PROJECT_CARD_SHADOW,
      }}
    >
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-4">
          <div className="flex h-12 items-start justify-between">
            <div
              className="flex size-12 items-center justify-center rounded-[14px]"
              style={{
                backgroundImage: PROJECT_ICON_GRADIENT,
                boxShadow: PROJECT_ICON_SHADOW,
              }}
            >
              <Building2 className="size-6 text-white" aria-hidden />
            </div>

            <div className="group relative flex shrink-0 items-center">
              <div
                className="flex h-6 items-center gap-1 rounded-[10px] px-2 py-1"
                style={{ backgroundColor: weeklyBadgeBg }}
              >
                <TrendingUp
                  className="size-3.5"
                  style={{ color: weeklyBadgeColor }}
                  aria-hidden
                />
                <span
                  className={HOME_TYPE.progressBadge}
                  style={{ color: weeklyBadgeColor }}
                >
                  {formatWeeklyDelta(weeklyDelta)}
                </span>
              </div>
              <div
                role="tooltip"
                className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-50 hidden w-max max-w-[220px] -translate-x-1/2 rounded-[8px] bg-[#111113] px-3 py-2 text-[12px] font-normal leading-[1.4] tracking-[-0.36px] text-white group-focus-within:block group-hover:block"
              >
                {HOME_WEEKLY_PROGRESS_TOOLTIP}
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <h3
              className={HOME_TYPE.projectName}
              style={{ color: HOME_COLORS.cardTitle }}
            >
              {project.name}
            </h3>
            <p
              className={`${HOME_TYPE.projectAddress} mt-0`}
              style={{ color: HOME_COLORS.cardAddress }}
            >
              {project.address}
            </p>
          </div>
        </div>

        <div
          className="flex h-[53px] items-start justify-between border-t pb-2 pt-[9px]"
          style={{ borderColor: HOME_COLORS.cardDivider }}
        >
          <div className="flex flex-col">
            <p className={HOME_TYPE.statLabel} style={{ color: HOME_COLORS.cardMuted }}>
              Pisos
            </p>
            <p className={HOME_TYPE.statValue} style={{ color: HOME_COLORS.cardStat }}>
              {project.floors}
            </p>
          </div>

          <div className="flex w-16 flex-col gap-2">
            <p className={HOME_TYPE.statLabel} style={{ color: HOME_COLORS.cardMuted }}>
              Progreso
            </p>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full"
              style={{ backgroundColor: HOME_COLORS.progressTrack }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${generalProgress}%`,
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
