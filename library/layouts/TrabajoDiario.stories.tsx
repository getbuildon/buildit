import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Calendar, ClipboardList, Plus } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Badge, type BadgeProps } from "../atoms/badge/Badge";
import { Button } from "../atoms/button/Button";
import { Icon } from "../atoms/icon/Icon";
import { Skeleton } from "../atoms/skeleton/Skeleton";
import { formatDate } from "../foundations/format/format";
import { Combobox } from "../molecules/combobox/Combobox";
import { DatePicker } from "../molecules/date-picker/DatePicker";
import { DateRangePicker } from "../molecules/date-picker/DateRangePicker";
import { EmptyState } from "../molecules/empty-state/EmptyState";
import { Field } from "../molecules/field/Field";
import { Segmented } from "../molecules/segmented/Segmented";
import { Select, SelectItem } from "../molecules/select/Select";
import {
  DataTable,
  type DataTableColumn,
} from "../organisms/data-table/DataTable";
import { ListToolbar } from "../organisms/list-toolbar/ListToolbar";
import { PageHeader } from "../organisms/page-header/PageHeader";
import { Sheet, SheetContent } from "../organisms/sheet/Sheet";
import {
  MobileHeaderToday,
  SidebarProposal,
  SidebarToday,
  TopbarProposal,
} from "./obra/ObraShell";
import { WorkspaceLayout } from "./workspace/WorkspaceLayout";

/* Trabajo diario (app/project/[projectId]/trabajo-diario): la lista de trabajos cargados
   con sus filtros. El modo «Cargar nuevo avance» y el detalle de un trabajo van aparte. */

/* ------------------------------------------------------------------ Datos */

type Status = "Completado" | "En Proceso" | "Bloqueado" | "Certificada";

type Task = {
  id: string;
  code: string;
  name: string;
  category: string;
  floorId: string;
  floor: string;
  unitId: string;
  unit: string;
  date: Date;
  status: Status;
  by: string;
};

const day = (dayOfMonth: number) =>
  new Date(Date.UTC(2026, 10, dayOfMonth, 15));
const today = day(18);

const floorsData = [
  {
    id: "pb",
    name: "Planta Baja",
    units: [
      { id: "pb-01", code: "PB-01" },
      { id: "pb-02", code: "PB-02" },
    ],
  },
  {
    id: "p1",
    name: "Piso 1",
    units: [
      { id: "1a", code: "1A" },
      { id: "1b", code: "1B" },
      { id: "1c", code: "1C" },
    ],
  },
  {
    id: "p2",
    name: "Piso 2",
    units: [
      { id: "2a", code: "2A" },
      { id: "2b", code: "2B" },
    ],
  },
  {
    id: "p3",
    name: "Piso 3",
    units: [
      { id: "3a", code: "3A" },
      { id: "3b", code: "3B" },
    ],
  },
];

const t = (
  id: string,
  code: string,
  name: string,
  category: string,
  floorId: string,
  unitId: string,
  dayOfMonth: number,
  status: Status,
  by = "Martín Gómez",
): Task => {
  const floor = floorsData.find((item) => item.id === floorId)!;
  const unit = floor.units.find((item) => item.id === unitId)!;
  return {
    id,
    code,
    name,
    category,
    floorId,
    floor: floor.name,
    unitId,
    unit: unit.code,
    date: day(dayOfMonth),
    status,
    by,
  };
};

const tasks: Task[] = [
  t(
    "1",
    "ALB-014",
    "Revoque grueso",
    "Albañilería",
    "p1",
    "1a",
    18,
    "En Proceso",
  ),
  t(
    "2",
    "ELE-031",
    "Cableado de tomas",
    "Instalación eléctrica",
    "p1",
    "1a",
    18,
    "Bloqueado",
    "Sofía Ruiz",
  ),
  t(
    "3",
    "SAN-008",
    "Bajadas pluviales",
    "Instalación sanitaria",
    "p3",
    "3a",
    17,
    "Bloqueado",
    "Sofía Ruiz",
  ),
  t(
    "4",
    "ALB-011",
    "Mampostería de ladrillo hueco",
    "Albañilería",
    "p3",
    "3b",
    17,
    "Bloqueado",
  ),
  t(
    "5",
    "PIN-002",
    "Enduido de paredes",
    "Pintura",
    "pb",
    "pb-01",
    16,
    "Completado",
  ),
  t(
    "6",
    "ALB-014",
    "Revoque grueso",
    "Albañilería",
    "p1",
    "1b",
    15,
    "Completado",
  ),
  t(
    "7",
    "CAR-005",
    "Colocación de marcos",
    "Carpintería",
    "p2",
    "2a",
    14,
    "En Proceso",
    "Diego Paz",
  ),
  t(
    "8",
    "ELE-030",
    "Cañerías embutidas",
    "Instalación eléctrica",
    "p2",
    "2b",
    12,
    "Certificada",
    "Sofía Ruiz",
  ),
  t(
    "9",
    "PIS-003",
    "Contrapiso",
    "Pisos",
    "p1",
    "1c",
    10,
    "Certificada",
    "Diego Paz",
  ),
  t(
    "10",
    "ALB-009",
    "Carpeta niveladora",
    "Albañilería",
    "pb",
    "pb-02",
    6,
    "Certificada",
  ),
  t("11", "PIN-001", "Imprimación", "Pintura", "pb", "pb-01", 4, "Completado"),
  t(
    "12",
    "SAN-006",
    "Montantes de agua",
    "Instalación sanitaria",
    "p2",
    "2a",
    2,
    "Certificada",
    "Sofía Ruiz",
  ),
];

const statusTone: Record<Status, NonNullable<BadgeProps["tone"]>> = {
  Completado: "ok",
  "En Proceso": "caution",
  Bloqueado: "danger",
  Certificada: "info",
};

/** sentence: «En proceso» (la propuesta); si no, como hoy: «En Proceso». */
function StatusBadge({
  status,
  sentence = false,
}: {
  status: Status;
  sentence?: boolean;
}) {
  return (
    <Badge tone={statusTone[status]} className="rounded-compact">
      {sentence ? status.charAt(0) + status.slice(1).toLowerCase() : status}
    </Badge>
  );
}

const inRange = (date: Date, from?: Date, to?: Date) => {
  const time = date.getTime();
  if (from && time < new Date(from).setHours(0, 0, 0, 0)) return false;
  if (to && time > new Date(to).setHours(23, 59, 59, 999)) return false;
  return true;
};

/* ================================================================== Como hoy */

const ALL_FLOORS = "todos-los-niveles";
const ALL_UNITS = "todas-las-unidades";

function TaskRow({ task }: { task: Task }) {
  return (
    <li>
      {/* Hoy el nombre es un <h3> adentro del botón: el lector de pantalla pierde el
          título y el botón queda con un nombre larguísimo. Acá el botón se nombra con la
          tarea y el resto queda como descripción. */}
      <button
        type="button"
        aria-describedby={`tarea-${task.id}-detalle`}
        className="focus-ring motion-color flex w-full cursor-pointer flex-col gap-snug rounded-control border border-line p-3.5 text-left hover:border-line-strong hover:bg-surface-hover sm:flex-row sm:items-center sm:justify-between"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-related">
          <span className="flex flex-wrap items-center gap-x-compact gap-y-related">
            <span className="font-mono text-meta text-ink-muted">
              {task.code}
            </span>
            <span className="text-body text-ink">{task.name}</span>
            <span className="text-meta text-ink-subtle">{task.category}</span>
          </span>
          <span
            id={`tarea-${task.id}-detalle`}
            className="flex flex-wrap items-center gap-x-compact gap-y-0.5 text-meta text-ink-muted"
          >
            <span>{task.floor}</span>
            <span aria-hidden>•</span>
            <span>{task.unit}</span>
            <span aria-hidden>•</span>
            <span>{formatDate(task.date, "compact")}</span>
            <span className="sr-only">, {task.status}</span>
          </span>
        </span>
        <span aria-hidden className="self-start sm:self-center">
          <StatusBadge status={task.status} />
        </span>
      </button>
    </li>
  );
}

function TrabajosCargados({ list }: { list: Task[] }) {
  const [from, setFrom] = useState<Date | undefined>(day(1));
  const [to, setTo] = useState<Date | undefined>(day(30));
  const [floorId, setFloorId] = useState(ALL_FLOORS);
  const [unitId, setUnitId] = useState(ALL_UNITS);
  const floor = floorsData.find((item) => item.id === floorId);
  const visible = list.filter(
    (task) =>
      (floorId === ALL_FLOORS || task.floorId === floorId) &&
      (unitId === ALL_UNITS || task.unitId === unitId) &&
      inRange(task.date, from, to),
  );

  return (
    <section
      aria-labelledby="trabajos-cargados"
      className="rounded-surface border border-line bg-canvas-raised p-group shadow-hint sm:p-block"
    >
      <h2
        id="trabajos-cargados"
        className="mb-group text-section font-regular sm:mb-block"
      >
        Trabajos Cargados
      </h2>
      <div className="mb-group grid grid-cols-1 gap-group sm:mb-block sm:grid-cols-2 md:grid-cols-4">
        <Field label="Desde">
          <DatePicker
            value={from}
            max={to}
            onChange={(date) => {
              if (!date) return;
              setFrom(date);
              if (to && date > to) setTo(date);
            }}
          />
        </Field>
        <Field label="Hasta">
          <DatePicker
            value={to}
            min={from}
            onChange={(date) => {
              if (!date) return;
              setTo(date);
              if (from && date < from) setFrom(date);
            }}
          />
        </Field>
        <Field label="Nivel">
          <Select
            value={floorId}
            onValueChange={(value) => {
              setFloorId(value);
              setUnitId(ALL_UNITS);
            }}
          >
            <SelectItem value={ALL_FLOORS}>Todos los niveles</SelectItem>
            {floorsData.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </Select>
        </Field>
        <Field
          label="Unidad"
          description={floor ? undefined : "Seleccioná un nivel primero"}
        >
          <Select
            value={floor ? unitId : undefined}
            onValueChange={setUnitId}
            disabled={!floor}
            placeholder="Todas las unidades"
          >
            <SelectItem value={ALL_UNITS}>Todas las unidades</SelectItem>
            {floor?.units.map((unit) => (
              <SelectItem key={unit.id} value={unit.id}>
                {unit.code}
              </SelectItem>
            ))}
          </Select>
        </Field>
      </div>
      {visible.length === 0 ? (
        <p
          role="status"
          className="rounded-control border border-dashed border-line px-group py-8 text-center text-body text-ink-muted"
        >
          No hay trabajos cargados para los filtros seleccionados.
        </p>
      ) : (
        <>
          <p role="status" className="sr-only">
            {visible.length} trabajos
          </p>
          <ul className="flex flex-col gap-compact">
            {visible.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

type TodayState = "datos" | "cargando" | "vacio";

function TrabajoDiarioHoy({ state = "datos" }: { state?: TodayState }) {
  return (
    <WorkspaceLayout
      sidebar={<SidebarToday active="trabajo-diario" />}
      topbar={<MobileHeaderToday active="trabajo-diario" />}
    >
      <div className="flex flex-col gap-group py-compact sm:gap-block sm:py-block">
        {state === "cargando" ? (
          <div
            role="status"
            aria-busy
            className="flex flex-col gap-group sm:gap-block"
          >
            <span className="sr-only">Cargando el trabajo diario…</span>
            <div className="flex flex-col gap-group sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-compact">
                <Skeleton className="h-8 w-50" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-control-large w-full rounded-control sm:w-52" />
            </div>
            <div className="flex flex-col gap-group rounded-surface border border-line bg-canvas-raised p-group shadow-hint sm:p-block">
              <Skeleton className="h-6 w-45" />
              <div className="grid grid-cols-1 gap-group sm:grid-cols-2 md:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="flex flex-col gap-compact">
                    <Skeleton className="h-3 w-14" />
                    <Skeleton className="h-control rounded-control" />
                  </div>
                ))}
              </div>
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-16 rounded-control" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-group sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-compact">
                <h1 className="text-title">Trabajo Diario</h1>
                <p className="flex items-center gap-compact text-body text-ink-muted">
                  <Icon icon={Calendar} />
                  {formatDate(today, "long")}
                </p>
              </div>
              <Button size="large" className="w-full sm:w-auto">
                <Icon icon={Plus} size="md" /> Cargar nuevo avance
              </Button>
            </div>
            <TrabajosCargados list={state === "vacio" ? [] : tasks} />
          </>
        )}
      </div>
    </WorkspaceLayout>
  );
}

/* ================================================================== Propuesta */

const locationOptions = floorsData.flatMap((floor) => [
  { value: `nivel:${floor.id}`, label: `${floor.name} (todo el nivel)` },
  ...floor.units.map((unit) => ({
    value: `unidad:${unit.id}`,
    label: unit.code,
    description: floor.name,
  })),
]);

const statusFilters = [
  "Todos",
  "En Proceso",
  "Bloqueado",
  "Completado",
  "Certificada",
] as const;

const columnsFor = (onOpen: (id: string) => void): DataTableColumn<Task>[] => [
  {
    key: "date",
    header: "Fecha",
    width: "6rem",
    sortValue: (row) => row.date,
    cell: (row) => (
      <span className="tabular-nums">{formatDate(row.date, "compact")}</span>
    ),
  },
  {
    key: "task",
    header: "Tarea",
    sortValue: (row) => row.name,
    cell: (row) => (
      <span className="flex min-w-0 flex-col">
        <button
          type="button"
          onClick={() => onOpen(row.id)}
          className="focus-ring cursor-pointer self-start truncate rounded-box text-left text-label text-ink underline-offset-4 hover:underline"
        >
          {row.name}
        </button>
        <span className="font-mono text-meta text-ink-muted">{row.code}</span>
        {/* En pantallas chicas, la ubicación y el estado van acá (sus columnas se ocultan). */}
        <span className="text-meta text-ink-muted md:hidden">
          {row.floor} · {row.unit}
        </span>
        <span className="mt-related sm:hidden">
          <StatusBadge status={row.status} sentence />
        </span>
      </span>
    ),
  },
  {
    key: "category",
    header: "Rubro",
    sortValue: (row) => row.category,
    cell: (row) => row.category,
    hideBelow: "lg",
  },
  {
    key: "location",
    header: "Ubicación",
    sortValue: (row) => `${row.floor} ${row.unit}`,
    cell: (row) => (
      <span>
        {row.floor} · {row.unit}
      </span>
    ),
    hideBelow: "md",
  },
  {
    key: "by",
    header: "Cargó",
    sortValue: (row) => row.by,
    cell: (row) => row.by,
    hideBelow: "lg",
  },
  {
    key: "status",
    header: "Estado",
    sortValue: (row) => row.status,
    cell: (row) => <StatusBadge status={row.status} sentence />,
    hideBelow: "sm",
  },
];

function TaskDetail({
  task,
  onClose,
}: {
  task: Task | undefined;
  onClose: () => void;
}) {
  return (
    <Sheet
      open={task !== undefined}
      onOpenChange={(open) => (open ? null : onClose())}
    >
      {task ? (
        <SheetContent
          title={task.name}
          description={`${task.code} · ${task.category}`}
          footer={
            <>
              <Button variant="outline" onClick={onClose}>
                Editar
              </Button>
              {/* Solo se certifica lo completado. */}
              {task.status === "Completado" ? (
                <Button>Certificar</Button>
              ) : null}
            </>
          }
        >
          <dl className="grid grid-cols-[auto_1fr] gap-x-block gap-y-snug p-group text-body">
            <dt className="text-ink-muted">Estado</dt>
            <dd>
              <StatusBadge status={task.status} sentence />
            </dd>
            <dt className="text-ink-muted">Ubicación</dt>
            <dd>
              {task.floor} · {task.unit}
            </dd>
            <dt className="text-ink-muted">Fecha</dt>
            <dd>{formatDate(task.date, "table")}</dd>
            <dt className="text-ink-muted">Cargó</dt>
            <dd>{task.by}</dd>
          </dl>
        </SheetContent>
      ) : null}
    </Sheet>
  );
}

function TrabajoDiarioPropuesta() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("Todos");
  const [range, setRange] = useState<DateRange | undefined>({
    from: day(1),
    to: day(30),
  });
  const [location, setLocation] = useState<string | undefined>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string>();

  const byFilters = useMemo(
    () =>
      tasks.filter((task) => {
        const text = `${task.code} ${task.name} ${task.category}`.toLowerCase();
        if (query && !text.includes(query.toLowerCase())) return false;
        if (!inRange(task.date, range?.from, range?.to)) return false;
        if (
          location?.startsWith("nivel:") &&
          task.floorId !== location.slice(6)
        )
          return false;
        if (
          location?.startsWith("unidad:") &&
          task.unitId !== location.slice(7)
        )
          return false;
        return true;
      }),
    [query, range, location],
  );
  const rows =
    status === "Todos"
      ? byFilters
      : byFilters.filter((task) => task.status === status);
  const countOf = (value: string) =>
    value === "Todos"
      ? byFilters.length
      : byFilters.filter((task) => task.status === value).length;

  return (
    <WorkspaceLayout
      sidebar={<SidebarProposal active="trabajo-diario" />}
      topbar={<TopbarProposal active="trabajo-diario" />}
      header={
        <PageHeader
          title="Trabajo diario"
          description={`Lo que cargó el equipo en la obra. Hoy es ${formatDate(today, "long").toLowerCase()}.`}
          actions={
            <Button>
              <Icon icon={Plus} /> Cargar avance
            </Button>
          }
        />
      }
      toolbar={
        <div className="flex flex-col gap-snug">
          <Segmented
            label="Filtrar por estado"
            value={status}
            onValueChange={setStatus}
            className="max-w-full self-start overflow-x-auto"
            options={statusFilters.map((value) => ({
              value,
              label: (
                <span className="flex items-center gap-related whitespace-nowrap">
                  {value === "En Proceso" ? "En proceso" : value}
                  <span className="text-meta text-ink-muted tabular-nums">
                    {countOf(value)}
                  </span>
                </span>
              ),
            }))}
          />
          <ListToolbar
            search={{
              value: query,
              onChange: setQuery,
              placeholder: "Buscar tarea, código o rubro",
              label: "Buscar trabajos",
            }}
            filters={
              <>
                <DateRangePicker
                  value={range}
                  onChange={setRange}
                  size="compact"
                  aria-label="Período"
                  className="w-60"
                />
                <Combobox
                  options={locationOptions}
                  value={location}
                  onValueChange={setLocation}
                  placeholder="Toda la obra"
                  searchPlaceholder="Buscar nivel o unidad"
                  size="compact"
                  aria-label="Ubicación"
                  className="w-48"
                />
              </>
            }
            count={`${rows.length} ${rows.length === 1 ? "trabajo" : "trabajos"}`}
            selection={{
              count: selected.size,
              onClear: () => setSelected(new Set()),
              actions: (
                <Button size="compact" variant="outline">
                  Certificar
                </Button>
              ),
            }}
          />
        </div>
      }
    >
      <DataTable
        caption="Trabajos cargados en Torre Alamo"
        columns={columnsFor(setOpenId)}
        rows={rows}
        getRowId={(row) => row.id}
        defaultSort={{ key: "date", direction: "desc" }}
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={
          <EmptyState
            icon={ClipboardList}
            size="compact"
            title="No hay trabajos con estos filtros"
            description="Probá con otro período o con toda la obra."
            action={
              <Button
                variant="outline"
                size="compact"
                onClick={() => {
                  setQuery("");
                  setStatus("Todos");
                  setLocation(undefined);
                  setRange({ from: day(1), to: day(30) });
                }}
              >
                Quitar filtros
              </Button>
            }
          />
        }
      />
      <TaskDetail
        task={tasks.find((task) => task.id === openId)}
        onClose={() => setOpenId(undefined)}
      />
    </WorkspaceLayout>
  );
}

/* ------------------------------------------------------------------ Historias */

const meta = {
  title: "Pantallas/Obra/Trabajo diario",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;

export const ComoHoy: StoryObj = {
  name: "Como hoy",
  render: () => <TrabajoDiarioHoy />,
};
export const ComoHoyCargando: StoryObj = {
  name: "Como hoy · cargando",
  render: () => <TrabajoDiarioHoy state="cargando" />,
};
export const ComoHoySinTrabajos: StoryObj = {
  name: "Como hoy · sin trabajos",
  render: () => <TrabajoDiarioHoy state="vacio" />,
};
export const Propuesta: StoryObj = {
  name: "Propuesta",
  render: () => <TrabajoDiarioPropuesta />,
};
