import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  Clock,
  Eye,
  Info,
  ListTodo,
  MessageCircle,
  ShieldCheck,
  Timer,
  Undo2,
} from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Avatar } from "../atoms/avatar/Avatar";
import { Badge } from "../atoms/badge/Badge";
import { Button } from "../atoms/button/Button";
import { IconButton } from "../atoms/button/IconButton";
import { Checkbox } from "../atoms/checkbox/Checkbox";
import { Icon } from "../atoms/icon/Icon";
import { Textarea } from "../atoms/input/Input";
import { Label } from "../atoms/label/Label";
import { cn } from "../lib/cn";
import { Combobox } from "../molecules/combobox/Combobox";
import { DatePicker } from "../molecules/date-picker/DatePicker";
import { DateRangePicker } from "../molecules/date-picker/DateRangePicker";
import { Dialog, DialogContent } from "../molecules/dialog/Dialog";
import { EmptyState } from "../molecules/empty-state/EmptyState";
import { Field } from "../molecules/field/Field";
import { Segmented } from "../molecules/segmented/Segmented";
import { Select, SelectItem } from "../molecules/select/Select";
import {
  DataTable,
  type DataTableColumn,
} from "../organisms/data-table/DataTable";
import { ListToolbar } from "../organisms/list-toolbar/ListToolbar";
import { MetricCard, MetricStrip } from "../organisms/metric/Metric";
import { PageHeader } from "../organisms/page-header/PageHeader";
import { Sheet, SheetContent } from "../organisms/sheet/Sheet";
import {
  MobileHeaderToday,
  SidebarProposal,
  SidebarToday,
  TopbarProposal,
} from "./obra/ObraShell";
import { WorkspaceLayout } from "./workspace/WorkspaceLayout";

/* Certificaciones (app/project/[projectId]/certificaciones): revisar los avances que
   cargó el equipo y certificarlos, de a uno o varios juntos. */

/* ------------------------------------------------------------------ Datos */

type Task = {
  id: string;
  code: string;
  name: string;
  rubro: string;
  floor: string;
  unit: string;
  author: string;
  date: string;
  time: string;
  dayOfMonth: number;
  comment?: string;
  daysPending: number;
  photos: number;
  status: "pending" | "certified";
  certifiedBy?: string;
  certifiedDate?: string;
};

const members = ["Sofía Ruiz", "Martín Gómez", "Diego Paz"];

const tasks: Task[] = [
  {
    id: "1",
    code: "SAN-006",
    name: "Montantes de agua",
    rubro: "Instalación sanitaria",
    floor: "Piso 2",
    unit: "2A",
    author: "Sofía Ruiz",
    date: "2 nov",
    time: "10:20 h",
    dayOfMonth: 2,
    daysPending: 16,
    photos: 3,
    status: "pending",
    comment: "Probado a presión, sin pérdidas.",
  },
  {
    id: "2",
    code: "ALB-009",
    name: "Carpeta niveladora",
    rubro: "Albañilería",
    floor: "Planta Baja",
    unit: "PB-02",
    author: "Martín Gómez",
    date: "6 nov",
    time: "15:05 h",
    dayOfMonth: 6,
    daysPending: 12,
    photos: 1,
    status: "pending",
  },
  {
    id: "3",
    code: "PIS-003",
    name: "Contrapiso",
    rubro: "Pisos",
    floor: "Piso 1",
    unit: "1C",
    author: "Diego Paz",
    date: "10 nov",
    time: "09:40 h",
    dayOfMonth: 10,
    daysPending: 8,
    photos: 2,
    status: "pending",
    comment: "Falta curar dos días más en el sector del baño.",
  },
  {
    id: "4",
    code: "PIN-002",
    name: "Enduido de paredes",
    rubro: "Pintura",
    floor: "Planta Baja",
    unit: "PB-01",
    author: "Martín Gómez",
    date: "13 nov",
    time: "17:30 h",
    dayOfMonth: 13,
    daysPending: 5,
    photos: 2,
    status: "pending",
  },
  {
    id: "5",
    code: "ALB-014",
    name: "Revoque grueso",
    rubro: "Albañilería",
    floor: "Piso 1",
    unit: "1B",
    author: "Martín Gómez",
    date: "15 nov",
    time: "11:15 h",
    dayOfMonth: 15,
    daysPending: 3,
    photos: 0,
    status: "pending",
  },
  {
    id: "6",
    code: "ELE-031",
    name: "Cableado de tomas",
    rubro: "Instalación eléctrica",
    floor: "Piso 1",
    unit: "1A",
    author: "Sofía Ruiz",
    date: "18 nov",
    time: "16:40 h",
    dayOfMonth: 18,
    daysPending: 1,
    photos: 2,
    status: "pending",
    comment: "Se terminó el cableado de los 6 tomas del living y la cocina.",
  },
  {
    id: "7",
    code: "ELE-030",
    name: "Cañerías embutidas",
    rubro: "Instalación eléctrica",
    floor: "Piso 2",
    unit: "2B",
    author: "Sofía Ruiz",
    date: "14 nov",
    time: "12:00 h",
    dayOfMonth: 12,
    daysPending: 0,
    photos: 1,
    status: "certified",
    certifiedBy: "Lucía Fernández",
    certifiedDate: "14 nov · 12:00 h",
  },
  {
    id: "8",
    code: "PIN-001",
    name: "Imprimación",
    rubro: "Pintura",
    floor: "Planta Baja",
    unit: "PB-01",
    author: "Martín Gómez",
    date: "9 nov",
    time: "18:10 h",
    dayOfMonth: 4,
    daysPending: 0,
    photos: 0,
    status: "certified",
    certifiedBy: "Lucía Fernández",
    certifiedDate: "9 nov · 18:10 h",
  },
];

const pendingTasks = tasks.filter((task) => task.status === "pending");
const urgentCount = pendingTasks.filter((task) => task.daysPending > 7).length;
const day = (dayOfMonth: number) =>
  new Date(Date.UTC(2026, 10, dayOfMonth, 15));

/** La urgencia de hoy: rojo de 8 días en adelante («urgente»), amarillo de 4 a 7, gris menos. */
function urgency(days: number) {
  if (days > 7)
    return {
      tone: "danger" as const,
      label: `${days} d. (urgente)`,
      short: `${days}d urg.`,
    };
  if (days >= 4)
    return {
      tone: "caution" as const,
      label: `${days} días`,
      short: `${days}d`,
    };
  return {
    tone: "neutral" as const,
    label: days === 1 ? "1 día" : `${days} días`,
    short: `${days}d`,
  };
}

/* ================================================================== Como hoy */

const PAGE_SIZE = 4;

function StatBox({
  icon,
  tone,
  value,
  label,
}: {
  icon: typeof ListTodo;
  tone: "info" | "danger";
  value: number;
  label: string;
}) {
  return (
    <div className="flex flex-1 flex-col gap-snug rounded-control border border-line bg-canvas-raised px-group py-snug shadow-hint sm:flex-row sm:items-center sm:gap-group sm:py-4.25">
      <div className="flex items-center gap-snug">
        <span
          className={cn(
            "flex size-7.75 shrink-0 items-center justify-center rounded-control",
            tone === "info"
              ? "bg-fn-info-canvas text-fn-info"
              : "bg-fn-danger-canvas text-fn-danger",
          )}
        >
          <Icon icon={icon} />
        </span>
        <span className="text-metric-compact">{value}</span>
      </div>
      <span className="text-body">{label}</span>
    </div>
  );
}

function CertifyDialog({
  open,
  onOpenChange,
  selection,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selection: Task[];
}) {
  const [notes, setNotes] = useState("");
  const single = selection.length === 1 ? selection[0] : undefined;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={single ? "Certificar Tarea" : "Certificar Tareas"}
        description="Revisá la información antes de confirmar. Esta acción impacta en el avance de obra y no se puede deshacer."
        footer={
          <>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={() => onOpenChange(false)}>
              <Icon icon={BadgeCheck} /> Confirmar Certificación
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-snug">
          <div className="rounded-control bg-canvas-sunken px-group py-snug">
            {single ? (
              <>
                <p className="text-label">{single.name}</p>
                <dl className="mt-related flex flex-wrap gap-x-snug gap-y-related text-meta">
                  {[
                    ["Nivel", single.floor],
                    ["Unidades", single.unit],
                    ["Rubro", single.rubro],
                    ["Completado por", single.author],
                  ].map(([term, value]) => (
                    <div key={term} className="flex gap-related">
                      <dt className="text-ink-muted">{term}:</dt>
                      <dd className="font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : (
              <>
                <p className="text-label">Tareas seleccionadas</p>
                <ul className="mt-compact flex max-h-40 flex-col gap-related overflow-y-auto text-body">
                  {selection.map((task) => (
                    <li key={task.id} className="flex items-center gap-compact">
                      <Icon
                        icon={BadgeCheck}
                        size="xs"
                        className="text-action-text"
                      />
                      <span className="truncate">
                        {task.name} ({task.floor} - {task.unit})
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <Field
            label={
              single
                ? "Notas de Certificación"
                : "Notas de Certificación (aplica a todas)"
            }
            optional
          >
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Observaciones sobre el trabajo verificado…"
            />
          </Field>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TaskCard({
  task,
  checked,
  onChecked,
  onCertify,
  canCertify,
}: {
  task: Task;
  checked: boolean;
  onChecked: (value: boolean) => void;
  onCertify: () => void;
  canCertify: boolean;
}) {
  const certified = task.status === "certified";
  const level = urgency(task.daysPending);
  return (
    <li className="rounded-control border border-line bg-canvas-raised p-snug sm:p-3.25">
      <div className="flex flex-col gap-snug sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-snug">
          {canCertify && !certified ? (
            <Checkbox
              checked={checked}
              onCheckedChange={(value) => onChecked(value === true)}
              aria-label={`Elegir ${task.name}, ${task.floor} ${task.unit}`}
              className="mt-0.5"
            />
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col gap-compact">
            <div className="flex flex-col gap-related">
              <div className="flex flex-wrap items-center gap-x-compact gap-y-related">
                <span className="font-mono text-meta text-ink-muted">
                  {task.code}
                </span>
                <h3 className="text-body">{task.name}</h3>
                <span className="text-meta text-ink-muted">{task.rubro}</span>
              </div>
              <p className="flex flex-wrap items-center gap-x-compact text-meta">
                <span>{task.floor}</span>
                <span aria-hidden>•</span>
                <span>{task.unit}</span>
                <span aria-hidden>•</span>
                <span>
                  {certified ? `Completado por ${task.author}` : task.author}
                </span>
                <span aria-hidden>•</span>
                <span>
                  {task.date} · {task.time}
                </span>
              </p>
            </div>
            {task.comment ? (
              <p className="flex items-center gap-related text-meta text-ink-muted">
                <Icon icon={MessageCircle} className="shrink-0" />
                <span className="line-clamp-1">
                  <span className="sr-only">Comentario: </span>
                  {task.comment}
                </span>
              </p>
            ) : null}
          </div>
        </div>
        <div
          className={cn(
            "flex items-center gap-compact",
            certified ? "w-full sm:w-auto" : "justify-end",
          )}
        >
          {certified ? (
            <div className="flex min-w-0 flex-1 items-center gap-compact rounded-control bg-fn-info-canvas p-compact text-fn-info sm:w-40 sm:flex-none">
              <Icon icon={ShieldCheck} />
              <div className="min-w-0">
                <p className="truncate text-meta">
                  <span className="sr-only">Certificó </span>
                  {task.certifiedBy}
                </p>
                <p className="truncate text-micro font-regular">
                  {task.certifiedDate}
                </p>
              </div>
            </div>
          ) : (
            <>
              <Badge tone={level.tone} icon={Clock} className="rounded-control">
                {/* En el celular hoy dice «9d urg.»: el lector de pantalla lee «nueve de urg». */}
                <span aria-hidden className="sm:hidden">
                  {level.short}
                </span>
                <span className="max-sm:sr-only">
                  <span className="sr-only">Espera: </span>
                  {level.label}
                </span>
              </Badge>
              {canCertify ? (
                <Button size="compact" onClick={onCertify}>
                  <Icon icon={BadgeCheck} size="xs" /> Certificar
                  <span className="sr-only"> {task.name}</span>
                </Button>
              ) : null}
            </>
          )}
          <IconButton
            icon={Eye}
            label={`Ver detalle de ${task.name}`}
            variant="ghost"
            size="compact"
            className="bg-canvas-track"
          />
        </div>
      </div>
    </li>
  );
}

function CertificacionesHoy({
  canCertify = true,
  empty = false,
}: {
  canCertify?: boolean;
  empty?: boolean;
}) {
  const [from, setFrom] = useState<Date | undefined>(day(1));
  const [to, setTo] = useState<Date | undefined>(day(30));
  const [member, setMember] = useState("todos");
  const [status, setStatus] = useState<"pending" | "certified">("pending");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [certifying, setCertifying] = useState<Task[]>([]);

  const list = (empty ? [] : tasks).filter(
    (task) =>
      task.status === status &&
      (member === "todos" || task.author === member) &&
      (!from || day(task.dayOfMonth) >= from) &&
      (!to || day(task.dayOfMonth) <= to),
  );
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const allSelected =
    list.length > 0 && list.every((task) => selected.has(task.id));
  const someSelected = list.some((task) => selected.has(task.id));
  const certifiedCount = tasks.filter(
    (task) => task.status === "certified",
  ).length;

  return (
    <WorkspaceLayout
      sidebar={<SidebarToday active="certificaciones" />}
      topbar={<MobileHeaderToday active="certificaciones" />}
    >
      <div className="flex flex-col gap-group py-compact sm:gap-block sm:py-block">
        <div className="flex flex-col gap-compact">
          <h1 className="text-headline">Certificación de Tareas</h1>
          <p className="text-body text-ink-muted">
            {status === "pending"
              ? `${empty ? 0 : pendingTasks.length} tareas pendientes de certificación`
              : `${certifiedCount} tareas certificadas`}
          </p>
        </div>

        {status === "pending" ? (
          <div className="flex flex-col gap-snug sm:flex-row">
            <StatBox
              icon={ListTodo}
              tone="info"
              value={empty ? 0 : pendingTasks.length}
              label="Pendientes"
            />
            <StatBox
              icon={Info}
              tone="danger"
              value={empty ? 0 : urgentCount}
              label="Urgentes (+7 días)"
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-snug">
          <section
            aria-labelledby="lista-cert"
            className="flex flex-col gap-group rounded-surface border border-line bg-canvas-raised p-group shadow-hint"
          >
            <h2 id="lista-cert" className="sr-only">
              {status === "pending"
                ? "Tareas pendientes"
                : "Tareas certificadas"}
            </h2>
            <div className="grid grid-cols-1 gap-snug sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Desde">
                <DatePicker
                  value={from}
                  max={to}
                  onChange={(date) => (setFrom(date), setPage(1))}
                  size="compact"
                />
              </Field>
              <Field label="Hasta">
                <DatePicker
                  value={to}
                  min={from}
                  onChange={(date) => (setTo(date), setPage(1))}
                  size="compact"
                />
              </Field>
              <Field label="Miembro">
                <Select
                  value={member}
                  onValueChange={(value) => (setMember(value), setPage(1))}
                  size="compact"
                >
                  <SelectItem value="todos">Todos</SelectItem>
                  {members.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </Select>
              </Field>
              <div className="flex flex-col gap-compact">
                <p id="estado-filtro" className="text-label">
                  Estado
                </p>
                {/* Hoy son dos botones sin estado: no se sabe cuál está elegido. */}
                <Segmented
                  size="compact"
                  label="Estado"
                  value={status}
                  onValueChange={(value) => {
                    setStatus(value as "pending" | "certified");
                    setSelected(new Set());
                    setPage(1);
                  }}
                  options={[
                    { value: "pending", label: "Pendientes" },
                    { value: "certified", label: "Certificadas" },
                  ]}
                  className="w-full [&>*]:flex-1"
                />
              </div>
            </div>

            {status === "pending" && canCertify ? (
              <div className="flex flex-col gap-snug sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-compact">
                  <Checkbox
                    id="elegir-todas"
                    checked={
                      allSelected
                        ? true
                        : someSelected
                          ? "indeterminate"
                          : false
                    }
                    disabled={list.length === 0}
                    onCheckedChange={() =>
                      setSelected(
                        allSelected
                          ? new Set()
                          : new Set(list.map((task) => task.id)),
                      )
                    }
                  />
                  <Label htmlFor="elegir-todas" variant="option">
                    Seleccionar todas
                  </Label>
                </div>
                {selected.size > 0 ? (
                  <Button
                    size="compact"
                    className="w-full sm:w-auto"
                    onClick={() =>
                      setCertifying(
                        list.filter((task) => selected.has(task.id)),
                      )
                    }
                  >
                    <Icon icon={BadgeCheck} size="xs" /> Certificar (
                    {selected.size})
                  </Button>
                ) : null}
              </div>
            ) : null}

            {visible.length === 0 ? (
              <p
                role="status"
                className="rounded-control border border-dashed border-line px-group py-10 text-center text-body text-ink-muted"
              >
                {status === "pending"
                  ? "No hay tareas pendientes de certificación para los filtros seleccionados."
                  : "No hay tareas certificadas para los filtros seleccionados."}
              </p>
            ) : (
              <ul className="flex flex-col gap-compact">
                {visible.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    canCertify={canCertify}
                    checked={selected.has(task.id)}
                    onChecked={(value) =>
                      setSelected((currentSet) => {
                        const next = new Set(currentSet);
                        if (value) next.add(task.id);
                        else next.delete(task.id);
                        return next;
                      })
                    }
                    onCertify={() => setCertifying([task])}
                  />
                ))}
              </ul>
            )}
          </section>

          {list.length > 0 ? (
            <div className="flex flex-col items-center gap-snug sm:flex-row sm:justify-between">
              <p role="status" className="text-meta text-ink-muted">
                Mostrando {visible.length} de {list.length}{" "}
                {list.length === 1 ? "tarea" : "tareas"}
              </p>
              {pages > 1 ? (
                // Hoy los números no dicen cuál es la página actual ni que son páginas.
                <nav
                  aria-label="Páginas"
                  className="flex flex-wrap items-center gap-related"
                >
                  <Button
                    variant="outline"
                    size="compact"
                    disabled={current === 1}
                    onClick={() => setPage(current - 1)}
                  >
                    Anterior
                  </Button>
                  {Array.from({ length: pages }, (_, index) => index + 1).map(
                    (number) => (
                      <button
                        key={number}
                        type="button"
                        aria-current={number === current ? "page" : undefined}
                        aria-label={`Página ${number}`}
                        onClick={() => setPage(number)}
                        className={cn(
                          "focus-ring motion-color grid size-8 cursor-pointer place-items-center rounded-control text-label",
                          number === current
                            ? "bg-action text-action-ink"
                            : "border border-line-strong text-ink hover:bg-surface-hover",
                        )}
                      >
                        {number}
                      </button>
                    ),
                  )}
                  <Button
                    variant="outline"
                    size="compact"
                    disabled={current === pages}
                    onClick={() => setPage(current + 1)}
                  >
                    Siguiente
                  </Button>
                </nav>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      <CertifyDialog
        open={certifying.length > 0}
        onOpenChange={(value) => (value ? null : setCertifying([]))}
        selection={certifying}
      />
    </WorkspaceLayout>
  );
}

/* ================================================================== Propuesta */

function WaitBadge({ days }: { days: number }) {
  const level = urgency(days);
  return (
    <Badge tone={level.tone} icon={Clock} className="rounded-compact">
      {days > 7
        ? `Urgente · ${days} días`
        : days === 1
          ? "1 día"
          : `${days} días`}
    </Badge>
  );
}

function ReviewSheet({
  task,
  onClose,
  onNext,
  remaining,
}: {
  task: Task | undefined;
  onClose: () => void;
  onNext: () => void;
  remaining: number;
}) {
  const [notes, setNotes] = useState("");
  return (
    <Sheet
      open={task !== undefined}
      onOpenChange={(open) => (open ? null : onClose())}
    >
      {task ? (
        <SheetContent
          title={task.name}
          description={`${task.code} · ${task.rubro} · ${task.floor} · Unidad ${task.unit}`}
          footer={
            task.status === "pending" ? (
              <>
                <Button variant="outline" onClick={onClose}>
                  <Icon icon={Undo2} /> Devolver<span className="sr-only"> con observaciones</span>
                </Button>
                <Button
                  onClick={() => {
                    setNotes("");
                    onNext();
                  }}
                >
                  <Icon icon={BadgeCheck} />{" "}
                  {remaining > 1 ? "Certificar y seguir" : "Certificar"}
                  {remaining > 1 ? <Icon icon={ArrowRight} /> : null}
                </Button>
              </>
            ) : null
          }
        >
          <div className="flex flex-col gap-block p-group">
            <dl className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-x-group gap-y-snug text-body">
              <dt className="text-ink-muted">Cargó</dt>
              <dd className="flex items-center gap-compact">
                <Avatar name={task.author} size="sm" /> {task.author}
              </dd>
              <dt className="text-ink-muted">Cuándo</dt>
              <dd>
                {task.date} · {task.time}
              </dd>
              <dt className="text-ink-muted">Espera</dt>
              <dd>
                {task.status === "pending" ? (
                  <WaitBadge days={task.daysPending} />
                ) : (
                  "—"
                )}
              </dd>
            </dl>
            {task.comment ? (
              <div className="flex flex-col gap-related">
                <p className="text-meta text-ink-muted">
                  Comentario del equipo
                </p>
                <p className="rounded-control bg-canvas-sunken px-group py-snug text-body">
                  {task.comment}
                </p>
              </div>
            ) : null}
            <div className="flex flex-col gap-compact">
              <p className="text-label">
                Fotos{" "}
                <span className="text-meta font-regular text-ink-muted">
                  · {task.photos}
                </span>
              </p>
              {task.photos > 0 ? (
                <ul className="grid grid-cols-3 gap-compact">
                  {Array.from({ length: task.photos }, (_, index) => (
                    <li
                      key={index}
                      className="flex aspect-4/3 flex-col items-center justify-center gap-related rounded-control bg-canvas-sunken text-meta text-ink-muted"
                    >
                      <Icon icon={Camera} />
                      Foto {index + 1}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-body text-ink-muted">
                  Sin fotos: conviene pedirlas antes de certificar.
                </p>
              )}
            </div>
            {task.status === "pending" ? (
              <Field
                label="Notas de certificación"
                optional
                description="Quedan en la actividad del trabajo."
              >
                <Textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Qué se verificó en la inspección…"
                />
              </Field>
            ) : null}
            {remaining > 1 && task.status === "pending" ? (
              <p className="text-meta text-ink-muted">
                Quedan {remaining - 1} pendientes después de esta.
              </p>
            ) : null}
          </div>
        </SheetContent>
      ) : null}
    </Sheet>
  );
}

function CertificacionesPropuesta() {
  const [tab, setTab] = useState("pendientes");
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<DateRange | undefined>({
    from: day(1),
    to: day(30),
  });
  const [author, setAuthor] = useState<string>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reviewId, setReviewId] = useState<string>();
  const [certifyingMany, setCertifyingMany] = useState(false);

  const rows = useMemo(
    () =>
      tasks.filter((task) => {
        if (tab === "pendientes" && task.status !== "pending") return false;
        if (
          tab === "urgentes" &&
          !(task.status === "pending" && task.daysPending > 7)
        )
          return false;
        if (tab === "certificadas" && task.status !== "certified") return false;
        if (author && task.author !== author) return false;
        if (
          query &&
          !`${task.code} ${task.name} ${task.rubro} ${task.unit}`
            .toLowerCase()
            .includes(query.toLowerCase())
        )
          return false;
        const date = day(task.dayOfMonth);
        if (range?.from && date < range.from) return false;
        if (range?.to && date > range.to) return false;
        return true;
      }),
    [tab, author, query, range],
  );
  const queue = rows
    .filter((task) => task.status === "pending")
    .sort((a, b) => b.daysPending - a.daysPending);
  const reviewIndex = queue.findIndex((task) => task.id === reviewId);
  const reviewing = tasks.find((task) => task.id === reviewId);

  const columns: DataTableColumn<Task>[] = [
    {
      key: "task",
      header: "Tarea",
      sortValue: (row) => row.name,
      cell: (row) => (
        <span className="flex min-w-0 flex-col">
          <button
            type="button"
            onClick={() => setReviewId(row.id)}
            className="focus-ring cursor-pointer self-start truncate rounded-box text-left text-label underline-offset-4 hover:underline"
          >
            {row.name}
          </button>
          <span className="flex items-center gap-related text-meta text-ink-muted">
            <span className="font-mono">{row.code}</span>
            {row.comment ? (
              <span className="inline-flex items-center gap-0.5">
                <Icon icon={MessageCircle} size="xs" />
                <span className="sr-only">con comentario</span>
              </span>
            ) : null}
            {row.photos > 0 ? (
              <span className="inline-flex items-center gap-0.5">
                <Icon icon={Camera} size="xs" /> {row.photos}
                <span className="sr-only"> fotos</span>
              </span>
            ) : null}
          </span>
          <span className="text-meta text-ink-muted md:hidden">
            {row.floor} · {row.unit}
          </span>
        </span>
      ),
    },
    {
      key: "rubro",
      header: "Rubro",
      sortValue: (row) => row.rubro,
      cell: (row) => row.rubro,
      hideBelow: "lg",
    },
    {
      key: "location",
      header: "Ubicación",
      sortValue: (row) => `${row.floor} ${row.unit}`,
      cell: (row) => `${row.floor} · ${row.unit}`,
      hideBelow: "md",
    },
    {
      key: "author",
      header: "Cargó",
      sortValue: (row) => row.author,
      hideBelow: "lg",
      cell: (row) => (
        <span className="flex items-center gap-compact">
          <Avatar name={row.author} size="sm" /> {row.author}
        </span>
      ),
    },
    tab === "certificadas"
      ? {
          key: "certified",
          header: "Certificó",
          sortValue: (row) => row.certifiedDate,
          cell: (row) => (
            <span className="flex flex-col">
              <span className="inline-flex items-center gap-related text-fn-info">
                <Icon icon={ShieldCheck} size="xs" /> {row.certifiedBy}
              </span>
              <span className="text-meta text-ink-muted">
                {row.certifiedDate}
              </span>
            </span>
          ),
        }
      : {
          key: "wait",
          header: "Espera",
          sortValue: (row) => row.daysPending,
          cell: (row) => <WaitBadge days={row.daysPending} />,
        },
  ];

  return (
    <WorkspaceLayout
      sidebar={<SidebarProposal active="certificaciones" />}
      topbar={<TopbarProposal active="certificaciones" />}
      header={
        <PageHeader
          title="Certificaciones"
          description="Revisá y certificá lo que cargó el equipo. Las más viejas primero."
          actions={
            pendingTasks.length > 0 ? (
              <Button
                onClick={() => setReviewId(queue[0]?.id ?? pendingTasks[0].id)}
              >
                <Icon icon={Eye} /> Revisar pendientes
              </Button>
            ) : null
          }
        />
      }
    >
      <MetricStrip className="lg:grid-cols-3">
        <MetricCard
          label="Pendientes"
          icon={ListTodo}
          value={String(pendingTasks.length)}
          hint={`${urgentCount} esperan hace más de 7 días`}
        />
        <MetricCard
          label="Tiempo promedio para certificar"
          icon={Timer}
          value="3,2 días"
          delta={{
            value: "1,1 días",
            direction: "down",
            good: true,
            label: "vs. mes pasado",
          }}
        />
        <MetricCard
          label="Certificadas esta semana"
          icon={BadgeCheck}
          value="18"
          delta={{
            value: "4",
            direction: "up",
            good: true,
            label: "vs. semana pasada",
          }}
        />
      </MetricStrip>

      <div className="flex flex-col gap-snug">
        <Segmented
          label="Qué tareas ver"
          value={tab}
          onValueChange={(value) => {
            setTab(value);
            setSelected(new Set());
          }}
          className="max-w-full self-start overflow-x-auto"
          options={[
            ["pendientes", "Pendientes", pendingTasks.length],
            ["urgentes", "Urgentes", urgentCount],
            [
              "certificadas",
              "Certificadas",
              tasks.length - pendingTasks.length,
            ],
          ].map(([value, label, count]) => ({
            value: String(value),
            label: (
              <span className="flex items-center gap-related whitespace-nowrap">
                {label}{" "}
                <span className="text-meta text-ink-muted tabular-nums">
                  {count}
                </span>
              </span>
            ),
          }))}
        />
        <ListToolbar
          search={{
            value: query,
            onChange: setQuery,
            placeholder: "Buscar tarea, código o unidad",
            label: "Buscar tareas",
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
                options={members.map((name) => ({ value: name, label: name }))}
                value={author}
                onValueChange={setAuthor}
                placeholder="Cualquiera cargó"
                searchPlaceholder="Buscar persona"
                size="compact"
                aria-label="Quién cargó"
                className="w-48"
              />
            </>
          }
          count={`${rows.length} ${rows.length === 1 ? "tarea" : "tareas"}`}
          selection={{
            count: selected.size,
            onClear: () => setSelected(new Set()),
            actions: (
              <Button size="compact" onClick={() => setCertifyingMany(true)}>
                <Icon icon={BadgeCheck} size="xs" /> Certificar {selected.size}
              </Button>
            ),
          }}
        />
      </div>

      <DataTable
        caption={
          tab === "certificadas"
            ? "Tareas certificadas"
            : "Tareas para certificar"
        }
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        defaultSort={
          tab === "certificadas"
            ? { key: "certified", direction: "desc" }
            : { key: "wait", direction: "desc" }
        }
        selectedIds={tab === "certificadas" ? undefined : selected}
        onSelectionChange={tab === "certificadas" ? undefined : setSelected}
        rowActions={
          tab === "certificadas"
            ? undefined
            : (row) => (
                <Button
                  variant="outline"
                  size="compact"
                  onClick={() => setReviewId(row.id)}
                >
                  Revisar<span className="sr-only"> {row.name}</span>
                </Button>
              )
        }
        empty={
          <EmptyState
            icon={BadgeCheck}
            size="compact"
            title={
              tab === "certificadas"
                ? "Todavía no hay tareas certificadas"
                : "Todo certificado"
            }
            description={
              tab === "certificadas"
                ? "Cuando certifiques una, aparece acá."
                : "No hay tareas esperando con estos filtros."
            }
          />
        }
      />

      <ReviewSheet
        task={reviewing}
        remaining={reviewIndex >= 0 ? queue.length - reviewIndex : 1}
        onClose={() => setReviewId(undefined)}
        onNext={() =>
          setReviewId(
            reviewIndex >= 0 && reviewIndex < queue.length - 1
              ? queue[reviewIndex + 1].id
              : undefined,
          )
        }
      />
      <CertifyDialog
        open={certifyingMany}
        onOpenChange={setCertifyingMany}
        selection={tasks.filter((task) => selected.has(task.id))}
      />
    </WorkspaceLayout>
  );
}

/* ------------------------------------------------------------------ Historias */

const meta = {
  title: "Pantallas/Obra/Certificaciones",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;

export const ComoHoy: StoryObj = {
  name: "Como hoy",
  render: () => <CertificacionesHoy />,
};
export const ComoHoySinPermiso: StoryObj = {
  name: "Como hoy · sin permiso para certificar",
  render: () => <CertificacionesHoy canCertify={false} />,
};
export const ComoHoyVacia: StoryObj = {
  name: "Como hoy · sin pendientes",
  render: () => <CertificacionesHoy empty />,
};
export const Propuesta: StoryObj = {
  name: "Propuesta",
  render: () => <CertificacionesPropuesta />,
};
