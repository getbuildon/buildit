import { useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  CircleEllipsis,
  House,
  MapPin,
  MessageSquarePlus,
  X,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "../atoms/badge/Badge";
import { Button } from "../atoms/button/Button";
import { IconButton } from "../atoms/button/IconButton";
import { Checkbox } from "../atoms/checkbox/Checkbox";
import { Icon } from "../atoms/icon/Icon";
import { Textarea } from "../atoms/input/Input";
import { cn } from "../lib/cn";
import { formatDate } from "../foundations/format/format";
import { ConfirmDialog } from "../molecules/confirm-dialog/ConfirmDialog";
import { Dialog, DialogContent } from "../molecules/dialog/Dialog";
import { Field } from "../molecules/field/Field";
import { FileField, type FileItem } from "../molecules/file-field/FileField";
import { Notice } from "../molecules/notice/Notice";
import { Segmented } from "../molecules/segmented/Segmented";
import { Select, SelectItem } from "../molecules/select/Select";
import { PageHeader } from "../organisms/page-header/PageHeader";
import { Stepper, WizardFooter } from "../organisms/wizard/Wizard";
import {
  MobileHeaderToday,
  SidebarProposal,
  SidebarToday,
  TopbarProposal,
} from "./obra/ObraShell";
import { WorkspaceLayout } from "./workspace/WorkspaceLayout";

/* Trabajo diario → «Cargar nuevo avance»: elegir nivel, unidades y rubro, marcar el
   estado de cada tarea (con comentarios y fotos) y confirmar. */

/* ------------------------------------------------------------------ Datos */

type Status = "pending" | "in_progress" | "completed" | "blocked";

const statusLabel: Record<Status, string> = {
  pending: "Sin Iniciar",
  in_progress: "En Proceso",
  completed: "Completado",
  blocked: "Bloqueado",
};
const statusTone = {
  pending: "neutral",
  in_progress: "caution",
  completed: "ok",
  blocked: "danger",
} as const;
const statusIcon: Record<Status, LucideIcon> = {
  pending: CircleEllipsis,
  in_progress: CircleDashed,
  completed: CheckCircle2,
  blocked: AlertCircle,
};
const statusIconColor: Record<Status, string> = {
  pending: "text-ink-muted",
  in_progress: "text-fn-caution",
  completed: "text-fn-ok",
  blocked: "text-fn-danger",
};

const floors = [
  { id: "pb", name: "Planta Baja", short: "PB", units: ["PB-01", "PB-02"] },
  { id: "p1", name: "Piso 1", short: "P1", units: ["1A", "1B", "1C", "1D"] },
  { id: "p2", name: "Piso 2", short: "P2", units: ["2A", "2B", "2C", "2D"] },
  { id: "p3", name: "Piso 3", short: "P3", units: ["3A", "3B", "3C", "3D"] },
  { id: "p4", name: "Piso 4", short: "P4", units: ["4A", "4B", "4C"] },
];

type Task = { id: string; name: string; onlyUnits?: RegExp };
const rubros: { id: string; name: string; tasks: Task[] }[] = [
  {
    id: "alb",
    name: "Albañilería",
    tasks: [
      { id: "alb-1", name: "Mampostería de ladrillo hueco" },
      { id: "alb-2", name: "Revoque grueso" },
      { id: "alb-3", name: "Revoque fino" },
      { id: "alb-4", name: "Carpeta niveladora" },
    ],
  },
  {
    id: "ele",
    name: "Instalación eléctrica",
    tasks: [
      { id: "ele-1", name: "Cañerías embutidas" },
      { id: "ele-2", name: "Cableado de tomas" },
      // Solo en las unidades «A»: así aparece el aviso de tareas que no coinciden.
      { id: "ele-3", name: "Tablero seccional", onlyUnits: /A$/ },
    ],
  },
  {
    id: "san",
    name: "Instalación sanitaria",
    tasks: [
      { id: "san-1", name: "Montantes de agua" },
      { id: "san-2", name: "Bajadas pluviales" },
    ],
  },
];

/** Estado actual de una tarea en una unidad (lo que ya está cargado). */
function currentStatus(unit: string, taskId: string): Status {
  const seed =
    [...`${unit}${taskId}`].reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    7;
  return seed === 0
    ? "completed"
    : seed === 1
      ? "in_progress"
      : seed === 2
        ? "blocked"
        : "pending";
}

const appliesTo = (task: Task, unit: string) =>
  !task.onlyUnits || task.onlyUnits.test(unit);

type Draft = {
  status: Status;
  comment: string;
  photos: FileItem[];
  units: string[];
};
const emptyDraft = (units: string[]): Draft => ({
  status: "pending",
  comment: "",
  photos: [],
  units,
});
const hasContent = (draft: Draft | undefined) =>
  !!draft &&
  draft.units.length > 0 &&
  (draft.status !== "pending" ||
    draft.comment.trim() !== "" ||
    draft.photos.length > 0);

const today = new Date(Date.UTC(2026, 10, 18, 15));

function useDraftPhotos() {
  return (draft: Draft, files: File[]): FileItem[] => [
    ...draft.photos,
    ...files.map((file) => ({
      id: `${file.name}-${file.size}-${Math.random()}`,
      name: file.name,
      previewUrl: URL.createObjectURL(file),
      status: "done" as const,
    })),
  ];
}

/* ================================================================== Como hoy */

function SelectionCard({
  icon,
  title,
  description,
  children,
  id,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
  id: string;
}) {
  return (
    <div
      role="group"
      aria-labelledby={id}
      className="rounded-surface border border-line bg-canvas-raised p-group shadow-hint sm:p-block"
    >
      <div className="mb-snug flex flex-col gap-related">
        <div className="flex items-center gap-compact">
          <Icon icon={icon} className="text-ink-muted" />
          <h3 id={id} className="text-reading">
            {title}
          </h3>
        </div>
        {description ? (
          <p className="text-body text-ink-muted">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function Pill({
  label,
  title,
  selected,
  onClick,
}: {
  label: string;
  title: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      title={title.includes(label) ? undefined : title}
      className={cn(
        "focus-ring motion-color flex min-h-11 min-w-[calc(50%-4px)] flex-1 cursor-pointer items-center justify-center rounded-control px-snug text-center text-body sm:min-w-22 sm:basis-0",
        selected
          ? "bg-action font-medium text-action-ink"
          : "bg-canvas-track text-ink hover:bg-surface-pressed",
      )}
    >
      {/* El nombre visible es el corto (PB) y el lector de pantalla suma el completo.
          Hoy el aria-label pisa el visible y «PB» no está en el nombre: el control por
          voz («tocar PB») no lo encuentra. */}
      <span className="truncate">{label}</span>
      {title.includes(label) ? null : <span className="sr-only">, {title}</span>}
    </button>
  );
}

const statusOptions: { status: Exclude<Status, "pending">; active: string }[] =
  [
    {
      status: "completed",
      active: "border-fn-ok-solid bg-fn-ok-canvas text-fn-ok",
    },
    {
      status: "in_progress",
      active: "border-fn-caution-solid bg-fn-caution-canvas text-fn-caution",
    },
    {
      status: "blocked",
      active: "border-fn-danger-solid bg-fn-danger-canvas text-fn-danger",
    },
  ];

function UnitChip({
  unit,
  taskId,
  checked,
  disabled,
  onChange,
}: {
  unit: string;
  taskId: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  const status = currentStatus(unit, taskId);
  return (
    <label
      className={cn(
        "motion-color inline-flex items-center gap-compact rounded-control border px-2.5 py-1.5",
        checked && !disabled
          ? "border-line-strong bg-canvas-sunken"
          : "border-line bg-canvas-raised",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:border-line-strong",
      )}
    >
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onChange(value === true)}
      />
      <span className="text-label">{unit}</span>
      <span aria-hidden className="h-3 w-px bg-line" />
      <Badge
        tone={statusTone[status]}
        size="compact"
        className="rounded-compact"
      >
        <span className="sr-only">estado actual: </span>
        {statusLabel[status]}
      </Badge>
    </label>
  );
}

function CargarHoy() {
  const [floorId, setFloorId] = useState<string>();
  const [units, setUnits] = useState<string[]>([]);
  const [rubroId, setRubroId] = useState<string>();
  const [pendingRubro, setPendingRubro] = useState<string>();
  const [open, setOpen] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [confirming, setConfirming] = useState(false);
  const addPhotos = useDraftPhotos();

  const floor = floors.find((item) => item.id === floorId);
  const rubro = rubros.find((item) => item.id === rubroId);
  const tasks = rubro
    ? rubro.tasks.filter((task) => units.some((unit) => appliesTo(task, unit)))
    : [];
  const mismatch =
    units.length > 1 &&
    tasks.some((task) => units.some((unit) => !appliesTo(task, unit)));
  const draftOf = (task: Task) =>
    drafts[task.id] ??
    emptyDraft(
      units.filter(
        (unit) =>
          appliesTo(task, unit) && currentStatus(unit, task.id) !== "completed",
      ),
    );
  const update = (task: Task, patch: Partial<Draft>) =>
    setDrafts((current) => ({
      ...current,
      [task.id]: { ...draftOf(task), ...patch },
    }));
  const canSave = tasks.some((task) => hasContent(drafts[task.id]));
  const review = tasks.filter((task) => hasContent(drafts[task.id]));

  const selectFloor = (id: string) => {
    setFloorId(id);
    setUnits([]);
    setRubroId(undefined);
    setDrafts({});
    setOpen([]);
  };
  const toggleUnit = (unit: string) => {
    setUnits((current) =>
      current.includes(unit)
        ? current.filter((item) => item !== unit)
        : [...current, unit],
    );
    setDrafts({});
    setOpen([]);
  };
  const changeRubro = (id: string) => {
    if (canSave) setPendingRubro(id);
    else {
      setRubroId(id);
      setOpen([]);
    }
  };

  return (
    <WorkspaceLayout
      sidebar={<SidebarToday active="trabajo-diario" />}
      topbar={<MobileHeaderToday active="trabajo-diario" />}
    >
      <div className="flex flex-col gap-group py-compact sm:gap-block sm:py-block">
        <div className="flex flex-col gap-group sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-compact">
            <h1 className="text-title">Trabajo Diario</h1>
            <p className="flex items-center gap-compact text-body text-ink-muted">
              <Icon icon={Calendar} />
              {formatDate(today, "long")}
            </p>
          </div>
          <Button size="large" className="w-full sm:w-auto">
            <Icon icon={X} /> Cancelar
          </Button>
        </div>

        <section
          aria-labelledby="carga"
          className="rounded-surface border border-line bg-canvas-raised p-group shadow-hint sm:p-block"
        >
          <div className="mb-group flex items-start justify-between gap-snug sm:mb-block">
            <h2 id="carga" className="text-section font-regular">
              Carga de Trabajo Diario
            </h2>
            {/* Hoy es una X de 20 px: menos que el mínimo de 24 para tocar. */}
            <IconButton
              icon={X}
              label="Cerrar carga de avance"
              size="compact"
              className="-mt-related -mr-compact"
            />
          </div>

          <div className="flex flex-col gap-block">
            <SelectionCard id="nivel" icon={MapPin} title="Seleccionar Nivel">
              <div className="flex w-full flex-wrap gap-compact">
                {floors.map((item) => (
                  <Pill
                    key={item.id}
                    label={item.short}
                    title={item.name}
                    selected={floorId === item.id}
                    onClick={() => selectFloor(item.id)}
                  />
                ))}
              </div>
            </SelectionCard>

            {floor ? (
              <SelectionCard
                id="unidades"
                icon={House}
                title="Unidades Funcionales"
                description="Seleccioná una o más unidades donde se hizo el trabajo"
              >
                <div className="flex w-full flex-wrap gap-compact">
                  {floor.units.map((unit) => (
                    <Pill
                      key={unit}
                      label={unit}
                      title={unit}
                      selected={units.includes(unit)}
                      onClick={() => toggleUnit(unit)}
                    />
                  ))}
                </div>
              </SelectionCard>
            ) : null}

            {units.length > 0 ? (
              <div className="flex flex-col gap-block">
                <div className="rounded-surface border border-line bg-canvas-raised p-group shadow-hint sm:p-block">
                  <Field label="Rubro">
                    <Select
                      value={rubroId}
                      onValueChange={changeRubro}
                      placeholder="Elegí un rubro"
                    >
                      {rubros.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </Select>
                  </Field>
                </div>

                {rubro ? (
                  <section
                    aria-labelledby="estado-avance"
                    className="rounded-surface border border-line bg-canvas-raised p-group shadow-hint sm:p-block"
                  >
                    <div className="mb-group flex flex-col gap-related">
                      <h3 id="estado-avance" className="text-reading">
                        Estado de avance de {rubro.name}
                      </h3>
                      <p className="text-body text-ink-muted">
                        Tocá cada tarea hecha para agregar detalles
                      </p>
                    </div>
                    <div className="mb-group flex flex-wrap items-center gap-group rounded-control border border-line bg-canvas-sunken p-snug">
                      <span className="text-meta font-medium text-ink-muted">
                        Estados:
                      </span>
                      <ul className="flex flex-wrap items-center gap-group">
                        {(
                          [
                            "pending",
                            "completed",
                            "in_progress",
                            "blocked",
                          ] as const
                        ).map((status) => (
                          <li
                            key={status}
                            className="flex items-center gap-1.5 text-meta text-ink-muted"
                          >
                            <Icon
                              icon={statusIcon[status]}
                              size="xs"
                              className={statusIconColor[status]}
                            />
                            {statusLabel[status]}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {mismatch ? (
                      <Notice
                        tone="info"
                        title={`Se seleccionaron ${units.length} unidades funcionales:`}
                        className="mb-group"
                      >
                        Hay tareas que se pueden cargar juntas y otras que no
                        coinciden. Elegí en cada tarea a qué unidades aplicar el
                        avance.
                      </Notice>
                    ) : null}

                    <AccordionPrimitive.Root
                      type="multiple"
                      value={open}
                      onValueChange={setOpen}
                      className="flex flex-col gap-compact"
                    >
                      {tasks.map((task) => {
                        const draft = draftOf(task);
                        const taskUnits = units.filter((unit) =>
                          appliesTo(task, unit),
                        );
                        const single = units.length === 1;
                        return (
                          <AccordionPrimitive.Item
                            key={task.id}
                            value={task.id}
                            className="group/task overflow-hidden rounded-control border border-line bg-canvas-raised"
                          >
                            <AccordionPrimitive.Header className="flex">
                              {/* Hoy el foco no se ve (outline-none sin reemplazo). */}
                              <AccordionPrimitive.Trigger className="focus-ring state-veil flex min-h-13 w-full cursor-pointer items-center gap-snug px-3.5 py-snug text-left">
                                <Icon
                                  icon={statusIcon[draft.status]}
                                  size="md"
                                  className={statusIconColor[draft.status]}
                                />
                                <span className="min-w-0 flex-1 truncate text-body">
                                  {task.name}
                                </span>
                                {/* El estado elegido se anuncia también en el celular, donde el badge no se ve. */}
                                {draft.status !== "pending" ? (
                                  <>
                                    <Badge
                                      tone={statusTone[draft.status]}
                                      className="hidden rounded-compact sm:inline-flex"
                                    >
                                      {statusLabel[draft.status]}
                                    </Badge>
                                    <span className="sr-only sm:hidden">
                                      , {statusLabel[draft.status]}
                                    </span>
                                  </>
                                ) : null}
                                <Icon
                                  icon={ChevronDown}
                                  className="text-ink-muted transition-transform duration-(--duration-base) group-data-[state=open]/task:rotate-180"
                                />
                              </AccordionPrimitive.Trigger>
                            </AccordionPrimitive.Header>
                            <AccordionPrimitive.Content className="overflow-hidden border-t border-line data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down motion-reduce:animate-none">
                              <div className="flex flex-col gap-group p-group">
                                <div
                                  role="group"
                                  aria-labelledby={`unidades-${task.id}`}
                                  className="flex flex-col gap-compact"
                                >
                                  <p
                                    id={`unidades-${task.id}`}
                                    className="text-meta text-ink-muted"
                                  >
                                    Unidades a aplicar los cambios
                                  </p>
                                  <div className="flex flex-wrap items-center gap-compact">
                                    {taskUnits.map((unit) => {
                                      const done =
                                        currentStatus(unit, task.id) ===
                                        "completed";
                                      return (
                                        <UnitChip
                                          key={unit}
                                          unit={unit}
                                          taskId={task.id}
                                          checked={
                                            single
                                              ? true
                                              : draft.units.includes(unit)
                                          }
                                          disabled={done || single}
                                          onChange={(checked) =>
                                            update(task, {
                                              units: checked
                                                ? [...draft.units, unit]
                                                : draft.units.filter(
                                                    (item) => item !== unit,
                                                  ),
                                            })
                                          }
                                        />
                                      );
                                    })}
                                  </div>
                                </div>
                                {draft.units.length > 0 ? (
                                  <>
                                    <div
                                      role="group"
                                      aria-labelledby={`estado-${task.id}`}
                                      className="flex flex-col gap-compact"
                                    >
                                      <p
                                        id={`estado-${task.id}`}
                                        className="text-meta text-ink-muted"
                                      >
                                        Estado de la Tarea
                                      </p>
                                      <div className="grid grid-cols-1 gap-compact sm:grid-cols-3">
                                        {statusOptions.map((option) => {
                                          const active =
                                            draft.status === option.status;
                                          return (
                                            <button
                                              key={option.status}
                                              type="button"
                                              aria-pressed={active}
                                              onClick={() =>
                                                update(task, {
                                                  status: active
                                                    ? "pending"
                                                    : option.status,
                                                })
                                              }
                                              className={cn(
                                                "focus-ring motion-color inline-flex cursor-pointer items-center justify-center gap-compact rounded-control border-2 px-snug py-2.5 text-label",
                                                active
                                                  ? option.active
                                                  : "border-line bg-canvas-raised text-ink-muted hover:bg-surface-hover",
                                              )}
                                            >
                                              <Icon
                                                icon={statusIcon[option.status]}
                                                size="md"
                                                className={
                                                  active
                                                    ? undefined
                                                    : "text-ink-disabled"
                                                }
                                              />
                                              {statusLabel[option.status]}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                    <Field label="Comentarios y Observaciones">
                                      <Textarea
                                        value={draft.comment}
                                        onChange={(event) =>
                                          update(task, {
                                            comment: event.target.value,
                                          })
                                        }
                                        placeholder="Agregá notas sobre esta tarea…"
                                      />
                                    </Field>
                                    <Field label="Fotos" optional>
                                      <FileField
                                        files={draft.photos}
                                        onAdd={(files) =>
                                          update(task, {
                                            photos: addPhotos(draft, files),
                                          })
                                        }
                                        onRemove={(id) =>
                                          update(task, {
                                            photos: draft.photos.filter(
                                              (photo) => photo.id !== id,
                                            ),
                                          })
                                        }
                                        accept="image/*"
                                        acceptLabel="JPG, PNG o HEIC"
                                        multiple
                                        capture="environment"
                                      />
                                    </Field>
                                  </>
                                ) : null}
                              </div>
                            </AccordionPrimitive.Content>
                          </AccordionPrimitive.Item>
                        );
                      })}
                    </AccordionPrimitive.Root>

                    <div className="mt-block flex flex-col items-stretch gap-snug border-t border-line pt-block sm:items-end">
                      <Button
                        size="large"
                        disabled={!canSave}
                        onClick={() => setConfirming(true)}
                        className="w-full sm:w-auto sm:min-w-50"
                      >
                        <Icon icon={Check} /> Revisar y Confirmar
                      </Button>
                    </div>
                  </section>
                ) : null}
              </div>
            ) : null}

            {!floor ? (
              <Notice tone="info" title="Instrucciones:">
                <ol className="mt-related list-decimal space-y-related pl-5">
                  <li>Elegí el nivel donde se hizo el trabajo</li>
                  <li>Elegí las unidades o locales trabajados</li>
                  <li>Elegí el rubro</li>
                  <li>
                    En cada tarea, tocala para abrirla y agregar estado,
                    comentarios y fotos
                  </li>
                  <li>Guardá el registro para que se pueda inspeccionar</li>
                </ol>
              </Notice>
            ) : null}
          </div>
        </section>
      </div>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent
          size="wide"
          title="Confirmar registro de avance"
          description="Revisá los trabajos registrados antes de confirmar."
          footer={
            <>
              <Button variant="outline" onClick={() => setConfirming(false)}>
                Volver a editar
              </Button>
              <Button onClick={() => setConfirming(false)}>Confirmar</Button>
            </>
          }
        >
          <div className="flex flex-col gap-group">
            <dl className="flex flex-wrap gap-x-5 gap-y-related rounded-control bg-canvas-sunken px-group py-snug text-body">
              <div className="flex gap-related">
                <dt className="text-ink-muted">Nivel:</dt>
                <dd className="font-medium">{floor?.name}</dd>
              </div>
              <div className="flex gap-related">
                <dt className="text-ink-muted">Rubro:</dt>
                <dd className="font-medium">{rubro?.name}</dd>
              </div>
            </dl>
            <ul className="flex flex-col gap-compact">
              {review.map((task) => {
                const draft = drafts[task.id]!;
                return (
                  <li
                    key={task.id}
                    className="flex flex-col gap-compact rounded-control border border-line px-group py-snug sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body">{task.name}</p>
                      <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-meta text-ink-muted">
                        Unidades:
                        {draft.units.map((unit) => (
                          <span
                            key={unit}
                            className="rounded-compact bg-canvas-track px-1.5 text-ink"
                          >
                            {unit}
                          </span>
                        ))}
                      </p>
                    </div>
                    <Badge
                      tone={statusTone[draft.status]}
                      className="self-start rounded-compact"
                    >
                      {statusLabel[draft.status]}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingRubro !== undefined}
        onOpenChange={(value) => (value ? null : setPendingRubro(undefined))}
        title="¿Cambiar de rubro?"
        description="Se pierde lo que cargaste en las tareas de este rubro."
        confirmLabel="Cambiar rubro"
        tone="danger"
        onConfirm={() => {
          setDrafts({});
          setRubroId(pendingRubro);
          setPendingRubro(undefined);
          setOpen([]);
        }}
      />
    </WorkspaceLayout>
  );
}

/* ================================================================== Propuesta */

const steps = [
  { id: "donde", label: "Dónde", description: "Nivel y unidades" },
  { id: "que", label: "Qué se hizo", description: "Estado de cada tarea" },
  { id: "revisar", label: "Revisar", description: "Confirmar y guardar" },
];

const proposalStatus = [
  { value: "pending", label: "Sin cambios" },
  { value: "in_progress", label: "En proceso" },
  { value: "completed", label: "Completado" },
  { value: "blocked", label: "Bloqueado" },
] as const;

const sentence = (status: Status) =>
  proposalStatus.find((item) => item.value === status)?.label ??
  statusLabel[status];

function TaskRowProposal({
  task,
  draft,
  units,
  onChange,
}: {
  task: Task;
  draft: Draft;
  units: string[];
  onChange: (patch: Partial<Draft>) => void;
}) {
  const [notesOpen, setNotesOpen] = useState(
    draft.comment !== "" || draft.photos.length > 0,
  );
  const addPhotos = useDraftPhotos();
  const taskUnits = units.filter((unit) => appliesTo(task, unit));
  return (
    <li className="flex flex-col gap-snug py-group first:pt-0 last:pb-0">
      <div className="flex flex-col gap-compact lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-compact">
          <Icon
            icon={statusIcon[draft.status]}
            className={statusIconColor[draft.status]}
          />
          <p className="truncate text-label">{task.name}</p>
        </div>
        <Segmented
          size="compact"
          label={`Estado de ${task.name}`}
          value={draft.status}
          onValueChange={(value) => onChange({ status: value as Status })}
          options={proposalStatus.map((item) => ({
            value: item.value,
            label: item.label,
          }))}
          className="hidden self-start sm:inline-flex lg:self-auto"
        />
        {/* En el celular los 4 estados no entran en una fila: lista desplegable. */}
        <Select
          size="compact"
          aria-label={`Estado de ${task.name}`}
          value={draft.status}
          onValueChange={(value) => onChange({ status: value as Status })}
          className="sm:hidden"
        >
          {proposalStatus.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </Select>
      </div>
      {draft.status !== "pending" ? (
        <div className="flex flex-col gap-snug pl-6">
          {taskUnits.length > 1 ? (
            <div
              role="group"
              aria-label={`Unidades de ${task.name}`}
              className="flex flex-wrap items-center gap-compact"
            >
              <span className="text-meta text-ink-muted">En:</span>
              {taskUnits.map((unit) => {
                const done = currentStatus(unit, task.id) === "completed";
                return (
                  <label
                    key={unit}
                    className={cn(
                      "inline-flex items-center gap-related text-label",
                      done ? "text-ink-muted" : "cursor-pointer",
                    )}
                  >
                    <Checkbox
                      checked={draft.units.includes(unit)}
                      disabled={done}
                      onCheckedChange={(checked) =>
                        onChange({
                          units:
                            checked === true
                              ? [...draft.units, unit]
                              : draft.units.filter((item) => item !== unit),
                        })
                      }
                    />
                    {unit}
                    {done ? (
                      <span className="text-meta">(ya completada)</span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          ) : null}
          {notesOpen ? (
            <div className="flex flex-col gap-snug">
              <Field
                label={
                  draft.status === "blocked"
                    ? "¿Por qué está bloqueada?"
                    : "Nota"
                }
                optional={draft.status !== "blocked"}
              >
                <Textarea
                  value={draft.comment}
                  onChange={(event) =>
                    onChange({ comment: event.target.value })
                  }
                  rows={2}
                  placeholder="Qué se hizo, qué falta, qué lo frena…"
                />
              </Field>
              <Field label="Fotos" optional>
                <FileField
                  files={draft.photos}
                  onAdd={(files) =>
                    onChange({ photos: addPhotos(draft, files) })
                  }
                  onRemove={(id) =>
                    onChange({
                      photos: draft.photos.filter((photo) => photo.id !== id),
                    })
                  }
                  accept="image/*"
                  acceptLabel="JPG, PNG o HEIC"
                  multiple
                  capture="environment"
                />
              </Field>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="compact"
              className="self-start"
              onClick={() => setNotesOpen(true)}
            >
              <Icon icon={MessageSquarePlus} />{" "}
              {draft.status === "blocked"
                ? "Contar por qué está bloqueada"
                : "Agregar nota o fotos"}
            </Button>
          )}
        </div>
      ) : null}
    </li>
  );
}

function CargarPropuesta() {
  const [step, setStep] = useState(0);
  const [floorId, setFloorId] = useState("p1");
  const [units, setUnits] = useState<string[]>(["1A", "1B"]);
  const [rubroId, setRubroId] = useState("alb");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const floor = floors.find((item) => item.id === floorId)!;
  const rubro = rubros.find((item) => item.id === rubroId)!;
  const draftOf = (task: Task) =>
    drafts[task.id] ??
    emptyDraft(
      units.filter(
        (unit) =>
          appliesTo(task, unit) && currentStatus(unit, task.id) !== "completed",
      ),
    );
  const update = (task: Task, patch: Partial<Draft>) =>
    setDrafts((current) => ({
      ...current,
      [task.id]: { ...draftOf(task), ...patch },
    }));
  const countFor = (id: string) =>
    rubros
      .find((item) => item.id === id)!
      .tasks.filter(
        (task) => drafts[task.id] && drafts[task.id].status !== "pending",
      ).length;
  const loaded = rubros.flatMap((item) =>
    item.tasks
      .filter((task) => hasContent(drafts[task.id]))
      .map((task) => ({ rubro: item.name, task, draft: drafts[task.id]! })),
  );
  const blockedWithoutReason = loaded.filter(
    (item) =>
      item.draft.status === "blocked" && item.draft.comment.trim() === "",
  );
  const tasks = rubro.tasks.filter((task) =>
    units.some((unit) => appliesTo(task, unit)),
  );

  return (
    <WorkspaceLayout
      sidebar={<SidebarProposal active="trabajo-diario" />}
      topbar={<TopbarProposal active="trabajo-diario" />}
      header={
        <PageHeader
          title="Cargar avance"
          description={`Torre Alamo · ${formatDate(today, "long")}`}
        />
      }
    >
      <div className="grid gap-block lg:grid-cols-[14rem_minmax(0,1fr)]">
        <Stepper steps={steps} current={step} onStepClick={setStep} />
        <section
          aria-labelledby="paso"
          className="flex flex-col overflow-hidden rounded-surface border border-line bg-canvas-raised"
        >
          <div className="flex flex-col gap-block p-group sm:p-block">
            <h2 id="paso" className="sr-only">
              {steps[step].label}
            </h2>

            {step === 0 ? (
              <>
                <div
                  role="radiogroup"
                  aria-labelledby="nivel-propuesta"
                  className="flex flex-col gap-compact"
                >
                  <p id="nivel-propuesta" className="text-label">
                    Nivel
                  </p>
                  <div className="flex flex-wrap gap-compact">
                    {floors.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        role="radio"
                        aria-checked={floorId === item.id}
                        onClick={() => {
                          setFloorId(item.id);
                          setUnits([]);
                        }}
                        className={cn(
                          "focus-ring motion-color h-control cursor-pointer rounded-control border px-group text-body",
                          floorId === item.id
                            ? "border-action bg-action-soft text-action-text font-medium"
                            : "border-line bg-canvas-raised text-ink hover:border-line-strong",
                        )}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div
                  role="group"
                  aria-labelledby="unidades-propuesta"
                  className="flex flex-col gap-compact"
                >
                  <div className="flex items-center justify-between gap-snug">
                    <p id="unidades-propuesta" className="text-label">
                      Unidades{" "}
                      <span className="text-meta font-regular text-ink-muted">
                        · podés elegir varias
                      </span>
                    </p>
                    <Button
                      variant="ghost"
                      size="compact"
                      onClick={() =>
                        setUnits(
                          units.length === floor.units.length
                            ? []
                            : floor.units,
                        )
                      }
                    >
                      {units.length === floor.units.length
                        ? "Quitar todas"
                        : "Elegir todas"}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-compact sm:grid-cols-4">
                    {floor.units.map((unit) => {
                      const pending = rubros
                        .flatMap((item) => item.tasks)
                        .filter(
                          (task) =>
                            appliesTo(task, unit) &&
                            currentStatus(unit, task.id) !== "completed",
                        ).length;
                      const checked = units.includes(unit);
                      return (
                        <label
                          key={unit}
                          className={cn(
                            "motion-color flex cursor-pointer items-start gap-compact rounded-control border p-snug",
                            checked
                              ? "border-action bg-action-soft"
                              : "border-line hover:border-line-strong",
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() =>
                              setUnits(
                                checked
                                  ? units.filter((item) => item !== unit)
                                  : [...units, unit],
                              )
                            }
                            className="mt-0.5"
                          />
                          <span className="flex flex-col">
                            <span className="text-label">{unit}</span>
                            <span className="text-meta text-ink-muted">
                              {pending} tareas por hacer
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : null}

            {step === 1 ? (
              <>
                <div className="flex flex-col gap-compact">
                  <p className="text-meta text-ink-muted">
                    {floor.name} · {units.join(", ")}
                  </p>
                  {/* Rubros como pestañas con contador: se cargan varios sin perder nada al cambiar. */}
                  <Segmented
                    label="Rubro"
                    value={rubroId}
                    onValueChange={setRubroId}
                    className="max-w-full self-start overflow-x-auto"
                    options={rubros.map((item) => ({
                      value: item.id,
                      label: (
                        <span className="flex items-center gap-related whitespace-nowrap">
                          {item.name}
                          {countFor(item.id) > 0 ? (
                            <span className="rounded-pill bg-action px-1.5 text-micro text-action-ink tabular-nums">
                              {countFor(item.id)}
                            </span>
                          ) : null}
                        </span>
                      ),
                    }))}
                  />
                </div>
                {units.length > 1 &&
                tasks.some((task) =>
                  units.some((unit) => !appliesTo(task, unit)),
                ) ? (
                  <Notice tone="info">
                    Algunas tareas no están en todas las unidades elegidas: en
                    esas se aplica solo donde corresponde.
                  </Notice>
                ) : null}
                <div className="flex items-center justify-between gap-snug">
                  <h3 className="text-section">{rubro.name}</h3>
                  <Button
                    variant="ghost"
                    size="compact"
                    onClick={() =>
                      setDrafts((current) => ({
                        ...current,
                        ...Object.fromEntries(
                          tasks.map((task) => [
                            task.id,
                            { ...draftOf(task), status: "completed" as const },
                          ]),
                        ),
                      }))
                    }
                  >
                    <Icon icon={CheckCircle2} /> Marcar todas completadas
                  </Button>
                </div>
                <ul className="flex flex-col divide-y divide-line">
                  {tasks.map((task) => (
                    <TaskRowProposal
                      key={`${task.id}-${units.join()}`}
                      task={task}
                      draft={draftOf(task)}
                      units={units}
                      onChange={(patch) => update(task, patch)}
                    />
                  ))}
                </ul>
              </>
            ) : null}

            {step === 2 ? (
              loaded.length === 0 ? (
                <Notice
                  tone="caution"
                  title="Todavía no marcaste ninguna tarea"
                >
                  Volvé al paso anterior y elegí el estado de lo que se hizo.
                </Notice>
              ) : (
                <div className="flex flex-col gap-group">
                  <p className="text-body text-ink-muted">
                    {floor.name} · {loaded.length}{" "}
                    {loaded.length === 1 ? "tarea" : "tareas"} en{" "}
                    {new Set(loaded.map((item) => item.rubro)).size} rubros
                  </p>
                  {blockedWithoutReason.length > 0 ? (
                    <Notice tone="caution">
                      {blockedWithoutReason.length === 1
                        ? "Hay 1 tarea bloqueada sin motivo. Contar por qué ayuda a destrabarla más rápido."
                        : `Hay ${blockedWithoutReason.length} tareas bloqueadas sin motivo. Contar por qué ayuda a destrabarlas más rápido.`}
                    </Notice>
                  ) : null}
                  <ul className="flex flex-col divide-y divide-line rounded-control border border-line">
                    {loaded.map(({ rubro: rubroName, task, draft }) => (
                      <li
                        key={task.id}
                        className="flex flex-col gap-compact px-group py-snug sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-label">{task.name}</p>
                          <p className="text-meta text-ink-muted">
                            {rubroName} · {draft.units.join(", ")}
                            {draft.photos.length > 0
                              ? ` · ${draft.photos.length} fotos`
                              : ""}
                          </p>
                        </div>
                        <Badge
                          tone={statusTone[draft.status]}
                          className="self-start rounded-compact sm:self-auto"
                        >
                          {sentence(draft.status)}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            ) : null}
          </div>
          <WizardFooter
            className="mt-auto"
            current={step}
            total={steps.length}
            onBack={() => setStep((value) => Math.max(0, value - 1))}
            onNext={() =>
              setStep((value) => Math.min(steps.length - 1, value + 1))
            }
            finishLabel="Guardar avance"
            secondary={
              <p
                className="hidden items-center gap-related text-meta text-ink-muted sm:flex"
                aria-live="polite"
              >
                <Icon icon={Check} size="xs" /> Borrador guardado
              </p>
            }
          />
        </section>
      </div>
    </WorkspaceLayout>
  );
}

/* ------------------------------------------------------------------ Historias */

const meta = {
  title: "Pantallas/Obra/Cargar avance",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;

export const ComoHoy: StoryObj = {
  name: "Como hoy",
  render: () => <CargarHoy />,
};
export const Propuesta: StoryObj = {
  name: "Propuesta",
  render: () => <CargarPropuesta />,
};
