import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocExamples, DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { Label } from "../label/Label"
import { Switch } from "./Switch"

const rules = [
  { title: "Aplica al instante", body: "Prender o apagar sin Guardar: «Mostrar en el portal del cliente». Si hay que confirmar, Checkbox." },
  { title: "El label dice qué prende", body: "«Notificaciones por mail», no «Activado». El estado lo dice el interruptor." },
  { title: "Se ve apagado", body: "La pista apagada tiene contraste 3:1 contra el fondo: el control se distingue aunque esté apagado." },
] as const

function SwitchDoc() {
  return (
    <FoundationDoc kicker="Átomos" title="Switch" lede="Interruptor para algo que se prende o se apaga en el momento.">
      <DocSection title="Estados">
        <DocExamples
          items={[
            { name: "Apagado", node: <Switch aria-label="Ejemplo apagado" /> },
            { name: "Prendido", node: <Switch aria-label="Ejemplo prendido" defaultChecked /> },
            {
              name: "Deshabilitado",
              node: (
                <>
                  <Switch aria-label="Deshabilitado" disabled />
                  <Switch aria-label="Deshabilitado prendido" disabled defaultChecked />
                </>
              ),
            },
          ]}
        />
      </DocSection>
      <DocSection title="En contexto">
        <div className="flex max-w-dialog items-center justify-between gap-group rounded-surface border border-line bg-canvas-raised p-group">
          <div className="flex flex-col gap-related">
            <Label htmlFor="portal">Mostrar en el portal del cliente</Label>
            <p className="text-meta text-ink-muted">Los compradores ven este hito en su unidad.</p>
          </div>
          <Switch id="portal" defaultChecked />
        </div>
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Átomos/Switch" } satisfies Meta

export default meta

export const Estados: StoryObj = { render: () => <SwitchDoc /> }
