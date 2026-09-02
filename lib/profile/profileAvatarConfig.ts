export const PROFILE_AVATARS_BUCKET = "profile-avatars"

export const MAX_PROFILE_AVATAR_BYTES = 10 * 1024 * 1024

export const MAX_PROFILE_AVATAR_SOURCE_BYTES = 10 * 1024 * 1024

export function buildProfileAvatarStoragePath(userId: string): string {
  return `${userId}/avatar.webp`
}
