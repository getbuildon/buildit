"use client"

import { createClient } from "@/utils/supabase/client"
import { compressImageHighQuality } from "@/lib/images/compressImage"
import {
  buildCompanyLogoStoragePath,
  COMPANY_LOGOS_BUCKET,
  MAX_COMPANY_LOGO_BYTES,
  MAX_COMPANY_LOGO_SOURCE_BYTES,
} from "@/lib/company/companyLogoConfig"

export type CompanyLogoDraft = {
  file: File
  previewUrl: string
}

export function revokeCompanyLogoPreview(draft: CompanyLogoDraft | null) {
  if (draft?.previewUrl) URL.revokeObjectURL(draft.previewUrl)
}

export async function compressCompanyLogo(file: File): Promise<File> {
  return compressImageHighQuality(file, {
    maxSourceBytes: MAX_COMPANY_LOGO_SOURCE_BYTES,
    maxOutputBytes: MAX_COMPANY_LOGO_BYTES,
    sourceLimitLabel: "10 MB",
  })
}

export async function uploadCompanyLogo(
  companyId: string,
  file: File,
): Promise<{ ok: true; publicUrl: string } | { ok: false; error: string }> {
  const supabase = createClient()
  const storagePath = buildCompanyLogoStoragePath(companyId)

  const { error: uploadError } = await supabase.storage
    .from(COMPANY_LOGOS_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      contentType: file.type || "image/webp",
      upsert: true,
    })

  if (uploadError) {
    return { ok: false, error: `No se pudo subir el logo: ${uploadError.message}` }
  }

  const { data: publicUrlData } = supabase.storage
    .from(COMPANY_LOGOS_BUCKET)
    .getPublicUrl(storagePath)

  return { ok: true, publicUrl: `${publicUrlData.publicUrl}?t=${Date.now()}` }
}
