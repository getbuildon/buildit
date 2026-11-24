import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AlertTriangle,
  Bell,
  CircleDollarSign,
  Clock,
  Eye,
  HandCoins,
  HardHat,
  Mail,
  MoreHorizontal,
  Plus,
  Receipt,
  RefreshCw,
  Trash2,
  UserPlus,
  Wallet,
} from "lucide-react";
import { Avatar } from "../atoms/avatar/Avatar";
import { Badge } from "../atoms/badge/Badge";
import { Button } from "../atoms/button/Button";
import { IconButton } from "../atoms/button/IconButton";
import { Icon } from "../atoms/icon/Icon";
import { Card, CardBody, CardHeader } from "../molecules/card/Card";
import { EmptyState } from "../molecules/empty-state/EmptyState";
import { Field } from "../molecules/field/Field";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "../molecules/menu/Menu";
import { Segmented } from "../molecules/segmented/Segmented";
import { Select, SelectItem } from "../molecules/select/Select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../molecules/tabs/Tabs";
import { BarChart, DonutChart } from "../organisms/chart/Charts";
import {
  DataTable,
  type DataTableColumn,
} from "../organisms/data-table/DataTable";
import { ListToolbar } from "../organisms/list-toolbar/ListToolbar";
import { MetricCard, MetricStrip } from "../organisms/metric/Metric";
import { PageHeader } from "../organisms/page-header/PageHeader";
import { Sheet, SheetContent } from "../organisms/sheet/Sheet";
import { BackofficeShell, type Section } from "./backoffice/Shell";
import {
  clients,
  companies,
  dashboard,
  movements,
  planGroups,
  projects,
  subStatusLabel,
  subStatusTone,
  usd,
  users,
  type AdminUser,
  type ClientRow,
  type Company,
  type Project,
  type SubStatus,
} from "./backoffice/data";

/* Backoffice propuesto: un resumen que dice qué hacer (como Stripe), cobranzas como
   sección propia, listas con filtros a la vista y el detalle en un panel al costado. */

const months = [
  { label: "Jun", value: 31800 },
  { label: "Jul", value: 35200 },
  { label: "Ago", value: 38900 },
  { label: "Sep", value: 41500 },
  { label: "Oct", value: 44100 },
  { label: "Nov", value: 48600 },
];

function RowMenu({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Menu>
      <MenuTrigger asChild>
        <IconButton
          icon={MoreHorizontal}
          label={label}
          size="compact"
          tooltip={false}
        />
      </MenuTrigger>
      <MenuContent>{children}</MenuContent>
    </Menu>
  );
}

const StatusBadge = ({ status }: { status: SubStatus }) => (
  <Badge tone={subStatusTone[status]} size="compact">
    {subStatusLabel[status]}
  </Badge>
);

/* ------------------------------------------------------------------ Resumen */

function Resumen({ go }: { go: (section: Section) => void }) {
  const [period, setPeriod] = useState("mes");
  const d = dashboard;
  const attention = [
    {
      icon: Wallet,
      tone: "text-fn-danger",
      title: "Elemental Haus debe US$ 1.200",
      detail: "Casa Herrera · vencido hace 18 días",
      action: "Ver cobranza",
      go: "clientes" as Section,
    },
    {
      icon: AlertTriangle,
      tone: "text-fn-danger",
      title: "Constructora Andina debe US$ 1.900",
      detail: "Parque Industrial Sur · suscripción cancelada",
      action: "Ver cobranza",
      go: "clientes" as Section,
    },
    {
      icon: Clock,
      tone: "text-fn-caution",
      title: "Oficinas Norte sigue en borrador",
      detail: "Creada hace 5 días, sin plan asignado",
      action: "Asignar plan",
      go: "proyectos" as Section,
    },
    {
      icon: Mail,
      tone: "text-fn-caution",
      title: "jorge.ibanez no confirmó su cuenta",
      detail: "Invitado hace 2 días",
      action: "Reenviar",
      go: "usuarios" as Section,
    },
  ];
  return (
    <>
      <PageHeader
        title="Resumen"
        description="Cómo viene el negocio y qué necesita atención."
        actions={
          // El período a la vista, con nombre para el lector. La comparación va sola contra el período anterior.
          <Segmented
            size="compact"
            label="Período"
            value={period}
            onValueChange={setPeriod}
            options={[
              { value: "mes", label: "Este mes" },
              { value: "90", label: "90 días" },
              { value: "anio", label: "Este año" },
            ]}
          />
        }
      />
      {/* Cada número con su comparación (hoy la comparativa está en otra sección, abajo de todo). */}
      <MetricStrip>
        <MetricCard
          label="Facturado"
          icon={CircleDollarSign}
          value={usd(d.charges)}
          delta={{
            value: usd(d.charges - d.previous.charges),
            direction: "up",
            good: true,
            label: "vs. octubre",
          }}
        />
        <MetricCard
          label="Cobrado"
          icon={HandCoins}
          value={usd(d.collected)}
          progress={{ value: (d.collected / d.charges) * 100, tone: "ok" }}
          hint="85% de lo facturado"
        />
        <MetricCard
          label="Por cobrar"
          icon={Receipt}
          value={usd(d.receivable)}
          delta={{
            value: usd(d.receivable - d.previous.receivable),
            direction: "up",
            good: false,
            label: "vs. octubre",
          }}
        />
        <MetricCard
          label="Deuda vencida"
          icon={Wallet}
          value={usd(d.debt)}
          delta={{
            value: usd(d.debt - d.previous.debt),
            direction: "up",
            good: false,
            label: "vs. octubre",
          }}
          hint={`${d.debtors} clientes`}
        />
      </MetricStrip>
      <div className="grid gap-block lg:grid-cols-[minmax(0,1fr)_24rem]">
        <Card>
          <CardHeader
            as="h2"
            title="Facturación por mes"
            description="Lo que se facturó cada mes en los últimos 6 meses."
          />
          <CardBody>
            <BarChart
              label="Facturación por mes"
              data={months}
              tone="naranja"
              height={240}
              format={(value) => usd(value)}
              axisFormat={(value) => `${Math.round(value / 1000)} mil`}
            />
          </CardBody>
        </Card>
        {/* Lo que hay que hacer hoy, con la acción al lado (como la bandeja de Stripe). */}
        <Card>
          <CardHeader
            as="h2"
            title="Necesita atención"
            description={`${attention.length} cosas para resolver`}
          />
          <CardBody className="pt-0">
            <ul className="flex flex-col divide-y divide-line">
              {attention.map((item) => (
                <li
                  key={item.title}
                  className="flex items-start gap-snug py-snug first:pt-0"
                >
                  <Icon icon={item.icon} className={item.tone} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-label">{item.title}</span>
                    <span className="text-meta text-ink-muted">
                      {item.detail}
                    </span>
                  </span>
                  <Button
                    variant="ghost"
                    size="compact"
                    onClick={() => go(item.go)}
                  >
                    {item.action}
                  </Button>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
      <div className="grid gap-block lg:grid-cols-2">
        <Card>
          <CardHeader
            as="h2"
            title="Suscripciones"
            description="Al cierre del período"
          />
          <CardBody>
            <DonutChart
              label="Suscripciones por estado"
              data={(Object.keys(d.status) as SubStatus[]).map((status) => ({
                label: subStatusLabel[status],
                value: d.status[status],
                tone:
                  status === "active"
                    ? "verde"
                    : status === "inactive"
                      ? "neutral"
                      : status === "expired"
                        ? "amarillo"
                        : "rojo",
              }))}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader
            as="h2"
            title="Planes"
            description="Suscripciones activas por plan"
          />
          <CardBody>
            <BarChart
              label="Suscripciones activas por plan"
              height={240}
              data={d.groups.map((group, index) => ({
                ...group,
                tone: (["naranja", "azul", "violeta"] as const)[index],
              }))}
            />
          </CardBody>
        </Card>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ Cobranzas */

function BillingPanel({
  title,
  description,
  debt,
  onClose,
}: {
  title?: string;
  description?: string;
  debt: number;
  onClose: () => void;
}) {
  return (
    <Sheet
      open={title !== undefined}
      onOpenChange={(open) => (open ? null : onClose())}
    >
      {title ? (
        <SheetContent
          title={title}
          description={description}
          footer={
            <>
              <Button variant="outline" onClick={onClose}>
                <Icon icon={Bell} /> Mandar recordatorio
              </Button>
              <Button onClick={onClose}>
                <Icon icon={Plus} /> Registrar pago
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-block p-group">
            <dl className="grid grid-cols-2 gap-compact">
              <div className="rounded-control border border-line p-snug">
                <dt className="text-meta text-ink-muted">Saldo</dt>
                <dd
                  className={debt ? "text-label text-fn-danger" : "text-label"}
                >
                  {debt ? `${usd(debt)} vencido` : "Al día"}
                </dd>
              </div>
              <div className="rounded-control border border-line p-snug">
                <dt className="text-meta text-ink-muted">Último pago</dt>
                <dd className="text-label">12 sep 2026</dd>
              </div>
            </dl>
            <section
              aria-labelledby="movs"
              className="flex flex-col gap-compact"
            >
              <h3 id="movs" className="text-label">
                Movimientos
              </h3>
              <ol className="flex flex-col divide-y divide-line rounded-control border border-line">
                {movements.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-start justify-between gap-snug px-snug py-compact"
                  >
                    <span className="flex flex-col">
                      <span className="text-body">{row.type}</span>
                      <span className="text-meta text-ink-muted">
                        {row.date} · {row.detail}
                      </span>
                    </span>
                    <span
                      className={
                        row.amount > 0
                          ? "text-label tabular-nums"
                          : "text-label text-fn-ok tabular-nums"
                      }
                    >
                      {row.amount > 0
                        ? `Cargo ${usd(row.amount)}`
                        : `Pago ${usd(row.amount)}`}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </SheetContent>
      ) : null}
    </Sheet>
  );
}

function Cobranzas() {
  const [tab, setTab] = useState("deuda");
  const [open, setOpen] = useState<ClientRow>();
  const rows =
    tab === "deuda" ? clients.filter((row) => row.debt > 0) : clients;
  const columns: DataTableColumn<ClientRow>[] = [
    {
      key: "company",
      header: "Empresa",
      sortValue: (row) => row.company,
      cell: (row) => (
        <span className="flex flex-col">
          <button
            type="button"
            onClick={() => setOpen(row)}
            className="focus-ring cursor-pointer self-start rounded-box text-left text-label underline-offset-4 hover:underline"
          >
            {row.company}
          </button>
          <span className="text-meta text-ink-muted">
            {row.owner?.name ?? "Sin owner"}
          </span>
        </span>
      ),
    },
    {
      key: "monthly",
      header: "Por mes",
      align: "end",
      sortValue: (row) => row.monthly,
      cell: (row) => (row.monthly ? usd(row.monthly) : "—"),
    },
    {
      key: "debt",
      header: "Deuda vencida",
      align: "end",
      sortValue: (row) => row.debt,
      cell: (row) =>
        row.debt ? (
          <span className="flex flex-col items-end">
            <span className="font-semibold text-fn-danger">
              {usd(row.debt)}
            </span>
            <span className="text-meta text-ink-muted">
              hace {row.company === "Elemental Haus" ? 18 : 41} días
            </span>
          </span>
        ) : (
          "—"
        ),
    },
    {
      key: "projects",
      header: "Obras",
      align: "end",
      cell: (row) => row.projects,
      hideBelow: "md",
    },
  ];
  return (
    <>
      <PageHeader
        title="Cobranzas"
        description="Qué factura cada empresa, quién debe y desde cuándo."
      />
      <MetricStrip className="lg:grid-cols-3">
        <MetricCard
          label="Ingreso mensual"
          icon={CircleDollarSign}
          value={usd(clients.reduce((sum, row) => sum + row.monthly, 0))}
        />
        <MetricCard
          label="Deuda vencida"
          icon={Wallet}
          value={usd(clients.reduce((sum, row) => sum + row.debt, 0))}
          hint={`${clients.filter((row) => row.debt).length} empresas`}
        />
        <MetricCard
          label="Cobrado este mes"
          icon={HandCoins}
          value={usd(dashboard.collected)}
          progress={{ value: 85, tone: "ok" }}
        />
      </MetricStrip>
      <Segmented
        label="Qué ver"
        value={tab}
        onValueChange={setTab}
        className="self-start"
        options={[
          {
            value: "deuda",
            label: (
              <span className="whitespace-nowrap">
                Con deuda{" "}
                <span className="text-meta text-ink-muted">
                  {clients.filter((row) => row.debt).length}
                </span>
              </span>
            ),
          },
          {
            value: "todas",
            label: (
              <span className="whitespace-nowrap">
                Todas{" "}
                <span className="text-meta text-ink-muted">
                  {clients.length}
                </span>
              </span>
            ),
          },
        ]}
      />
      <DataTable
        caption="Cobranzas por empresa"
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        defaultSort={{ key: "debt", direction: "desc" }}
        rowActions={(row) => (
          <RowMenu label={`Acciones de ${row.company}`}>
            <MenuItem icon={Plus} onSelect={() => setOpen(row)}>
              Registrar pago
            </MenuItem>
            <MenuItem icon={Bell}>Mandar recordatorio</MenuItem>
          </RowMenu>
        )}
      />
      <BillingPanel
        title={open?.company}
        description={
          open
            ? `${open.projects} obras · ${usd(open.monthly)} por mes`
            : undefined
        }
        debt={open?.debt ?? 0}
        onClose={() => setOpen(undefined)}
      />
    </>
  );
}

/* ------------------------------------------------------------------ Obras y suscripciones */

function ProjectPanel({
  project,
  onClose,
}: {
  project?: Project;
  onClose: () => void;
}) {
  const [tier, setTier] = useState("compacto-120");
  return (
    <Sheet
      open={project !== undefined}
      onOpenChange={(open) => (open ? null : onClose())}
    >
      {project ? (
        <SheetContent
          title={project.name}
          description={`${project.company} · ${project.location}`}
          className="sm:w-[min(92vw,32rem)]"
        >
          <Tabs defaultValue="suscripcion" className="p-group">
            <TabsList aria-label="Detalle de la obra">
              <TabsTrigger value="suscripcion">Suscripción</TabsTrigger>
              <TabsTrigger value="facturacion">Facturación</TabsTrigger>
            </TabsList>
            <TabsContent
              value="suscripcion"
              className="flex flex-col gap-group pt-group"
            >
              <div className="flex items-center justify-between">
                <span className="text-body">{project.plan ?? "Sin plan"}</span>
                <StatusBadge status={project.status} />
              </div>
              <Field label="Cambiar a">
                <Select value={tier} onValueChange={setTier}>
                  {planGroups.flatMap((group) =>
                    group.tiers.map((item) => (
                      <SelectItem key={item.slug} value={item.slug}>
                        {group.label} · {item.label}{" "}
                        {item.monthly
                          ? `· ${usd(item.monthly)}/mes`
                          : "· a cotizar"}
                      </SelectItem>
                    )),
                  )}
                </Select>
              </Field>
              {/* El prorrateo en una frase, antes de confirmar. */}
              <p className="rounded-control bg-action-soft p-snug text-body">
                Se cobra hoy <strong>US$ 80</strong> por los 12 días que quedan
                del período. Desde el 1 de diciembre paga {usd(600)} por mes.
              </p>
              <Button className="self-start">Cambiar plan</Button>
              <Button variant="danger-quiet" className="self-start">
                Cancelar suscripción
              </Button>
            </TabsContent>
            <TabsContent value="facturacion" className="pt-group">
              <ol className="flex flex-col divide-y divide-line rounded-control border border-line">
                {movements.map((row) => (
                  <li
                    key={row.id}
                    className="flex justify-between gap-snug px-snug py-compact text-body"
                  >
                    <span>
                      {row.date} · {row.type}
                    </span>
                    <span
                      className={
                        row.amount > 0
                          ? "tabular-nums"
                          : "text-fn-ok tabular-nums"
                      }
                    >
                      {row.amount > 0
                        ? `Cargo ${usd(row.amount)}`
                        : `Pago ${usd(row.amount)}`}
                    </span>
                  </li>
                ))}
              </ol>
            </TabsContent>
          </Tabs>
        </SheetContent>
      ) : null}
    </Sheet>
  );
}

function Obras() {
  const [status, setStatus] = useState("todos");
  const [plan, setPlan] = useState("todos");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Project>();
  const count = (value: string) =>
    value === "todos"
      ? projects.length
      : projects.filter((row) => row.status === value).length;
  const rows = projects.filter(
    (row) =>
      (status === "todos" || row.status === status) &&
      (plan === "todos" || row.plan?.startsWith(plan)) &&
      `${row.name} ${row.company} ${row.location}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const columns: DataTableColumn<Project>[] = [
    {
      key: "name",
      header: "Obra",
      sortValue: (row) => row.name,
      cell: (row) => (
        <span className="flex flex-col">
          <button
            type="button"
            onClick={() => setOpen(row)}
            className="focus-ring cursor-pointer self-start rounded-box text-left text-label underline-offset-4 hover:underline"
          >
            {row.name}
          </button>
          <span className="text-meta text-ink-muted">{row.company}</span>
        </span>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      cell: (row) =>
        row.plan ?? <span className="text-ink-muted">Sin plan</span>,
      hideBelow: "md",
    },
    {
      key: "status",
      header: "Estado",
      sortValue: (row) => row.status,
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "amount",
      header: "Por mes",
      align: "end",
      sortValue: (row) => row.amount ?? 0,
      cell: (row) => (row.amount ? usd(row.amount) : "—"),
      hideBelow: "md",
    },
    {
      key: "debt",
      header: "Deuda",
      align: "end",
      sortValue: (row) => row.debt,
      cell: (row) =>
        row.debt ? (
          <span className="font-semibold text-fn-danger">{usd(row.debt)}</span>
        ) : (
          "—"
        ),
    },
  ];
  return (
    <>
      <PageHeader
        title="Obras y suscripciones"
        description="Cada obra con su plan, su estado de pago y su facturación."
        actions={
          <Button>
            <Icon icon={Plus} /> Nueva obra
          </Button>
        }
      />
      {/* Los filtros a la vista, con cantidades (hoy están en una ventana aparte). */}
      <Segmented
        label="Estado de la suscripción"
        value={status}
        onValueChange={setStatus}
        className="max-w-full self-start overflow-x-auto"
        options={["todos", "active", "expired", "disabled", "inactive"].map(
          (value) => ({
            value,
            label: (
              <span className="whitespace-nowrap">
                {value === "todos"
                  ? "Todas"
                  : subStatusLabel[value as SubStatus]}{" "}
                <span className="text-meta text-ink-muted">{count(value)}</span>
              </span>
            ),
          }),
        )}
      />
      <ListToolbar
        search={{
          value: query,
          onChange: setQuery,
          placeholder: "Buscar obra, empresa o ubicación",
          label: "Buscar obras",
        }}
        filters={
          <Select
            value={plan}
            onValueChange={setPlan}
            size="compact"
            aria-label="Plan"
            className="w-44"
          >
            <SelectItem value="todos">Todos los planes</SelectItem>
            {planGroups.map((group) => (
              <SelectItem key={group.id} value={group.label}>
                {group.label}
              </SelectItem>
            ))}
          </Select>
        }
        count={`${rows.length} obras`}
      />
      <DataTable
        caption="Obras y suscripciones"
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        defaultSort={{ key: "debt", direction: "desc" }}
        empty={
          <EmptyState
            icon={HardHat}
            size="compact"
            title="No hay obras con estos filtros"
          />
        }
        rowActions={(row) => (
          <RowMenu label={`Acciones de ${row.name}`}>
            <MenuItem onSelect={() => setOpen(row)}>
              Ver suscripción y facturación
            </MenuItem>
            <MenuItem icon={Eye}>Abrir la obra</MenuItem>
            <MenuSeparator />
            <MenuItem icon={Trash2} tone="danger">
              Eliminar
            </MenuItem>
          </RowMenu>
        )}
      />
      <ProjectPanel project={open} onClose={() => setOpen(undefined)} />
    </>
  );
}

/* ------------------------------------------------------------------ Empresas y usuarios */

function Empresas() {
  const [open, setOpen] = useState<Company>();
  const columns: DataTableColumn<Company>[] = [
    {
      key: "name",
      header: "Empresa",
      sortValue: (row) => row.name,
      cell: (row) => (
        <span className="flex flex-col">
          <button
            type="button"
            onClick={() => setOpen(row)}
            className="focus-ring cursor-pointer self-start rounded-box text-left text-label underline-offset-4 hover:underline"
          >
            {row.name}
          </button>
          <span className="text-meta text-ink-muted">
            {[row.legalName, row.taxId].filter(Boolean).join(" · ") ||
              "Sin datos fiscales"}
          </span>
        </span>
      ),
    },
    {
      key: "owner",
      header: "Dueño de la cuenta",
      cell: (row) =>
        row.owner?.name ?? (
          <Badge tone="caution" size="compact">
            Sin dueño
          </Badge>
        ),
    },
    {
      key: "obras",
      header: "Obras",
      align: "end",
      cell: (row) =>
        projects.filter((project) => project.company === row.name).length,
    },
    {
      key: "members",
      header: "Personas",
      align: "end",
      cell: (row) => row.members,
      hideBelow: "md",
    },
    {
      key: "country",
      header: "País",
      cell: (row) => row.country,
      hideBelow: "lg",
    },
  ];
  return (
    <>
      <PageHeader
        title="Empresas"
        description="Las cuentas de cada constructora, con su dueño y su gente."
        actions={
          <Button>
            <Icon icon={Plus} /> Nueva empresa
          </Button>
        }
      />
      <DataTable
        caption="Empresas"
        columns={columns}
        rows={companies}
        getRowId={(row) => row.id}
        defaultSort={{ key: "name", direction: "asc" }}
      />
      <Sheet
        open={open !== undefined}
        onOpenChange={(value) => (value ? null : setOpen(undefined))}
      >
        {open ? (
          <SheetContent
            title={open.name}
            description={open.legalName || undefined}
          >
            <div className="flex flex-col gap-group p-group">
              {["Dueño", "Admin", "Facturación"].map((role) => (
                <section
                  key={role}
                  aria-label={role}
                  className="flex flex-col gap-compact"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-label">{role}</h3>
                    <Button variant="ghost" size="compact">
                      <Icon icon={UserPlus} size="xs" /> Sumar
                      <span className="sr-only"> {role}</span>
                    </Button>
                  </div>
                  {role === "Dueño" && open.owner ? (
                    <p className="flex items-center gap-compact text-body">
                      <Avatar name={open.owner.name} size="sm" />{" "}
                      {open.owner.name}
                    </p>
                  ) : (
                    <p className="text-meta text-ink-muted">Nadie todavía.</p>
                  )}
                </section>
              ))}
            </div>
          </SheetContent>
        ) : null}
      </Sheet>
    </>
  );
}

function Usuarios() {
  const [tab, setTab] = useState("todos");
  const rows =
    tab === "pendientes" ? users.filter((user) => !user.active) : users;
  const columns: DataTableColumn<AdminUser>[] = [
    {
      key: "name",
      header: "Persona",
      sortValue: (row) => row.name,
      cell: (row) => (
        <span className="flex items-center gap-compact">
          <Avatar name={row.name} size="sm" />
          <span className="flex flex-col">
            <span className="text-label">{row.name}</span>
            <span className="text-meta text-ink-muted">{row.email}</span>
          </span>
        </span>
      ),
    },
    {
      key: "companies",
      header: "Empresas",
      cell: (row) =>
        row.companies.join(", ") || (
          <span className="text-ink-muted">Ninguna</span>
        ),
      hideBelow: "md",
    },
    {
      key: "status",
      header: "Cuenta",
      cell: (row) =>
        row.active ? (
          <Badge tone="ok" size="compact">
            Confirmada
          </Badge>
        ) : (
          <Badge tone="caution" size="compact">
            Sin confirmar
          </Badge>
        ),
    },
    {
      key: "created",
      header: "Alta",
      cell: (row) => row.createdAt,
      hideBelow: "lg",
    },
  ];
  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Todas las personas con cuenta en BuildOn."
        actions={
          <Button>
            <Icon icon={UserPlus} /> Invitar persona
          </Button>
        }
      />
      <Segmented
        label="Qué ver"
        value={tab}
        onValueChange={setTab}
        className="self-start"
        options={[
          {
            value: "todos",
            label: (
              <span className="whitespace-nowrap">
                Todos{" "}
                <span className="text-meta text-ink-muted">{users.length}</span>
              </span>
            ),
          },
          {
            value: "pendientes",
            label: (
              <span className="whitespace-nowrap">
                Sin confirmar{" "}
                <span className="text-meta text-ink-muted">
                  {users.filter((user) => !user.active).length}
                </span>
              </span>
            ),
          },
        ]}
      />
      <DataTable
        caption="Usuarios"
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        defaultSort={{ key: "name", direction: "asc" }}
        rowActions={(row) => (
          <RowMenu label={`Acciones de ${row.name}`}>
            {row.active ? null : (
              <MenuItem icon={RefreshCw}>Reenviar invitación</MenuItem>
            )}
            {/* Soporte (como Intercom): ver lo mismo que ve la persona, solo lectura y queda registrado. */}
            <MenuItem icon={Eye}>Ver la app como esta persona</MenuItem>
            <MenuSeparator />
            <MenuItem icon={Trash2} tone="danger">
              Eliminar cuenta
            </MenuItem>
          </RowMenu>
        )}
      />
    </>
  );
}

/* ------------------------------------------------------------------ App */

function BackofficePropuesta({ start }: { start: Section }) {
  const [section, setSection] = useState<Section>(start);
  return (
    <BackofficeShell
      version="propuesta"
      active={section}
      onNavigate={setSection}
    >
      <div className="flex flex-col gap-block">
        {section === "dashboard" ? <Resumen go={setSection} /> : null}
        {section === "clientes" ? <Cobranzas /> : null}
        {section === "proyectos" ? <Obras /> : null}
        {section === "empresas" ? <Empresas /> : null}
        {section === "usuarios" ? <Usuarios /> : null}
      </div>
    </BackofficeShell>
  );
}

const meta = {
  title: "Pantallas/Backoffice/Propuesta",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;

export const Resumen_: StoryObj = {
  name: "Resumen",
  render: () => <BackofficePropuesta start="dashboard" />,
};
export const Cobranzas_: StoryObj = {
  name: "Cobranzas",
  render: () => <BackofficePropuesta start="clientes" />,
};
export const Obras_: StoryObj = {
  name: "Obras y suscripciones",
  render: () => <BackofficePropuesta start="proyectos" />,
};
export const Empresas_: StoryObj = {
  name: "Empresas",
  render: () => <BackofficePropuesta start="empresas" />,
};
export const Usuarios_: StoryObj = {
  name: "Usuarios",
  render: () => <BackofficePropuesta start="usuarios" />,
};
