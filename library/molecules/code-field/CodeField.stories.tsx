import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocExamples, DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { CodeField } from "./CodeField"

function Interactive({ error: initialError }: { error?: string }) {
  const [value, setValue] = useState("")
  const [error, setError] = useState(initialError)
  const [done, setDone] = useState<string>()
  return (
    <div className="flex flex-col gap-snug">
      <CodeField
        value={value}
        error={error}
        description="Probá pegar «123 456» o escribirlo: al completar se envía solo."
        onChange={(next) => {
          setValue(next)
          setError(undefined)
          setDone(undefined)
        }}
        onComplete={(code) => (code === "123456" ? setDone(code) : setError("El código no es correcto o ya venció. Revisalo o pedí otro."))}
      />
      {done ? <p className="text-body text-fn-ok">Código correcto: {done}</p> : null}
    </div>
  )
}

const rules = [
  { title: "Un casillero por dígito", body: "Como Slack, Stripe y Rootsy: el código se lee de un vistazo y se nota cuánto falta. Seis dígitos van en dos grupos de tres." },
  { title: "Pegar y autocompletar", body: "Pegar el código entero lo reparte. En el celular, el primer casillero ofrece el código del mail (one-time-code)." },
  { title: "Se envía solo", body: "Al completar el último dígito se verifica sin tocar el botón; el botón queda para quien lo prefiera." },
  { title: "El error dice qué hacer", body: "«Revisalo o pedí otro», con los casilleros marcados. Al volver a escribir, el error se va." },
] as const

function CodeFieldDoc() {
  return (
    <FoundationDoc kicker="Moléculas" title="CodeField" lede="El código de verificación que llega por mail: recuperar la contraseña, confirmar un correo.">
      <DocSection title="Estados">
        <DocExamples
          items={[
            { name: "Vacío", node: <CodeField value="" onChange={() => {}} /> },
            { name: "A medio escribir", node: <CodeField value="482" onChange={() => {}} /> },
            { name: "Con error", node: <CodeField value="482913" error="El código no es correcto o ya venció. Revisalo o pedí otro." onChange={() => {}} /> },
            { name: "Verificando", node: <CodeField value="482913" disabled onChange={() => {}} /> },
          ]}
        />
      </DocSection>
      <DocSection title="Probalo" lede="El código correcto es 123456.">
        <Interactive />
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Moléculas/CodeField" } satisfies Meta

export default meta

export const Estados: StoryObj = { render: () => <CodeFieldDoc /> }
