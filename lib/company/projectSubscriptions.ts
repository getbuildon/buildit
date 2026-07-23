import { createClient } from "@/utils/supabase/server"
import type { ProjectSubscriptionSummary } from "@/lib/company/subscriptionTypes"

type SubscriptionQueryRow = {
  project_id: string
  billing_note: string | null
  payment_method_label: string
  card_last4: string
  project:
    | {
        id: string
        name: string
        company_id: string
        status: string
      }
    | {
        id: string
        name: string
        company_id: string
        status: string
      }[]
    | null
  plan:
    | {
        name: string
        surface_label: string
        max_admins: number
        max_supervisors: number
        max_operators: number
        max_clients: number
        price_label: string
      }
    | {
        name: string
        surface_label: string
        max_admins: number
        max_supervisors: number
        max_operators: number
        max_clients: number
        price_label: string
      }[]
    | null
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export async function listCompanyProjectSubscriptions(
  companyId: string,
): Promise<ProjectSubscriptionSummary[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("project_subscriptions")
    .select(
      `
      project_id,
      billing_note,
      payment_method_label,
      card_last4,
      project:projects!inner (
        id,
        name,
        company_id,
        status
      ),
      plan:subscription_plans (
        name,
        surface_label,
        max_admins,
        max_supervisors,
        max_operators,
        max_clients,
        price_label
      )
    `,
    )
    .eq("status", "active")
    .eq("project.company_id", companyId)
    .eq("project.status", "active")
    .order("started_at", { ascending: false })

  if (error) throw error

  return ((data ?? []) as SubscriptionQueryRow[])
    .map((row) => {
      const project = firstRelation(row.project)
      const plan = firstRelation(row.plan)
      if (!project || !plan) return null

      return {
        projectId: row.project_id,
        projectName: project.name,
        planName: plan.name,
        surfaceLabel: plan.surface_label,
        members: {
          admins: plan.max_admins,
          supervisors: plan.max_supervisors,
          operators: plan.max_operators,
        },
        clients: plan.max_clients,
        price: plan.price_label,
        billingNote: row.billing_note ?? "",
        paymentMethod: row.payment_method_label,
        cardLast4: row.card_last4,
      }
    })
    .filter((row): row is ProjectSubscriptionSummary => row != null)
}
