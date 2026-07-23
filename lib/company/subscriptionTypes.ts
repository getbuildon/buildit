export type SubscriptionMemberLimits = {
  admins: number
  supervisors: number
  operators: number
}

export type ProjectSubscriptionSummary = {
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

export type ProjectSeatLimits = SubscriptionMemberLimits & {
  clients: number
}

export type ProjectSeatUsage = ProjectSeatLimits

export type ProjectSeatBucket = keyof ProjectSeatLimits

export type TeamSeatSummary = {
  usage: Pick<ProjectSeatLimits, "admins" | "supervisors" | "operators">
  limits: Pick<ProjectSeatLimits, "admins" | "supervisors" | "operators">
}

export type ClientSeatSummary = {
  usage: number
  limit: number
}
