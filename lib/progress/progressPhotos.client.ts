"use client"

import imageCompression from "browser-image-compression"
import { createClient } from "@/utils/supabase/client"
import {
  buildProgressPhotoStoragePath,
  MAX_PROGRESS_PHOTO_BYTES,
  PROGRESS_PHOTO_COMPRESSION,
  PROGRESS_PHOTOS_BUCKET,
} from "@/lib/progress/progressPhotoConfig"

export type UploadedProgressPhoto = {
  photoId: string
  storagePath: string
  fileName: string
  fileType: string
  fileSize: number
}

export async function compressProgressPhoto(file: File): Promise<File> {
  const compressed = await imageCompression(file, PROGRESS_PHOTO_COMPRESSION)

  if (compressed.size > MAX_PROGRESS_PHOTO_BYTES) {
    throw new Error(
      `La imagen "${file.name}" sigue siendo muy pesada después de comprimirla. Probá con otra foto.`,
    )
  }

  return compressed
}

export async function uploadProgressPhotos(
  projectId: string,
  batchId: string,
  files: File[],
  onProgress?: (completed: number, total: number) => void,
): Promise<{ ok: true; uploads: UploadedProgressPhoto[] } | { ok: false; error: string }> {
  if (files.length === 0) return { ok: true, uploads: [] }

  const supabase = createClient()
  const uploads: UploadedProgressPhoto[] = []

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]
    const photoId = crypto.randomUUID()
    const storagePath = buildProgressPhotoStoragePath(projectId, batchId, photoId)

    const { error } = await supabase.storage.from(PROGRESS_PHOTOS_BUCKET).upload(storagePath, file, {
      cacheControl: "3600",
      contentType: file.type || "image/webp",
      upsert: false,
    })

    if (error) {
      return { ok: false, error: `No se pudo subir "${file.name}": ${error.message}` }
    }

    uploads.push({
      photoId,
      storagePath,
      fileName: file.name,
      fileType: file.type || "image/webp",
      fileSize: file.size,
    })

    onProgress?.(index + 1, files.length)
  }

  return { ok: true, uploads }
}

const UPLOAD_CONCURRENCY = 3

export async function uploadProgressPhotosWithLimit(
  projectId: string,
  batchId: string,
  files: File[],
  onProgress?: (completed: number, total: number) => void,
): Promise<{ ok: true; uploads: UploadedProgressPhoto[] } | { ok: false; error: string }> {
  if (files.length === 0) return { ok: true, uploads: [] }

  const uploads: UploadedProgressPhoto[] = []
  let completed = 0

  for (let offset = 0; offset < files.length; offset += UPLOAD_CONCURRENCY) {
    const chunk = files.slice(offset, offset + UPLOAD_CONCURRENCY)
    const result = await uploadProgressPhotos(projectId, batchId, chunk, (chunkCompleted) => {
      onProgress?.(completed + chunkCompleted, files.length)
    })

    if (!result.ok) return result
    uploads.push(...result.uploads)
    completed += chunk.length
    onProgress?.(completed, files.length)
  }

  return { ok: true, uploads }
}
