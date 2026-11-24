import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Trash2 } from "lucide-react"
import { DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { Button } from "../../atoms/button/Button"
import { Input } from "../../atoms/input/Input"
import { ConfirmDialog } from "../confirm-dialog/ConfirmDialog"
import { Field } from "../field/Field"
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "./Dialog"

const dialogRules = [
  { title: "Con título siempre", body: "title es obligatorio: es lo que anuncia el lector de pantalla al abrir." },
  { title: "El foco no se escapa", body: "Tab recorre solo el diálogo; Escape lo cierra y el foco vuelve al botón que lo abrió." },
  { title: "En el celular, desde abajo", body: "Ocupa el ancho y sube desde el borde: se alcanza con el pulgar." },
  { title: "Cerrar de 44", body: "La cruz de hoy mide 20 px y esconde el foco. Esta es un IconButton: tocable de 44 y con foco visible." },
] as const

function DialogExample() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Nueva unidad</Button>
      </DialogTrigger>
      <DialogContent
        title="Nueva unidad"
        description="Se suma al piso elegido con las tareas de su tipología."
        footer={
          <>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button>Crear unidad</Button>
          </>
        }
      >
        <div className="flex flex-col gap-group">
          <Field label="Identificador" required>
            <Input placeholder="Ej.: 4B" />
          </Field>
          <Field label="Superficie" description="En m².">
            <Input inputMode="decimal" />
          </Field>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function LongDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Ver términos (largo)</Button>
      </DialogTrigger>
      <DialogContent title="Términos del plan" size="wide" footer={<DialogClose asChild><Button>Entendido</Button></DialogClose>}>
        <div className="flex flex-col gap-snug text-body text-ink-muted">
          {Array.from({ length: 14 }, (_, index) => (
            <p key={index}>
              {index + 1}. El plan incluye el seguimiento de avance por unidad, la certificación de tareas y el portal de clientes. El cuerpo
              scrollea; el título y el pie quedan fijos.
            </p>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DialogDoc() {
  return (
    <FoundationDoc kicker="Moléculas" title="Dialog" lede="Una tarea corta encima de la pantalla. Abrilo y probá Tab y Escape.">
      <DocSection title="Ejemplos">
        <div className="flex flex-wrap gap-snug">
          <DialogExample />
          <LongDialog />
        </div>
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={dialogRules} />
      </DocSection>
    </FoundationDoc>
  )
}

const confirmRules = [
  { title: "La pregunta es concreta", body: "«¿Borrar la unidad 4B?», no «¿Estás seguro?»." },
  { title: "El botón dice qué hace", body: "«Borrar unidad», no «Aceptar» ni «Sí»." },
  { title: "Arranca en Cancelar", body: "Un Enter apurado no borra nada. Tocar afuera no lo cierra." },
  { title: "Espera la respuesta", body: "Si onConfirm es async, muestra el spinner y no se cierra hasta que termina; si falla, queda abierto." },
] as const

function ConfirmDoc() {
  const [log, setLog] = useState("")
  return (
    <FoundationDoc kicker="Moléculas" title="ConfirmDialog" lede="Confirmar algo importante o que no se deshace. Reemplaza ConfirmActionDialog con la tinta y el foco correctos.">
      <DocSection title="Ejemplos">
        <div className="flex flex-wrap items-center gap-snug">
          <ConfirmDialog
            trigger={
              <Button variant="danger-quiet">
                <Trash2 className="size-icon-sm" aria-hidden /> Borrar unidad
              </Button>
            }
            tone="danger"
            title="¿Borrar la unidad 4B?"
            description="Se borran también sus 32 avances cargados. No se puede deshacer."
            confirmLabel="Borrar unidad"
            onConfirm={() => new Promise<void>((resolve) => setTimeout(() => (setLog("Unidad borrada."), resolve()), 1200))}
          />
          <ConfirmDialog
            trigger={<Button variant="outline">Certificar 12 tareas</Button>}
            title="¿Certificar 12 tareas?"
            description="Quedan certificadas con tu usuario y la fecha de hoy."
            confirmLabel="Certificar"
            onConfirm={() => setLog("Tareas certificadas.")}
          />
          {log ? <p role="status" className="text-meta text-fn-ok">{log}</p> : null}
        </div>
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={confirmRules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Moléculas/Dialog" } satisfies Meta

export default meta

export const Ejemplos: StoryObj = { render: () => <DialogDoc /> }
export const Confirmar: StoryObj = { name: "ConfirmDialog", render: () => <ConfirmDoc /> }
