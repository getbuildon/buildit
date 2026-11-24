/* El marco de las pantallas de la obra (menú, barra del celular), en las dos versiones:
   «como hoy» y «propuesta». Es de los ejemplos del catálogo: no se exporta. */
import { useState } from "react";
import {
  House,
  ArrowRightLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronsUpDown,
  ClipboardList,
  Contact,
  Globe,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Menu as MenuIcon,
  Settings,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { Avatar } from "../../atoms/avatar/Avatar";
import { Badge } from "../../atoms/badge/Badge";
import { IconButton } from "../../atoms/button/IconButton";
import { Icon } from "../../atoms/icon/Icon";
import { Tooltip } from "../../atoms/tooltip/Tooltip";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
} from "../../molecules/menu/Menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "../../organisms/sheet/Sheet";
import {
  Sidebar,
  SidebarItem,
  SidebarSection,
} from "../../organisms/sidebar/Sidebar";
import { Topbar } from "../../organisms/topbar/Topbar";

export const project = {
  name: "Torre Alamo",
  company: "Grupo Alamo",
  address: "Av. Siempreviva 742, Córdoba",
};
export const user = {
  name: "Lucía Fernández",
  email: "lucia@grupoalamo.com.ar",
  role: "Dueña",
};
export const otherProjects = ["Barrio Los Álamos", "Edificio Mirador"];

/* ================================================================== Como hoy */

/** El cliente solo ve «Mi Unidad». */
export const navClient = [{ id: "mi-unidad", label: "Mi Unidad", icon: House }];

export const navToday = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "trabajo-diario", label: "Trabajo Diario", icon: ClipboardList },
  { id: "certificaciones", label: "Certificaciones", icon: BadgeCheck },
  { id: "equipo", label: "Equipo", icon: Users },
  { id: "clientes", label: "Clientes", icon: Contact },
  { id: "configuracion", label: "Configuración", icon: Settings },
  { id: "portal-clientes", label: "Portal Clientes", icon: Globe },
];

export function CompanyMark({
  size = "default",
}: {
  size?: "default" | "compact";
}) {
  return (
    <span
      className={
        size === "compact"
          ? "flex size-8 shrink-0 items-center justify-center rounded-compact bg-action text-action-ink"
          : "flex size-9 shrink-0 items-center justify-center rounded-control bg-action text-action-ink"
      }
    >
      <Icon icon={Building2} size={size === "compact" ? "sm" : "md"} />
    </span>
  );
}

/** Volver al inicio para elegir otra obra. Hoy es un ícono sin texto: suma el tooltip. */
function SwitchProjectLink() {
  return (
    <Tooltip content="Cambiar de obra">
      <a
        href="#inicio"
        aria-label="Cambiar de obra"
        className="focus-ring motion-color grid size-6 shrink-0 place-items-center rounded-compact bg-canvas-track text-ink-subtle hover:text-ink-muted"
      >
        <Icon icon={ArrowRightLeft} size="xs" />
      </a>
    </Tooltip>
  );
}

function ProjectIdentity() {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-snug">
      <CompanyMark />
      <div className="flex min-w-0 flex-col">
        <p className="truncate text-label font-semibold">{project.company}</p>
        <p className="truncate text-meta">{project.name}</p>
      </div>
    </div>
  );
}

function UserMenuToday() {
  return (
    <div className="flex items-center gap-snug rounded-control bg-canvas-sunken p-snug">
      <Avatar name={user.name} size="sm" tone="naranja" />
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate text-label font-semibold">{user.name}</p>
        <p className="truncate text-meta">{user.role}</p>
      </div>
      <Menu>
        <MenuTrigger asChild>
          <button
            type="button"
            aria-label="Menú de usuario"
            className="focus-ring motion-color motion-press group/trigger grid size-6 shrink-0 cursor-pointer place-items-center rounded-compact bg-canvas-track text-ink hover:bg-surface-pressed data-[state=open]:bg-canvas-inverse data-[state=open]:text-ink-inverse"
          >
            <Icon
              icon={ChevronDown}
              size="xs"
              className="transition-transform duration-(--duration-base) group-data-[state=open]/trigger:rotate-180"
            />
          </button>
        </MenuTrigger>
        <MenuContent side="top" className="w-48">
          <div className="flex flex-col border-b border-line px-compact pt-compact pb-snug">
            <p className="truncate text-label">{user.name}</p>
            <p className="truncate text-meta text-ink-muted">{user.email}</p>
            <Badge className="mt-compact self-start">{user.role}</Badge>
          </div>
          <MenuItem icon={UserCircle} className="mt-related">
            Mi Perfil
          </MenuItem>
          <MenuItem icon={LogOut} tone="danger">
            Cerrar sesión
          </MenuItem>
        </MenuContent>
      </Menu>
    </div>
  );
}

export function NavToday({
  active,
  onNavigate,
}: {
  active: string;
  onNavigate?: () => void;
}) {
  return (
    <SidebarSection>
      {(active === "mi-unidad" ? navClient : navToday).map((item) => (
        <SidebarItem
          key={item.id}
          href={`#${item.id}`}
          icon={item.icon}
          active={active === item.id}
          onClick={(event) => {
            event.preventDefault();
            onNavigate?.();
          }}
        >
          {item.label}
        </SidebarItem>
      ))}
    </SidebarSection>
  );
}

/** active: el id de la sección («dashboard», «trabajo-diario»…). */
export function SidebarToday({ active }: { active: string }) {
  return (
    <Sidebar
      variant="floating"
      label="Secciones de la obra"
      header={
        <>
          <ProjectIdentity />
          <SwitchProjectLink />
        </>
      }
      footer={<UserMenuToday />}
    >
      <NavToday active={active} />
    </Sidebar>
  );
}

/** Celular y tablet: barra de 80 con la obra; el menú baja desde arriba. */
export function MobileHeaderToday({ active }: { active: string }) {
  const [open, setOpen] = useState(false);
  const row = (button: React.ReactNode) => (
    <div className="flex h-20 items-center justify-between gap-snug px-block">
      <ProjectIdentity />
      <div className="flex shrink-0 items-center gap-compact">
        <SwitchProjectLink />
        {button}
      </div>
    </div>
  );
  return (
    <div className="relative bg-canvas-raised">
      <Sheet open={open} onOpenChange={setOpen}>
        {row(
          <SheetTrigger asChild>
            <IconButton
              icon={MenuIcon}
              label="Abrir menú"
              tooltip={false}
              size="large"
            />
          </SheetTrigger>,
        )}
        <SheetContent
          side="top"
          title="Menú de la obra"
          hideHeader
          className="bg-canvas-raised shadow-near"
        >
          {row(
            <SheetClose asChild>
              <IconButton
                icon={X}
                label="Cerrar menú"
                tooltip={false}
                size="large"
              />
            </SheetClose>,
          )}
          <nav
            aria-label="Secciones de la obra"
            className="flex flex-col px-block pt-group pb-block"
          >
            <NavToday active={active} onNavigate={() => setOpen(false)} />
            <div className="mt-group flex flex-col gap-related border-t border-line pt-group">
              <div className="mb-compact flex items-center gap-snug rounded-control bg-canvas-sunken p-snug">
                <Avatar name={user.name} size="sm" tone="naranja" />
                <div className="flex min-w-0 flex-col">
                  <p className="truncate text-label font-semibold">
                    {user.name}
                  </p>
                  <p className="truncate text-meta">{user.role}</p>
                </div>
              </div>
              <a
                href="#perfil"
                className="focus-ring state-veil flex min-h-10 items-center gap-snug rounded-control px-snug text-label text-ink"
              >
                <Icon icon={UserCircle} className="text-ink-muted" /> Mi Perfil
              </a>
              <button
                type="button"
                className="focus-ring flex min-h-10 cursor-pointer items-center gap-snug rounded-control px-snug text-label text-fn-danger hover:bg-fn-danger-canvas"
              >
                <Icon icon={LogOut} /> Cerrar sesión
              </button>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ================================================================== Propuesta */

function ProjectSwitcher() {
  return (
    <Menu>
      <MenuTrigger asChild>
        <button
          type="button"
          aria-label={`Obra: ${project.name}, de ${project.company}. Cambiar de obra`}
          className="focus-ring state-veil motion-color flex w-full min-w-0 cursor-pointer items-center gap-snug rounded-control p-related text-left"
        >
          <CompanyMark size="compact" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-label">{project.name}</span>
            <span className="truncate text-meta text-ink-muted">
              {project.company}
            </span>
          </span>
          <Icon icon={ChevronsUpDown} size="xs" className="text-ink-muted" />
        </button>
      </MenuTrigger>
      <MenuContent
        align="start"
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
      >
        <MenuLabel>Obras de {project.company}</MenuLabel>
        <MenuItem icon={CheckCircle2} className="font-medium">
          {project.name}
        </MenuItem>
        {otherProjects.map((name) => (
          <MenuItem key={name} icon={Building2}>
            {name}
          </MenuItem>
        ))}
        <MenuSeparator />
        <MenuItem icon={LayoutGrid}>Ver todas las obras</MenuItem>
      </MenuContent>
    </Menu>
  );
}

function UserButton() {
  return (
    <Menu>
      <MenuTrigger asChild>
        <button
          type="button"
          aria-label={`Menú de ${user.name}`}
          className="focus-ring state-veil motion-color flex w-full min-w-0 cursor-pointer items-center gap-snug rounded-control p-related text-left"
        >
          <Avatar name={user.name} size="sm" tone="naranja" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-label">{user.name}</span>
            <span className="truncate text-meta text-ink-muted">
              {user.role}
            </span>
          </span>
          <Icon icon={ChevronsUpDown} size="xs" className="text-ink-muted" />
        </button>
      </MenuTrigger>
      <MenuContent
        side="top"
        align="start"
        className="w-(--radix-dropdown-menu-trigger-width) min-w-52"
      >
        <MenuLabel className="normal-case">{user.email}</MenuLabel>
        <MenuItem icon={UserCircle}>Mi perfil</MenuItem>
        <MenuSeparator />
        <MenuItem icon={LogOut} tone="danger">
          Cerrar sesión
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

export const navProposal = [
  {
    items: [
      { id: "resumen", label: "Resumen", icon: LayoutDashboard },
      {
        id: "trabajo-diario",
        label: "Trabajo diario",
        icon: ClipboardList,
        count: 3,
      },
      { id: "certificaciones", label: "Certificaciones", icon: BadgeCheck },
    ],
  },
  {
    title: "Personas",
    items: [
      { id: "equipo", label: "Equipo", icon: Users },
      { id: "clientes", label: "Clientes", icon: Contact },
    ],
  },
  {
    title: "Obra",
    items: [
      { id: "portal-clientes", label: "Portal de clientes", icon: Globe },
      { id: "configuracion", label: "Configuración", icon: Settings },
    ],
  },
];

/** active: el id de la sección («resumen», «trabajo-diario»…). */
export function SidebarProposal({
  active,
  onNavigate,
}: {
  active: string;
  onNavigate?: () => void;
}) {
  return (
    <Sidebar
      label="Secciones de la obra"
      header={<ProjectSwitcher />}
      footer={<UserButton />}
      className="h-full"
    >
      {(active === "mi-unidad"
        ? [{ items: [{ id: "mi-unidad", label: "Mi unidad", icon: House }] }]
        : navProposal
      ).map((section, index) => (
        <SidebarSection key={index} title={section.title}>
          {section.items.map((item) => (
            <SidebarItem
              key={item.id}
              href={`#${item.id}`}
              icon={item.icon}
              active={item.id === active}
              count={"count" in item ? item.count : undefined}
              onClick={(event) => {
                event.preventDefault();
                onNavigate?.();
              }}
            >
              {item.label}
            </SidebarItem>
          ))}
        </SidebarSection>
      ))}
    </Sidebar>
  );
}

export function TopbarProposal({ active }: { active: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Topbar
      start={
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <IconButton icon={MenuIcon} label="Abrir menú" tooltip={false} />
          </SheetTrigger>
          <SheetContent
            title="Menú de la obra"
            side="left"
            hideHeader
            className="w-(--layout-sidebar)"
          >
            <SidebarProposal
              active={active}
              onNavigate={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>
      }
      title={project.name}
    />
  );
}
