import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { Button } from "../../atoms/button/Button"
import { ToastProvider, useToast } from "../toast/Toast"
import { Notice } from "./Notice"

const noticeRules = [
  { title: "En su lugar", body: "Arriba de lo que afecta: el aviso de avances pendientes, arriba de la lista." },
  { title: "Con salida", body: "Si se puede resolver, el aviso trae el botón: «Revisar avances»." },
  { title: "El de peligro interrumpe", body: "role=\"alert\": el lector de pantalla lo dice apenas aparece. Los demás esperan su turno." },
] as const

function NoticeDoc() {
  const [visible, setVisible] = useState(true)
  return (
    <FoundationDoc kicker="Moléculas" title="Notice" lede="Un aviso que se queda en la pantalla hasta que se resuelve.">
      <div className="flex max-w-reading flex-col gap-snug">
        <Notice tone="info" title="Nueva versión del plano">
          El plano de la unidad 4B se actualizó ayer.
        </Notice>
        <Notice tone="ok">El avance de octubre quedó certificado.</Notice>
        <Notice tone="caution" title="3 avances pendientes de revisión" action={<Button size="compact" variant="outline">Revisar avances</Button>}>
          Los cargó el equipo de obra esta semana.
        </Notice>
        <Notice tone="danger" title="No se pudo guardar">
          Revisá la conexión e intentá de nuevo.
        </Notice>
        {visible ? (
          <Notice tone="info" onDismiss={() => setVisible(false)}>
            Podés cerrar este aviso.
          </Notice>
        ) : null}
      </div>
      <DocSection title="Reglas">
        <DocRules rules={noticeRules} />
      </DocSection>
    </FoundationDoc>
  )
}

function ToastButtons() {
  const toast = useToast()
  return (
    <div className="flex flex-wrap gap-snug">
      <Button onClick={() => toast({ title: "Avance guardado", description: "Unidad 4B · Colocación de cerámicos" })}>Guardar avance</Button>
      <Button
        variant="outline"
        onClick={() => toast({ title: "Tarea archivada", tone: "info", action: { label: "Deshacer", onClick: () => toast({ title: "Tarea restaurada" }) } })}
      >
        Archivar (con deshacer)
      </Button>
      <Button variant="danger-quiet" onClick={() => toast({ title: "No se pudo guardar", description: "Revisá la conexión e intentá de nuevo.", tone: "danger" })}>
        Simular error
      </Button>
    </div>
  )
}

const toastRules = [
  { title: "Para lo que pasó recién", body: "«Avance guardado». Si hay que hacer algo, Notice en la pantalla." },
  { title: "Se pausa y se puede cerrar", body: "Con el mouse encima o con foco no se va; se cierra con la cruz o deslizando." },
  { title: "Deshacer mejor que confirmar", body: "Para acciones que se pueden revertir, un toast con «Deshacer» es más ágil que un diálogo." },
  { title: "Máximo tres", body: "Si llegan más, se van los más viejos." },
] as const

function ToastDoc() {
  return (
    <FoundationDoc kicker="Moléculas" title="Toast" lede="Un aviso que aparece arriba a la derecha y se va solo.">
      <ToastProvider>
        <ToastButtons />
      </ToastProvider>
      <DocSection title="Reglas">
        <DocRules rules={toastRules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Moléculas/Notice" } satisfies Meta

export default meta

export const Tonos: StoryObj = { render: () => <NoticeDoc /> }
export const ToastStory: StoryObj = { name: "Toast", render: () => <ToastDoc /> }
