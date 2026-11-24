/* El marco del backoffice (menú oscuro y barra del celular), en las dos versiones. */
import { useState, type ReactNode } from "react";
import {
  Building2,
  ChevronsUpDown,
  FolderKanban,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  PanelLeft,
  PanelLeftClose,
  Search,
  UserCircle,
  UserRound,
  Users,
} from "lucide-react";
import { Avatar } from "../../atoms/avatar/Avatar";
import { IconButton } from "../../atoms/button/IconButton";
import { Icon } from "../../atoms/icon/Icon";
import { Logo } from "../../atoms/logo/Logo";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
} from "../../molecules/menu/Menu";
import { Sheet, SheetContent, SheetTrigger } from "../../organisms/sheet/Sheet";
import {
  Sidebar,
  SidebarItem,
  SidebarSection,
} from "../../organisms/sidebar/Sidebar";
import { Topbar } from "../../organisms/topbar/Topbar";
import { WorkspaceLayout } from "../workspace/WorkspaceLayout";

export type Section =
  "dashboard" | "clientes" | "usuarios" | "empresas" | "proyectos";

const navToday: { id: Section; label: string; icon: typeof Users }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "usuarios", label: "Usuarios", icon: UserRound },
  { id: "empresas", label: "Empresas", icon: Building2 },
  { id: "proyectos", label: "Proyectos", icon: FolderKanban },
];

const navProposal: {
  title?: string;
  items: { id: Section; label: string; icon: typeof Users; count?: number }[];
}[] = [
  { items: [{ id: "dashboard", label: "Resumen", icon: LayoutDashboard }] },
  {
    title: "Negocio",
    items: [
      { id: "clientes", label: "Cobranzas", icon: HandCoins, count: 2 },
      { id: "proyectos", label: "Obras y suscripciones", icon: FolderKanban },
    ],
  },
  {
    title: "Cuentas",
    items: [
      { id: "empresas", label: "Empresas", icon: Building2 },
      { id: "usuarios", label: "Usuarios", icon: UserRound },
    ],
  },
];

function Brand() {
  return (
    <span className="flex min-w-0 flex-col gap-related text-ink">
      <Logo size="sm" />
      <span className="text-meta text-ink-muted">Administración</span>
    </span>
  );
}

function UserBlock() {
  return (
    <Menu>
      <MenuTrigger asChild>
        <button
          type="button"
          className="focus-ring state-veil flex w-full cursor-pointer items-center gap-compact rounded-control p-related text-left"
          aria-label="Menú de Arian Fernández"
        >
          <Avatar name="Arian Fernández" size="sm" tone="naranja" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-label">Arian Fernández</span>
            {/* Hoy el mail va en 10 px gris claro: ilegible. */}
            <span className="truncate text-meta text-ink-muted">
              arian@buildon.app
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
        <MenuLabel className="normal-case">Administración</MenuLabel>
        <MenuItem icon={UserCircle}>Ir al perfil</MenuItem>
        <MenuSeparator />
        <MenuItem icon={LogOut} tone="danger">
          Cerrar sesión
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

function Nav({
  version,
  active,
  onNavigate,
}: {
  version: "hoy" | "propuesta";
  active: Section;
  onNavigate: (section: Section) => void;
}) {
  const sections = version === "hoy" ? [{ items: navToday }] : navProposal;
  return (
    <>
      {sections.map((section, index) => (
        <SidebarSection
          key={index}
          title={"title" in section ? section.title : undefined}
        >
          {section.items.map((item) => (
            <SidebarItem
              key={item.id}
              href={`#${item.id}`}
              icon={item.icon}
              active={active === item.id}
              count={"count" in item ? item.count : undefined}
              onClick={(event) => {
                event.preventDefault();
                onNavigate(item.id);
              }}
            >
              {item.label}
            </SidebarItem>
          ))}
        </SidebarSection>
      ))}
    </>
  );
}

export function BackofficeShell({
  version,
  active,
  onNavigate = () => undefined,
  width,
  children,
}: {
  version: "hoy" | "propuesta";
  active: Section;
  onNavigate?: (section: Section) => void;
  width?: "page" | "reading";
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const sidebar = (inSheet = false) => (
    <Sidebar
      tone="inverse"
      label="Secciones del backoffice"
      header={
        <>
          <Brand />
          {inSheet || version === "propuesta" ? null : (
            // Hoy al plegarlo, el menú queda oculto pero se puede seguir llegando con Tab.
            <IconButton
              icon={PanelLeftClose}
              label="Ocultar menú"
              size="compact"
              onClick={() => setCollapsed(true)}
              className="ml-auto"
            />
          )}
        </>
      }
      footer={<UserBlock />}
      className="h-full"
    >
      {version === "propuesta" ? (
        // Buscador global (como Linear o Stripe): ir directo a una empresa, obra o persona.
        <button
          type="button"
          className="focus-ring flex h-control-compact cursor-pointer items-center gap-compact rounded-control border border-line bg-canvas-raised px-snug text-left text-body text-ink-muted"
        >
          <Icon icon={Search} size="xs" />
          <span className="flex-1">Buscar</span>
          <kbd className="rounded-box border border-line px-related text-micro">
            ⌘K
          </kbd>
        </button>
      ) : null}
      <Nav
        version={version}
        active={active}
        onNavigate={(section) => {
          onNavigate(section);
          setOpen(false);
        }}
      />
    </Sidebar>
  );
  return (
    <WorkspaceLayout
      width={width}
      sidebar={collapsed ? undefined : sidebar()}
      topbar={
        <Topbar
          start={
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <IconButton
                  icon={MenuIcon}
                  label="Abrir menú"
                  tooltip={false}
                />
              </SheetTrigger>
              <SheetContent
                title="Menú del backoffice"
                side="left"
                hideHeader
                className="w-(--layout-sidebar)"
              >
                {sidebar(true)}
              </SheetContent>
            </Sheet>
          }
          title="Administración"
        />
      }
    >
      {collapsed ? (
        <div className="hidden lg:block">
          <IconButton
            icon={PanelLeft}
            label="Mostrar menú"
            variant="outline"
            onClick={() => setCollapsed(false)}
          />
        </div>
      ) : null}
      {children}
    </WorkspaceLayout>
  );
}
