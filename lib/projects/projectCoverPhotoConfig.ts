export const PROJECT_COVERS_BUCKET = "project-covers"

/** Tope post-compresión aceptado por el bucket (10 MB). */
export const MAX_PROJECT_COVER_BYTES = 10 * 1024 * 1024

/** Tamaño máximo del archivo original antes de comprimir (20 MB). */
export const MAX_PROJECT_COVER_SOURCE_BYTES = 20 * 1024 * 1024

export function buildProjectCoverStoragePath(projectId: string): string {
  return `${projectId}/cover.webp`
}
