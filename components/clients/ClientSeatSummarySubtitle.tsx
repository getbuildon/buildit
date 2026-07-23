"use client"

import { SubscriptionSeatSummarySubtitle } from "@/components/subscription/SubscriptionSeatSummarySubtitle"
import { formatClientSeatSummarySubtitle } from "@/lib/company/projectSubscriptionLimits"
import type { ClientSeatSummary } from "@/lib/company/subscriptionTypes"

type ClientSeatSummarySubtitleProps = {
  summary: ClientSeatSummary
}

export function ClientSeatSummarySubtitle({ summary }: ClientSeatSummarySubtitleProps) {
  return (
    <SubscriptionSeatSummarySubtitle text={formatClientSeatSummarySubtitle(summary)} />
  )
}
