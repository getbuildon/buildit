export const PROJECT_COVERS_BUCKET = "project-covers"

/** Tope post-compresión aceptado por el bucket (1 MB). */
export const MAX_PROJECT_COVER_BYTES = 1_048_576

/** Tamaño máximo del archivo original antes de comprimir (20 MB). */
export const MAX_PROJECT_COVER_SOURCE_BYTES = 20 * 1024 * 1024

export const PROJECT_COVER_COMPRESSION = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1600,
  useWebWorker: true,
  fileType: "image/webp" as const,
  initialQuality: 0.8,
}

export function buildProjectCoverStoragePath(projectId: string): string {
  return `${projectId}/cover.webp`
}
