import type { SupabaseClient } from "@supabase/supabase-js"
import { USER_TYPE_SLUG } from "@/lib/projects/catalogSlugs"
import type { ProjectUserType } from "@/lib/projects/createProjectDraft"
import type { ProjectSeatBucket, ProjectSeatLimits, ProjectSeatUsage, TeamSeatSummary, ClientSeatSummary } from "@/lib/company/subscriptionTypes"

const ADMIN_SLUGS = new Set([USER_TYPE_SLUG.Owner, USER_TYPE_SLUG.Admin])
const SUPERVISOR_SLUG = USER_TYPE_SLUG.Supervisor
const OPERATOR_SLUG = USER_TYPE_SLUG.Operador
const CLIENT_SLUG = USER_TYPE_SLUG.Cliente

const BUCKET_LABELS: Record<ProjectSeatBucket, string> = {
  admins: "administradores",
  supervisors: "supervisores",
  operators: "operadores",
  clients: "clientes",
}

export function seatBucketForUserType(userType: ProjectUserType): ProjectSeatBucket {
  switch (userType) {
    case "Owner":
    case "Admin":
      return "admins"
    case "Supervisor":
      return "supervisors"
    case "Operador":
      return "operators"
    case "Cliente":
      return "clients"
  }
}

export function formatSubscriptionLimitError(
  bucket: ProjectSeatBucket,
  limit: number,
): string {
  return `El plan actual permite hasta ${limit} ${BUCKET_LABELS[bucket]}. Mejorá el plan para agregar más.`
}

function bucketForUserTypeSlug(slug: string | undefined): ProjectSeatBucket | null {
  if (!slug) return null
  if (ADMIN_SLUGS.has(slug)) return "admins"
  if (slug === SUPERVISOR_SLUG) return "supervisors"
  if (slug === OPERATOR_SLUG) return "operators"
  if (slug === CLIENT_SLUG) return "clients"
  return null
}

export function emptySeatUsage(): ProjectSeatUsage {
  return { admins: 0, supervisors: 0, operators: 0, clients: 0 }
}

export function countSeatsByUserTypes(userTypes: ProjectUserType[]): ProjectSeatUsage {
  const usage = emptySeatUsage()
  for (const userType of userTypes) {
    usage[seatBucketForUserType(userType)] += 1
  }
  return usage
}

export function mergeSeatUsage(...usages: ProjectSeatUsage[]): ProjectSeatUsage {
  return usages.reduce(
    (total, usage) => ({
      admins: total.admins + usage.admins,
      supervisors: total.supervisors + usage.supervisors,
      operators: total.operators + usage.operators,
      clients: total.clients + usage.clients,
    }),
    emptySeatUsage(),
  )
}

export function wouldExceedSeatLimit(
  current: ProjectSeatUsage,
  limits: ProjectSeatLimits,
  bucket: ProjectSeatBucket,
  additional = 1,
): boolean {
  return current[bucket] + additional > limits[bucket]
}

export function validateSeatUsageAgainstLimits(
  usage: ProjectSeatUsage,
  limits: ProjectSeatLimits,
): { ok: true } | { ok: false; bucket: ProjectSeatBucket; limit: number } {
  for (const bucket of Object.keys(limits) as ProjectSeatBucket[]) {
    if (usage[bucket] > limits[bucket]) {
      return { ok: false, bucket, limit: limits[bucket] }
    }
  }
  return { ok: true }
}

type SubscriptionRow = {
  plan: {
    max_admins: number
    max_supervisors: number
    max_operators: number
    max_clients: number
  } | null
}

export async function loadProjectSeatLimits(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ProjectSeatLimits | null> {
  const { data, error } = await supabase
    .from("project_subscriptions")
    .select(
      `
      plan:subscription_plans (
        max_admins,
        max_supervisors,
        max_operators,
        max_clients
      )
    `,
    )
    .eq("project_id", projectId)
    .eq("status", "active")
    .maybeSingle()

  if (error) throw error

  const row = data as SubscriptionRow | null
  const plan = row?.plan
  if (!plan) return null

  return {
    admins: plan.max_admins,
    supervisors: plan.max_supervisors,
    operators: plan.max_operators,
    clients: plan.max_clients,
  }
}

export async function loadProjectSeatUsage(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ProjectSeatUsage> {
  const usage = emptySeatUsage()

  const [{ data: members }, { data: invitations }] = await Promise.all([
    supabase
      .from("project_members")
      .select("user_type_id")
      .eq("project_id", projectId)
      .eq("is_active", true),
    supabase
      .from("project_invitations")
      .select("user_type_id")
      .eq("project_id", projectId)
      .eq("status", "pending"),
  ])

  const userTypeIds = [
    ...new Set(
      [...(members ?? []), ...(invitations ?? [])]
        .map((row) => row.user_type_id)
        .filter((id): id is string => id != null),
    ),
  ]

  if (userTypeIds.length === 0) return usage

  const { data: userTypes, error } = await supabase
    .from("user_types")
    .select("id, slug")
    .in("id", userTypeIds)

  if (error) throw error

  const slugById = new Map((userTypes ?? []).map((row) => [row.id, row.slug]))

  for (const row of [...(members ?? []), ...(invitations ?? [])]) {
    const bucket = bucketForUserTypeSlug(
      row.user_type_id ? slugById.get(row.user_type_id) : undefined,
    )
    if (bucket) usage[bucket] += 1
  }

  return usage
}

export async function assertCanAddProjectSeat(
  supabase: SupabaseClient,
  projectId: string,
  userType: ProjectUserType,
  options?: { excludeMemberId?: string; excludeInvitationId?: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const limits = await loadProjectSeatLimits(supabase, projectId)
  if (!limits) {
    return { ok: false, error: "Este proyecto no tiene un plan de suscripción activo." }
  }

  let usage = await loadProjectSeatUsage(supabase, projectId)

  if (options?.excludeMemberId) {
    const { data: member } = await supabase
      .from("project_members")
      .select("user_type_id")
      .eq("id", options.excludeMemberId)
      .maybeSingle()

    if (member?.user_type_id) {
      const { data: userTypeRow } = await supabase
        .from("user_types")
        .select("slug")
        .eq("id", member.user_type_id)
        .maybeSingle()

      const bucket = bucketForUserTypeSlug(userTypeRow?.slug)
      if (bucket && usage[bucket] > 0) usage[bucket] -= 1
    }
  }

  if (options?.excludeInvitationId) {
    const { data: invitation } = await supabase
      .from("project_invitations")
      .select("user_type_id")
      .eq("id", options.excludeInvitationId)
      .maybeSingle()

    if (invitation?.user_type_id) {
      const { data: userTypeRow } = await supabase
        .from("user_types")
        .select("slug")
        .eq("id", invitation.user_type_id)
        .maybeSingle()

      const bucket = bucketForUserTypeSlug(userTypeRow?.slug)
      if (bucket && usage[bucket] > 0) usage[bucket] -= 1
    }
  }

  const bucket = seatBucketForUserType(userType)
  if (wouldExceedSeatLimit(usage, limits, bucket)) {
    return {
      ok: false,
      error: formatSubscriptionLimitError(bucket, limits[bucket]),
    }
  }

  return { ok: true }
}

export function selectPlanSlugForSurface(surfaceM2: number | null | undefined): string {
  if (surfaceM2 == null || surfaceM2 <= 60) return "starter-s"
  return "growth-m"
}

export async function assignDefaultProjectSubscription(
  supabase: SupabaseClient,
  projectId: string,
  surfaceM2: number | null | undefined,
): Promise<void> {
  const planSlug = selectPlanSlugForSurface(surfaceM2)

  const { data: plan, error: planError } = await supabase
    .from("subscription_plans")
    .select("id, billing_interval")
    .eq("slug", planSlug)
    .eq("is_active", true)
    .single()

  if (planError || !plan) {
    throw planError ?? new Error(`No se encontró el plan ${planSlug}.`)
  }

  const billingNote =
    plan.billing_interval === "annual"
      ? "Se renueva automáticamente el 01/03/2027"
      : "Próxima facturación 05/07/2026"

  const renewsAt =
    plan.billing_interval === "annual" ? "2027-03-01T00:00:00.000Z" : "2026-07-05T00:00:00.000Z"

  const { error } = await supabase.from("project_subscriptions").insert({
    project_id: projectId,
    plan_id: plan.id,
    billing_note: billingNote,
    renews_at: renewsAt,
  })

  if (error) throw error
}

export async function validateProjectSeatAllocation(
  supabase: SupabaseClient,
  projectId: string,
  additionalUserTypes: ProjectUserType[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const [limits, usage] = await Promise.all([
    loadProjectSeatLimits(supabase, projectId),
    loadProjectSeatUsage(supabase, projectId),
  ])

  if (!limits) {
    return { ok: false, error: "Este proyecto no tiene un plan de suscripción activo." }
  }

  const projected = mergeSeatUsage(usage, countSeatsByUserTypes(additionalUserTypes))
  const validation = validateSeatUsageAgainstLimits(projected, limits)
  if (!validation.ok) {
    return {
      ok: false,
      error: formatSubscriptionLimitError(validation.bucket, validation.limit),
    }
  }

  return { ok: true }
}

export const TEAM_SEAT_SUMMARY_TOOLTIP =
  "Cantidad de usuarios sobre el máximo disponible para cada rol según tu plan."

export function formatTeamSeatSummarySubtitle(summary: TeamSeatSummary): string {
  const { usage, limits } = summary
  return `${usage.admins}/${limits.admins} Admins, ${usage.supervisors}/${limits.supervisors} Supervisores, ${usage.operators}/${limits.operators} operadores`
}

export async function loadTeamSeatSummary(
  supabase: SupabaseClient,
  projectId: string,
): Promise<TeamSeatSummary | null> {
  const [limits, usage] = await Promise.all([
    loadProjectSeatLimits(supabase, projectId),
    loadProjectSeatUsage(supabase, projectId),
  ])

  if (!limits) return null

  return {
    usage: {
      admins: usage.admins,
      supervisors: usage.supervisors,
      operators: usage.operators,
    },
    limits: {
      admins: limits.admins,
      supervisors: limits.supervisors,
      operators: limits.operators,
    },
  }
}

export function formatClientSeatSummarySubtitle(summary: ClientSeatSummary): string {
  return `${summary.usage}/${summary.limit} Clientes en este proyecto`
}

export async function loadClientSeatSummary(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ClientSeatSummary | null> {
  const [limits, usage] = await Promise.all([
    loadProjectSeatLimits(supabase, projectId),
    loadProjectSeatUsage(supabase, projectId),
  ])

  if (!limits) return null

  return {
    usage: usage.clients,
    limit: limits.clients,
  }
}
