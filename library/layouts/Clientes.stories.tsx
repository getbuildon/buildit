import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  ChevronDown,
  Clock,
  Eye,
  Home,
  Link2,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  RefreshCw,
  SquarePen,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Avatar } from "../atoms/avatar/Avatar";
import { Badge } from "../atoms/badge/Badge";
import { Button } from "../atoms/button/Button";
import { IconButton } from "../atoms/button/IconButton";
import { Checkbox } from "../atoms/checkbox/Checkbox";
import { Icon } from "../atoms/icon/Icon";
import { Input } from "../atoms/input/Input";
import { Link } from "../atoms/link/Link";
import { Tag } from "../atoms/tag/Tag";
import { Tooltip } from "../atoms/tooltip/Tooltip";
import { cn } from "../lib/cn";
import { ConfirmDialog } from "../molecules/confirm-dialog/ConfirmDialog";
import { Dialog, DialogContent } from "../molecules/dialog/Dialog";
import { EmptyState } from "../molecules/empty-state/EmptyState";
import { Field } from "../molecules/field/Field";
import { InputGroup } from "../molecules/input-group/InputGroup";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "../molecules/menu/Menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../molecules/popover/Popover";
import { Segmented } from "../molecules/segmented/Segmented";
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

/* Clientes (app/project/[projectId]/clientes): los compradores de cada unidad, con
   acceso al portal del cliente. Invitaciones pendientes en la misma lista. */

/* ------------------------------------------------------------------ Datos */

type Unit = { id: string; code: string; floor: string };
type Client = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  units: string[];
  pending?: boolean;
  lastVisit?: string;
};

const floors = ["Piso 1", "Piso 2", "Piso 3", "Piso 4"];
const units: Unit[] = floors.flatMap((floor, index) =>
  ["A", "B", "C", "D"]
    .slice(0, index === 3 ? 3 : 4)
    .map((letter) => ({
      id: `${index + 1}${letter}`,
      code: `${index + 1}${letter}`,
      floor,
    })),
);

const clients: Client[] = [
  {
    id: "c1",
    firstName: "Valeria",
    lastName: "Quiroga",
    email: "valeria.quiroga@gmail.com",
    phone: "+54 9 351 612 4410",
    units: ["1A"],
    lastVisit: "Hoy, 9:12 h",
  },
  {
    id: "c2",
    firstName: "Hernán",
    lastName: "Bustos",
    email: "hbustos@outlook.com",
    phone: "+54 9 351 555 0182",
    units: ["1C", "2C"],
    lastVisit: "Hace 3 días",
  },
  {
    id: "c3",
    firstName: "Familia",
    lastName: "Ledesma",
    email: "ledesma.familia@gmail.com",
    units: ["2A"],
    lastVisit: "Hace 2 semanas",
  },
  {
    id: "c4",
    firstName: "Paula",
    lastName: "Arce",
    email: "paula.arce@estudioarce.com",
    phone: "+54 9 11 4022 7781",
    units: ["3B"],
    lastVisit: "Nunca entró",
  },
  {
    id: "c5",
    firstName: "Gustavo",
    lastName: "Molina",
    email: "gmolina@gmail.com",
    units: ["3D", "4A"],
    pending: true,
  },
  {
    id: "c6",
    firstName: "Rocío",
    lastName: "Salas",
    email: "rocio.salas@yahoo.com.ar",
    phone: "+54 9 351 300 9922",
    units: ["4C"],
    pending: true,
  },
];
const limit = 20;
const occupied = new Set(clients.flatMap((client) => client.units));
const fullName = (client: Client) => `${client.firstName} ${client.lastName}`;

/** Elegir unidades: lista con casillas, agrupada por piso. Las que ya tienen cliente, apagadas. */
function UnitPicker({
  value,
  onChange,
  keep = [],
  id,
  // Un botón no admite aria-required: el campo ya marca que es obligatorio.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  "aria-required": _required,
  ...aria
}: {
  value: string[];
  onChange: (value: string[]) => void;
  keep?: string[];
  id?: string;
  "aria-describedby"?: string;
  "aria-required"?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          {...aria}
          className={cn(
            "focus-ring motion-color flex h-control w-full min-w-40 cursor-pointer items-center gap-compact rounded-control border border-line-strong bg-canvas-raised px-snug text-left text-field hover:border-ink-subtle",
            value.length === 0 && "text-ink-subtle",
          )}
        >
          <span className="min-w-0 flex-1 truncate">
            {value.length === 0
              ? "Elegí unidades"
              : value.length === 1
                ? `Unidad ${value[0]}`
                : `${value.length} unidades`}
          </span>
          <Icon icon={ChevronDown} className="text-ink-muted" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        aria-label="Elegir unidades"
        align="start"
        className="max-h-72 w-56 overflow-y-auto p-compact"
      >
        {floors.map((floor) => (
          <div
            key={floor}
            role="group"
            aria-label={floor}
            className="flex flex-col pb-compact"
          >
            <p className="px-compact pt-related pb-related text-micro text-ink-muted uppercase">
              {floor}
            </p>
            {units
              .filter((unit) => unit.floor === floor)
              .map((unit) => {
                const taken = occupied.has(unit.id) && !keep.includes(unit.id);
                const checked = value.includes(unit.id);
                return (
                  <label
                    key={unit.id}
                    className={cn(
                      "flex h-9 items-center gap-compact rounded-compact px-compact text-body",
                      taken
                        ? "text-ink-muted"
                        : "cursor-pointer hover:bg-surface-hover",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={taken}
                      onCheckedChange={() =>
                        onChange(
                          checked
                            ? value.filter((item) => item !== unit.id)
                            : [...value, unit.id],
                        )
                      }
                    />
                    Unidad {unit.code}
                    {taken ? (
                      <span className="ml-auto text-meta">con cliente</span>
                    ) : null}
                  </label>
                );
              })}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}

/* ================================================================== Como hoy */

function UnitPills({ list }: { list: string[] }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-compact md:w-50 md:shrink-0 md:justify-end md:gap-snug">
      <span className="text-label whitespace-nowrap">
        {list.length} {list.length === 1 ? "unidad" : "unidades"}
      </span>
      <ul
        className="flex flex-wrap items-center gap-related"
        aria-label="Unidades"
      >
        {list.map((code) => (
          <li key={code}>
            {/* Hoy el nombre completo está solo en un title (no lo ve el teclado ni el celular). */}
            <Tag tone="naranja">{code}</Tag>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ClientRow({
  client,
  onEdit,
  onRemove,
}: {
  client: Client;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const actions = client.pending ? (
    <>
      <IconButton
        icon={Link2}
        label={`Copiar link de ${fullName(client)}`}
        size="compact"
      />
      <IconButton
        icon={RefreshCw}
        label={`Reenviar invitación a ${fullName(client)}`}
        size="compact"
      />
      <IconButton
        icon={SquarePen}
        label={`Editar invitación de ${fullName(client)}`}
        size="compact"
        onClick={onEdit}
      />
      <IconButton
        icon={Trash2}
        label={`Revocar invitación de ${fullName(client)}`}
        size="compact"
        onClick={onRemove}
      />
    </>
  ) : (
    <>
      <IconButton
        icon={SquarePen}
        label={`Editar a ${fullName(client)}`}
        size="compact"
        onClick={onEdit}
      />
      <IconButton
        icon={Trash2}
        label={`Quitar a ${fullName(client)}`}
        size="compact"
        onClick={onRemove}
      />
    </>
  );
  return (
    <li className="border-b border-line p-group last:border-b-0">
      <div className="flex flex-col gap-snug md:flex-row md:items-center md:gap-group">
        <div className="flex min-w-0 items-start gap-snug md:flex-1">
          <Avatar
            name={fullName(client)}
            size="md"
            tone={client.pending ? undefined : "naranja"}
            className={
              client.pending ? "bg-canvas-track text-ink-muted" : undefined
            }
          />
          <div className="flex min-w-0 flex-1 items-start justify-between gap-compact">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-compact">
                <h3 className="truncate text-label">{fullName(client)}</h3>
                {client.pending ? (
                  <Badge tone="caution" size="compact" icon={Clock}>
                    Pendiente
                  </Badge>
                ) : null}
              </div>
              <div className="mt-related flex flex-col gap-related text-body text-ink-muted sm:flex-row sm:flex-wrap sm:items-center sm:gap-snug">
                <span className="flex min-w-0 items-center gap-1.5">
                  <Icon icon={Mail} size="xs" className="shrink-0" />
                  <span className="truncate">{client.email}</span>
                </span>
                {client.phone ? (
                  <span className="flex items-center gap-1.5">
                    <Icon icon={Phone} size="xs" className="shrink-0" />
                    {client.phone}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-related md:hidden">
              {actions}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-snug border-t border-line pt-snug md:border-0 md:pt-0">
          <UnitPills list={client.units} />
          <div className="hidden shrink-0 items-center gap-related md:flex">
            {actions}
          </div>
        </div>
      </div>
    </li>
  );
}

function ClientesHoy({
  formOpen = false,
  empty = false,
}: {
  formOpen?: boolean;
  empty?: boolean;
}) {
  const [showForm, setShowForm] = useState(formOpen);
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<Client>();
  const [editUnits, setEditUnits] = useState<string[]>([]);
  const [removing, setRemoving] = useState<Client>();
  const list = empty ? [] : clients;
  const used = empty ? 0 : clients.length;

  return (
    <WorkspaceLayout
      sidebar={<SidebarToday active="clientes" />}
      topbar={<MobileHeaderToday active="clientes" />}
    >
      <div className="mx-auto flex w-full max-w-255.5 flex-col gap-group py-compact sm:gap-block sm:py-block">
        <div className="flex flex-col gap-group sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 flex-col gap-compact">
            <h1 className="text-title">Clientes</h1>
            <p className="text-body text-ink-muted">
              {used}/{limit} Clientes en este proyecto
            </p>
          </div>
          <Button
            size="large"
            className="w-full sm:w-auto"
            onClick={() => setShowForm((value) => !value)}
            aria-expanded={showForm}
          >
            <Icon icon={showForm ? X : Plus} />{" "}
            {showForm ? "Cancelar" : "Agregar cliente"}
          </Button>
        </div>

        {showForm ? (
          <section
            aria-labelledby="nuevo-cliente"
            className="flex flex-col gap-group rounded-surface border border-line bg-canvas-raised p-group shadow-hint sm:p-block"
          >
            <div className="flex items-baseline justify-between gap-snug">
              <h2 id="nuevo-cliente" className="text-section font-regular">
                Nuevo cliente
              </h2>
              <p className="text-meta text-ink-muted">
                <span aria-hidden className="text-fn-danger">
                  *
                </span>{" "}
                Campos obligatorios
              </p>
            </div>
            <div className="grid grid-cols-1 gap-snug sm:grid-cols-2 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto] lg:items-end">
              <Field label="Nombre" required>
                <Input autoComplete="given-name" />
              </Field>
              <Field label="Apellido" required>
                <Input autoComplete="family-name" />
              </Field>
              <Field label="Mail" required>
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  autoComplete="email"
                />
              </Field>
              {/* Hoy el ejemplo es un número de Paraguay (+595). */}
              <Field label="Teléfono" optional>
                <Input
                  type="tel"
                  placeholder="+54 9 351 123 4567"
                  autoComplete="tel"
                />
              </Field>
              <Field label="Unidades" required>
                <UnitPicker value={selected} onChange={setSelected} />
              </Field>
              <Button size="large">
                <Icon icon={Plus} /> Agregar
              </Button>
            </div>
          </section>
        ) : null}

        {list.length > 0 ? (
          <div className="flex flex-col gap-snug">
            <section
              aria-labelledby="lista-clientes"
              className="rounded-surface border border-line bg-canvas-raised shadow-hint"
            >
              <h2 id="lista-clientes" className="sr-only">
                Clientes e invitaciones
              </h2>
              <ul>
                {list.map((client) => (
                  <ClientRow
                    key={client.id}
                    client={client}
                    onEdit={() => {
                      setEditing(client);
                      setEditUnits(client.units);
                    }}
                    onRemove={() => setRemoving(client)}
                  />
                ))}
              </ul>
            </section>
            {/* Hoy debajo hay una paginación siempre apagada («Anterior 1 Siguiente»): no pagina nada. */}
            <p className="text-meta text-ink-muted">
              Mostrando {list.length} de {list.length} clientes
            </p>
          </div>
        ) : (
          <div className="rounded-surface border border-line bg-canvas-raised shadow-hint">
            <EmptyState
              icon={Users}
              title="No hay clientes en este proyecto"
              description="Sumá a los compradores para que sigan el avance de su unidad desde el portal."
              action={
                <Button onClick={() => setShowForm(true)}>
                  <Icon icon={Plus} /> Agregar cliente
                </Button>
              }
            />
          </div>
        )}
      </div>

      <Dialog
        open={editing !== undefined}
        onOpenChange={(value) => (value ? null : setEditing(undefined))}
      >
        <DialogContent
          title={editing?.pending ? "Editar invitación" : "Editar cliente"}
          description={
            editing ? `Actualizá los datos de ${fullName(editing)}.` : undefined
          }
          footer={
            <>
              <Button variant="outline" onClick={() => setEditing(undefined)}>
                Cancelar
              </Button>
              <Button onClick={() => setEditing(undefined)}>Confirmar</Button>
            </>
          }
        >
          {editing ? (
            <div className="grid gap-snug sm:grid-cols-2">
              <Field label="Nombre" required>
                <Input defaultValue={editing.firstName} />
              </Field>
              <Field label="Apellido" required>
                <Input defaultValue={editing.lastName} />
              </Field>
              <Field label="Mail" required className="sm:col-span-2">
                <Input type="email" defaultValue={editing.email} />
              </Field>
              <Field label="Teléfono" optional>
                <Input
                  type="tel"
                  defaultValue={editing.phone}
                  placeholder="+54 9 351 123 4567"
                />
              </Field>
              <Field label="Unidades" required>
                <UnitPicker
                  value={editUnits}
                  onChange={setEditUnits}
                  keep={editing.units}
                />
              </Field>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={removing !== undefined}
        onOpenChange={(value) => (value ? null : setRemoving(undefined))}
        title={
          removing?.pending
            ? `¿Revocar la invitación de ${removing ? fullName(removing) : ""}?`
            : `¿Quitar a ${removing ? fullName(removing) : ""}?`
        }
        description={
          removing?.pending
            ? "El link de la invitación deja de funcionar."
            : "Deja de ver el avance de sus unidades en el portal."
        }
        confirmLabel={
          removing?.pending ? "Revocar invitación" : "Quitar cliente"
        }
        tone="danger"
        onConfirm={() => setRemoving(undefined)}
      />
    </WorkspaceLayout>
  );
}

/* ================================================================== Propuesta */

function InviteClientDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="wide"
        title="Invitar cliente"
        description="Le llega un mail para entrar al portal y ver el avance de sus unidades."
        footer={
          <>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={() => onOpenChange(false)}>
              <Icon icon={UserPlus} /> Enviar invitación
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-group">
          <div className="grid gap-snug sm:grid-cols-2">
            <Field label="Nombre" required>
              <Input autoComplete="given-name" />
            </Field>
            <Field label="Apellido" required>
              <Input autoComplete="family-name" />
            </Field>
          </div>
          <Field label="Mail" required>
            <Input
              type="email"
              placeholder="correo@ejemplo.com"
              autoComplete="email"
            />
          </Field>
          <Field
            label="Celular"
            optional
            description="Para avisarle por WhatsApp cuando haya novedades de su unidad."
          >
            <InputGroup
              type="tel"
              start="+54"
              placeholder="9 351 123 4567"
              autoComplete="tel-national"
            />
          </Field>
          <Field
            label="Unidades"
            required
            description={`Quedan ${units.length - occupied.size} unidades sin cliente.`}
          >
            <UnitPicker value={selected} onChange={setSelected} />
          </Field>
          {selected.length > 0 ? (
            <ul
              className="flex flex-wrap gap-related"
              aria-label="Unidades elegidas"
            >
              {selected.map((code) => (
                <li key={code}>
                  <Tag
                    tone="naranja"
                    onRemove={() =>
                      setSelected(selected.filter((item) => item !== code))
                    }
                  >
                    {`Unidad ${code}`}
                  </Tag>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ClientesPropuesta() {
  const [tab, setTab] = useState("todos");
  const [query, setQuery] = useState("");
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<Client>();
  const active = clients.filter((client) => !client.pending);
  const visited = active.filter(
    (client) => client.lastVisit && client.lastVisit !== "Nunca entró",
  ).length;
  const rows = clients.filter(
    (client) =>
      (tab === "todos" ||
        (tab === "activos" ? !client.pending : client.pending)) &&
      `${fullName(client)} ${client.email} ${client.units.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );

  const columns: DataTableColumn<Client>[] = [
    {
      key: "client",
      header: "Cliente",
      sortValue: (row) => fullName(row),
      cell: (row) => (
        <span className="flex min-w-0 items-center gap-snug">
          <Avatar
            name={fullName(row)}
            size="sm"
            tone={row.pending ? undefined : "naranja"}
          />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-label">{fullName(row)}</span>
            <span className="truncate text-meta text-ink-muted">
              {row.email}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: "phone",
      header: "Celular",
      hideBelow: "lg",
      cell: (row) =>
        row.phone ? (
          <Link
            href={`tel:${row.phone.replace(/\s/g, "")}`}
            tone="ink"
            className="whitespace-nowrap no-underline hover:underline"
          >
            {row.phone}
          </Link>
        ) : (
          <span className="text-ink-muted">—</span>
        ),
    },
    {
      key: "units",
      header: "Unidades",
      sortValue: (row) => row.units[0],
      cell: (row) => (
        <ul
          className="flex flex-wrap gap-related"
          aria-label={`Unidades de ${fullName(row)}`}
        >
          {row.units.map((code) => (
            <li key={code}>
              <Tag tone="naranja">{code}</Tag>
            </li>
          ))}
        </ul>
      ),
    },
    {
      key: "status",
      header: "Portal",
      sortValue: (row) => (row.pending ? "0" : row.lastVisit),
      hideBelow: "md",
      cell: (row) =>
        row.pending ? (
          <Badge tone="caution" icon={Clock} className="rounded-compact">
            Invitación pendiente
          </Badge>
        ) : row.lastVisit === "Nunca entró" ? (
          <Badge tone="neutral" className="rounded-compact">
            Nunca entró
          </Badge>
        ) : (
          <span className="text-ink-muted">
            Entró {row.lastVisit?.toLowerCase()}
          </span>
        ),
    },
  ];

  return (
    <WorkspaceLayout
      sidebar={<SidebarProposal active="clientes" />}
      topbar={<TopbarProposal active="clientes" />}
      header={
        <PageHeader
          title="Clientes"
          description="Los compradores de cada unidad y cómo usan el portal."
          actions={
            <Button onClick={() => setInviting(true)}>
              <Icon icon={UserPlus} /> Invitar cliente
            </Button>
          }
        />
      }
    >
      <MetricStrip className="lg:grid-cols-3">
        <MetricCard
          label="Clientes"
          icon={Users}
          value={`${clients.length} de ${limit}`}
          progress={{ value: (clients.length / limit) * 100 }}
          hint={`${limit - clients.length} lugares libres en el plan`}
        />
        <MetricCard
          label="Unidades sin cliente"
          icon={Home}
          value={String(units.length - occupied.size)}
          hint={
            <Link href="#sin-cliente" tone="ink">
              Ver cuáles
            </Link>
          }
        />
        <MetricCard
          label="Entraron al portal este mes"
          icon={Eye}
          value={`${visited} de ${active.length}`}
          progress={{ value: (visited / active.length) * 100, tone: "ok" }}
          hint="Los que no entran, quizás no recibieron el mail."
        />
      </MetricStrip>

      <div className="flex flex-col gap-snug">
        <Segmented
          label="Qué ver"
          value={tab}
          onValueChange={setTab}
          className="max-w-full self-start overflow-x-auto"
          options={[
            ["todos", "Todos", clients.length],
            ["activos", "Activos", active.length],
            ["invitaciones", "Invitaciones", clients.length - active.length],
          ].map(([value, label, count]) => ({
            value: String(value),
            label: (
              <span className="whitespace-nowrap">
                {label}{" "}
                <span className="text-meta text-ink-muted">{count}</span>
              </span>
            ),
          }))}
        />
        <ListToolbar
          search={{
            value: query,
            onChange: setQuery,
            placeholder: "Buscar por nombre, mail o unidad",
            label: "Buscar clientes",
          }}
          count={`${rows.length} ${rows.length === 1 ? "cliente" : "clientes"}`}
        />
      </div>

      <DataTable
        caption="Clientes de Torre Alamo"
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        defaultSort={{ key: "client", direction: "asc" }}
        empty={
          <EmptyState
            icon={Users}
            size="compact"
            title="No hay clientes con esa búsqueda"
            description="Probá con otro nombre, mail o unidad."
          />
        }
        rowActions={(row) => (
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
              <MenuItem icon={SquarePen}>Editar datos y unidades</MenuItem>
              {row.pending ? (
                <>
                  <MenuItem icon={Link2}>Copiar link de invitación</MenuItem>
                  <MenuItem icon={RefreshCw}>Reenviar invitación</MenuItem>
                </>
              ) : (
                <MenuItem icon={Eye}>
                  Ver el portal como {row.firstName}
                </MenuItem>
              )}
              <MenuSeparator />
              <MenuItem
                icon={Trash2}
                tone="danger"
                onSelect={() => setRemoving(row)}
              >
                {row.pending ? "Revocar invitación" : "Quitar cliente"}
              </MenuItem>
            </MenuContent>
          </Menu>
        )}
      />

      <section
        id="sin-cliente"
        aria-labelledby="sin-cliente-titulo"
        className="flex flex-col gap-snug rounded-surface border border-line bg-canvas-raised p-group"
      >
        <div className="flex flex-wrap items-center justify-between gap-snug">
          <h2 id="sin-cliente-titulo" className="text-section">
            Unidades sin cliente
          </h2>
          <p className="text-meta text-ink-muted">
            Invitá al comprador directo desde la unidad.
          </p>
        </div>
        <ul className="flex flex-wrap gap-compact">
          {units
            .filter((unit) => !occupied.has(unit.id))
            .map((unit) => (
              <li key={unit.id}>
                <Tooltip
                  content={`Invitar al cliente de la unidad ${unit.code}`}
                >
                  <Button
                    variant="outline"
                    size="compact"
                    onClick={() => setInviting(true)}
                    aria-label={`Invitar cliente a la unidad ${unit.code}`}
                  >
                    {unit.code} <Icon icon={Plus} size="xs" />
                  </Button>
                </Tooltip>
              </li>
            ))}
        </ul>
      </section>

      <InviteClientDialog open={inviting} onOpenChange={setInviting} />
      <ConfirmDialog
        open={removing !== undefined}
        onOpenChange={(value) => (value ? null : setRemoving(undefined))}
        title={
          removing?.pending
            ? `¿Revocar la invitación de ${removing ? fullName(removing) : ""}?`
            : `¿Quitar a ${removing ? fullName(removing) : ""}?`
        }
        description={
          removing?.pending
            ? "El link de la invitación deja de funcionar."
            : "Deja de ver el avance de sus unidades en el portal."
        }
        confirmLabel={
          removing?.pending ? "Revocar invitación" : "Quitar cliente"
        }
        tone="danger"
        onConfirm={() => setRemoving(undefined)}
      />
    </WorkspaceLayout>
  );
}

/* ------------------------------------------------------------------ Historias */

const meta = {
  title: "Pantallas/Obra/Clientes",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;

export const ComoHoy: StoryObj = {
  name: "Como hoy",
  render: () => <ClientesHoy />,
};
export const ComoHoyAgregando: StoryObj = {
  name: "Como hoy · agregando",
  render: () => <ClientesHoy formOpen />,
};
export const ComoHoyVacio: StoryObj = {
  name: "Como hoy · sin clientes",
  render: () => <ClientesHoy empty />,
};
export const Propuesta: StoryObj = {
  name: "Propuesta",
  render: () => <ClientesPropuesta />,
};
