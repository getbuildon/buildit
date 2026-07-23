"use server"

import { getCompanyById, type CompanyData } from "@/lib/company/getCompanies"
import { listCompanyProjectSubscriptions } from "@/lib/company/projectSubscriptions"
import type { ProjectSubscriptionSummary } from "@/lib/company/subscriptionTypes"

export type CompanySubscriptionsData = {
  company: CompanyData
  subscriptions: ProjectSubscriptionSummary[]
}

export async function getCompanySubscriptionsData(
  companyId: string,
): Promise<CompanySubscriptionsData | null> {
  const company = await getCompanyById(companyId)
  if (!company) return null

  const subscriptions = await listCompanyProjectSubscriptions(companyId)

  return {
    company,
    subscriptions,
  }
}
