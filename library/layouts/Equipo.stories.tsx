import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Check,
  ChevronDown,
  Clock,
  Info,
  Link2,
  Mail,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  SquarePen,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { Avatar } from "../atoms/avatar/Avatar";
import { Badge } from "../atoms/badge/Badge";
import { Button } from "../atoms/button/Button";
import { IconButton } from "../atoms/button/IconButton";
import { Icon } from "../atoms/icon/Icon";
import { Input } from "../atoms/input/Input";
import { Link } from "../atoms/link/Link";
import { Tooltip } from "../atoms/tooltip/Tooltip";
import { cn } from "../lib/cn";
import { ConfirmDialog } from "../molecules/confirm-dialog/ConfirmDialog";
import { Dialog, DialogContent } from "../molecules/dialog/Dialog";
import { Field } from "../molecules/field/Field";
import { InputGroup } from "../molecules/input-group/InputGroup";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "../molecules/menu/Menu";
import { Notice } from "../molecules/notice/Notice";
import { Segmented } from "../molecules/segmented/Segmented";
import { Select, SelectGroup, SelectItem } from "../molecules/select/Select";
import {
  DataTable,
  type DataTableColumn,
} from "../organisms/data-table/DataTable";
import { ListToolbar } from "../organisms/list-toolbar/ListToolbar";
import { MetricCard, MetricStrip } from "../organisms/metric/Metric";
import { PageHeader } from "../organisms/page-header/PageHeader";
import {
  MobileHeaderToday,
  SidebarProposal,
  SidebarToday,
  TopbarProposal,
} from "./obra/ObraShell";
import { WorkspaceLayout } from "./workspace/WorkspaceLayout";

/* Equipo (app/project/[projectId]/equipo): quiénes trabajan en la obra, invitaciones
   pendientes, cupos del plan y qué puede hacer cada tipo de usuario. */

/* ------------------------------------------------------------------ Datos */

type UserType = "Owner" | "Admin" | "Supervisor" | "Operador" | "Cliente";
type Person = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  type: UserType;
  role: string;
  isYou?: boolean;
  lastSeen?: string;
};

const roleGroups: {
  type: Exclude<UserType, "Owner" | "Cliente">;
  roles: string[];
}[] = [
  {
    type: "Admin",
    roles: ["Administrador", "Gerente", "Project Manager", "Coordinador"],
  },
  {
    type: "Supervisor",
    roles: [
      "Director de Obra",
      "Residente",
      "Jefe de Obra",
      "Supervisor",
      "Lider de Proyecto",
    ],
  },
  { type: "Operador", roles: ["Capataz", "Contratista", "Subcontratista"] },
];

const typeDescription: Record<Exclude<UserType, "Owner">, string> = {
  Admin:
    "Configura la obra, el equipo y los permisos; certifica y edita tareas.",
  Supervisor:
    "Supervisa avances, certifica tareas, edita estados y ve el registro de cambios.",
  Operador:
    "Carga avances y edita tareas en la obra, sin configurar ni certificar.",
  Cliente: "Entra al portal del cliente y ve el avance de su unidad.",
};

const members: Person[] = [
  {
    id: "m1",
    firstName: "Lucía",
    lastName: "Fernández",
    email: "lucia@grupoalamo.com.ar",
    type: "Owner",
    role: "Founder",
    isYou: true,
    lastSeen: "Ahora",
  },
  {
    id: "m2",
    firstName: "Ana",
    lastName: "Torres",
    email: "ana.torres@grupoalamo.com.ar",
    type: "Admin",
    role: "Project Manager",
    lastSeen: "Hace 2 h",
  },
  {
    id: "m3",
    firstName: "Martín",
    lastName: "Gómez",
    email: "martin.gomez@gmail.com",
    type: "Supervisor",
    role: "Jefe de Obra",
    lastSeen: "Hoy, 8:40 h",
  },
  {
    id: "m4",
    firstName: "Sofía",
    lastName: "Ruiz",
    email: "sofia.ruiz@electricaruiz.com",
    type: "Operador",
    role: "Contratista",
    lastSeen: "Ayer",
  },
  {
    id: "m5",
    firstName: "Diego",
    lastName: "Paz",
    email: "diegopaz@hotmail.com",
    type: "Operador",
    role: "Capataz",
    lastSeen: "Hace 3 días",
  },
];
const invitations: Person[] = [
  {
    id: "i1",
    firstName: "Carla",
    lastName: "Méndez",
    email: "carla.mendez@gmail.com",
    type: "Supervisor",
    role: "Residente",
    lastSeen: "Invitada hace 2 días",
  },
  {
    id: "i2",
    firstName: "Jorge",
    lastName: "Ibáñez",
    email: "jibanez@sanitariosib.com",
    type: "Operador",
    role: "Subcontratista",
    lastSeen: "Invitado hace 6 días",
  },
];

const seats = {
  Admin: { used: 2, limit: 3 },
  Supervisor: { used: 2, limit: 4 },
  Operador: { used: 4, limit: 4 },
};

const fullName = (person: Person) => `${person.firstName} ${person.lastName}`;

type Permission = boolean | "unit";
const permissionColumns = [
  "Admin",
  "Supervisor",
  "Operador",
  "Cliente",
] as const;
const permissions: { action: string; values: Permission[] }[] = [
  { action: "Agregar usuarios", values: [true, false, false, false] },
  { action: "Editar permisos", values: [true, false, false, false] },
  { action: "Configurar proyecto", values: [true, false, false, false] },
  { action: "Ver dashboard general", values: [true, true, true, false] },
  { action: "Ver avances detallados", values: [true, true, true, "unit"] },
  { action: "Cargar avances", values: [true, true, true, false] },
  { action: "Certificar tareas", values: [true, true, false, false] },
  { action: "Editar tareas", values: [true, true, true, false] },
  { action: "Ver registro de cambios", values: [true, true, true, false] },
  { action: "Portal cliente", values: [false, false, false, true] },
  { action: "Ver/agregar clientes", values: [true, false, false, false] },
];

function RoleSelect({
  value,
  onChange,
  invalid,
  size,
  ...aria
}: {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  size?: "compact" | "default";
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-required"?: boolean;
}) {
  return (
    <Select
      {...aria}
      value={value || undefined}
      onValueChange={onChange}
      placeholder="Elegí un rol"
      invalid={invalid}
      size={size}
    >
      {roleGroups.map((group) => (
        <SelectGroup key={group.type} label={group.type}>
          {group.roles.map((role) => (
            <SelectItem key={role} value={`${group.type}:${role}`}>
              {role}
            </SelectItem>
          ))}
        </SelectGroup>
      ))}
    </Select>
  );
}

const typeOf = (selection: string) =>
  selection.split(":")[0] as keyof typeof seats | "";

/** La tabla de permisos: ✓ y ✕ con palabra para el lector de pantalla. */
function PermissionsTable({
  withDescriptions = false,
}: {
  withDescriptions?: boolean;
}) {
  return (
    <div
      role="region"
      aria-label="Tabla de permisos"
      tabIndex={0}
      className="focus-ring overflow-x-auto rounded-control"
    >
      <table className="w-full min-w-160 border-collapse text-body">
        <caption className="sr-only">
          Qué puede hacer cada tipo de usuario
        </caption>
        <thead>
          <tr className="border-b-2 border-line">
            <th
              scope="col"
              className="h-10 w-40 px-group text-left text-meta font-regular text-ink-muted"
            >
              Pantalla / Acción
            </th>
            {permissionColumns.map((column) => (
              <th
                key={column}
                scope="col"
                className="h-10 px-compact text-center text-label"
              >
                <span className="inline-flex items-center gap-1.5">
                  {column}
                  {withDescriptions ? null : (
                    <Tooltip content={typeDescription[column]}>
                      <button
                        type="button"
                        aria-label={`Qué hace un ${column}`}
                        className="focus-ring grid size-6 cursor-help place-items-center rounded-pill text-ink-muted"
                      >
                        <Icon icon={Info} size="xs" />
                      </button>
                    </Tooltip>
                  )}
                </span>
                {withDescriptions ? (
                  <span className="mt-related block text-meta font-regular text-ink-muted">
                    {typeDescription[column]}
                  </span>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {permissions.map((row, index) => (
            <tr
              key={row.action}
              className={cn(
                "border-b border-line last:border-b-0",
                index % 2 === 1 && "bg-canvas-sunken",
              )}
            >
              <th scope="row" className="h-11 px-group text-left font-regular">
                {row.action}
              </th>
              {row.values.map((value, column) => (
                <td key={column} className="text-center">
                  {value === false ? (
                    <span className="text-fn-danger">
                      <Icon icon={X} size="sm" />
                      <span className="sr-only">No</span>
                    </span>
                  ) : (
                    <span className="inline-flex flex-col items-center text-fn-ok">
                      <Icon icon={Check} size="sm" />
                      <span className="sr-only">Sí</span>
                      {value === "unit" ? (
                        <span className="text-micro font-regular text-ink-muted">
                          Su unidad
                        </span>
                      ) : null}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ================================================================== Como hoy */

function TypeBadge({ type }: { type: UserType }) {
  return (
    <Badge
      tone="action"
      size="compact"
      className={type === "Owner" ? "bg-action text-action-ink" : undefined}
    >
      {type}
    </Badge>
  );
}

function PersonRow({
  person,
  pending,
  actions,
}: {
  person: Person;
  pending?: boolean;
  actions: React.ReactNode;
}) {
  return (
    <li className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] gap-x-snug gap-y-compact border-b border-line p-group last:border-b-0 hover:bg-canvas md:grid-cols-[2.5rem_minmax(0,1fr)_18.75rem_auto] md:items-center md:gap-x-group">
      <Avatar
        name={fullName(person)}
        size="md"
        tone={pending ? undefined : "naranja"}
        className={cn(
          "row-span-2 self-start md:row-span-1 md:self-center",
          pending && "bg-canvas-track text-ink-muted",
        )}
      />
      <div className="col-start-2 row-start-1 flex min-w-0 flex-col gap-related">
        <div className="flex flex-wrap items-center gap-compact">
          <h3 className="truncate text-label">{fullName(person)}</h3>
          {/* Hoy dice «Tú»: el resto de la app habla de vos. */}
          {person.isYou ? (
            <Badge
              tone="action"
              size="compact"
              className="bg-action text-action-ink"
            >
              Vos
            </Badge>
          ) : null}
          {pending ? (
            <Badge tone="caution" size="compact" icon={Clock}>
              Pendiente
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <TypeBadge type={person.type} />
          <span className="text-meta">{person.role}</span>
        </div>
      </div>
      <p className="col-span-2 col-start-2 row-start-2 flex min-w-0 items-center gap-compact text-meta text-ink-muted md:col-span-1 md:col-start-3 md:row-start-1">
        <Icon icon={Mail} size="xs" className="shrink-0" />
        <span className="truncate">{person.email}</span>
      </p>
      {/* Hoy los íconos son de 16 px: muy chicos para tocar. Acá, 32. */}
      <div className="col-start-3 row-start-1 flex items-center justify-end gap-related md:col-start-4">
        {actions}
      </div>
    </li>
  );
}

function EquipoHoy({ formOpen = false }: { formOpen?: boolean }) {
  const [showForm, setShowForm] = useState(formOpen);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [role, setRole] = useState(formOpen ? "Operador:Capataz" : "");
  const [email, setEmail] = useState("");
  const [query, setQuery] = useState("");
  const [permisosOpen, setPermisosOpen] = useState(true);
  const [editing, setEditing] = useState<Person>();
  const [editRole, setEditRole] = useState("");
  const [removing, setRemoving] = useState<Person>();
  const atLimit = (() => {
    const type = typeOf(role);
    return type !== "" && seats[type].used >= seats[type].limit;
  })();
  const match = (person: Person) =>
    `${fullName(person)} ${person.email} ${person.role}`
      .toLowerCase()
      .includes(query.toLowerCase());
  const visible = members.filter(match);
  const pending = invitations.filter(match);

  return (
    <WorkspaceLayout
      sidebar={<SidebarToday active="equipo" />}
      topbar={<MobileHeaderToday active="equipo" />}
    >
      <div className="mx-auto flex w-full max-w-252.75 flex-col gap-group py-compact pb-10 sm:gap-block sm:py-block">
        <div className="flex flex-col gap-group sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 flex-col gap-compact">
            <h1 className="text-title">Equipo de trabajo</h1>
            <p className="text-body text-ink-muted">
              {seats.Admin.used}/{seats.Admin.limit} Admins,{" "}
              {seats.Supervisor.used}/{seats.Supervisor.limit} Supervisores,{" "}
              {seats.Operador.used}/{seats.Operador.limit} operadores
            </p>
          </div>
          <Button
            size="large"
            className="w-full sm:w-auto"
            onClick={() => setShowForm((value) => !value)}
            aria-expanded={showForm}
          >
            <Icon icon={showForm ? X : Plus} />{" "}
            {showForm ? "Cancelar" : "Agregar miembro"}
          </Button>
        </div>

        {showForm ? (
          <section
            aria-labelledby="nuevo-miembro"
            className="flex flex-col gap-group rounded-surface border border-line bg-canvas-raised p-group shadow-hint sm:p-block"
          >
            <div className="flex items-baseline justify-between gap-snug">
              <h2 id="nuevo-miembro" className="text-section font-regular">
                Nuevo miembro
              </h2>
              <p className="text-meta text-ink-muted">
                <span aria-hidden className="text-fn-danger">
                  *
                </span>{" "}
                Campos obligatorios
              </p>
            </div>
            {/* Hoy los campos no tienen título: el nombre del campo es el texto gris de adentro,
                que desaparece al escribir. */}
            <div className="grid grid-cols-1 gap-snug sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Nombre" required>
                <Input
                  value={first}
                  onChange={(event) => setFirst(event.target.value)}
                  autoComplete="given-name"
                />
              </Field>
              <Field label="Apellido" required>
                <Input
                  value={last}
                  onChange={(event) => setLast(event.target.value)}
                  autoComplete="family-name"
                />
              </Field>
              <Field label="Rol" required>
                <RoleSelect value={role} onChange={setRole} invalid={atLimit} />
              </Field>
            </div>
            <div className="flex flex-col gap-snug sm:flex-row sm:items-end">
              <Field label="Mail" required className="min-w-0 flex-1">
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="correo@ejemplo.com"
                  autoComplete="email"
                />
              </Field>
              <Button size="large" disabled={atLimit}>
                <Icon icon={Plus} /> Agregar miembro
              </Button>
            </div>
            {atLimit ? (
              <Notice
                tone="info"
                title={`Alcanzaste el límite de usuarios tipo «${typeOf(role)}».`}
                action={
                  <Link href="#mejorar-plan" tone="ink">
                    Mejorar plan
                  </Link>
                }
              >
                Para sumar más usuarios de este tipo, pedile una mejora del plan
                al administrador de la organización.
              </Notice>
            ) : null}
          </section>
        ) : null}

        <div className="flex flex-col gap-group">
          <InputGroup
            start={<Icon icon={Search} />}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onClear={() => setQuery("")}
            placeholder="Buscar miembros del equipo…"
            aria-label="Buscar miembros del equipo"
            groupClassName="shadow-hint"
          />
          <section
            aria-labelledby="miembros-titulo"
            className="rounded-surface border border-line bg-canvas-raised shadow-hint"
          >
            <h2 id="miembros-titulo" className="sr-only">
              Miembros
            </h2>
            {visible.length === 0 ? (
              <p className="px-group py-8 text-center text-body text-ink-muted">
                Sin resultados para esa búsqueda.
              </p>
            ) : (
              <ul>
                {visible.map((person) => {
                  const owner = person.type === "Owner";
                  const editButton = (
                    <IconButton
                      icon={SquarePen}
                      label={`Editar a ${fullName(person)}`}
                      size="compact"
                      tooltip={!owner}
                      disabled={owner}
                      onClick={() => {
                        setEditing(person);
                        setEditRole(`${person.type}:${person.role}`);
                      }}
                    />
                  );
                  const removeButton = (
                    <IconButton
                      icon={Trash2}
                      label={`Quitar a ${fullName(person)}`}
                      size="compact"
                      tooltip={!owner}
                      disabled={owner}
                      onClick={() => setRemoving(person)}
                    />
                  );
                  return (
                    <PersonRow
                      key={person.id}
                      person={person}
                      actions={
                        owner ? (
                          // Un botón desactivado no recibe foco: el motivo va en un tooltip del contenedor.
                          <Tooltip content="El owner no se puede editar ni quitar">
                            <span
                              role="group"
                              tabIndex={0}
                              className="focus-ring flex gap-related rounded-control"
                              aria-label="El owner no se puede editar ni quitar"
                            >
                              {editButton}
                              {removeButton}
                            </span>
                          </Tooltip>
                        ) : (
                          <>
                            {editButton}
                            {removeButton}
                          </>
                        )
                      }
                    />
                  );
                })}
              </ul>
            )}
          </section>
          <p role="status" className="text-meta text-ink-muted">
            Mostrando {visible.length} de {members.length} miembros
          </p>
        </div>

        <section
          aria-labelledby="pendientes"
          className="flex flex-col gap-group"
        >
          <h2 id="pendientes" className="text-reading">
            Usuarios pendientes de activación
          </h2>
          <div className="rounded-surface border border-line bg-canvas-raised">
            {pending.length === 0 ? (
              <p className="px-group py-6 text-center text-body text-ink-muted">
                Sin resultados para esa búsqueda.
              </p>
            ) : (
              <ul>
                {pending.map((person) => (
                  <PersonRow
                    key={person.id}
                    person={person}
                    pending
                    actions={
                      <>
                        <IconButton
                          icon={Link2}
                          label={`Copiar link de ${fullName(person)}`}
                          size="compact"
                        />
                        <IconButton
                          icon={RefreshCw}
                          label={`Reenviar invitación a ${fullName(person)}`}
                          size="compact"
                        />
                        <IconButton
                          icon={Trash2}
                          label={`Revocar invitación de ${fullName(person)}`}
                          size="compact"
                        />
                      </>
                    }
                  />
                ))}
              </ul>
            )}
          </div>
        </section>

        <section
          aria-labelledby="permisos"
          className="rounded-surface border border-line bg-canvas-raised p-group shadow-hint sm:p-block"
        >
          <h2 id="permisos">
            <button
              type="button"
              aria-expanded={permisosOpen}
              aria-controls="tabla-permisos"
              onClick={() => setPermisosOpen((value) => !value)}
              className="focus-ring flex w-full cursor-pointer items-center gap-compact rounded-box text-left text-reading"
            >
              <Icon icon={ShieldCheck} className="text-ink-muted" />
              <span className="flex-1">Permisos de usuarios</span>
              <Icon
                icon={ChevronDown}
                className={cn(
                  "text-ink-muted transition-transform duration-(--duration-base)",
                  permisosOpen && "rotate-180",
                )}
              />
            </button>
          </h2>
          {permisosOpen ? (
            <div id="tabla-permisos" className="mt-group">
              <PermissionsTable />
            </div>
          ) : null}
        </section>
      </div>

      <Dialog
        open={editing !== undefined}
        onOpenChange={(value) => (value ? null : setEditing(undefined))}
      >
        <DialogContent
          title="Editar miembro"
          description={
            editing ? `Actualizá el rol de ${fullName(editing)}.` : undefined
          }
          footer={
            <>
              <Button variant="outline" onClick={() => setEditing(undefined)}>
                Cancelar
              </Button>
              <Button onClick={() => setEditing(undefined)}>
                Guardar cambios
              </Button>
            </>
          }
        >
          <Field label="Rol" required>
            <RoleSelect value={editRole} onChange={setEditRole} />
          </Field>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={removing !== undefined}
        onOpenChange={(value) => (value ? null : setRemoving(undefined))}
        title={`¿Quitar a ${removing ? fullName(removing) : ""} del equipo?`}
        description="Deja de tener acceso a esta obra. Lo que cargó se mantiene."
        confirmLabel="Quitar del equipo"
        tone="danger"
        onConfirm={() => setRemoving(undefined)}
      />
    </WorkspaceLayout>
  );
}

/* ================================================================== Propuesta */

function InviteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [role, setRole] = useState("");
  const type = typeOf(role);
  const atLimit = type !== "" && seats[type].used >= seats[type].limit;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="wide"
        title="Invitar al equipo"
        description="Le llega un mail para crear su cuenta y entrar a la obra."
        footer={
          <>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button disabled={atLimit} onClick={() => onOpenChange(false)}>
              <Icon icon={UserPlus} /> Enviar invitación
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-group">
          <Field label="Mail" required>
            <Input
              type="email"
              placeholder="correo@ejemplo.com"
              autoComplete="email"
            />
          </Field>
          <div className="grid gap-snug sm:grid-cols-2">
            <Field label="Nombre" required>
              <Input autoComplete="given-name" />
            </Field>
            <Field label="Apellido" required>
              <Input autoComplete="family-name" />
            </Field>
          </div>
          <Field
            label="Rol"
            required
            // Qué puede hacer, en el momento de elegir (como Notion y Slack).
            description={
              type
                ? `${type}: ${typeDescription[type]} Quedan ${Math.max(0, seats[type].limit - seats[type].used)} de ${seats[type].limit} lugares.`
                : "El tipo de usuario define qué puede hacer en la obra."
            }
          >
            <RoleSelect value={role} onChange={setRole} invalid={atLimit} />
          </Field>
          {atLimit ? (
            <Notice
              tone="caution"
              title={`No quedan lugares de ${type}`}
              action={
                <Link href="#mejorar-plan" tone="ink">
                  Pedir más lugares
                </Link>
              }
            >
              Elegí otro rol o pedile una mejora del plan al administrador de la
              organización.
            </Notice>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EquipoPropuesta() {
  const [tab, setTab] = useState("miembros");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("todos");
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<Person>();
  const [permisosOpen, setPermisosOpen] = useState(false);

  const source = tab === "miembros" ? members : invitations;
  const rows = source.filter(
    (person) =>
      (type === "todos" ||
        person.type === type ||
        (type === "Admin" && person.type === "Owner")) &&
      `${fullName(person)} ${person.email} ${person.role}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );

  const columns: DataTableColumn<Person>[] = [
    {
      key: "person",
      header: "Persona",
      sortValue: (row) => fullName(row),
      cell: (row) => (
        <span className="flex min-w-0 items-center gap-snug">
          <Avatar
            name={fullName(row)}
            size="sm"
            tone={tab === "miembros" ? "naranja" : undefined}
          />
          <span className="flex min-w-0 flex-col">
            <span className="flex items-center gap-compact truncate text-label">
              {fullName(row)}
              {row.isYou ? (
                <Badge size="compact" tone="action">
                  Vos
                </Badge>
              ) : null}
            </span>
            <span className="truncate text-meta text-ink-muted">
              {row.email}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      sortValue: (row) => row.type,
      cell: (row) => (
        <Badge
          tone={row.type === "Owner" ? "action" : "neutral"}
          className="rounded-compact"
        >
          {row.type}
        </Badge>
      ),
    },
    {
      key: "role",
      header: "Rol",
      sortValue: (row) => row.role,
      cell: (row) => row.role,
      hideBelow: "md",
    },
    {
      key: "seen",
      header: tab === "miembros" ? "Última actividad" : "Invitación",
      sortValue: (row) => row.lastSeen,
      cell: (row) => <span className="text-ink-muted">{row.lastSeen}</span>,
      hideBelow: "lg",
    },
  ];

  return (
    <WorkspaceLayout
      sidebar={<SidebarProposal active="equipo" />}
      topbar={<TopbarProposal active="equipo" />}
      header={
        <PageHeader
          title="Equipo"
          description="Quiénes trabajan en Torre Alamo y qué puede hacer cada uno."
          actions={
            <Button onClick={() => setInviting(true)}>
              <Icon icon={UserPlus} /> Invitar
            </Button>
          }
        />
      }
    >
      {/* Los cupos del plan a la vista, con barra: hoy es una línea de texto. */}
      <MetricStrip className="lg:grid-cols-3">
        {(Object.keys(seats) as (keyof typeof seats)[]).map((key) => {
          const seat = seats[key];
          const full = seat.used >= seat.limit;
          return (
            <MetricCard
              key={key}
              label={
                key === "Admin"
                  ? "Admins"
                  : key === "Supervisor"
                    ? "Supervisores"
                    : "Operadores"
              }
              value={`${seat.used} de ${seat.limit}`}
              progress={{
                value: (seat.used / seat.limit) * 100,
                tone: full ? "caution" : "action",
              }}
              hint={
                full ? (
                  <span className="flex flex-wrap items-center gap-x-compact">
                    Sin lugares libres ·
                    <Link href="#mejorar-plan" tone="ink">
                      Pedir más
                    </Link>
                  </span>
                ) : (
                  `${seat.limit - seat.used} lugares libres`
                )
              }
            />
          );
        })}
      </MetricStrip>

      <div className="flex flex-col gap-snug">
        <Segmented
          label="Qué ver"
          value={tab}
          onValueChange={setTab}
          className="self-start"
          options={[
            {
              value: "miembros",
              label: (
                <span className="whitespace-nowrap">
                  Miembros{" "}
                  <span className="text-meta text-ink-muted">
                    {members.length}
                  </span>
                </span>
              ),
            },
            {
              value: "invitaciones",
              label: (
                <span className="whitespace-nowrap">
                  Invitaciones{" "}
                  <span className="text-meta text-ink-muted">
                    {invitations.length}
                  </span>
                </span>
              ),
            },
          ]}
        />
        <ListToolbar
          search={{
            value: query,
            onChange: setQuery,
            placeholder: "Buscar por nombre, mail o rol",
            label: "Buscar en el equipo",
          }}
          filters={
            <Select
              value={type}
              onValueChange={setType}
              size="compact"
              aria-label="Tipo de usuario"
              className="w-44"
            >
              <SelectItem value="todos">Todos los tipos</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Supervisor">Supervisor</SelectItem>
              <SelectItem value="Operador">Operador</SelectItem>
            </Select>
          }
          count={`${rows.length} ${tab === "miembros" ? (rows.length === 1 ? "persona" : "personas") : rows.length === 1 ? "invitación" : "invitaciones"}`}
        />
      </div>

      <DataTable
        caption={
          tab === "miembros" ? "Miembros del equipo" : "Invitaciones pendientes"
        }
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        defaultSort={{ key: "person", direction: "asc" }}
        rowActions={(row) =>
          row.type === "Owner" ? (
            <span className="text-meta text-ink-muted">Owner</span>
          ) : (
            <Menu>
              <MenuTrigger asChild>
                <IconButton
                  icon={MoreHorizontal}
                  label={`Acciones de ${fullName(row)}`}
                  size="compact"
                  tooltip={false}
                />
              </MenuTrigger>
              <MenuContent>
                {tab === "miembros" ? (
                  <>
                    <MenuItem icon={SquarePen}>Cambiar rol</MenuItem>
                    <MenuSeparator />
                    <MenuItem
                      icon={Trash2}
                      tone="danger"
                      onSelect={() => setRemoving(row)}
                    >
                      Quitar del equipo
                    </MenuItem>
                  </>
                ) : (
                  <>
                    <MenuItem icon={Link2}>Copiar link de invitación</MenuItem>
                    <MenuItem icon={RefreshCw}>Reenviar invitación</MenuItem>
                    <MenuItem icon={SquarePen}>Cambiar rol</MenuItem>
                    <MenuSeparator />
                    <MenuItem icon={Trash2} tone="danger">
                      Revocar invitación
                    </MenuItem>
                  </>
                )}
              </MenuContent>
            </Menu>
          )
        }
      />

      <section
        aria-labelledby="permisos-propuesta"
        className="rounded-surface border border-line bg-canvas-raised p-group"
      >
        <h2 id="permisos-propuesta">
          <button
            type="button"
            aria-expanded={permisosOpen}
            aria-controls="tabla-permisos-propuesta"
            onClick={() => setPermisosOpen((value) => !value)}
            className="focus-ring flex w-full cursor-pointer items-center gap-compact rounded-box text-left text-section"
          >
            <Icon icon={ShieldCheck} className="text-ink-muted" />
            <span className="flex-1">Qué puede hacer cada tipo</span>
            <Icon
              icon={ChevronDown}
              className={cn(
                "text-ink-muted transition-transform duration-(--duration-base)",
                permisosOpen && "rotate-180",
              )}
            />
          </button>
        </h2>
        {permisosOpen ? (
          <div id="tabla-permisos-propuesta" className="mt-group">
            {/* La descripción de cada tipo a la vista, no escondida en un ícono de info. */}
            <PermissionsTable withDescriptions />
          </div>
        ) : null}
      </section>

      <InviteDialog open={inviting} onOpenChange={setInviting} />
      <ConfirmDialog
        open={removing !== undefined}
        onOpenChange={(value) => (value ? null : setRemoving(undefined))}
        title={`¿Quitar a ${removing ? fullName(removing) : ""} del equipo?`}
        description="Deja de tener acceso a esta obra. Lo que cargó se mantiene."
        confirmLabel="Quitar del equipo"
        tone="danger"
        onConfirm={() => setRemoving(undefined)}
      />
    </WorkspaceLayout>
  );
}

/* ------------------------------------------------------------------ Historias */

const meta = {
  title: "Pantallas/Obra/Equipo",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;

export const ComoHoy: StoryObj = {
  name: "Como hoy",
  render: () => <EquipoHoy />,
};
export const ComoHoyAgregando: StoryObj = {
  name: "Como hoy · agregando (límite del plan)",
  render: () => <EquipoHoy formOpen />,
};
export const Propuesta: StoryObj = {
  name: "Propuesta",
  render: () => <EquipoPropuesta />,
};
