import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { Button } from "../../atoms/button/Button"
import { Input } from "../../atoms/input/Input"
import { Field } from "../../molecules/field/Field"
import { InputGroup } from "../../molecules/input-group/InputGroup"
import { Stepper, WizardFooter, type WizardStep } from "./Wizard"

const steps: WizardStep[] = [
  { id: "datos", label: "Datos de la obra", description: "Nombre y ubicación" },
  { id: "estructura", label: "Estructura", description: "Pisos y unidades" },
  { id: "rubros", label: "Rubros y tareas" },
  { id: "estado", label: "Estado inicial" },
  { id: "equipo", label: "Equipo" },
]

function CreateProject() {
  const [current, setCurrent] = useState(1)
  const [saving, setSaving] = useState(false)
  return (
    <div className="flex flex-col overflow-hidden rounded-surface border border-line bg-canvas md:flex-row">
      <aside className="border-b border-line p-group md:w-64 md:border-r md:border-b-0">
        <Stepper steps={steps} current={current} onStepClick={setCurrent} />
      </aside>
      <div className="flex min-h-96 flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-group p-block">
          <h2 className="text-heading">{steps[current].label}</h2>
          {current === 0 ? (
            <Field label="Nombre de la obra" required>
              <Input defaultValue="Torre Alamo" />
            </Field>
          ) : current === 1 ? (
            <>
              <Field label="Pisos" required>
                <Input inputMode="numeric" defaultValue="12" />
              </Field>
              <Field label="Superficie total">
                <InputGroup inputMode="decimal" end="m²" defaultValue="3.240" />
              </Field>
            </>
          ) : (
            <p className="text-body text-ink-muted">Contenido del paso «{steps[current].label}».</p>
          )}
        </div>
        <WizardFooter
          current={current}
          total={steps.length}
          finishLabel="Crear obra"
          loading={saving}
          secondary={<Button variant="ghost">Guardar borrador</Button>}
          onBack={() => setCurrent((value) => Math.max(0, value - 1))}
          onNext={() => {
            setSaving(true)
            setTimeout(() => {
              setSaving(false)
              setCurrent((value) => Math.min(steps.length - 1, value + 1))
            }, 500)
          }}
        />
      </div>
    </div>
  )
}

const rules = [
  { title: "Dónde estoy y cuánto falta", body: "La lista con estados en escritorio; «Paso 2 de 5» con barra en el celular." },
  { title: "Volver sí, saltear no", body: "Se puede tocar un paso hecho para corregirlo; los que faltan no se adelantan." },
  { title: "El último botón dice qué termina", body: "«Crear obra», no «Siguiente» ni «Finalizar»." },
  { title: "Borrador siempre a mano", body: "Un proceso largo se puede dejar a medias sin perder lo cargado." },
] as const

function WizardDoc() {
  return (
    <FoundationDoc kicker="Organismos" title="Wizard" lede="Un proceso en pasos: crear una obra. Probá Siguiente y volver a un paso hecho.">
      <CreateProject />
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Organismos/Wizard" } satisfies Meta

export default meta

export const CrearObra: StoryObj = { name: "Crear obra", render: () => <WizardDoc /> }
