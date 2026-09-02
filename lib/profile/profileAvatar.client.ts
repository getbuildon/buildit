"use client"

import { createClient } from "@/utils/supabase/client"
import { compressImageHighQuality } from "@/lib/images/compressImage"
import {
  buildProfileAvatarStoragePath,
  MAX_PROFILE_AVATAR_BYTES,
  MAX_PROFILE_AVATAR_SOURCE_BYTES,
  PROFILE_AVATARS_BUCKET,
} from "@/lib/profile/profileAvatarConfig"

export async function compressProfileAvatar(file: File): Promise<File> {
  return compressImageHighQuality(file, {
    maxSourceBytes: MAX_PROFILE_AVATAR_SOURCE_BYTES,
    maxOutputBytes: MAX_PROFILE_AVATAR_BYTES,
    sourceLimitLabel: "10 MB",
  })
}

export async function uploadProfileAvatar(
  userId: string,
  file: File,
): Promise<{ ok: true; publicUrl: string } | { ok: false; error: string }> {
  const supabase = createClient()
  const storagePath = buildProfileAvatarStoragePath(userId)

  const { error: uploadError } = await supabase.storage
    .from(PROFILE_AVATARS_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      contentType: file.type || "image/webp",
      upsert: true,
    })

  if (uploadError) {
    return { ok: false, error: `No se pudo subir la imagen: ${uploadError.message}` }
  }

  const { data: publicUrlData } = supabase.storage
    .from(PROFILE_AVATARS_BUCKET)
    .getPublicUrl(storagePath)

  const publicUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", userId)

  if (updateError) {
    return { ok: false, error: `No se pudo guardar el avatar: ${updateError.message}` }
  }

  return { ok: true, publicUrl }
}
