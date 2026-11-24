import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { Input } from "../../atoms/input/Input"
import { Label } from "../../atoms/label/Label"
import { Switch } from "../../atoms/switch/Switch"
import { Field } from "../../molecules/field/Field"
import { FormActions, FormSection } from "./FormSection"

const initial = { name: "Grupo Alamo", cuit: "30-71234567-8", weather: true }

function Settings() {
  const [values, setValues] = useState(initial)
  const [saved, setSaved] = useState(initial)
  const [saving, setSaving] = useState(false)
  const dirty = JSON.stringify(values) !== JSON.stringify(saved)
  return (
    <div className="overflow-hidden rounded-surface border border-line bg-canvas">
      <div className="px-block">
        <FormSection title="Datos de la empresa" description="Aparecen en los reportes y en el portal de clientes.">
          <Field label="Nombre" required>
            <Input value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} />
          </Field>
          <Field label="CUIT" description="11 números, con o sin guiones.">
            <Input inputMode="numeric" value={values.cuit} onChange={(event) => setValues({ ...values, cuit: event.target.value })} />
          </Field>
        </FormSection>
        <FormSection title="Portal de clientes" description="Lo que ven los compradores de cada unidad.">
          <div className="flex items-center justify-between gap-group">
            <Label htmlFor="clima" variant="option">
              Mostrar el clima de la obra
            </Label>
            <Switch id="clima" checked={values.weather} onCheckedChange={(weather) => setValues({ ...values, weather })} />
          </div>
        </FormSection>
      </div>
      <FormActions
        dirty={dirty}
        saving={saving}
        onDiscard={() => setValues(saved)}
        onSave={() => {
          setSaving(true)
          setTimeout(() => {
            setSaved(values)
            setSaving(false)
          }, 700)
        }}
      />
    </div>
  )
}

const rules = [
  { title: "Explicación al lado", body: "Cada bloque dice para qué sirve: la persona entiende antes de tocar." },
  { title: "Guardar a la vista", body: "La barra queda fija abajo mientras hay cambios y avisa «Tenés cambios sin guardar»." },
  { title: "Descartar sin miedo", body: "Vuelve a lo último guardado." },
] as const

function FormSectionDoc() {
  return (
    <FoundationDoc kicker="Organismos" title="FormSection" lede="Pantallas de configuración. Cambiá un dato y mirá la barra de abajo.">
      <Settings />
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Organismos/FormSection" } satisfies Meta

export default meta

export const Configuracion: StoryObj = { name: "Configuración", render: () => <FormSectionDoc /> }
