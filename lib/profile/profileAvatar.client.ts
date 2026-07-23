"use client"

import imageCompression from "browser-image-compression"
import { createClient } from "@/utils/supabase/client"
import {
  buildProfileAvatarStoragePath,
  MAX_PROFILE_AVATAR_BYTES,
  MAX_PROFILE_AVATAR_SOURCE_BYTES,
  PROFILE_AVATAR_COMPRESSION,
  PROFILE_AVATARS_BUCKET,
} from "@/lib/profile/profileAvatarConfig"

export async function compressProfileAvatar(file: File): Promise<File> {
  if (file.size > MAX_PROFILE_AVATAR_SOURCE_BYTES) {
    throw new Error("La imagen supera el límite de 10 MB.")
  }

  const compressed = await imageCompression(file, PROFILE_AVATAR_COMPRESSION)

  if (compressed.size > MAX_PROFILE_AVATAR_BYTES) {
    throw new Error(
      "La imagen sigue siendo muy pesada después de comprimirla. Probá con otra foto.",
    )
  }

  return compressed
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
