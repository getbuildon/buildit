"use server"

import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { requireAuthenticatedUser } from "@/lib/authHelpers"
import type {
  AvailableTeamMember,
  CreateProjectDraft,
  ProjectTeamRole,
  ProjectUserType,
} from "@/lib/projects/createProjectDraft"
import type { CreateProjectStepId } from "@/lib/projects/createProjectSteps"
import { PROJECT_ROLE_SLUG, USER_TYPE_SLUG } from "@/lib/projects/catalogSlugs"
import {
  assertDraftProjectAccess,
  ensureProjectCreatorMembership,
  getProjectFieldUpdates,
  persistProjectFromDraft,
  requireAuthenticatedUserId,
  resolveProjectCompanyId,
} from "@/lib/projects/persistProjectFromDraft"
import { buildDraftFromProjectDb } from "@/lib/projects/buildDraftFromProjectDb"
import { mergeProjectSetupDraft } from "@/lib/projects/mergeProjectSetupDraft"
import {
  serializeSetupDraft,
  type StoredProjectSetupDraft,
} from "@/lib/projects/storedProjectSetupDraft"

export type CreateProjectResult =
  | { ok: true; projectId: string; unitIdByDraftId: Record<string, string> }
  | { ok: false; error: string }

export type SaveProjectDraftResult =
  | { ok: true; projectId: string; companyId: string }
  | { ok: false; error: string }

export type LoadProjectDraftResult =
  | {
      ok: true
      projectId: string
      draft: CreateProjectDraft
      phase: "stage" | "wizard"
      activeStepId: CreateProjectStepId
      coverUrl: string | null
    }
  | { ok: false; error: string }

export async function getCompanyProjectMembers(
  companyId: string,
): Promise<AvailableTeamMember[]> {
  const user = await requireAuthenticatedUser()
  const admin = createAdminClient()

  const { data: projects, error: projectsError } = await admin
    .from("projects")
    .select("id")
    .eq("company_id", companyId)

  if (projectsError || !projects?.length) return []

  const projectIds = projects.map((p) => p.id)

  const { data: members, error: membersError } = await admin
    .from("project_members")
    .select("user_id, role_id, user_type_id, joined_at")
    .in("project_id", projectIds)
    .eq("is_active", true)
    .neq("user_id", user.id)

  if (membersError || !members?.length) return []

  const userIds = [...new Set(members.map((m) => m.user_id))]

  const [profilesResult, rolesResult, userTypesResult] = await Promise.all([
    admin.from("profiles").select("id, first_name, last_name, email, avatar_url").in("id", userIds),
    admin.from("project_roles").select("id, slug, label"),
    admin.from("user_types").select("id, slug"),
  ])

  const profileById = new Map((profilesResult.data ?? []).map((p) => [p.id, p]))
  const roleById = new Map((rolesResult.data ?? []).map((r) => [r.id, r]))
  const userTypeById = new Map((userTypesResult.data ?? []).map((t) => [t.id, t]))

  const roleBySlug = new Map<string, ProjectTeamRole>(
    Object.entries(PROJECT_ROLE_SLUG).map(([label, slug]) => [slug, label as ProjectTeamRole]),
  )
  const userTypeBySlug = new Map<string, ProjectUserType>(
    Object.entries(USER_TYPE_SLUG).map(([label, slug]) => [slug, label as ProjectUserType]),
  )

  const sorted = [...members].sort(
    (a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime(),
  )

  const seen = new Set<string>()
  const result: AvailableTeamMember[] = []

  for (const member of sorted) {
    if (seen.has(member.user_id)) continue
    seen.add(member.user_id)

    const profile = profileById.get(member.user_id)
    if (!profile) continue

    const roleRow = roleById.get(member.role_id)
    const userTypeRow = userTypeById.get(member.user_type_id)

    const role: ProjectTeamRole = roleBySlug.get(roleRow?.slug ?? "") ?? "Residente"
    const userType: ProjectUserType = userTypeBySlug.get(userTypeRow?.slug ?? "") ?? "Operador"

    result.push({
      id: member.user_id,
      firstName: profile.first_name || "",
      lastName: profile.last_name || "",
      email: profile.email,
      roleTitle: roleRow?.label ?? role,
      userType,
      role,
      avatarUrl: profile.avatar_url ?? null,
    })
  }

  return result
}

export async function saveProjectDraft(input: {
  draft: CreateProjectDraft
  phase: "stage" | "wizard"
  activeStepId: CreateProjectStepId
  projectId?: string | null
}): Promise<SaveProjectDraftResult> {
  const userId = await requireAuthenticatedUserId()
  const supabase = await createClient()
  const storedDraft = serializeSetupDraft({
    draft: input.draft,
    phase: input.phase,
    activeStepId: input.activeStepId,
  })

  let projectId = input.projectId?.trim() || null
  let companyId = input.draft.companyId

  if (projectId) {
    const access = await assertDraftProjectAccess(supabase, userId, projectId)
    if (!access.ok) {
      return { ok: false, error: access.error }
    }

    if (!companyId && access.project.company_id) {
      companyId = access.project.company_id
    }

    const { error: updateError } = await supabase
      .from("projects")
      .update({
        ...getProjectFieldUpdates(input.draft),
        company_id: companyId,
        setup_draft: storedDraft,
      })
      .eq("id", projectId)

    if (updateError) {
      return { ok: false, error: updateError.message }
    }

    return { ok: true, projectId, companyId: companyId! }
  }

  const companyResult = await resolveProjectCompanyId(supabase, userId, {
    ...input.draft,
    companyId,
  })
  if (!companyResult.ok) {
    return { ok: false, error: companyResult.error }
  }

  companyId = companyResult.companyId

  const { data: project, error: insertError } = await supabase
    .from("projects")
    .insert({
      ...getProjectFieldUpdates(input.draft),
      status: "draft",
      company_id: companyId,
      created_by: userId,
      setup_draft: storedDraft,
    })
    .select("id")
    .single()

  if (insertError || !project) {
    return { ok: false, error: insertError?.message ?? "No se pudo guardar el borrador." }
  }

  const savedProjectId = project.id

  const membershipResult = await ensureProjectCreatorMembership(
    supabase,
    userId,
    savedProjectId,
    companyId,
  )
  if (!membershipResult.ok) {
    await supabase.from("projects").delete().eq("id", savedProjectId)
    return { ok: false, error: membershipResult.error }
  }

  return { ok: true, projectId: savedProjectId, companyId }
}

export async function loadProjectDraft(
  projectId: string,
): Promise<LoadProjectDraftResult> {
  const userId = await requireAuthenticatedUserId()
  const supabase = await createClient()
  const id = projectId.trim()

  const access = await assertDraftProjectAccess(supabase, userId, id)
  if (!access.ok) {
    return { ok: false, error: access.error }
  }

  const { data: project, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      setup_draft,
      cover_url,
      company_id,
      name,
      location,
      start_date,
      end_date,
      total_surface_m2,
      building_type,
      companies ( name )
    `,
    )
    .eq("id", id)
    .maybeSingle()

  if (error || !project) {
    return { ok: false, error: "No se pudo cargar el borrador." }
  }

  const companyRaw = project.companies as { name: string } | { name: string }[] | null
  const companyName = companyRaw
    ? Array.isArray(companyRaw)
      ? (companyRaw[0]?.name ?? null)
      : companyRaw.name
    : null

  const { draft: dbDraft, hasDbFloors, hasDbRubros, hasDbTeam } =
    await buildDraftFromProjectDb(id, {
      name: project.name,
      location: project.location,
      start_date: project.start_date,
      end_date: project.end_date,
      total_surface_m2: project.total_surface_m2,
      company_id: project.company_id,
      building_type: project.building_type,
      companyName,
    })

  const merged = mergeProjectSetupDraft({
    setupDraft: project.setup_draft as StoredProjectSetupDraft | null,
    dbDraft,
    hasDbFloors,
    hasDbRubros,
    hasDbTeam,
  })

  return {
    ok: true,
    projectId: project.id,
    draft: merged.draft,
    phase: merged.phase,
    activeStepId: merged.activeStepId,
    coverUrl: project.cover_url,
  }
}

export async function createProjectFromDraft(
  draft: CreateProjectDraft,
  draftProjectId?: string | null,
): Promise<CreateProjectResult> {
  const name = draft.projectName.trim()
  if (!name) {
    return { ok: false, error: "El nombre del proyecto es obligatorio." }
  }

  const userId = await requireAuthenticatedUserId()
  const supabase = await createClient()
  const existingDraftId = draftProjectId?.trim() || null

  try {
    let resolvedProjectId: string
    let companyId = draft.companyId

    if (existingDraftId) {
      const access = await assertDraftProjectAccess(supabase, userId, existingDraftId)
      if (!access.ok) {
        return { ok: false, error: access.error }
      }

      if (!companyId && access.project.company_id) {
        companyId = access.project.company_id
      }

      const { error: updateError } = await supabase
        .from("projects")
        .update({
          ...getProjectFieldUpdates(draft),
          company_id: companyId,
          status: "active",
          setup_draft: null,
        })
        .eq("id", existingDraftId)

      if (updateError) {
        return { ok: false, error: updateError.message }
      }

      resolvedProjectId = existingDraftId
    } else {
      const companyResult = await resolveProjectCompanyId(supabase, userId, draft)
      if (!companyResult.ok) {
        return { ok: false, error: companyResult.error }
      }

      companyId = companyResult.companyId

      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          ...getProjectFieldUpdates(draft),
          status: "active",
          company_id: companyId,
          created_by: userId,
        })
        .select("id")
        .single()

      if (projectError || !project) {
        return {
          ok: false,
          error: projectError?.message ?? "No se pudo crear la obra.",
        }
      }

      resolvedProjectId = project.id

      const membershipResult = await ensureProjectCreatorMembership(
        supabase,
        userId,
        resolvedProjectId,
        companyId,
      )
      if (!membershipResult.ok) {
        throw new Error(membershipResult.error)
      }
    }

    const persistResult = await persistProjectFromDraft(
      supabase,
      userId,
      resolvedProjectId,
      draft,
    )

    if (!persistResult.ok) {
      if (!existingDraftId) {
        await supabase.from("projects").delete().eq("id", resolvedProjectId)
      }
      return { ok: false, error: persistResult.error }
    }

    return {
      ok: true,
      projectId: resolvedProjectId,
      unitIdByDraftId: persistResult.unitIdByDraftId,
    }
  } catch (cause) {
    const message =
      cause instanceof Error
        ? cause.message
        : "No se pudo crear la obra. Intentá de nuevo."

    return { ok: false, error: message }
  }
}

export async function getProjectSetupStatus(projectId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("projects")
    .select("status")
    .eq("id", projectId.trim())
    .maybeSingle()

  return data?.status ?? null
}
