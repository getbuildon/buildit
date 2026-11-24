import { useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { DateRange } from "react-day-picker";
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CircleDollarSign,
  HandCoins,
  HardHat,
  Minus,
  MoreHorizontal,
  Plus,
  Receipt,
  Search,
  SlidersHorizontal,
  Wallet,
  X,
} from "lucide-react";
import { Avatar } from "../atoms/avatar/Avatar";
import { Badge } from "../atoms/badge/Badge";
import { Button } from "../atoms/button/Button";
import { IconButton } from "../atoms/button/IconButton";
import { Icon } from "../atoms/icon/Icon";
import { Input, Textarea } from "../atoms/input/Input";
import { cn } from "../lib/cn";
import { formatPercent } from "../foundations/format/format";
import { Combobox } from "../molecules/combobox/Combobox";
import { ConfirmDialog } from "../molecules/confirm-dialog/ConfirmDialog";
import { DatePicker } from "../molecules/date-picker/DatePicker";
import { DateRangePicker } from "../molecules/date-picker/DateRangePicker";
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
import { Select, SelectItem } from "../molecules/select/Select";
import { BarChart, DonutChart } from "../organisms/chart/Charts";
import {
  DataTable,
  type DataTableColumn,
} from "../organisms/data-table/DataTable";
import { MetricCard } from "../organisms/metric/Metric";
import { BackofficeShell } from "./backoffice/Shell";
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

/* Backoffice (app/backoffice) como hoy: dashboard, clientes, usuarios, empresas y
   proyectos, con sus formularios. Arreglos solo donde hay malas prácticas reales. */

/* ------------------------------------------------------------------ Piezas comunes */

function PageTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-snug sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-title">{title}</h1>
        {subtitle ? (
          <p className="text-body text-ink-muted">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/** La tarjeta de lista de hoy: filtros, chips, buscador, tabla y paginación. */
function ListCard<Row>({
  searchPlaceholder,
  entity,
  rows,
  columns,
  caption,
  getRowId,
  onFilters,
  chips = [],
  onRemoveChip,
  rowActions,
  footerExtra,
}: {
  searchPlaceholder: string;
  entity: string;
  rows: Row[];
  columns: DataTableColumn<Row>[];
  caption: string;
  getRowId: (row: Row) => string;
  onFilters?: () => void;
  chips?: string[];
  onRemoveChip?: (chip: string) => void;
  rowActions?: (row: Row) => ReactNode;
  footerExtra?: string;
}) {
  const [query, setQuery] = useState("");
  const visible = rows.filter((row) =>
    JSON.stringify(row).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="flex flex-col gap-snug">
      <div className="flex flex-col gap-snug rounded-control border border-line bg-canvas-raised p-group shadow-hint">
        <div className="flex flex-wrap items-center gap-compact">
          <ul
            aria-label="Filtros aplicados"
            className="flex flex-1 flex-wrap gap-related"
          >
            {chips.map((chip) => (
              <li key={chip}>
                <span className="inline-flex items-center gap-related rounded-pill border border-line bg-canvas py-0.5 pr-related pl-compact text-meta">
                  {chip}
                  {/* Hoy la X mide 20 px. */}
                  <IconButton
                    icon={X}
                    label={`Quitar filtro ${chip}`}
                    size="compact"
                    tooltip={false}
                    onClick={() => onRemoveChip?.(chip)}
                    className="size-6"
                  />
                </span>
              </li>
            ))}
          </ul>
          {onFilters ? (
            // Hoy es solo un ícono con un punto naranja: no dice cuántos filtros hay.
            <Button
              variant="outline"
              onClick={onFilters}
              className={cn(
                chips.length > 0 && "border-action text-action-text",
              )}
            >
              <Icon icon={SlidersHorizontal} /> Filtros
              {chips.length > 0 ? ` (${chips.length})` : ""}
            </Button>
          ) : null}
          {/* Hoy el buscador no tiene nombre: solo el texto gris de adentro. */}
          <InputGroup
            start={<Icon icon={Search} size="xs" />}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onClear={() => setQuery("")}
            placeholder={searchPlaceholder}
            aria-label={`Buscar ${entity}`}
            groupClassName="w-full sm:w-80"
          />
        </div>
        {/* Hoy la tabla está hecha con divs: el lector de pantalla no la lee como tabla. */}
        <DataTable
          caption={caption}
          columns={columns}
          rows={visible}
          getRowId={getRowId}
          rowActions={rowActions}
          empty={
            <p className="py-8 text-center text-body text-ink-muted">
              No hay {entity} que coincidan con la búsqueda.
            </p>
          }
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-snug">
        <p role="status" className="text-meta text-ink-muted">
          {visible.length === 0
            ? `0 ${entity}`
            : `Mostrando 1–${visible.length} de ${visible.length} ${entity}`}
          {footerExtra ? ` · ${footerExtra}` : ""}
        </p>
        <nav aria-label="Páginas" className="flex items-center gap-compact">
          <Button variant="ghost" size="compact" disabled>
            ‹ Anterior
          </Button>
          <Input
            size="compact"
            aria-label="Ir a página"
            defaultValue="1"
            className="w-12 text-center"
          />
          <span className="text-meta text-ink-muted">/ 1</span>
          <Button variant="ghost" size="compact" disabled>
            Siguiente ›
          </Button>
        </nav>
      </div>
    </div>
  );
}

function RowMenu({ label, children }: { label: string; children: ReactNode }) {
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

/* ================================================================== Dashboard */

const periodOptions = [
  { value: "siempre", label: "Siempre" },
  { value: "mes", label: "Este mes" },
  { value: "anterior", label: "Mes anterior" },
  { value: "personalizado", label: "Personalizado" },
];

function PeriodFilter({
  label,
  value,
  onChange,
  removable = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  removable?: boolean;
}) {
  const [range, setRange] = useState<DateRange | undefined>();
  return (
    <div className="flex flex-col gap-snug rounded-control border border-line bg-canvas-raised p-group shadow-hint sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-meta text-ink-muted">{label}</p>
        <p className="text-label">
          {value === "mes"
            ? "1 nov 2026 – 19 nov 2026"
            : value === "anterior"
              ? "1 oct 2026 – 31 oct 2026"
              : value === "siempre"
                ? "Siempre"
                : value
                  ? "Elegí las fechas"
                  : "Seleccioná un período para comparar"}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-compact">
        {/* Hoy son pastillas sin estado elegido para el lector de pantalla y de 28 px de alto. */}
        <Segmented
          size="compact"
          label={label}
          value={value || "ninguno"}
          onValueChange={onChange}
          options={periodOptions}
        />
        {value === "personalizado" ? (
          <DateRangePicker
            value={range}
            onChange={setRange}
            size="compact"
            aria-label={`${label}: fechas`}
          />
        ) : null}
        {removable && value ? (
          <Button variant="ghost" size="compact" onClick={() => onChange("")}>
            Quitar
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function Delta({
  now,
  before,
  money = false,
  upIsGood = true,
}: {
  now: number;
  before: number;
  money?: boolean;
  upIsGood?: boolean;
}) {
  const diff = now - before;
  const pct = before ? (diff / before) * 100 : 0;
  const good = diff === 0 ? undefined : diff > 0 === upIsGood;
  return (
    <Badge
      tone={good === undefined ? "neutral" : good ? "ok" : "danger"}
      icon={diff === 0 ? Minus : diff > 0 ? ArrowUpRight : ArrowDownRight}
      className="rounded-pill"
    >
      {diff > 0 ? "+" : diff < 0 ? "−" : ""}
      {money ? usd(diff) : Math.abs(diff)}
      {before
        ? ` (${diff >= 0 ? "+" : "−"}${formatPercent(Math.abs(pct), 0)})`
        : ""}
      {/* Hoy una baja de deuda se ve verde con flecha para abajo y nada lo explica. */}
      {good !== undefined ? (
        <span className="sr-only">{good ? ", mejora" : ", empeora"}</span>
      ) : null}
    </Badge>
  );
}

function DashboardHoy() {
  const [period, setPeriod] = useState("mes");
  const [compare, setCompare] = useState("anterior");
  const d = dashboard;
  const totalStatus = Object.values(d.status).reduce((a, b) => a + b, 0);
  return (
    <BackofficeShell version="hoy" active="dashboard">
      <div className="flex flex-col gap-block py-block">
        <PageTitle
          title="Dashboard"
          subtitle="Métricas reales de usuarios, suscripciones e ingresos para administración."
        />
        <PeriodFilter label="Período" value={period} onChange={setPeriod} />
        <div className="grid gap-snug md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            variant="tile"
            tone="action"
            icon={CircleDollarSign}
            value={usd(d.charges)}
            label="Cargos emitidos"
            hint="Total facturado en el período"
          />
          <MetricCard
            variant="tile"
            tone="ok"
            icon={HandCoins}
            value={usd(d.collected)}
            label="Cargos cobrados"
            hint="Pagos registrados en el período"
          />
          <MetricCard
            variant="tile"
            tone="danger"
            icon={Receipt}
            value={usd(d.receivable)}
            label="Cargos por cobrar"
            hint="Emitidos en el período que aún no se cobraron"
          />
          <MetricCard
            variant="tile"
            tone="danger"
            icon={Wallet}
            value={usd(d.debt)}
            label="Deuda"
            hint={`Cargos impagos con período vencido · ${d.debtors} clientes`}
          />
        </div>
        <div className="grid gap-snug lg:grid-cols-2">
          <section
            aria-labelledby="estado-subs"
            className="flex flex-col gap-snug rounded-control border border-line bg-canvas-raised p-group shadow-hint"
          >
            <div>
              <h2 id="estado-subs" className="text-label">
                Estado de suscripciones
              </h2>
              <p className="text-meta text-ink-muted">
                Distribución al cierre del período
              </p>
            </div>
            {/* Hoy los gráficos no tienen alternativa en texto; los de la librería traen una tabla para el lector. */}
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
              centerLabel={
                <>
                  <span className="text-metric-compact">{totalStatus}</span>
                  <span className="text-meta text-ink-muted">
                    suscripciones
                  </span>
                </>
              }
            />
          </section>
          <section
            aria-labelledby="actividad"
            className="flex flex-col gap-snug rounded-control border border-line bg-canvas-raised p-group shadow-hint"
          >
            <div>
              <h2 id="actividad" className="text-label">
                Actividad del período
              </h2>
              <p className="text-meta text-ink-muted">
                Altas registradas en el período
              </p>
            </div>
            <BarChart
              label="Altas del período"
              height={240}
              data={[
                { label: "Usuarios", value: d.activity.users, tone: "naranja" },
                {
                  label: "Empresas",
                  value: d.activity.companies,
                  tone: "azul",
                },
                {
                  label: "Proyectos",
                  value: d.activity.projects,
                  tone: "violeta",
                },
                {
                  label: "Suscripciones",
                  value: d.activity.subscriptions,
                  tone: "verde",
                },
              ]}
            />
          </section>
        </div>

        <section
          aria-labelledby="planes"
          className="flex flex-col gap-snug border-t border-line pt-block"
        >
          <div>
            <h2 id="planes" className="text-heading">
              Planes por suscripción
            </h2>
            <p className="text-body text-ink-muted">
              Cantidades al cierre del período, por tipo de plan y superficie.
            </p>
          </div>
          <div className="grid gap-snug lg:grid-cols-2">
            <div className="rounded-control border border-line bg-canvas-raised p-group shadow-hint">
              <h3 className="text-label">Por tipo de plan</h3>
              <BarChart
                label="Suscripciones activas por tipo de plan"
                height={220}
                data={d.groups.map((group, index) => ({
                  ...group,
                  tone: (["naranja", "azul", "violeta"] as const)[index],
                }))}
              />
            </div>
            <div className="rounded-control border border-line bg-canvas-raised p-group shadow-hint">
              <h3 className="text-label">Por superficie</h3>
              {/* Hoy el grupo de cada barra se sabe solo por el color, sin referencia. */}
              <ul className="mt-snug flex flex-col gap-compact">
                {d.tiers.map((tier) => (
                  <li
                    key={`${tier.group}-${tier.tier}`}
                    className="grid grid-cols-[9rem_minmax(0,1fr)_2rem] items-center gap-compact text-meta"
                  >
                    <span>
                      {tier.group} · {tier.tier}
                    </span>
                    <span
                      aria-hidden
                      className="h-3 rounded-pill bg-canvas-track"
                    >
                      <span
                        className="block h-full rounded-pill bg-action"
                        style={{ width: `${(tier.value / 4) * 100}%` }}
                      />
                    </span>
                    <span className="text-right tabular-nums">
                      {tier.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="comparativa"
          className="flex flex-col gap-snug border-t border-line pt-block"
        >
          <div>
            <h2 id="comparativa" className="text-heading">
              Comparativa
            </h2>
            <p className="text-body text-ink-muted">
              Variación del período principal respecto a otro período de
              referencia.
            </p>
          </div>
          <PeriodFilter
            label="Período de referencia"
            value={compare}
            onChange={setCompare}
            removable
          />
          {compare ? (
            <div className="grid gap-snug lg:grid-cols-2">
              {[
                {
                  title: "Al cierre del período",
                  rows: [
                    [
                      "Cargos emitidos",
                      d.charges,
                      d.previous.charges,
                      true,
                      true,
                    ],
                    [
                      "Cargos cobrados",
                      d.collected,
                      d.previous.collected,
                      true,
                      true,
                    ],
                    [
                      "Cargos por cobrar",
                      d.receivable,
                      d.previous.receivable,
                      true,
                      false,
                    ],
                    ["Deuda", d.debt, d.previous.debt, true, false],
                  ],
                },
                {
                  title: "Actividad en el período",
                  rows: [
                    [
                      "Nuevos usuarios",
                      d.activity.users,
                      d.previous.users,
                      false,
                      true,
                    ],
                    [
                      "Nuevas empresas",
                      d.activity.companies,
                      d.previous.companies,
                      false,
                      true,
                    ],
                    [
                      "Nuevos proyectos",
                      d.activity.projects,
                      d.previous.projects,
                      false,
                      true,
                    ],
                    [
                      "Nuevas suscripciones",
                      d.activity.subscriptions,
                      d.previous.subscriptions,
                      false,
                      true,
                    ],
                  ],
                },
              ].map((group) => (
                <div
                  key={group.title}
                  className="rounded-control border border-line bg-canvas-raised p-group shadow-hint"
                >
                  <h3 className="text-label">{group.title}</h3>
                  <ul className="mt-snug flex flex-col divide-y divide-line">
                    {group.rows.map(([label, now, before, money, upIsGood]) => (
                      <li
                        key={label as string}
                        className="flex flex-wrap items-center justify-between gap-compact py-compact"
                      >
                        <span className="text-body">{label as string}</span>
                        <span className="flex items-center gap-compact">
                          <span className="text-label tabular-nums">
                            {money ? usd(now as number) : (now as number)}
                          </span>
                          <span className="text-meta text-ink-muted">
                            vs{" "}
                            {money ? usd(before as number) : (before as number)}
                          </span>
                          <Delta
                            now={now as number}
                            before={before as number}
                            money={money as boolean}
                            upIsGood={upIsGood as boolean}
                          />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-control border border-dashed border-line p-group text-body text-ink-muted">
              Elegí un período de referencia para ver cuánto subió o bajó cada
              número.
            </p>
          )}
        </section>
      </div>
    </BackofficeShell>
  );
}

/* ================================================================== Proyectos */

function SubscriptionBlock({ editing }: { editing: boolean }) {
  const [group, setGroup] = useState("compacto");
  const [tier, setTier] = useState("compacto-120");
  const [interval, setInterval] = useState("Mensual");
  const plan = planGroups.find((item) => item.id === group);
  const selected = plan?.tiers.find((item) => item.slug === tier);
  const price = selected
    ? interval === "Mensual"
      ? selected.monthly
      : selected.annual
    : null;
  return (
    <fieldset className="flex flex-col gap-snug rounded-control bg-canvas-sunken p-group">
      <div className="flex items-start justify-between gap-snug">
        <div>
          {/* Hoy dice «Subscripción»: en castellano es «suscripción». */}
          <legend className="text-label">Suscripción</legend>
          <p className="text-meta text-ink-muted">
            Plan, facturación e inicio de cobro{" "}
            {editing ? "del proyecto" : "para el nuevo proyecto"}.
          </p>
        </div>
        {editing ? (
          <Badge tone="ok" size="compact">
            Activa
          </Badge>
        ) : null}
      </div>
      <div className="grid gap-snug sm:grid-cols-2">
        <Field label="Tipo de plan">
          <Select
            value={group}
            onValueChange={(value) => (
              setGroup(value),
              setTier(
                planGroups.find((item) => item.id === value)?.tiers[0].slug ??
                  "",
              )
            )}
          >
            {planGroups.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.label}
              </SelectItem>
            ))}
            <SelectItem value="custom">Personalizado</SelectItem>
          </Select>
        </Field>
        {plan ? (
          <Field label="Superficie del plan">
            <Select value={tier} onValueChange={setTier}>
              {plan.tiers.map((item) => (
                <SelectItem key={item.slug} value={item.slug}>
                  {item.label}
                </SelectItem>
              ))}
            </Select>
          </Field>
        ) : null}
      </div>
      {group === "custom" ? (
        <div className="grid gap-snug sm:grid-cols-2">
          <Field label="Nombre del plan" required>
            <Input placeholder="Plan especial cliente X" />
          </Field>
          <Field label="Descripción de superficie" required>
            <Input placeholder="Superficie hasta 800 m²" />
          </Field>
          <Field label="Superficie máxima">
            <InputGroup end="m²" inputMode="numeric" placeholder="800" />
          </Field>
          <Field label="Precio mensual">
            <InputGroup start="US$" inputMode="decimal" placeholder="900" />
          </Field>
        </div>
      ) : null}
      <div className="grid gap-snug sm:grid-cols-2">
        <Field label="Facturación">
          <Segmented
            label="Facturación"
            value={interval}
            onValueChange={setInterval}
            options={[
              { value: "Mensual", label: "Mensual" },
              { value: "Anual", label: "Anual" },
            ]}
          />
        </Field>
        <Field
          label={
            editing ? "Inicio del período actual" : "Inicio de facturación"
          }
        >
          <DatePicker
            value={new Date(2026, 10, 1)}
            onChange={() => undefined}
          />
        </Field>
      </div>
      <p className="text-meta text-ink-muted">
        Precio:{" "}
        {price
          ? `${usd(price)} / mes${interval === "Anual" ? " (pago anual)" : ""}`
          : "a cotizar"}
      </p>
      {editing ? (
        <div className="flex flex-col gap-compact rounded-control border border-action/20 bg-action-soft p-snug">
          <p className="text-label">Ajuste prorrateado</p>
          <p className="text-meta">
            Compacto · 60 m² → Compacto · 120 m². Quedan 12 días de 30: se cobra
            la diferencia y la renovación se mantiene.
          </p>
          <dl className="grid grid-cols-3 gap-compact text-center">
            {[
              ["Crédito", "− US$ 160"],
              ["Nuevo plan", "+ US$ 240"],
              ["Neto", "+ US$ 80"],
            ].map(([term, value]) => (
              <div
                key={term}
                className="rounded-compact bg-canvas-raised p-compact"
              >
                <dt className="text-meta text-ink-muted">{term}</dt>
                <dd className="text-label tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </fieldset>
  );
}

function ProjectDialog({
  project,
  open,
  onOpenChange,
}: {
  project?: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const editing = project !== undefined;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="wide"
        title={editing ? "Editar proyecto" : "Nuevo proyecto"}
        description={
          editing
            ? "Actualizá los datos del proyecto y su suscripción."
            : "Completá los datos para registrar un nuevo proyecto."
        }
        footer={
          <>
            {/* Hoy acá dice «Cerrar» y en los demás formularios «Cancelar». */}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={() => onOpenChange(false)}>
              {editing ? "Guardar cambios" : "Crear proyecto"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-group">
          {/* Hoy solo Empresa marca qué es obligatorio; acá todos los formularios igual. */}
          <Field label="Nombre" required>
            <Input
              defaultValue={project?.name}
              placeholder="Edificio Las Palmas"
            />
          </Field>
          <Field label="Empresa" required>
            <Combobox
              options={companies.map((company) => ({
                value: company.id,
                label: company.name,
              }))}
              value={
                companies.find((company) => company.name === project?.company)
                  ?.id
              }
              onValueChange={() => undefined}
              placeholder="Buscar empresa…"
              searchPlaceholder="Buscar empresa"
              emptyText="No encontramos empresas con esa búsqueda."
            />
          </Field>
          <Field label="Ubicación" optional>
            <Input
              defaultValue={project?.location}
              placeholder="Av. Libertador 1234"
            />
          </Field>
          <div className="grid gap-snug sm:grid-cols-2">
            <Field
              label="Estado"
              description={
                editing
                  ? undefined
                  : "Se crea en borrador hasta que el cliente complete la configuración."
              }
            >
              <Select
                value={editing ? "active" : "draft"}
                onValueChange={() => undefined}
                disabled={!editing}
              >
                {[
                  ["active", "Activo"],
                  ["draft", "Borrador"],
                  ["paused", "Pausado"],
                  ["completed", "Completado"],
                  ["archived", "Archivado"],
                ].map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </Select>
            </Field>
            <Field label="Superficie" optional>
              <InputGroup
                end="m²"
                inputMode="numeric"
                defaultValue={project?.surface}
                placeholder="2500"
              />
            </Field>
          </div>
          <SubscriptionBlock editing={editing} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BillingDialog({
  project,
  onOpenChange,
}: {
  project?: Project;
  onOpenChange: (open: boolean) => void;
}) {
  const [form, setForm] = useState<"pago" | "cargo" | null>(null);
  const [amount, setAmount] = useState("600");
  return (
    <Dialog open={project !== undefined} onOpenChange={onOpenChange}>
      <DialogContent
        size="wide"
        title="Facturación"
        description={
          project ? `${project.name} · ${project.company}` : undefined
        }
        className="sm:max-w-3xl"
      >
        {project ? (
          <div className="flex flex-col gap-group">
            <dl className="grid grid-cols-2 gap-compact sm:grid-cols-4">
              {[
                [
                  "Saldo",
                  project.debt + project.receivable > 0
                    ? `${usd(project.debt + project.receivable)} pendiente`
                    : "Al día",
                ],
                ["Cargos", usd(1800)],
                ["Pagos", usd(600)],
                ["Deuda", project.debt ? usd(project.debt) : "—"],
              ].map(([term, value]) => (
                <div
                  key={term}
                  className="rounded-control border border-line p-snug"
                >
                  <dt className="text-meta text-ink-muted">{term}</dt>
                  <dd className="text-label tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap items-center justify-between gap-compact">
              <h3 className="text-label">Movimientos</h3>
              <div className="flex gap-compact">
                <Button
                  variant="outline"
                  size="compact"
                  onClick={() => setForm("cargo")}
                >
                  <Icon icon={Minus} size="xs" /> Registrar cargo
                </Button>
                <Button
                  variant="outline"
                  size="compact"
                  onClick={() => setForm("pago")}
                >
                  <Icon icon={Plus} size="xs" /> Registrar pago
                </Button>
              </div>
            </div>
            {form ? (
              <fieldset
                className={cn(
                  "grid gap-snug rounded-control border p-group sm:grid-cols-2",
                  form === "pago"
                    ? "border-fn-info-line bg-fn-info-canvas"
                    : "border-action/20 bg-action-soft",
                )}
              >
                <legend className="px-related text-label">
                  {form === "pago" ? "Nuevo pago" : "Nuevo cargo"}
                </legend>
                <Field label="Monto" required>
                  <InputGroup
                    start="US$"
                    inputMode="decimal"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                  />
                </Field>
                <Field
                  label={form === "pago" ? "Fecha de pago" : "Fecha del cargo"}
                  required
                >
                  <DatePicker
                    value={new Date(2026, 10, 19)}
                    onChange={() => undefined}
                  />
                </Field>
                <Field label="Descuento" optional>
                  <InputGroup start="US$" inputMode="decimal" placeholder="0" />
                </Field>
                <Field label="Interés" optional>
                  <InputGroup start="US$" inputMode="decimal" placeholder="0" />
                </Field>
                {form === "pago" ? (
                  <Field label="Método">
                    <Select
                      value="transferencia"
                      onValueChange={() => undefined}
                    >
                      {[
                        "Transferencia",
                        "Tarjeta",
                        "Efectivo",
                        "Cheque",
                        "Otro",
                      ].map((method) => (
                        <SelectItem key={method} value={method.toLowerCase()}>
                          {method}
                        </SelectItem>
                      ))}
                    </Select>
                  </Field>
                ) : null}
                <Field
                  label="Nota"
                  optional
                  className={form === "pago" ? undefined : "sm:col-span-2"}
                >
                  <Textarea
                    rows={1}
                    placeholder={
                      form === "pago"
                        ? "Ref. transferencia, factura, etc."
                        : "Renovación, cargo extra, ajuste, etc."
                    }
                  />
                </Field>
                <p aria-live="polite" className="text-meta sm:col-span-2">
                  Neto (monto − descuento + interés):{" "}
                  {form === "pago" ? "−" : "+"}
                  {usd(Number(amount) || 0)}
                </p>
                <div className="flex justify-end gap-compact sm:col-span-2">
                  <Button
                    variant="ghost"
                    size="compact"
                    onClick={() => setForm(null)}
                  >
                    Cancelar
                  </Button>
                  <Button size="compact" onClick={() => setForm(null)}>
                    {form === "pago" ? "Guardar pago" : "Guardar cargo"}
                  </Button>
                </div>
              </fieldset>
            ) : null}
            <div
              role="region"
              aria-label="Historial de movimientos"
              tabIndex={0}
              className="focus-ring max-h-64 overflow-auto rounded-control border border-line"
            >
              <table className="w-full min-w-140 border-collapse text-body">
                <caption className="sr-only">Historial de movimientos</caption>
                <thead className="sticky top-0 bg-canvas-sunken text-left text-meta text-ink-muted">
                  <tr>
                    {["Fecha", "Tipo", "Detalle", "Monto"].map((header) => (
                      <th
                        key={header}
                        scope="col"
                        className={cn(
                          "px-snug py-compact font-medium",
                          header === "Monto" && "text-right",
                        )}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {movements.map((row) => (
                    <tr key={row.id} className="border-t border-line">
                      <td className="px-snug py-compact whitespace-nowrap">
                        {row.date}
                      </td>
                      <td className="px-snug py-compact">{row.type}</td>
                      <td className="px-snug py-compact text-ink-muted">
                        {row.detail}
                      </td>
                      {/* Hoy el signo y el color dicen si es cargo o pago; el lector también lo sabe. */}
                      <td
                        className={cn(
                          "px-snug py-compact text-right tabular-nums",
                          row.amount > 0 ? "text-action-text" : "text-fn-ok",
                        )}
                      >
                        {row.amount > 0 ? "+" : "−"}
                        {usd(row.amount)}
                        <span className="sr-only">
                          {row.amount > 0 ? " (cargo)" : " (pago)"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ProjectFilters({
  open,
  onOpenChange,
  value,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string[];
  onApply: (value: string[]) => void;
}) {
  const [draft, setDraft] = useState(value);
  const toggle = (chip: string) =>
    setDraft(
      draft.includes(chip)
        ? draft.filter((item) => item !== chip)
        : [...draft, chip],
    );
  const Chip = ({ label }: { label: string }) => (
    <button
      type="button"
      aria-pressed={draft.includes(label)}
      onClick={() => toggle(label)}
      className={cn(
        "focus-ring motion-color h-control-compact cursor-pointer rounded-pill border px-snug text-body",
        draft.includes(label)
          ? "border-action bg-action-soft text-action-text"
          : "border-line hover:border-line-strong",
      )}
    >
      {label}
    </button>
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Filtros"
        description="Podés combinar varios planes y estados a la vez."
        footer={
          <>
            <Button
              variant="ghost"
              className="sm:mr-auto"
              onClick={() => setDraft([])}
            >
              Limpiar
            </Button>
            <Button onClick={() => (onApply(draft), onOpenChange(false))}>
              Aplicar filtros
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-group">
          <fieldset className="flex flex-col gap-compact">
            <legend className="text-label">Suscripción</legend>
            {planGroups.map((group) => (
              <div
                key={group.id}
                role="group"
                aria-label={group.label}
                className="flex flex-wrap items-center gap-compact"
              >
                <span className="w-24 text-meta text-ink-muted">
                  {group.label}
                </span>
                {group.tiers.map((tier) => (
                  <Chip
                    key={tier.slug}
                    label={`${group.label} · ${tier.label}`}
                  />
                ))}
              </div>
            ))}
          </fieldset>
          <fieldset className="flex flex-col gap-compact">
            <legend className="text-label">Estado</legend>
            <div className="flex flex-wrap gap-compact">
              {Object.values(subStatusLabel).map((label) => (
                <Chip key={label} label={label} />
              ))}
            </div>
          </fieldset>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProyectosHoy() {
  const [filters, setFilters] = useState<string[]>(["Activo"]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editing, setEditing] = useState<Project | "nuevo">();
  const [billing, setBilling] = useState<Project>();
  const [cancelling, setCancelling] = useState<Project>();
  const [removing, setRemoving] = useState<Project>();
  const rows = projects.filter(
    (project) =>
      !filters.some((chip) => Object.values(subStatusLabel).includes(chip)) ||
      filters.includes(subStatusLabel[project.status]),
  );
  const columns: DataTableColumn<Project>[] = [
    {
      key: "name",
      header: "Proyecto",
      sortValue: (row) => row.name,
      cell: (row) => (
        <span className="flex items-center gap-compact">
          <span className="grid size-7 shrink-0 place-items-center rounded-pill bg-canvas-sunken text-ink-muted">
            <Icon icon={HardHat} size="xs" />
          </span>
          <span className="flex flex-col items-start">
            <span className="text-label">{row.name}</span>
            <StatusBadge status={row.status} />
          </span>
        </span>
      ),
    },
    {
      key: "company",
      header: "Empresa",
      sortValue: (row) => row.company,
      cell: (row) => row.company,
    },
    {
      key: "location",
      header: "Ubicación",
      cell: (row) => <span className="text-ink-muted">{row.location}</span>,
      hideBelow: "lg",
    },
    {
      key: "surface",
      header: "Superficie",
      align: "end",
      sortValue: (row) => row.surface,
      cell: (row) => `${row.surface.toLocaleString("es-AR")} m²`,
      hideBelow: "md",
    },
    {
      key: "plan",
      header: "Plan",
      cell: (row) => (
        <span className="flex flex-col">
          <span>
            {row.plan ?? <span className="text-ink-muted">Sin plan</span>}
          </span>
          {row.interval ? (
            <span className="text-meta text-ink-muted">{row.interval}</span>
          ) : null}
        </span>
      ),
      hideBelow: "md",
    },
    {
      key: "amount",
      header: "Importe",
      align: "end",
      sortValue: (row) => row.amount ?? 0,
      cell: (row) => (row.amount ? `${usd(row.amount)} / mes` : "—"),
    },
    {
      key: "debt",
      header: "Deuda",
      align: "end",
      sortValue: (row) => row.debt,
      // Hoy «Por cobrar» y «Deuda» son botones que no parecen botones y explican qué hacen solo en un title.
      cell: (row) =>
        row.debt > 0 ? (
          <Button
            variant="ghost"
            size="compact"
            onClick={() => setBilling(row)}
            className="font-semibold text-fn-danger"
          >
            {usd(row.debt)}
            <span className="sr-only">: ver facturación de {row.name}</span>
          </Button>
        ) : (
          <span className="text-ink-muted">—</span>
        ),
    },
  ];
  return (
    <BackofficeShell version="hoy" active="proyectos">
      <div className="flex flex-col gap-block py-block">
        <PageTitle
          title="Proyectos"
          action={
            <Button onClick={() => setEditing("nuevo")}>
              <Icon icon={Plus} /> Nuevo proyecto
            </Button>
          }
        />
        <ListCard
          entity="proyectos"
          caption="Proyectos"
          searchPlaceholder="Buscar por nombre, empresa o ubicación…"
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          onFilters={() => setFiltersOpen(true)}
          chips={filters}
          onRemoveChip={(chip) =>
            setFilters(filters.filter((item) => item !== chip))
          }
          rowActions={(row) => (
            <RowMenu label={`Acciones de ${row.name}`}>
              <MenuItem onSelect={() => setEditing(row)}>Editar</MenuItem>
              <MenuItem onSelect={() => setBilling(row)}>Facturación</MenuItem>
              <MenuItem
                disabled={!row.plan || row.status === "disabled"}
                onSelect={() => setCancelling(row)}
              >
                Cancelar suscripción
              </MenuItem>
              <MenuSeparator />
              <MenuItem tone="danger" onSelect={() => setRemoving(row)}>
                Eliminar
              </MenuItem>
            </RowMenu>
          )}
        />
      </div>
      <ProjectFilters
        key={filters.join()}
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        value={filters}
        onApply={setFilters}
      />
      <ProjectDialog
        project={editing === "nuevo" ? undefined : editing}
        open={editing !== undefined}
        onOpenChange={(value) => (value ? null : setEditing(undefined))}
      />
      <BillingDialog
        project={billing}
        onOpenChange={(value) => (value ? null : setBilling(undefined))}
      />
      <ConfirmDialog
        open={cancelling !== undefined}
        onOpenChange={(value) => (value ? null : setCancelling(undefined))}
        title={`¿Cancelar la suscripción de ${cancelling?.name}?`}
        description="El proyecto pasa a estado Cancelado."
        confirmLabel="Cancelar suscripción"
        tone="danger"
        onConfirm={() => setCancelling(undefined)}
      />
      <ConfirmDialog
        open={removing !== undefined}
        onOpenChange={(value) => (value ? null : setRemoving(undefined))}
        title={`¿Eliminar ${removing?.name}?`}
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar proyecto"
        tone="danger"
        onConfirm={() => setRemoving(undefined)}
      />
    </BackofficeShell>
  );
}

/* ================================================================== Empresas */

function CompanyDialog({
  company,
  open,
  onOpenChange,
}: {
  company?: Company;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const editing = company !== undefined;
  const [owner, setOwner] = useState<string>();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="wide"
        title={editing ? "Editar empresa" : "Nueva empresa"}
        description={
          editing
            ? "Actualizá los datos de la empresa."
            : "Completá los datos para registrar una nueva empresa."
        }
        footer={
          <>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={() => onOpenChange(false)}>
              {editing ? "Guardar cambios" : "Crear empresa"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-group">
          <Field label="Nombre" required>
            <Input defaultValue={company?.name} placeholder="Grupo Álamo" />
          </Field>
          <Field label="Razón social" optional>
            <Input
              defaultValue={company?.legalName}
              placeholder="Grupo Álamo S.A."
            />
          </Field>
          <div className="grid gap-snug sm:grid-cols-2">
            <Field label="País" optional>
              <Input defaultValue={company?.country} placeholder="Argentina" />
            </Field>
            {/* Hoy dice «CUIT / Tax ID». */}
            <Field label="CUIT o identificación fiscal" optional>
              <Input
                defaultValue={company?.taxId}
                placeholder="30-12345678-9"
              />
            </Field>
          </div>
          {editing ? (
            <section
              aria-labelledby="miembros"
              className="flex flex-col gap-compact"
            >
              <h3 id="miembros" className="text-label">
                Miembros por rol
              </h3>
              <p className="text-meta text-ink-muted">
                Owner y Admin entran a todas las obras. No van al equipo ni
                ocupan lugar del plan.
              </p>
              {["Owner", "Admin", "Facturación", "Miembro"].map((role) => (
                <div
                  key={role}
                  className="flex items-center justify-between rounded-control border border-line p-snug"
                >
                  <span className="text-body">
                    {role}{" "}
                    <span className="text-ink-muted">
                      · {role === "Owner" ? 1 : role === "Admin" ? 2 : 0}
                    </span>
                  </span>
                  <Button variant="ghost" size="compact">
                    <Icon icon={Plus} size="xs" /> Agregar
                    <span className="sr-only"> {role}</span>
                  </Button>
                </div>
              ))}
            </section>
          ) : (
            <Field
              label="Owner"
              required
              description="La persona dueña de la cuenta de la empresa."
            >
              <Combobox
                options={users.map((user) => ({
                  value: user.id,
                  label: user.name,
                  description: user.email,
                }))}
                value={owner}
                onValueChange={setOwner}
                placeholder="Buscar por nombre o mail…"
                searchPlaceholder="Buscar usuario"
                emptyText="No encontramos usuarios con esa búsqueda."
              />
            </Field>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmpresasHoy() {
  const [editing, setEditing] = useState<Company | "nueva">();
  const [removing, setRemoving] = useState<Company>();
  const columns: DataTableColumn<Company>[] = [
    {
      key: "name",
      header: "Empresa",
      sortValue: (row) => row.name,
      cell: (row) => (
        <span className="flex items-center gap-compact text-label">
          <Icon icon={Building2} size="xs" className="text-ink-muted" />{" "}
          {row.name}
        </span>
      ),
    },
    {
      key: "owner",
      header: "Owner",
      cell: (row) =>
        row.owner ? (
          <span className="flex flex-col">
            <span>{row.owner.name}</span>
            <span className="text-meta text-ink-muted">{row.owner.email}</span>
          </span>
        ) : (
          <span className="text-ink-muted">Sin owner</span>
        ),
    },
    {
      key: "legal",
      header: "Razón social",
      cell: (row) => row.legalName || "—",
      hideBelow: "lg",
    },
    {
      key: "country",
      header: "País",
      cell: (row) => row.country,
      hideBelow: "md",
    },
    {
      key: "tax",
      header: "CUIT",
      cell: (row) => row.taxId || "—",
      hideBelow: "lg",
    },
    {
      key: "members",
      header: "Miembros",
      align: "end",
      sortValue: (row) => row.members,
      cell: (row) => row.members,
    },
    {
      key: "created",
      header: "Alta",
      cell: (row) => row.createdAt,
      hideBelow: "md",
    },
  ];
  return (
    <BackofficeShell version="hoy" active="empresas">
      <div className="flex flex-col gap-block py-block">
        <PageTitle
          title="Empresas"
          action={
            <Button onClick={() => setEditing("nueva")}>
              <Icon icon={Plus} /> Nueva empresa
            </Button>
          }
        />
        <ListCard
          entity="empresas"
          caption="Empresas"
          searchPlaceholder="Buscar por nombre, razón social o CUIT…"
          rows={companies}
          columns={columns}
          getRowId={(row) => row.id}
          rowActions={(row) => (
            <RowMenu label={`Acciones de ${row.name}`}>
              <MenuItem onSelect={() => setEditing(row)}>Editar</MenuItem>
              <MenuSeparator />
              <MenuItem tone="danger" onSelect={() => setRemoving(row)}>
                Eliminar
              </MenuItem>
            </RowMenu>
          )}
        />
      </div>
      <CompanyDialog
        key={editing === "nueva" ? "nueva" : editing?.id}
        company={editing === "nueva" ? undefined : editing}
        open={editing !== undefined}
        onOpenChange={(value) => (value ? null : setEditing(undefined))}
      />
      <ConfirmDialog
        open={removing !== undefined}
        onOpenChange={(value) => (value ? null : setRemoving(undefined))}
        title={`¿Eliminar ${removing?.name}?`}
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar empresa"
        tone="danger"
        onConfirm={() => setRemoving(undefined)}
      />
    </BackofficeShell>
  );
}

/* ================================================================== Usuarios */

function NewUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [sent, setSent] = useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => (
        onOpenChange(value),
        value ? null : setSent(false)
      )}
    >
      <DialogContent
        title="Nuevo usuario"
        description="Completá los datos y le mandamos un mail con un enlace para confirmar el registro y crear su contraseña."
        footer={
          sent ? (
            <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setSent(true)}>Crear usuario</Button>
            </>
          )
        }
      >
        <div className="flex flex-col gap-group">
          <div className="grid gap-snug sm:grid-cols-2">
            <Field label="Nombre" required>
              <Input disabled={sent} autoComplete="off" />
            </Field>
            <Field label="Apellido" optional>
              <Input disabled={sent} autoComplete="off" />
            </Field>
          </div>
          <Field label="Mail" required>
            <Input
              type="email"
              disabled={sent}
              defaultValue={sent ? "carla.mendez@gmail.com" : undefined}
              placeholder="correo@ejemplo.com"
            />
          </Field>
          <Field label="Teléfono" optional>
            <Input
              type="tel"
              disabled={sent}
              placeholder="+54 9 351 123 4567"
            />
          </Field>
          {sent ? (
            <Notice tone="ok">
              Le mandamos un mail a carla.mendez@gmail.com para que complete el
              registro y cree su contraseña.
            </Notice>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UsuariosHoy() {
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<AdminUser>();
  const columns: DataTableColumn<AdminUser>[] = [
    {
      key: "name",
      header: "Usuario",
      sortValue: (row) => row.name,
      cell: (row) => (
        <span className="flex items-center gap-compact">
          <Avatar name={row.name} size="sm" />
          <span className="flex flex-col items-start">
            <span className="text-label">{row.name}</span>
            <Badge tone={row.active ? "ok" : "neutral"} size="compact">
              {row.active ? "Activo" : "Inactivo"}
            </Badge>
          </span>
        </span>
      ),
    },
    { key: "email", header: "Mail", cell: (row) => row.email, hideBelow: "md" },
    {
      key: "phone",
      header: "Teléfono",
      cell: (row) => row.phone ?? "—",
      hideBelow: "lg",
    },
    {
      key: "company",
      header: "Empresa",
      cell: (row) =>
        row.companies.length ? (
          `${row.companies[0]}${row.companies.length > 1 ? ` +${row.companies.length - 1}` : ""}`
        ) : (
          <span className="text-ink-muted">Sin empresa</span>
        ),
    },
    {
      key: "projects",
      header: "Colaborador",
      cell: (row) =>
        row.projects === 1 ? "1 proyecto" : `${row.projects} proyectos`,
      hideBelow: "lg",
    },
    {
      key: "created",
      header: "Alta",
      cell: (row) => row.createdAt,
      hideBelow: "md",
    },
  ];
  return (
    <BackofficeShell version="hoy" active="usuarios">
      <div className="flex flex-col gap-block py-block">
        <PageTitle
          title="Usuarios"
          action={
            <Button onClick={() => setCreating(true)}>
              <Icon icon={Plus} /> Nuevo usuario
            </Button>
          }
        />
        <ListCard
          entity="usuarios"
          caption="Usuarios"
          searchPlaceholder="Buscar por nombre, mail o empresa…"
          rows={users}
          columns={columns}
          getRowId={(row) => row.id}
          onFilters={() => undefined}
          footerExtra={`${users.filter((user) => user.active).length} confirmados en total`}
          rowActions={(row) => (
            <RowMenu label={`Acciones de ${row.name}`}>
              {row.active ? null : <MenuItem>Activar</MenuItem>}
              <MenuItem tone="danger" onSelect={() => setRemoving(row)}>
                Eliminar
              </MenuItem>
            </RowMenu>
          )}
        />
      </div>
      <NewUserDialog open={creating} onOpenChange={setCreating} />
      <ConfirmDialog
        open={removing !== undefined}
        onOpenChange={(value) => (value ? null : setRemoving(undefined))}
        title={`¿Eliminar la cuenta de ${removing?.name}?`}
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar usuario"
        tone="danger"
        onConfirm={() => setRemoving(undefined)}
      />
    </BackofficeShell>
  );
}

/* ================================================================== Clientes */

function ClientesHoy() {
  const columns: DataTableColumn<ClientRow>[] = [
    {
      key: "client",
      header: "Cliente",
      cell: (row) =>
        row.owner ? (
          <span className="flex items-center gap-compact">
            <Avatar name={row.owner.name} size="sm" />
            <span className="flex flex-col">
              <span className="text-label">{row.owner.name}</span>
              <span className="text-meta text-ink-muted">
                {row.owner.email}
              </span>
            </span>
          </span>
        ) : (
          <span className="flex items-center gap-compact text-ink-muted">
            <Icon icon={Building2} size="xs" /> Sin owner
          </span>
        ),
    },
    {
      key: "company",
      header: "Empresa",
      sortValue: (row) => row.company,
      cell: (row) => row.company,
    },
    {
      key: "projects",
      header: "Proyectos",
      align: "end",
      cell: (row) => row.projects,
      hideBelow: "md",
    },
    {
      key: "plans",
      header: "Planes",
      cell: (row) =>
        row.plans.length ? (
          <ul className="text-meta">
            {row.plans.map((plan) => (
              <li key={plan}>{plan}</li>
            ))}
          </ul>
        ) : (
          <span className="text-ink-muted">Sin planes</span>
        ),
      hideBelow: "lg",
    },
    {
      key: "status",
      header: "Estado",
      cell: (row) =>
        (Object.keys(row.status) as SubStatus[])
          .map(
            (status) =>
              `${row.status[status]} ${subStatusLabel[status].toLowerCase()}${(row.status[status] ?? 0) > 1 ? "s" : ""}`,
          )
          .join(" · "),
      hideBelow: "md",
    },
    {
      key: "monthly",
      header: "Pago mensual",
      align: "end",
      sortValue: (row) => row.monthly,
      cell: (row) => (row.monthly ? `${usd(row.monthly)} / mes` : "—"),
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
    <BackofficeShell version="hoy" active="clientes">
      <div className="flex flex-col gap-block py-block">
        <PageTitle
          title="Clientes"
          subtitle="Empresas con su owner, proyectos, planes y facturación consolidada."
        />
        <ListCard
          entity="clientes"
          caption="Clientes"
          searchPlaceholder="Buscar por cliente, empresa o proyecto…"
          rows={clients}
          columns={columns}
          getRowId={(row) => row.id}
          footerExtra={`${usd(clients.reduce((sum, row) => sum + row.monthly, 0))} / mes en página · ${usd(clients.reduce((sum, row) => sum + row.debt, 0))} de deuda en página`}
        />
      </div>
    </BackofficeShell>
  );
}

/* ------------------------------------------------------------------ Historias */

const meta = {
  title: "Pantallas/Backoffice/Como hoy",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;

export const Dashboard: StoryObj = {
  name: "Dashboard",
  render: () => <DashboardHoy />,
};
export const Clientes: StoryObj = {
  name: "Clientes",
  render: () => <ClientesHoy />,
};
export const Usuarios: StoryObj = {
  name: "Usuarios",
  render: () => <UsuariosHoy />,
};
export const Empresas: StoryObj = {
  name: "Empresas",
  render: () => <EmpresasHoy />,
};
export const Proyectos: StoryObj = {
  name: "Proyectos",
  render: () => <ProyectosHoy />,
};
