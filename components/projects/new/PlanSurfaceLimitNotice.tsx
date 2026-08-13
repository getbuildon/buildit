"use client"

import { useState } from "react"

import { StructureSurfaceLimitBanner } from "@/components/projects/new/StructureSurfaceLimitBanner"
import { RequestPlanUpgradeModal } from "@/components/team/RequestPlanUpgradeModal"

type PlanSurfaceLimitNoticeProps = {
  planSurfaceMaxM2: number
  projectId?: string | null
  reportedSurfaceM2: number
}

export function PlanSurfaceLimitNotice({
  planSurfaceMaxM2,
  projectId = null,
  reportedSurfaceM2,
}: PlanSurfaceLimitNoticeProps) {
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)

  return (
    <>
      <StructureSurfaceLimitBanner
        planSurfaceMaxM2={planSurfaceMaxM2}
        onUpgradeClick={() => setUpgradeModalOpen(true)}
      />
      <RequestPlanUpgradeModal
        projectId={projectId}
        surfaceLimit={{
          planSurfaceMaxM2,
          unitsSurfaceM2: reportedSurfaceM2,
        }}
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
      />
    </>
  )
}
