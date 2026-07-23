import type { UserProjectListItem } from "@/lib/projects/types"

export type SubscriptionMemberLimits = {
  admins: number
  supervisors: number
  operators: number
}

export type HardcodedSubscription = {
  projectId: string
  projectName: string
  planName: string
  surfaceLabel: string
  members: SubscriptionMemberLimits
  clients: number
  price: string
  billingNote: string
  paymentMethod: string
  cardLast4: string
}

const SUBSCRIPTION_TEMPLATES = [
  {
    planName: "Plan Starter S",
    surfaceLabel: "Hasta 60m²",
    members: { admins: 1, supervisors: 2, operators: 15 },
    clients: 20,
    price: "4.800usd / Anual",
    billingNote: "Se renueva automáticamente el 01/03/2027",
    paymentMethod: "Tarjeta de Crédito",
    cardLast4: "1234",
  },
  {
    planName: "Plan Growth M",
    surfaceLabel: "Hasta 2.500m²",
    members: { admins: 3, supervisors: 5, operators: 50 },
    clients: 100,
    price: "1.300usd / Mensual",
    billingNote: "Próxima facturación 05/07/2026",
    paymentMethod: "Tarjeta de Crédito",
    cardLast4: "1234",
  },
] as const

export function buildHardcodedSubscriptions(
  projects: UserProjectListItem[],
): HardcodedSubscription[] {
  return projects.map((project, index) => {
    const template = SUBSCRIPTION_TEMPLATES[index % SUBSCRIPTION_TEMPLATES.length]
    return {
      projectId: project.projectId,
      projectName: project.name,
      ...template,
    }
  })
}
