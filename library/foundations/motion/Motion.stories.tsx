import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocRules, DocSection, FoundationDoc, TokenTable } from "../docs/FoundationDoc"

const durations = [
  { id: "fast", ms: 150, uses: "Press, hover." },
  { id: "base", ms: 200, uses: "Fade, cambio de color." },
  { id: "slow", ms: 300, uses: "Entrar, abrir un panel." },
] as const

const curves = [
  { token: "--ease-standard · ease-standard", title: "Estándar", uses: "Lo que cambia en el lugar: color, tamaño." },
  { token: "--ease-emphasized · ease-emphasized", title: "Enfática", uses: "Lo que entra: diálogos, paneles, toasts." },
] as const

const rules = [
  { title: "Tres tiempos", body: "Hoy hay 150, 200, 300 y 700 ms con cuatro curvas distintas. Se pide duration-(--duration-base), no un número." },
  { title: "Reduced-motion apaga", body: "Si la persona pidió menos movimiento en su sistema, los tiempos van a 0 y nada se desplaza." },
  { title: "El movimiento explica", body: "Se anima lo que entra, sale o cambia de estado. No se anima para decorar." },
] as const

function Bar({ duration }: { duration: string }) {
  const [on, setOn] = useState(false)
  return (
    <button
      type="button"
      onClick={() => setOn((value) => !value)}
      className="focus-ring relative h-control w-40 overflow-hidden rounded-control border border-line bg-canvas-sunken"
      aria-label="Reproducir"
    >
      <span
        className="absolute inset-y-related left-related w-avatar-sm rounded-compact bg-action ease-emphasized"
        style={{ transform: on ? "translateX(5.5rem)" : "none", transitionProperty: "transform", transitionDuration: `var(${duration})` }}
      />
    </button>
  )
}

function MotionRoles() {
  const [key, setKey] = useState(0)
  return (
    <FoundationDoc title="Motion" lede="Tiempo y curva. Tocá cada barra para verla.">
      <DocSection title="Tiempos">
        <TokenTable
          sampleWidth="w-44"
          rows={durations.map((d) => ({
            token: `--duration-${d.id}`,
            title: `${d.id} · ${d.ms} ms`,
            uses: d.uses,
            sample: <Bar duration={`--duration-${d.id}`} />,
          }))}
        />
      </DocSection>
      <DocSection title="Curvas">
        <TokenTable rows={curves} />
      </DocSection>
      <DocSection title="Entrar" lede="animate-enter: sube 8px y aparece. Es la entrada de títulos y paneles.">
        <div className="flex items-center gap-group">
          <button type="button" onClick={() => setKey((k) => k + 1)} className="focus-ring motion-press h-control rounded-control border border-line bg-canvas-raised px-group text-label">
            Repetir
          </button>
          <p key={key} className="animate-enter text-heading">
            Avance actualizado
          </p>
        </div>
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Foundations/Motion" } satisfies Meta

export default meta

export const Roles: StoryObj = { render: () => <MotionRoles /> }
