"use client"

import imageCompression from "browser-image-compression"
import { createClient } from "@/utils/supabase/client"
import {
  buildPortalNewsStoragePath,
  MAX_PORTAL_NEWS_IMAGE_BYTES,
  MAX_PORTAL_NEWS_SOURCE_BYTES,
  PORTAL_NEWS_IMAGE_COMPRESSION,
  PROJECT_PORTAL_NEWS_BUCKET,
} from "@/lib/projects/portalNewsPhotoConfig"

export type PortalNewsImageDraft = {
  file: File
  previewUrl: string
  fileName: string
  fileSize: number
  fileType: string
}

export function revokePortalNewsPreview(draft: PortalNewsImageDraft | null) {
  if (draft?.previewUrl) URL.revokeObjectURL(draft.previewUrl)
}

export async function compressPortalNewsImage(file: File): Promise<File> {
  if (file.size > MAX_PORTAL_NEWS_SOURCE_BYTES) {
    throw new Error("La imagen supera el límite de 10 MB.")
  }

  if (file.size <= MAX_PORTAL_NEWS_IMAGE_BYTES / 2) {
    return file
  }

  const compressed = await imageCompression(file, PORTAL_NEWS_IMAGE_COMPRESSION)

  if (compressed.size > MAX_PORTAL_NEWS_IMAGE_BYTES) {
    throw new Error(
      `La imagen "${file.name}" sigue siendo muy pesada después de comprimirla. Probá con otra foto.`,
    )
  }

  return compressed
}

export async function uploadPortalNewsImage(
  projectId: string,
  newsId: string,
  file: File,
): Promise<{ ok: true; publicUrl: string } | { ok: false; error: string }> {
  const supabase = createClient()
  const storagePath = buildPortalNewsStoragePath(projectId, newsId)

  const { error: uploadError } = await supabase.storage
    .from(PROJECT_PORTAL_NEWS_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      contentType: file.type || "image/webp",
      upsert: true,
    })

  if (uploadError) {
    return { ok: false, error: `No se pudo subir la imagen: ${uploadError.message}` }
  }

  const { data: publicUrlData } = supabase.storage
    .from(PROJECT_PORTAL_NEWS_BUCKET)
    .getPublicUrl(storagePath)

  return { ok: true, publicUrl: publicUrlData.publicUrl }
}
