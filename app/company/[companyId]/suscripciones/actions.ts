"use server"

import { getCompanyById, type CompanyData } from "@/lib/company/getCompanies"
import {
  buildHardcodedSubscriptions,
  type HardcodedSubscription,
} from "@/lib/company/subscriptionMocks"
import { listUserProjects } from "@/lib/projects/listUserProjects"

export type CompanySubscriptionsData = {
  company: CompanyData
  subscriptions: HardcodedSubscription[]
}

export async function getCompanySubscriptionsData(
  companyId: string,
): Promise<CompanySubscriptionsData | null> {
  const company = await getCompanyById(companyId)
  if (!company) return null

  const projects = (await listUserProjects()).filter(
    (project) => project.company_id === companyId,
  )

  return {
    company,
    subscriptions: buildHardcodedSubscriptions(projects),
  }
}
