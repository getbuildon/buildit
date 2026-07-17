"use client"

import type { CargarAvanceTaskDraft } from "@/lib/projects/cargarAvance"
import type { RegisterProgressAttachmentInput } from "@/app/[projectId]/trabajo-diario/actions"
import {
  uploadProgressPhotosWithLimit,
  type UploadedProgressPhoto,
} from "@/lib/progress/progressPhotos.client"

export async function buildAttachmentsForTaskPhotos(input: {
  projectId: string
  batchId: string
  entriesByTaskId: Map<string, string[]>
  taskDrafts: Record<string, CargarAvanceTaskDraft>
  onUploadProgress?: (completed: number, total: number) => void
}): Promise<
  | { ok: true; attachments: RegisterProgressAttachmentInput[] }
  | { ok: false; error: string }
> {
  const attachments: RegisterProgressAttachmentInput[] = []
  let totalPhotos = 0
  let uploadedPhotos = 0

  for (const [, draft] of Object.entries(input.taskDrafts)) {
    totalPhotos += draft.photos.length
  }

  for (const [taskId, draft] of Object.entries(input.taskDrafts)) {
    if (draft.photos.length === 0) continue

    const entryIds = input.entriesByTaskId.get(taskId) ?? []
    if (entryIds.length === 0) continue

    const uploadResult = await uploadProgressPhotosWithLimit(
      input.projectId,
      input.batchId,
      draft.photos.map((photo) => photo.file),
      (completed, total) => {
        input.onUploadProgress?.(uploadedPhotos + completed, totalPhotos)
      },
    )

    if (!uploadResult.ok) return uploadResult

    uploadedPhotos += draft.photos.length
    input.onUploadProgress?.(uploadedPhotos, totalPhotos)

    for (const entryId of entryIds) {
      for (const upload of uploadResult.uploads) {
        attachments.push(mapUploadToAttachment(entryId, upload))
      }
    }
  }

  return { ok: true, attachments }
}

export async function buildAttachmentsForSingleEntry(input: {
  projectId: string
  batchId: string
  entryId: string
  photos: File[]
  onUploadProgress?: (completed: number, total: number) => void
}): Promise<
  | { ok: true; attachments: RegisterProgressAttachmentInput[] }
  | { ok: false; error: string }
> {
  if (input.photos.length === 0) return { ok: true, attachments: [] }

  const uploadResult = await uploadProgressPhotosWithLimit(
    input.projectId,
    input.batchId,
    input.photos,
    input.onUploadProgress,
  )

  if (!uploadResult.ok) return uploadResult

  return {
    ok: true,
    attachments: uploadResult.uploads.map((upload) =>
      mapUploadToAttachment(input.entryId, upload),
    ),
  }
}

function mapUploadToAttachment(
  entryId: string,
  upload: UploadedProgressPhoto,
): RegisterProgressAttachmentInput {
  return {
    entryId,
    storagePath: upload.storagePath,
    fileName: upload.fileName,
    fileType: upload.fileType,
    fileSize: upload.fileSize,
  }
}
