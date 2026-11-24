import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  Building2,
  ChartColumn,
  ClipboardCheck,
  Cog,
  CreditCard,
  FolderOpen,
  HardHat,
  LayoutDashboard,
  Menu as MenuIcon,
  Users,
} from "lucide-react"
import { DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { Avatar } from "../../atoms/avatar/Avatar"
import { IconButton } from "../../atoms/button/IconButton"
import { Icon } from "../../atoms/icon/Icon"
import { Sheet, SheetContent, SheetTrigger } from "../sheet/Sheet"
import { Sidebar, SidebarItem, SidebarSection } from "./Sidebar"

const projectItems = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "unidades", label: "Unidades", icon: Building2 },
  { id: "trabajo", label: "Trabajo diario", icon: HardHat, count: 3 },
  { id: "certificaciones", label: "Certificaciones", icon: ClipboardCheck },
  { id: "clientes", label: "Portal de clientes", icon: Users },
  { id: "archivos", label: "Archivos", icon: FolderOpen },
] as const

function ProjectHeader() {
  return (
    <div className="flex min-w-0 items-center gap-snug">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-action text-action-ink">
        <Icon icon={Building2} />
      </span>
      <div className="flex min-w-0 flex-col">
        <p className="truncate text-label">Torre Alamo</p>
        <p className="truncate text-meta text-ink-muted">Grupo Alamo</p>
      </div>
    </div>
  )
}

function UserFooter() {
  return (
    <div className="flex items-center gap-snug px-related">
      <Avatar name="Lucía Fernández" size="sm" />
      <div className="flex min-w-0 flex-col">
        <p className="truncate text-label">Lucía Fernández</p>
        <p className="truncate text-meta text-ink-muted">Dueña</p>
      </div>
    </div>
  )
}

function ProjectSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const [active, setActive] = useState("unidades")
  return (
    <Sidebar label="Secciones de la obra" header={<ProjectHeader />} footer={<UserFooter />}>
      <SidebarSection>
        {projectItems.map((item) => (
          <SidebarItem
            key={item.id}
            href={`#${item.id}`}
            icon={item.icon}
            active={active === item.id}
            count={"count" in item ? item.count : undefined}
            onClick={(event) => {
              event.preventDefault()
              setActive(item.id)
              onNavigate?.()
            }}
          >
            {item.label}
          </SidebarItem>
        ))}
      </SidebarSection>
      <SidebarSection title="Obra">
        <SidebarItem href="#config" icon={Cog} onClick={(event) => event.preventDefault()}>
          Configuración
        </SidebarItem>
      </SidebarSection>
    </Sidebar>
  )
}

function BackofficeSidebar() {
  const [active, setActive] = useState("dashboard")
  const items = [
    { id: "dashboard", label: "Dashboard", icon: ChartColumn },
    { id: "empresas", label: "Empresas", icon: Building2 },
    { id: "usuarios", label: "Usuarios", icon: Users },
    { id: "suscripciones", label: "Suscripciones", icon: CreditCard },
  ]
  return (
    <Sidebar
      tone="inverse"
      label="Secciones del backoffice"
      header={<p className="font-display text-heading">BuildOn</p>}
      footer={<UserFooter />}
    >
      <SidebarSection>
        {items.map((item) => (
          <SidebarItem
            key={item.id}
            href={`#${item.id}`}
            icon={item.icon}
            active={active === item.id}
            onClick={(event) => {
              event.preventDefault()
              setActive(item.id)
            }}
          >
            {item.label}
          </SidebarItem>
        ))}
      </SidebarSection>
    </Sidebar>
  )
}

function MobileNav() {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex items-center gap-snug rounded-surface border border-line bg-canvas-raised p-compact sm:max-w-dialog">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <IconButton icon={MenuIcon} label="Abrir menú" tooltip={false} />
        </SheetTrigger>
        <SheetContent title="Menú de la obra" side="left" hideHeader className="w-(--layout-sidebar)">
          <ProjectSidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <p className="text-label">Torre Alamo</p>
    </div>
  )
}

const rules = [
  { title: "Un menú, dos tonos", body: "El de la obra (claro) y el del backoffice (oscuro) son el mismo componente. El oscuro es el modo oscuro de la librería aplicado al menú, sin colores aparte." },
  { title: "Sin estilos sueltos", body: "El menú de la obra de hoy fija alto, aire y letra con estilos en línea y colores escritos a mano. Este usa los roles." },
  { title: "Dónde estoy", body: "La sección actual lleva aria-current=\"page\": el lector de pantalla dice «página actual»." },
  { title: "En el celular, panel lateral", body: "El mismo menú entra desde la izquierda en un Sheet y se cierra al elegir una sección." },
] as const

function SidebarDoc() {
  return (
    <FoundationDoc kicker="Organismos" title="Sidebar" lede="El menú lateral de la obra y del backoffice.">
      <div className="flex flex-wrap gap-block">
        <div className="h-[34rem] overflow-hidden rounded-surface border border-line">
          <ProjectSidebar />
        </div>
        <div className="h-[34rem] overflow-hidden rounded-surface">
          <BackofficeSidebar />
        </div>
      </div>
      <DocSection title="En el celular" lede="Tocá el botón de menú.">
        <MobileNav />
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Organismos/Sidebar" } satisfies Meta

export default meta

export const Navegacion: StoryObj = { name: "Navegación", render: () => <SidebarDoc /> }
