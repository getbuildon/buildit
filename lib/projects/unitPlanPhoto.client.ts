"use client"

import { createClient } from "@/utils/supabase/client"
import type { UnitRenderImageDraft as DraftUnitRenderImage } from "@/lib/projects/createProjectDraft"
import {
  compressProjectCoverPhoto,
  revokeProjectCoverPreview,
} from "@/lib/projects/projectCoverPhoto.client"
import {
  buildUnitPlanStoragePath,
  buildUnitRenderStoragePath,
  UNIT_PLANS_BUCKET,
} from "@/lib/projects/unitPlanPhotoConfig"

export type UnitRenderImageDraft = DraftUnitRenderImage

export { compressProjectCoverPhoto as compressUnitPlanPhoto, revokeProjectCoverPreview as revokeUnitRenderPreview }

type UploadResult = { ok: true; publicUrl: string } | { ok: false; error: string }

async function uploadUnitAsset(
  projectId: string,
  unitId: string,
  file: File,
  storagePath: string,
  dbColumn: "plan_url" | "render_url",
): Promise<UploadResult> {
  const supabase = createClient()

  const { error: uploadError } = await supabase.storage
    .from(UNIT_PLANS_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      contentType: file.type || "image/webp",
      upsert: true,
    })

  if (uploadError) {
    return { ok: false, error: `No se pudo subir el archivo: ${uploadError.message}` }
  }

  const { data: publicUrlData } = supabase.storage
    .from(UNIT_PLANS_BUCKET)
    .getPublicUrl(storagePath)

  const publicUrl = publicUrlData.publicUrl

  const { error: updateError } = await supabase
    .from("project_units")
    .update({ [dbColumn]: publicUrl })
    .eq("id", unitId)
    .eq("project_id", projectId)

  if (updateError) {
    return { ok: false, error: `No se pudo guardar el archivo de la unidad: ${updateError.message}` }
  }

  return { ok: true, publicUrl }
}

export async function uploadUnitPlanPhoto(
  projectId: string,
  unitId: string,
  file: File,
): Promise<UploadResult> {
  return uploadUnitAsset(
    projectId,
    unitId,
    file,
    buildUnitPlanStoragePath(projectId, unitId),
    "plan_url",
  )
}

export async function uploadUnitRenderPhoto(
  projectId: string,
  unitId: string,
  file: File,
): Promise<UploadResult> {
  return uploadUnitAsset(
    projectId,
    unitId,
    file,
    buildUnitRenderStoragePath(projectId, unitId),
    "render_url",
  )
}

async function clearUnitAsset(
  projectId: string,
  unitId: string,
  storagePath: string,
  dbColumn: "plan_url" | "render_url",
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient()

  const { error: removeError } = await supabase.storage
    .from(UNIT_PLANS_BUCKET)
    .remove([storagePath])

  if (removeError) {
    return { ok: false, error: `No se pudo eliminar el archivo: ${removeError.message}` }
  }

  const { error: updateError } = await supabase
    .from("project_units")
    .update({ [dbColumn]: null })
    .eq("id", unitId)
    .eq("project_id", projectId)

  if (updateError) {
    return { ok: false, error: `No se pudo quitar el archivo de la unidad: ${updateError.message}` }
  }

  return { ok: true }
}

export async function clearUnitPlanPhoto(
  projectId: string,
  unitId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return clearUnitAsset(
    projectId,
    unitId,
    buildUnitPlanStoragePath(projectId, unitId),
    "plan_url",
  )
}

export async function clearUnitRenderPhoto(
  projectId: string,
  unitId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return clearUnitAsset(
    projectId,
    unitId,
    buildUnitRenderStoragePath(projectId, unitId),
    "render_url",
  )
}

type UnitAssetDraft = {
  id: string
  planImage: UnitRenderImageDraft | null
  renderImage: UnitRenderImageDraft | null
}

export async function uploadUnitAssetsFromDraft(
  projectId: string,
  draftUnitIdToDbId: Record<string, string>,
  units: UnitAssetDraft[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  for (const unit of units) {
    const dbUnitId = draftUnitIdToDbId[unit.id]
    if (!dbUnitId) continue

    if (unit.planImage) {
      const result = await uploadUnitPlanPhoto(projectId, dbUnitId, unit.planImage.file)
      if (!result.ok) return result
    }

    if (unit.renderImage) {
      const result = await uploadUnitRenderPhoto(projectId, dbUnitId, unit.renderImage.file)
      if (!result.ok) return result
    }
  }

  return { ok: true }
}

/** @deprecated Use uploadUnitAssetsFromDraft */
export async function uploadUnitPlanPhotosFromDraft(
  projectId: string,
  draftUnitIdToDbId: Record<string, string>,
  units: Array<{ id: string; renderImage: UnitRenderImageDraft | null }>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return uploadUnitAssetsFromDraft(
    projectId,
    draftUnitIdToDbId,
    units.map((unit) => ({
      id: unit.id,
      planImage: null,
      renderImage: unit.renderImage,
    })),
  )
}
