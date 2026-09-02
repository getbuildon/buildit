import imageCompression from "browser-image-compression"

export const HIGH_QUALITY_IMAGE_COMPRESSION = {
  maxSizeMB: 4,
  maxWidthOrHeight: 2560,
  useWebWorker: true,
  fileType: "image/webp" as const,
  initialQuality: 0.93,
}

export const LIGHT_COMPRESSION_SKIP_BYTES = 800 * 1024

type CompressImageOptions = {
  maxSourceBytes: number
  maxOutputBytes: number
  sourceLimitLabel: string
  options?: typeof HIGH_QUALITY_IMAGE_COMPRESSION
  useWebWorker?: boolean
}

export async function compressImageHighQuality(
  file: File,
  input: CompressImageOptions,
): Promise<File> {
  if (file.size > input.maxSourceBytes) {
    throw new Error(`La imagen supera el límite de ${input.sourceLimitLabel}.`)
  }

  if (file.size <= LIGHT_COMPRESSION_SKIP_BYTES) {
    return file
  }

  const compression = {
    ...(input.options ?? HIGH_QUALITY_IMAGE_COMPRESSION),
    useWebWorker: input.useWebWorker ?? true,
  }

  try {
    const compressed = await imageCompression(file, compression)

    if (compressed.size > input.maxOutputBytes) {
      throw new Error(
        `La imagen "${file.name}" sigue siendo muy pesada después de comprimirla. Probá con otra foto.`,
      )
    }

    return compressed
  } catch (caught) {
    if (caught instanceof Error && caught.message.includes("sigue siendo muy pesada")) {
      throw caught
    }

    throw new Error(
      `No se pudo procesar esta imagen. Probá con un JPG o PNG de hasta ${input.sourceLimitLabel}.`,
    )
  }
}
