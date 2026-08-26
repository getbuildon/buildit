"use client"

import { Suspense } from "react"
import { useParams } from "next/navigation"

import { BackofficeApp } from "../BackofficeApp"
import { BackofficeDashboardSkeleton } from "../skeletons/BackofficePageSkeletons"

function sectionFromParams(section: string | string[] | undefined): string[] | undefined {
  if (section == null) return undefined
  return Array.isArray(section) ? section : [section]
}

function BackofficeCatchAllPage() {
  const params = useParams<{ section?: string | string[] }>()

  return (
    <Suspense fallback={<BackofficeDashboardSkeleton />}>
      <BackofficeApp section={sectionFromParams(params.section)} />
    </Suspense>
  )
}

export default BackofficeCatchAllPage
