/* Piezas de ejemplo para las pantallas del catálogo. No se exportan. */
import { useState } from "react"
import {
  Bell,
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
import { Avatar } from "../atoms/avatar/Avatar"
import { IconButton } from "../atoms/button/IconButton"
import { Icon } from "../atoms/icon/Icon"
import { Sheet, SheetContent, SheetTrigger } from "../organisms/sheet/Sheet"
import { Sidebar, SidebarItem, SidebarSection } from "../organisms/sidebar/Sidebar"
import { Topbar } from "../organisms/topbar/Topbar"

const projectItems = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "unidades", label: "Unidades", icon: Building2 },
  { id: "trabajo", label: "Trabajo diario", icon: HardHat, count: 3 },
  { id: "certificaciones", label: "Certificaciones", icon: ClipboardCheck },
  { id: "clientes", label: "Portal de clientes", icon: Users },
  { id: "archivos", label: "Archivos", icon: FolderOpen },
]

export function BrandMark() {
  return <span className="font-display text-heading">BuildOn</span>
}

function UserBlock() {
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

export function ProjectSidebar({ active, onNavigate }: { active: string; onNavigate?: () => void }) {
  return (
    <Sidebar
      label="Secciones de la obra"
      header={
        <div className="flex min-w-0 items-center gap-snug">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-action text-action-ink">
            <Icon icon={Building2} />
          </span>
          <div className="flex min-w-0 flex-col">
            <p className="truncate text-label">Torre Alamo</p>
            <p className="truncate text-meta text-ink-muted">Grupo Alamo</p>
          </div>
        </div>
      }
      footer={<UserBlock />}
    >
      <SidebarSection>
        {projectItems.map((item) => (
          <SidebarItem
            key={item.id}
            href={`#${item.id}`}
            icon={item.icon}
            active={active === item.id}
            count={item.count}
            onClick={(event) => {
              event.preventDefault()
              onNavigate?.()
            }}
          >
            {item.label}
          </SidebarItem>
        ))}
      </SidebarSection>
      <SidebarSection title="Obra">
        <SidebarItem href="#config" icon={Cog} active={active === "config"} onClick={(event) => event.preventDefault()}>
          Configuración
        </SidebarItem>
      </SidebarSection>
    </Sidebar>
  )
}

export function BackofficeSidebar({ active }: { active: string }) {
  const items = [
    { id: "dashboard", label: "Dashboard", icon: ChartColumn },
    { id: "empresas", label: "Empresas", icon: Building2 },
    { id: "usuarios", label: "Usuarios", icon: Users },
    { id: "suscripciones", label: "Suscripciones", icon: CreditCard },
  ]
  return (
    <Sidebar tone="inverse" label="Secciones del backoffice" header={<BrandMark />} footer={<UserBlock />}>
      <SidebarSection>
        {items.map((item) => (
          <SidebarItem key={item.id} href={`#${item.id}`} icon={item.icon} active={active === item.id} onClick={(event) => event.preventDefault()}>
            {item.label}
          </SidebarItem>
        ))}
      </SidebarSection>
    </Sidebar>
  )
}

/** Barra del celular: menú (abre el Sidebar en un Sheet), nombre de la obra y avisos. */
export function ProjectTopbar({ active }: { active: string }) {
  const [open, setOpen] = useState(false)
  return (
    <Topbar
      start={
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <IconButton icon={MenuIcon} label="Abrir menú" tooltip={false} />
          </SheetTrigger>
          <SheetContent title="Menú de la obra" side="left" hideHeader className="w-(--layout-sidebar)">
            <ProjectSidebar active={active} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      }
      title="Torre Alamo"
      end={<IconButton icon={Bell} label="Avisos" tooltip={false} />}
    />
  )
}
