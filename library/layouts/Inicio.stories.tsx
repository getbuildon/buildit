import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { ChevronDown, LayoutDashboard, LogOut, Plus, UserCircle, X } from "lucide-react"
import { Avatar } from "../atoms/avatar/Avatar"
import { Button } from "../atoms/button/Button"
import { Icon } from "../atoms/icon/Icon"
import { Link } from "../atoms/link/Link"
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from "../molecules/menu/Menu"
import { ProjectCard, ProjectCardSkeleton } from "../organisms/project-card/ProjectCard"
import { HomeLayout } from "./home/HomeLayout"

/* El inicio de BuildOn (app/home), armado con la librería. Mismo diseño y contenido que
   la app, con los arreglos de buenas prácticas. */

const user = { firstName: "Lucía", name: "Lucía Fernández" }
const companies = [
  { id: "alamo", name: "Grupo Alamo", role: "Dueña" },
  { id: "elemental", name: "Elemental Haus", role: "Administradora" },
]
const projects = [
  { id: "torre", name: "Torre Alamo", address: "Av. Siempreviva 742, Córdoba", floors: 12, progress: 45.5, weeklyDelta: 2.3 },
  { id: "alamos", name: "Barrio Los Álamos", address: "Ruta 20 km 12, Villa Carlos Paz", floors: 2, progress: 12, weeklyDelta: -0.8 },
  { id: "mirador", name: "Edificio Mirador", address: "Bv. San Juan 1200, Córdoba", floors: 8, progress: 78.2, weeklyDelta: 0 },
  { id: "herrera", name: "Casa Herrera", address: "Nueva Córdoba", floors: 3, draft: true },
]

/* ------------------------------------------------------------------ Barra de arriba */

function CompanySwitcher() {
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="earth" size="compact" className="max-w-30 sm:max-w-56" aria-label={`Empresa: ${companies[0].name}. Cambiar de empresa`}>
          <span className="truncate">{companies[0].name}</span>
          <Icon icon={ChevronDown} size="xs" />
        </Button>
      </MenuTrigger>
      <MenuContent className="min-w-56">
        <MenuLabel>Empresas</MenuLabel>
        {companies.map((company) => (
          <MenuItem key={company.id} className="h-auto py-compact">
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-label">{company.name}</span>
              <span className="text-meta text-ink-muted">{company.role}</span>
            </span>
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  )
}

function UserMenu() {
  return (
    <Menu>
      <MenuTrigger asChild>
        <button
          type="button"
          aria-label={`Menú de ${user.name}`}
          className="focus-ring motion-color flex cursor-pointer items-center gap-related rounded-control py-related pr-related pl-related text-on-earth-muted hover:bg-earth-veil hover:text-on-earth data-[state=open]:bg-earth-veil data-[state=open]:text-on-earth sm:gap-compact sm:pr-compact"
        >
          <Avatar name={user.name} size="sm" tone="naranja" />
          <span className="hidden max-w-30 truncate text-label sm:inline">{user.name}</span>
          <Icon icon={ChevronDown} size="xs" />
        </button>
      </MenuTrigger>
      <MenuContent className="min-w-48">
        <div className="flex flex-col gap-compact px-compact pt-compact pb-snug">
          <Avatar name={user.name} size="md" tone="naranja" />
          <p className="text-label">{user.name}</p>
        </div>
        <MenuSeparator />
        <MenuItem icon={UserCircle}>Editar perfil</MenuItem>
        <MenuItem icon={LogOut}>Cerrar sesión</MenuItem>
      </MenuContent>
    </Menu>
  )
}

function Header({ clientAccess = true }: { clientAccess?: boolean }) {
  return (
    <>
      {clientAccess ? (
        <Button variant="earth" size="compact">
          Portal Clientes
        </Button>
      ) : null}
      <CompanySwitcher />
      <UserMenu />
    </>
  )
}

/* ------------------------------------------------------------------ Barra de abajo */

function BackofficeNotice() {
  const [visible, setVisible] = useState(true)
  if (!visible) return null
  return (
    <div role="status" className="flex w-full max-w-xl items-center gap-snug text-body text-on-earth-muted animate-enter">
      <Icon icon={LayoutDashboard} className="shrink-0" />
      <p className="min-w-0 flex-1">
        Como administrador de BuildOn, podés acceder al{" "}
        <Link href="#backoffice" tone="ink" className="text-on-earth decoration-on-earth-muted">
          backoffice
        </Link>
        .
      </p>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Cerrar aviso"
        className="focus-ring motion-color grid size-8 shrink-0 cursor-pointer place-items-center rounded-control text-on-earth-muted hover:bg-earth-veil hover:text-on-earth"
      >
        <Icon icon={X} />
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ Pantalla */

type HomeState = "obras" | "cargando" | "sin-obras" | "sin-permiso" | "error-avance"

function Greeting({ state }: { state: HomeState }) {
  return (
    <div className="flex w-full max-w-reading flex-col items-center gap-compact px-related text-center sm:gap-snug">
      <h1 className="text-welcome">
        ¡Hola, {user.firstName}! <span aria-hidden>👋</span>
      </h1>
      {state === "sin-obras" ? <p className="text-welcome-lede">Creá tu primera obra.</p> : null}
      {state === "sin-permiso" ? <p className="text-welcome-lede">No tenés obras asignadas. Cuando te sumen a una, va a aparecer acá.</p> : null}
    </div>
  )
}

function Home({ state = "obras" }: { state?: HomeState }) {
  const loading = state === "cargando"
  const list = state === "obras" || state === "error-avance" ? projects : []
  return (
    <HomeLayout header={<Header />} footer={<BackofficeNotice />} busy={loading}>
      <Greeting state={state} />
      {state === "sin-obras" ? (
        <Button className="mt-block" size="large">
          <Icon icon={Plus} /> Crear obra
        </Button>
      ) : null}
      <ul className="mt-8 flex w-full flex-wrap justify-center gap-group pb-16 sm:mt-10 sm:gap-5 sm:pb-20 md:mt-12 md:pb-24" aria-label="Tus obras">
        {loading
          ? Array.from({ length: 3 }, (_, index) => (
              <li key={index}>
                <ProjectCardSkeleton />
              </li>
            ))
          : list.map((project) => (
              <li key={project.id} className="flex w-full max-w-60 sm:w-60">
                <ProjectCard
                  name={project.name}
                  address={project.address}
                  floors={project.floors}
                  draft={project.draft}
                  progress={state === "error-avance" ? undefined : project.progress}
                  weeklyDelta={state === "error-avance" ? null : project.weeklyDelta}
                  link={<a href={`#${project.id}`}>{project.name}</a>}
                />
              </li>
            ))}
      </ul>
      {state === "error-avance" ? (
        <p role="status" className="-mt-12 text-center text-body text-on-earth-muted">
          No pudimos cargar el progreso de las obras. Probá de nuevo en un momento.
        </p>
      ) : null}
    </HomeLayout>
  )
}

const meta = { title: "Pantallas/Inicio", parameters: { layout: "fullscreen" } } satisfies Meta

export default meta

export const ConObras: StoryObj = { name: "Con obras", render: () => <Home state="obras" /> }
export const Cargando: StoryObj = { name: "Cargando", render: () => <Home state="cargando" /> }
export const SinObras: StoryObj = { name: "Sin obras · puede crear", render: () => <Home state="sin-obras" /> }
export const SinPermiso: StoryObj = { name: "Sin obras · sin permiso", render: () => <Home state="sin-permiso" /> }
export const ErrorAvance: StoryObj = { name: "Error al cargar el avance", render: () => <Home state="error-avance" /> }
