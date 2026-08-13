"use client"

import Link from "next/link"
import { Building2, TrendingUp } from "lucide-react"

import { useAppRouteNavigation } from "@/components/navigation/AppRouteLoadingProvider"
import type { UserProjectListItem } from "@/lib/projects/types"
import { projectDashboardHref } from "@/lib/project/routes"
import {
  HOME_COLORS,
  HOME_LAYOUT,
  HOME_TYPE,
  HOME_WEEKLY_PROGRESS_TOOLTIP,
  PROJECT_CARD_SHADOW,
  PROJECT_ICON_SHADOW,
  PROJECT_PROGRESS_GRADIENT,
} from "@/lib/home/designTokens"
import { cn } from "@/lib/utils"

type ProjectCardProps = {
  project: UserProjectListItem
}

function formatWeeklyDelta(delta: number): string {
  return `${delta}%`
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { navigate } = useAppRouteNavigation()
  const isDraft = project.status === "draft"
  const href = isDraft
    ? `/projects/new?projectId=${project.projectId}`
    : projectDashboardHref(project.projectId)
  const generalProgress = project.generalProgressPercent
  const weeklyDelta = project.weeklyProgressDelta
  const weeklyBadgeColor =
    weeklyDelta >= 0 ? HOME_COLORS.progressBadge : "#ce2c31"
  const weeklyBadgeBg =
    weeklyDelta >= 0 ? HOME_COLORS.progressBadgeBg : "#feebec"

  return (
    <Link
      href={href}
      onClick={(event) => {
        event.preventDefault()
        navigate(href)
      }}
      className={cn(
        "flex h-full shrink-0 flex-col rounded-[16px] bg-white text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60",
        HOME_LAYOUT.projectCardSize,
      )}
      style={{
        boxShadow: PROJECT_CARD_SHADOW,
      }}
    >
      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-col gap-4">
          <div className="flex h-12 items-start justify-between">
            <div
              className="flex size-12 items-center justify-center rounded-[14px] bg-[#ff7433]"
              style={{
                boxShadow: PROJECT_ICON_SHADOW,
              }}
            >
              <Building2 className="size-6 text-white" aria-hidden />
            </div>

            {isDraft ? (
              <div
                className="flex h-6 items-center rounded-[10px] px-2 py-1"
                style={{ backgroundColor: HOME_COLORS.draftBadgeBg }}
              >
                <span
                  className="text-[12px] font-medium leading-[1.4]"
                  style={{ color: HOME_COLORS.draftBadgeText }}
                >
                  Borrador
                </span>
              </div>
            ) : (
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
            )}
          </div>

          <div className="flex flex-col">
            <h3
              className={cn(HOME_TYPE.projectName, "line-clamp-2")}
              style={{ color: HOME_COLORS.cardTitle }}
            >
              {project.name}
            </h3>
            <p
              className={cn(HOME_TYPE.projectAddress, "mt-0 line-clamp-2")}
              style={{ color: HOME_COLORS.cardAddress }}
            >
              {project.address}
            </p>
          </div>
        </div>

        <div
          className="mt-auto flex h-[53px] items-start justify-between border-t pb-2 pt-[9px]"
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
              {!isDraft ? (
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${generalProgress}%`,
                    backgroundImage: PROJECT_PROGRESS_GRADIENT,
                  }}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
