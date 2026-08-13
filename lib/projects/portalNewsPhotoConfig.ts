export const PROJECT_PORTAL_NEWS_BUCKET = "project-portal-news"

/** Tope post-compresión aceptado por el bucket (10 MB). */
export const MAX_PORTAL_NEWS_IMAGE_BYTES = 10 * 1024 * 1024

/** Tamaño máximo del archivo original antes de comprimir (10 MB). */
export const MAX_PORTAL_NEWS_SOURCE_BYTES = 10 * 1024 * 1024

export const PORTAL_NEWS_IMAGE_COMPRESSION = {
  maxSizeMB: 2,
  maxWidthOrHeight: 1600,
  useWebWorker: true,
  fileType: "image/webp" as const,
  initialQuality: 0.85,
}

export function buildPortalNewsStoragePath(projectId: string, newsId: string): string {
  return `${projectId}/news/${newsId}.webp`
}
