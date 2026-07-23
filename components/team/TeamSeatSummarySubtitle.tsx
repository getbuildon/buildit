"use client"

import { SubscriptionSeatSummarySubtitle } from "@/components/subscription/SubscriptionSeatSummarySubtitle"
import { formatTeamSeatSummarySubtitle } from "@/lib/company/projectSubscriptionLimits"
import type { TeamSeatSummary } from "@/lib/company/subscriptionTypes"

type TeamSeatSummarySubtitleProps = {
  summary: TeamSeatSummary
}

export function TeamSeatSummarySubtitle({ summary }: TeamSeatSummarySubtitleProps) {
  return (
    <SubscriptionSeatSummarySubtitle text={formatTeamSeatSummarySubtitle(summary)} />
  )
}
