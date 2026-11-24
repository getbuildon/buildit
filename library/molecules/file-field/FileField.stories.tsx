import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { Field } from "../field/Field"
import { FileField, type FileItem } from "./FileField"

function Photos() {
  const [files, setFiles] = useState<FileItem[]>([])
  return (
    <Field label="Fotos del avance" optional className="max-w-reading">
      <FileField
        files={files}
        accept="image/*"
        acceptLabel="JPG, PNG o HEIC"
        multiple
        maxFiles={4}
        maxSizeMB={10}
        capture="environment"
        onAdd={(added) => {
          const items = added.map((file) => ({
            id: `${file.name}-${file.lastModified}`,
            name: file.name,
            previewUrl: URL.createObjectURL(file),
            status: "uploading" as const,
          }))
          setFiles((current) => [...current, ...items])
          // Simula la subida: quien usa el campo comprime y sube.
          setTimeout(() => {
            setFiles((current) => current.map((item) => (items.some((added) => added.id === item.id) ? { ...item, status: "done" } : item)))
          }, 1200)
        }}
        onRemove={(id) => setFiles((current) => current.filter((item) => item.id !== id))}
      />
    </Field>
  )
}

function Plan() {
  const [files, setFiles] = useState<FileItem[]>([{ id: "plano", name: "plano-4B.pdf", status: "done" }])
  return (
    <Field label="Plano de la unidad" className="max-w-reading">
      <FileField
        files={files}
        accept=".pdf,image/*"
        acceptLabel="PDF o imagen"
        maxSizeMB={20}
        onAdd={(added) => setFiles(added.map((file) => ({ id: file.name, name: file.name, status: "done" })))}
        onRemove={(id) => setFiles((current) => current.filter((item) => item.id !== id))}
      />
    </Field>
  )
}

const rules = [
  { title: "Una sola forma de subir", body: "Hoy hay 6 componentes de subida distintos, cada uno con su vista previa y su arrastre." },
  { title: "Validar antes de subir", body: "Tipo, tamaño y cantidad, con mensajes que dicen qué archivo y por qué." },
  { title: "La lógica, afuera", body: "Comprimir fotos y subirlas lo hace quien usa el campo: FileField avisa qué archivos llegaron y muestra el estado de cada uno." },
  { title: "Cámara en el celular", body: "capture=\"environment\" abre la cámara de atrás directo: ideal para fotos de avance en obra." },
  { title: "Botón, no un área muda", body: "El área de arrastre lleva un botón real: se llega con Tab y el lector de pantalla lo anuncia con sus límites." },
] as const

function FileFieldDoc() {
  return (
    <FoundationDoc kicker="Moléculas" title="FileField" lede="Subir archivos: fotos de avance, planos, logos. Elegí o arrastrá una imagen.">
      <DocSection title="Fotos (varias)">
        <Photos />
      </DocSection>
      <DocSection title="Un archivo">
        <Plan />
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Moléculas/FileField" } satisfies Meta

export default meta

export const Ejemplos: StoryObj = { render: () => <FileFieldDoc /> }
