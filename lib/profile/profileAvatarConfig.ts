export const PROFILE_AVATARS_BUCKET = "profile-avatars"

export const MAX_PROFILE_AVATAR_BYTES = 524_288

export const MAX_PROFILE_AVATAR_SOURCE_BYTES = 10 * 1024 * 1024

export const PROFILE_AVATAR_COMPRESSION = {
  maxSizeMB: 0.25,
  maxWidthOrHeight: 512,
  useWebWorker: true,
  fileType: "image/webp" as const,
  initialQuality: 0.82,
}

export function buildProfileAvatarStoragePath(userId: string): string {
  return `${userId}/avatar.webp`
}
