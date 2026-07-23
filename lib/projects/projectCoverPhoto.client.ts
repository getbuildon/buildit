"use client"

import imageCompression from "browser-image-compression"
import { createClient } from "@/utils/supabase/client"
import {
  buildProjectCoverStoragePath,
  MAX_PROJECT_COVER_BYTES,
  MAX_PROJECT_COVER_SOURCE_BYTES,
  PROJECT_COVER_COMPRESSION,
  PROJECT_COVERS_BUCKET,
} from "@/lib/projects/projectCoverPhotoConfig"

export type ProjectCoverImageDraft = {
  file: File
  previewUrl: string
  fileName: string
  fileSize: number
  fileType: string
}

export function revokeProjectCoverPreview(draft: ProjectCoverImageDraft | null) {
  if (draft?.previewUrl) URL.revokeObjectURL(draft.previewUrl)
}

export async function compressProjectCoverPhoto(file: File): Promise<File> {
  if (file.size > MAX_PROJECT_COVER_SOURCE_BYTES) {
    throw new Error("La imagen supera el límite de 20 MB.")
  }

  const compressed = await imageCompression(file, PROJECT_COVER_COMPRESSION)

  if (compressed.size > MAX_PROJECT_COVER_BYTES) {
    throw new Error(
      `La imagen "${file.name}" sigue siendo muy pesada después de comprimirla. Probá con otra foto.`,
    )
  }

  return compressed
}

export async function uploadProjectCoverPhoto(
  projectId: string,
  file: File,
): Promise<{ ok: true; publicUrl: string } | { ok: false; error: string }> {
  const supabase = createClient()
  const storagePath = buildProjectCoverStoragePath(projectId)

  const { error: uploadError } = await supabase.storage
    .from(PROJECT_COVERS_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      contentType: file.type || "image/webp",
      upsert: true,
    })

  if (uploadError) {
    return { ok: false, error: `No se pudo subir la imagen: ${uploadError.message}` }
  }

  const { data: publicUrlData } = supabase.storage
    .from(PROJECT_COVERS_BUCKET)
    .getPublicUrl(storagePath)

  const publicUrl = publicUrlData.publicUrl

  const { error: updateError } = await supabase
    .from("projects")
    .update({
      image_url: publicUrl,
      cover_url: publicUrl,
    })
    .eq("id", projectId)

  if (updateError) {
    return { ok: false, error: `No se pudo guardar la imagen del proyecto: ${updateError.message}` }
  }

  return { ok: true, publicUrl }
}
