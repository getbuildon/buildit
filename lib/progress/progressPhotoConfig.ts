export const PROGRESS_PHOTOS_BUCKET = "progress-photos"

export const MAX_PHOTOS_PER_TASK = 8

/** Tope post-compresión aceptado por el bucket (1 MB). */
export const MAX_PROGRESS_PHOTO_BYTES = 1_048_576

export const PROGRESS_PHOTO_COMPRESSION = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1600,
  useWebWorker: true,
  fileType: "image/webp" as const,
  initialQuality: 0.8,
}

export function buildProgressPhotoStoragePath(
  projectId: string,
  batchId: string,
  photoId: string,
): string {
  return `${projectId}/progress/${batchId}/${photoId}.webp`
}
