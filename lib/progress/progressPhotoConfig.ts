export const PROGRESS_PHOTOS_BUCKET = "progress-photos"

export const MAX_PHOTOS_PER_TASK = 8

/** Tope post-compresión aceptado por el bucket (10 MB). */
export const MAX_PROGRESS_PHOTO_BYTES = 10 * 1024 * 1024

export const MAX_PROGRESS_PHOTO_SOURCE_BYTES = 20 * 1024 * 1024

export function buildProgressPhotoStoragePath(
  projectId: string,
  batchId: string,
  photoId: string,
): string {
  return `${projectId}/progress/${batchId}/${photoId}.webp`
}
