"use client"

import { Check, Circle } from "lucide-react"
import { parseDraftDateString } from "@/lib/projects/createProjectDraft"
import {
  MI_UNIDAD_MILESTONE_LOREM,
} from "@/lib/projects/miUnidadTypes"
import type { PortalMilestoneItem, PortalMilestoneStatus } from "@/lib/projects/portalClientesTypes"
import { cn } from "@/lib/utils"

type ConstructionMilestonesTimelineProps = {
  milestones: PortalMilestoneItem[]
}

function formatMilestoneDate(value: string | null): string | null {
  if (!value) return null
  const parsed = parseDraftDateString(value)
  if (!parsed) return value
  return parsed.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function getTimelineStyles(status: PortalMilestoneStatus, isLast: boolean) {
  switch (status) {
    case "completed":
      return {
        node: "border-[#acdec8] bg-[#e6f7ed] text-[#208368]",
        connector: isLast ? null : "bg-[#acdec8]",
        dateBadge:
          "border-[#d6f1e3] bg-[#f4fbf7] text-[#208368]",
        datePrefix: "✓ ",
      }
    case "in_progress":
      return {
        node: "border-[#5eb1ef] bg-[#e6f4fe] text-[#0d74ce]",
        connector: isLast ? null : "bg-[#5eb1ef]/35",
        dateBadge: "border-[#5eb1ef] bg-[#e6f4fe] text-[#113264]",
        datePrefix: "Est. ",
      }
    default:
      return {
        node: "border-[#edeef0] bg-white text-[#777b84]",
        connector: isLast ? null : "bg-[#edeef0]",
        dateBadge:
          "border-[#edeef0] bg-[rgba(237,238,240,0.4)] text-[#777b84]",
        datePrefix: "Est. ",
      }
  }
}

export function ConstructionMilestonesTimeline({
  milestones,
}: ConstructionMilestonesTimelineProps) {
  if (milestones.length === 0) {
    return (
      <p className="text-[14px] leading-[1.4] text-[#696e77]">
        Todavía no hay hitos de construcción publicados.
      </p>
    )
  }

  return (
    <div className="flex flex-col">
      {milestones.map((milestone, index) => {
        const isLast = index === milestones.length - 1
        const styles = getTimelineStyles(milestone.status, isLast)
        const formattedDate = formatMilestoneDate(milestone.estimatedDate)

        return (
          <div key={milestone.id} className="flex gap-4">
            <div className="flex w-7 shrink-0 flex-col items-center">
              <div
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border-2",
                  styles.node,
                )}
              >
                {milestone.status === "completed" ? (
                  <Check className="size-3" strokeWidth={2.5} aria-hidden />
                ) : milestone.status === "in_progress" ? (
                  <Circle className="size-3 fill-current" aria-hidden />
                ) : (
                  <Circle className="size-3" strokeWidth={2} aria-hidden />
                )}
              </div>
              {styles.connector ? (
                <div
                  className={cn("mt-1 w-0.5 flex-1 min-h-6 rounded-full", styles.connector)}
                />
              ) : null}
            </div>

            <div
              className={cn(
                "flex min-w-0 flex-1 gap-3 pb-6",
                isLast && "pb-0",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-medium leading-[1.4] text-[#1d293d]">
                  {milestone.name}
                </p>
                <p className="pt-0.5 text-[14px] leading-[1.4] text-[#43484e]">
                  {MI_UNIDAD_MILESTONE_LOREM}
                </p>
                {milestone.status === "in_progress" ? (
                  <span className="mt-2 inline-flex rounded-[6px] border border-[#5eb1ef] bg-[#e6f4fe] px-2 py-1 text-[11px] font-medium leading-[1.5] text-[#0d74ce]">
                    En Progreso
                  </span>
                ) : null}
              </div>

              {formattedDate ? (
                <div className="shrink-0 pt-0.5">
                  <span
                    className={cn(
                      "inline-flex rounded-[6px] border px-[9px] py-1 text-[12px] leading-[1.4] tracking-[-0.36px] whitespace-nowrap",
                      styles.dateBadge,
                    )}
                  >
                    {styles.datePrefix}
                    {formattedDate}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
