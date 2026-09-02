"use client"

import Link from "next/link"
import { Building2, TrendingUp } from "lucide-react"
import { CompanyLogoMark } from "@/components/company/CompanyLogoMark"

import { useAppRouteNavigation } from "@/components/navigation/AppRouteLoadingProvider"
import type { HomeProjectListItem } from "@/lib/projects/types"
import type { ProjectHomeProgress } from "@/lib/projects/homeProjectProgress"
import {
  formatProgressPercentLabel,
  progressBarWidthPercent,
} from "@/lib/projects/dashboardProgress"
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
  project: HomeProjectListItem
  progress?: ProjectHomeProgress
}

export function ProjectCard({ project, progress }: ProjectCardProps) {
  const { navigate } = useAppRouteNavigation()
  const isDraft = project.status === "draft"
  const href = isDraft
    ? `/projects/new?projectId=${project.projectId}`
    : projectDashboardHref(project.projectId)
  const generalProgress = progress?.generalProgressPercent
  const weeklyDelta = progress?.weeklyProgressDelta
  const weeklyBadgeColor =
    (weeklyDelta ?? 0) >= 0 ? HOME_COLORS.progressBadge : "#ce2c31"
  const weeklyBadgeBg =
    (weeklyDelta ?? 0) >= 0 ? HOME_COLORS.progressBadgeBg : "#feebec"

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
              className="shrink-0 rounded-[14px]"
              style={{ boxShadow: PROJECT_ICON_SHADOW }}
            >
              <CompanyLogoMark
                logoUrl={project.companyLogoUrl}
                alt={`Logo de ${project.name}`}
                className="flex size-12 items-center justify-center rounded-[14px] bg-[#ff7433]"
                fallback={<Building2 className="size-6 text-white" aria-hidden />}
              />
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
            ) : weeklyDelta != null ? (
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
                    {formatProgressPercentLabel(weeklyDelta)}
                  </span>
                </div>
                <div
                  role="tooltip"
                  className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-50 hidden w-max max-w-[220px] -translate-x-1/2 rounded-[8px] bg-[#111113] px-3 py-2 text-[12px] font-normal leading-[1.4] tracking-[-0.36px] text-white group-focus-within:block group-hover:block"
                >
                  {HOME_WEEKLY_PROGRESS_TOOLTIP}
                </div>
              </div>
            ) : (
              <div
                className="h-6 w-14 animate-pulse rounded-[10px]"
                style={{ backgroundColor: HOME_COLORS.progressTrack }}
                aria-hidden
              />
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
              Niveles
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
              {!isDraft && generalProgress != null ? (
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${progressBarWidthPercent(generalProgress)}%`,
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
