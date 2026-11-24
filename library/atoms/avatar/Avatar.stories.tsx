import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocExamples, DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { Avatar } from "./Avatar"

const people = ["Lucía Fernández", "Martín Gómez", "Carla Ruiz", "Juan Pérez", "Sofía Díaz", "Tomás Herrera"]

const photo =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#d8d9db"/><circle cx="40" cy="32" r="14" fill="#777b84"/><rect x="16" y="52" width="48" height="30" rx="15" fill="#777b84"/></svg>',
  )

const rules = [
  { title: "Siempre el nombre", body: "name da el texto alternativo de la foto y las iniciales. Sin foto, el lector de pantalla igual dice quién es." },
  { title: "Un tono por persona", body: "El mismo nombre da siempre el mismo tono: se reconoce a la persona en toda la app." },
  { title: "Tres tamaños", body: "Hoy hay avatares de 31, 32, 40 y 64 px. Quedan 32, 40 y 48." },
] as const

function AvatarDoc() {
  return (
    <FoundationDoc kicker="Átomos" title="Avatar" lede="La foto de una persona o sus iniciales.">
      <DocSection title="Variantes">
        <DocExamples
          items={[
            {
              name: "sm · md · lg",
              note: "32, 40 y 48.",
              node: (
                <>
                  <Avatar name="Lucía Fernández" size="sm" />
                  <Avatar name="Lucía Fernández" />
                  <Avatar name="Lucía Fernández" size="lg" />
                </>
              ),
            },
            { name: "Con foto", node: <Avatar name="Martín Gómez" src={photo} size="lg" /> },
            {
              name: "Tonos por nombre",
              node: people.map((person) => <Avatar key={person} name={person} />),
            },
          ]}
        />
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Átomos/Avatar" } satisfies Meta

export default meta

export const Variantes: StoryObj = { render: () => <AvatarDoc /> }
