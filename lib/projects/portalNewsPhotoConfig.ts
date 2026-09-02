export const PROJECT_PORTAL_NEWS_BUCKET = "project-portal-news"

/** Tope post-compresión aceptado por el bucket (10 MB). */
export const MAX_PORTAL_NEWS_IMAGE_BYTES = 10 * 1024 * 1024

/** Tamaño máximo del archivo original antes de comprimir (10 MB). */
export const MAX_PORTAL_NEWS_SOURCE_BYTES = 10 * 1024 * 1024

export function buildPortalNewsStoragePath(projectId: string, newsId: string): string {
  return `${projectId}/news/${newsId}-${Date.now()}.webp`
}
