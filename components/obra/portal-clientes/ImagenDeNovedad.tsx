"use client"

import { useState } from "react"

import { Field } from "@/library/molecules/field/Field"
import { FileField, type FileItem } from "@/library/molecules/file-field/FileField"

import {
  compressPortalNewsImage,
  revokePortalNewsPreview,
  type PortalNewsImageDraft,
} from "@/lib/projects/portalNewsPhoto.client"

/** Además de image/*, por extensión: hay navegadores que mandan las HEIC sin tipo. */
const TIPOS_ACEPTADOS = "image/*,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif"

/**
 * La imagen de una novedad: una sola, obligatoria. Se comprime al elegirla (como antes)
 * y recién se sube al guardar. Quitarla borra tanto la nueva como la que ya estaba guardada.
 */
export function ImagenDeNovedad({
  borrador,
  imagenGuardada,
  error,
  alElegir,
  alQuitar,
}: {
  borrador: PortalNewsImageDraft | null
  /** La URL que ya está en el portal (null si no tiene o si se quitó). */
  imagenGuardada: string | null
  /** Error que viene de afuera: falta la imagen o no se pudo subir. */
  error?: string
  alElegir: (borrador: PortalNewsImageDraft) => void
  alQuitar: () => void
}) {
  const [procesando, setProcesando] = useState(false)
  const [errorPropio, setErrorPropio] = useState<string | null>(null)

  const elegir = async (archivo: File | undefined) => {
    if (!archivo || procesando) return
    setErrorPropio(null)
    setProcesando(true)
    try {
      const comprimida = await compressPortalNewsImage(archivo)
      revokePortalNewsPreview(borrador)
      alElegir({
        file: comprimida,
        previewUrl: URL.createObjectURL(comprimida),
        fileName: archivo.name,
        fileSize: comprimida.size,
        fileType: comprimida.type || "image/webp",
      })
    } catch (caught) {
      setErrorPropio(caught instanceof Error ? caught.message : "No se pudo procesar la imagen.")
    } finally {
      setProcesando(false)
    }
  }

  const vistaPrevia = borrador?.previewUrl ?? imagenGuardada
  const archivos: FileItem[] = procesando
    ? [{ id: "procesando", name: "Procesando imagen…", status: "uploading" }]
    : vistaPrevia
      ? [{ id: "imagen", name: borrador?.fileName ?? "Imagen de la novedad", previewUrl: vistaPrevia }]
      : []

  return (
    <Field label="Imagen" required error={errorPropio ?? error} className="sm:w-60 sm:shrink-0">
      <FileField
        files={archivos}
        onAdd={(elegidos) => void elegir(elegidos[0])}
        onRemove={() => {
          if (procesando) return
          revokePortalNewsPreview(borrador)
          setErrorPropio(null)
          alQuitar()
        }}
        accept={TIPOS_ACEPTADOS}
        acceptLabel="JPG, PNG, WebP o HEIC"
        maxSizeMB={10}
        maxFiles={1}
        disabled={procesando}
        className="[&_ul]:grid-cols-1 [&_ul]:sm:grid-cols-1"
      />
    </Field>
  )
}
