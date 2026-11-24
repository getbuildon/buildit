import type { Meta, StoryObj } from "@storybook/react-vite"
import { Copy, Ellipsis, Pencil, SlidersHorizontal, Trash2, UserPlus } from "lucide-react"
import { DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { Button } from "../../atoms/button/Button"
import { Checkbox } from "../../atoms/checkbox/Checkbox"
import { IconButton } from "../../atoms/button/IconButton"
import { Label } from "../../atoms/label/Label"
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "../popover/Popover"
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from "./Menu"

const menuRules = [
  { title: "Acciones, no navegación", body: "Editar, duplicar, borrar. Para ir a otra pantalla, links." },
  { title: "Lo peligroso, al final y en rojo", body: "Separado del resto y con tone=\"danger\". Si no se deshace, abre un ConfirmDialog." },
  { title: "El disparador tiene nombre", body: "Los «tres puntitos» son un IconButton con label: «Opciones de la unidad 4B»." },
] as const

function MenuDoc() {
  return (
    <FoundationDoc kicker="Moléculas" title="Menu" lede="Las acciones de una fila o de una card. Abrilo con Enter y recorrelo con las flechas.">
      <DocSection title="Ejemplo">
        <div className="flex items-center justify-between gap-group rounded-surface border border-line bg-canvas-raised p-group sm:max-w-dialog">
          <div className="flex flex-col gap-related">
            <p className="text-label">Unidad 4B</p>
            <p className="text-meta text-ink-muted">Piso 4 · 68 m²</p>
          </div>
          <Menu>
            <MenuTrigger asChild>
              <IconButton icon={Ellipsis} label="Opciones de la unidad 4B" tooltip={false} />
            </MenuTrigger>
            <MenuContent>
              <MenuLabel>Unidad 4B</MenuLabel>
              <MenuItem icon={Pencil}>Editar</MenuItem>
              <MenuItem icon={Copy}>Duplicar</MenuItem>
              <MenuItem icon={UserPlus}>Asignar cliente</MenuItem>
              <MenuItem icon={UserPlus} disabled>
                Transferir (sin cliente)
              </MenuItem>
              <MenuSeparator />
              <MenuItem icon={Trash2} tone="danger">
                Borrar
              </MenuItem>
            </MenuContent>
          </Menu>
        </div>
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={menuRules} />
      </DocSection>
    </FoundationDoc>
  )
}

const popoverRules = [
  { title: "Contenido que se toca", body: "Filtros, un formulario de dos campos, una ayuda con link. Si es una frase, Tooltip." },
  { title: "No bloquea", body: "Se cierra tocando afuera o con Escape. Si hay que terminarlo sí o sí, Dialog." },
] as const

function PopoverDoc() {
  return (
    <FoundationDoc kicker="Moléculas" title="Popover" lede="Un panel flotante con contenido que se puede tocar.">
      <DocSection title="Ejemplo: filtros">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <SlidersHorizontal className="size-icon-sm" aria-hidden /> Filtros
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="flex flex-col gap-group">
            <p className="text-section">Mostrar unidades</p>
            {["Con avance pendiente", "Con cliente asignado", "Terminadas"].map((item, index) => (
              <div key={item} className="flex items-center gap-compact">
                <Checkbox id={`f${index}`} defaultChecked={index === 0} />
                <Label htmlFor={`f${index}`} variant="option">
                  {item}
                </Label>
              </div>
            ))}
            <div className="flex justify-end gap-snug">
              <PopoverClose asChild>
                <Button variant="ghost" size="compact">
                  Limpiar
                </Button>
              </PopoverClose>
              <PopoverClose asChild>
                <Button size="compact">Aplicar</Button>
              </PopoverClose>
            </div>
          </PopoverContent>
        </Popover>
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={popoverRules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Moléculas/Menu" } satisfies Meta

export default meta

export const Acciones: StoryObj = { render: () => <MenuDoc /> }
export const PopoverStory: StoryObj = { name: "Popover", render: () => <PopoverDoc /> }
