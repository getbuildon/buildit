import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  CircleDashed,
  CircleEllipsis,
  ClipboardList,
  Hammer,
  Home,
  LayoutGrid,
  ListChecks,
  LogOut,
  MapPin,
  Plus,
  Save,
  Trash2,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Avatar } from "../atoms/avatar/Avatar";
import { Badge } from "../atoms/badge/Badge";
import { Button } from "../atoms/button/Button";
import { IconButton } from "../atoms/button/IconButton";
import { Icon } from "../atoms/icon/Icon";
import { Input } from "../atoms/input/Input";
import { Progress } from "../atoms/progress/Progress";
import { cn } from "../lib/cn";
import { ConfirmDialog } from "../molecules/confirm-dialog/ConfirmDialog";
import { DatePicker } from "../molecules/date-picker/DatePicker";
import { Dialog, DialogContent } from "../molecules/dialog/Dialog";
import { EmptyState } from "../molecules/empty-state/EmptyState";
import { Field } from "../molecules/field/Field";
import { FileField } from "../molecules/file-field/FileField";
import { InputGroup } from "../molecules/input-group/InputGroup";
import { Segmented } from "../molecules/segmented/Segmented";
import { Select, SelectGroup, SelectItem } from "../molecules/select/Select";
import { Topbar } from "../organisms/topbar/Topbar";
import { Stepper, WizardFooter } from "../organisms/wizard/Wizard";
import { BrandMark } from "./demo";
import {
  RubrosProposal,
  RubrosToday,
  StructureProposal,
  StructureToday,
  UnitTasksTree,
  useConfigState,
  type GroupRow,
} from "./obra/ConfigParts";
import { WizardLayout } from "./wizard/WizardLayout";

/* Crear obra (app/projects/new): la etapa de la obra y el asistente en pasos. Los pasos de
   estructura y rubros son las mismas piezas que Configuración. */

/* ------------------------------------------------------------------ Datos compartidos */

type Stage = "not_started" | "in_execution";
type TaskStatus = "pending" | "in_progress" | "completed";
type Member = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  type: string;
  role: string;
};

const roleGroups = [
  {
    type: "Admin",
    roles: ["Administrador", "Gerente", "Project Manager", "Coordinador"],
  },
  {
    type: "Supervisor",
    roles: ["Director de Obra", "Residente", "Jefe de Obra", "Supervisor"],
  },
  { type: "Operador", roles: ["Capataz", "Contratista", "Subcontratista"] },
];
const available: Member[] = [
  {
    id: "a1",
    firstName: "Ana",
    lastName: "Torres",
    email: "ana.torres@grupoalamo.com.ar",
    type: "Admin",
    role: "Project Manager",
  },
  {
    id: "a2",
    firstName: "Martín",
    lastName: "Gómez",
    email: "martin.gomez@gmail.com",
    type: "Supervisor",
    role: "Jefe de Obra",
  },
  {
    id: "a3",
    firstName: "Sofía",
    lastName: "Ruiz",
    email: "sofia.ruiz@electricaruiz.com",
    type: "Operador",
    role: "Contratista",
  },
];

const taskStatusLabel: Record<TaskStatus, string> = {
  pending: "Sin iniciar",
  in_progress: "En proceso",
  completed: "Completado",
};
const taskStatusIcon: Record<TaskStatus, LucideIcon> = {
  pending: CircleEllipsis,
  in_progress: CircleDashed,
  completed: CheckCircle2,
};

function RoleSelect({
  value,
  onChange,
  ...aria
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
}) {
  return (
    <Select
      value={value || undefined}
      onValueChange={onChange}
      placeholder="Elegí un rol"
      {...aria}
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

/** Estado actual de cada tarea (obra ya en ejecución): el rubro resume a sus tareas. */
function WorkStatusStep({
  groups,
  statuses,
  onChange,
  sentence = false,
}: {
  groups: GroupRow[];
  statuses: Record<string, TaskStatus>;
  onChange: (next: Record<string, TaskStatus>) => void;
  sentence?: boolean;
}) {
  const of = (taskId: string): TaskStatus => statuses[taskId] ?? "pending";
  const options = (Object.keys(taskStatusLabel) as TaskStatus[]).map(
    (value) => ({
      value,
      label: (
        <span className="flex items-center gap-related">
          <Icon
            icon={taskStatusIcon[value]}
            size="xs"
            className={
              value === "completed"
                ? "text-fn-ok"
                : value === "in_progress"
                  ? "text-fn-caution"
                  : "text-ink-muted"
            }
          />
          <span className={sentence ? undefined : "max-sm:sr-only"}>
            {taskStatusLabel[value]}
          </span>
        </span>
      ),
    }),
  );
  return (
    <div className="flex flex-col gap-group">
      <p className="text-body text-ink-muted">
        Indicá el estado actual de los rubros para empezar el seguimiento desde
        la situación real de la obra. Todo arranca como «Sin iniciar»: marcá
        solo lo que ya está completado o en proceso.
      </p>
      <ol className="flex flex-col gap-snug">
        {groups.map((group, groupIndex) => (
          <li
            key={group.id}
            className="overflow-hidden rounded-control border border-line"
          >
            <p className="bg-action-soft px-group py-compact text-label">
              {groupIndex + 1}. {group.name}
            </p>
            <ul className="divide-y divide-line">
              {group.rubros.map((rubro, rubroIndex) => {
                const values = rubro.tasks.map((task) => of(task.id));
                const rubroStatus: TaskStatus = values.every(
                  (value) => value === "completed",
                )
                  ? "completed"
                  : values.every((value) => value === "pending")
                    ? "pending"
                    : "in_progress";
                return (
                  <li
                    key={rubro.id}
                    className="flex flex-col gap-compact px-group py-snug"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-compact">
                      <span className="text-label">
                        {groupIndex + 1}.{rubroIndex + 1} {rubro.name}
                      </span>
                      {/* Hoy son tres botones de 25 px con aria-pressed: acá, un selector con una sola opción elegida. */}
                      <Segmented
                        size="compact"
                        label={`Estado de ${rubro.name}`}
                        value={rubroStatus}
                        onValueChange={(value) =>
                          onChange({
                            ...statuses,
                            ...Object.fromEntries(
                              rubro.tasks.map((task) => [
                                task.id,
                                value as TaskStatus,
                              ]),
                            ),
                          })
                        }
                        options={options}
                      />
                    </div>
                    <ul className="flex flex-col gap-related pl-group">
                      {rubro.tasks.map((task) => (
                        <li
                          key={task.id}
                          className="flex flex-wrap items-center justify-between gap-compact text-body"
                        >
                          <span className="text-ink-muted">{task.name}</span>
                          <Segmented
                            size="compact"
                            label={`Estado de ${task.name}`}
                            value={of(task.id)}
                            onValueChange={(value) =>
                              onChange({
                                ...statuses,
                                [task.id]: value as TaskStatus,
                              })
                            }
                            options={options}
                          />
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ================================================================== Como hoy */

type StepId =
  "basica" | "estructura" | "rubros" | "por-unidad" | "estado" | "equipo";
const allSteps: {
  id: StepId;
  label: string;
  title: string;
  icon: LucideIcon;
  hidden?: boolean;
  onlyRunning?: boolean;
}[] = [
  {
    id: "basica",
    label: "Información Básica",
    title: "Información del Proyecto",
    icon: ClipboardList,
  },
  {
    id: "estructura",
    label: "Niveles y Locales",
    title: "Configuración de Niveles y Locales",
    icon: Building2,
  },
  {
    id: "rubros",
    label: "Rubros y Tareas",
    title: "Rubros y Tareas",
    icon: ListChecks,
  },
  {
    id: "por-unidad",
    label: "Asignación por Unidad",
    title: "Revisar aplicación por unidad",
    icon: LayoutGrid,
    hidden: true,
  },
  {
    id: "estado",
    label: "Estado actual de Obra",
    title: "Estado inicial de Obra",
    icon: Hammer,
    onlyRunning: true,
  },
  {
    id: "equipo",
    label: "Equipo de Trabajo",
    title: "Equipo de Trabajo",
    icon: Users,
  },
];

function StageCards({
  value,
  onChange,
}: {
  value: Stage;
  onChange: (stage: Stage) => void;
}) {
  const cards: { value: Stage; title: string; body: string }[] = [
    {
      value: "not_started",
      title: "La obra aún no comenzó",
      body: "Vas a configurar la obra desde cero y el seguimiento va a arrancar con todos los rubros y tareas como «pendientes».",
    },
    {
      value: "in_execution",
      title: "La obra ya está en ejecución",
      body: "Vas a poder indicar qué rubros ya están «Completados» o «En proceso» para empezar el seguimiento desde el estado actual.",
    },
  ];
  return (
    // Radios de verdad: las flechas cambian la opción y el grupo es un solo paso de Tab (hoy, dos).
    <div
      role="radiogroup"
      aria-label="Etapa de la obra"
      className="flex flex-col gap-group lg:flex-row lg:justify-center"
    >
      {cards.map((card) => {
        const checked = value === card.value;
        return (
          <label
            key={card.value}
            className={cn(
              "relative flex min-h-50 w-full cursor-pointer flex-col justify-end gap-compact rounded-control border bg-canvas-raised p-block text-left lg:max-w-95",
              checked
                ? "border-action shadow-action"
                : "border-line hover:border-line-strong",
              "has-[input:focus-visible]:[box-shadow:var(--focus-ring)]",
            )}
          >
            <input
              type="radio"
              name="etapa"
              value={card.value}
              checked={checked}
              onChange={() => onChange(card.value)}
              className="sr-only"
            />
            <span
              aria-hidden
              className={cn(
                "absolute top-block right-block grid size-5 place-items-center rounded-pill border",
                checked
                  ? "border-action bg-action text-action-ink"
                  : "border-line-strong",
              )}
            >
              {checked ? <Icon icon={Check} size="xs" /> : null}
            </span>
            <span className="text-section">{card.title}</span>
            <span className="text-body text-ink-muted">{card.body}</span>
          </label>
        );
      })}
    </div>
  );
}

/** El stepper de hoy (círculos con íconos), con lista ordenada, «(listo)» para el lector y versión celular. */
function StepperToday({
  steps,
  current,
}: {
  steps: typeof allSteps;
  current: number;
}) {
  const visible = steps.filter((step) => !step.hidden);
  const currentStep = steps[current];
  const visibleIndex = Math.max(
    0,
    visible.findIndex((step) => step.id === currentStep.id) === -1
      ? visible.findIndex((step) => step.id === "rubros")
      : visible.findIndex((step) => step.id === currentStep.id),
  );
  return (
    <nav aria-label="Pasos para crear la obra">
      {/* Hoy no hay versión celular: 6 círculos de 90 px no entran y la fila se desborda. */}
      <div className="flex flex-col gap-compact sm:hidden">
        <p className="text-meta text-ink-muted">
          Paso {visibleIndex + 1} de {visible.length}
        </p>
        <Progress
          value={((visibleIndex + 1) / visible.length) * 100}
          label={`Paso ${visibleIndex + 1} de ${visible.length}`}
          size="thin"
        />
      </div>
      <ol className="hidden items-start sm:flex">
        {visible.map((step, index) => {
          const done =
            index < visibleIndex ||
            (currentStep.hidden && step.id === "rubros");
          const active = index === visibleIndex && !currentStep.hidden;
          return (
            <li
              key={step.id}
              aria-current={active ? "step" : undefined}
              className="flex flex-1 items-start last:flex-none"
            >
              <span className="flex w-22.5 flex-col items-center gap-compact text-center">
                <span
                  className={cn(
                    "grid size-10 place-items-center rounded-pill",
                    done || active
                      ? "bg-action text-action-ink shadow-action"
                      : "bg-canvas-track text-ink-subtle",
                  )}
                >
                  <Icon icon={done ? Check : step.icon} size="md" />
                </span>
                <span
                  className={cn(
                    "text-meta",
                    done || active ? "text-ink" : "text-ink-muted",
                  )}
                >
                  {step.label}
                  {done ? <span className="sr-only"> (listo)</span> : null}
                </span>
              </span>
              {index < visible.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    "mt-5 h-0.5 flex-1 rounded-pill",
                    index < visibleIndex ? "bg-action" : "bg-line",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function BasicInfoToday({
  errors,
  values,
  onChange,
}: {
  errors: Record<string, string>;
  values: {
    name: string;
    surface: string;
    location: string;
    start?: Date;
    end?: Date;
  };
  onChange: (patch: Partial<typeof values>) => void;
}) {
  return (
    <div className="flex flex-col gap-group">
      <div className="grid gap-group sm:grid-cols-2">
        <Field label="Nombre del proyecto" required error={errors.name}>
          <Input
            value={values.name}
            placeholder="Ej. Edificio Las Palmas"
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </Field>
        <Field label="Superficie total" required error={errors.surface}>
          <InputGroup
            end="m²"
            inputMode="decimal"
            placeholder="Ej. 2.000,50"
            value={values.surface}
            onChange={(event) => onChange({ surface: event.target.value })}
          />
        </Field>
      </div>
      <Field label="Ubicación" optional>
        <InputGroup
          start={<Icon icon={MapPin} size="xs" />}
          placeholder="Dirección completa"
          value={values.location}
          onChange={(event) => onChange({ location: event.target.value })}
        />
      </Field>
      <div className="grid gap-group sm:grid-cols-2">
        <Field label="Fecha de inicio" required error={errors.start}>
          <DatePicker
            value={values.start}
            max={values.end}
            onChange={(start) => onChange({ start })}
          />
        </Field>
        <Field
          label="Fecha de finalización estimada"
          required
          error={errors.end}
        >
          <DatePicker
            value={values.end}
            min={values.start}
            onChange={(end) => onChange({ end })}
          />
        </Field>
      </div>
      {/* Hoy el título de la imagen no está conectado al campo y dice «PNG, JPG hasta 20MB» aunque acepta más. */}
      <Field label="Imagen del proyecto" optional>
        <FileField
          files={[]}
          onAdd={() => undefined}
          onRemove={() => undefined}
          accept="image/*"
          acceptLabel="JPG, PNG, WebP o HEIC"
          maxSizeMB={20}
          maxFiles={1}
        />
      </Field>
    </div>
  );
}

function TeamToday({
  members,
  onChange,
}: {
  members: Member[];
  onChange: (members: Member[]) => void;
}) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    role: "",
    email: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const add = () => {
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = "Ingresá el nombre.";
    if (!form.lastName.trim()) next.lastName = "Ingresá el apellido.";
    if (!form.role) next.role = "Elegí el rol.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Ingresá un mail válido.";
    else if (members.some((member) => member.email === form.email))
      next.email = "Ese mail ya está en el equipo.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const [type, role] = form.role.split(":");
    onChange([
      ...members,
      {
        id: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        type,
        role,
      },
    ]);
    setForm({ firstName: "", lastName: "", role: "", email: "" });
  };
  const pool = available.filter(
    (person) => !members.some((member) => member.id === person.id),
  );
  return (
    <div className="flex flex-col gap-block">
      <p className="text-body text-ink-muted">
        Agregá a quienes van a trabajar en esta obra. Quien la crea entra como
        Owner.
      </p>
      {/* Hoy salta de h2 a h4 y los errores aparecen de a uno, sin marcar el campo. */}
      <section aria-labelledby="nuevos" className="flex flex-col gap-snug">
        <div>
          <h3 id="nuevos" className="text-label">
            Nuevos miembros
          </h3>
          <p className="text-meta text-ink-muted">
            Para quienes no están en otras obras de la empresa.
          </p>
        </div>
        <div className="flex flex-col gap-snug rounded-control border border-action/15 bg-canvas p-group">
          <div className="grid gap-snug sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Nombre" required error={errors.firstName}>
              <Input
                value={form.firstName}
                onChange={(event) =>
                  setForm({ ...form, firstName: event.target.value })
                }
                autoComplete="off"
              />
            </Field>
            <Field label="Apellido" required error={errors.lastName}>
              <Input
                value={form.lastName}
                onChange={(event) =>
                  setForm({ ...form, lastName: event.target.value })
                }
                autoComplete="off"
              />
            </Field>
            <Field label="Rol" required error={errors.role}>
              <RoleSelect
                value={form.role}
                onChange={(role) => setForm({ ...form, role })}
              />
            </Field>
          </div>
          <div className="flex flex-col gap-snug sm:flex-row sm:items-start">
            <Field
              label="Mail"
              required
              error={errors.email}
              className="min-w-0 flex-1"
            >
              <Input
                type="email"
                value={form.email}
                placeholder="correo@ejemplo.com"
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                onKeyDown={(event) => event.key === "Enter" && add()}
              />
            </Field>
            <Button className="sm:mt-6.5" onClick={add}>
              <Icon icon={Plus} /> Agregar miembro
            </Button>
          </div>
        </div>
      </section>
      {pool.length > 0 ? (
        <section
          aria-labelledby="disponible"
          className="flex flex-col gap-snug"
        >
          <div>
            <h3 id="disponible" className="text-label">
              Equipo disponible
            </h3>
            <p className="text-meta text-ink-muted">
              Ya trabajan en otras obras de la empresa.
            </p>
          </div>
          <ul className="grid gap-compact sm:grid-cols-2 lg:grid-cols-3">
            {pool.map((person) => (
              <li
                key={person.id}
                className="flex items-center gap-compact rounded-control border border-line p-compact"
              >
                <Avatar
                  name={`${person.firstName} ${person.lastName}`}
                  size="sm"
                  tone="naranja"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-label">
                    {person.firstName} {person.lastName}
                  </span>
                  <span className="block truncate text-meta text-ink-muted">
                    {person.role}
                  </span>
                </span>
                <Button
                  size="compact"
                  variant="outline"
                  onClick={() => onChange([...members, person])}
                >
                  <Icon icon={UserPlus} size="xs" /> Agregar
                  <span className="sr-only"> a {person.firstName}</span>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section aria-labelledby="asignado" className="flex flex-col gap-snug">
        <h3 id="asignado" className="text-label">
          Equipo asignado a esta obra
        </h3>
        {members.length === 0 ? (
          <div className="rounded-control border border-dashed border-line">
            <EmptyState
              icon={Users}
              size="compact"
              title="Todavía no sumaste a nadie"
              description="Podés crear la obra igual y sumar al equipo después."
            />
          </div>
        ) : (
          <ul className="flex flex-col gap-compact">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-center gap-snug rounded-control border border-action/20 bg-action-soft p-snug"
              >
                <Avatar
                  name={`${member.firstName} ${member.lastName}`}
                  size="md"
                  tone="naranja"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-label">
                    {member.firstName} {member.lastName}
                  </span>
                  <span className="block truncate text-meta text-ink-muted">
                    {member.email}
                  </span>
                </span>
                <Badge tone="action" size="compact">
                  {member.type}
                </Badge>
                <span className="hidden text-meta sm:inline">
                  {member.role}
                </span>
                <IconButton
                  icon={Trash2}
                  label={`Quitar a ${member.firstName} ${member.lastName}`}
                  size="compact"
                  onClick={() =>
                    onChange(members.filter((item) => item.id !== member.id))
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function CrearObraHoy({ startAt = "etapa" }: { startAt?: "etapa" | StepId }) {
  const config = useConfigState();
  const [phase, setPhase] = useState<"etapa" | "asistente">(
    startAt === "etapa" ? "etapa" : "asistente",
  );
  const [stage, setStage] = useState<Stage>("in_execution");
  const steps = allSteps.filter(
    (step) => stage === "in_execution" || !step.onlyRunning,
  );
  const [current, setCurrent] = useState(
    Math.max(
      0,
      steps.findIndex((step) => step.id === startAt),
    ),
  );
  const [basic, setBasic] = useState<{
    name: string;
    surface: string;
    location: string;
    start?: Date;
    end?: Date;
  }>({ name: "", surface: "", location: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, TaskStatus>>({});
  const [members, setMembers] = useState<Member[]>([available[0]]);
  const [askDraft, setAskDraft] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [created, setCreated] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const step = steps[current];

  // Hoy, al cambiar de paso, el foco se queda en el botón y el lector no se entera del paso nuevo.
  useEffect(() => {
    if (phase === "asistente") heading.current?.focus();
  }, [current, phase]);

  const next = () => {
    if (step.id === "basica") {
      const found: Record<string, string> = {};
      if (!basic.name.trim())
        found.name = "El nombre del proyecto es obligatorio.";
      if (!basic.surface.trim())
        found.surface = "La superficie total es obligatoria.";
      if (!basic.start) found.start = "La fecha de inicio es obligatoria.";
      if (!basic.end) found.end = "La fecha de finalización es obligatoria.";
      setErrors(found);
      if (Object.keys(found).length) return;
    }
    if (current === steps.length - 1) setCreated(true);
    else setCurrent(current + 1);
  };

  if (phase === "etapa") {
    return (
      <main
        id="contenido"
        className="flex min-h-dvh flex-col items-center justify-center gap-14 bg-canvas px-block py-chapter text-ink"
      >
        <div className="flex max-w-224 flex-col gap-group text-center">
          <h1 className="text-headline sm:text-display">
            Antes de empezar, contanos en qué etapa está tu obra.
          </h1>
          <p className="text-reading text-ink-muted">
            Esto nos ayuda a configurar la obra de la forma más adecuada.
          </p>
        </div>
        <StageCards value={stage} onChange={setStage} />
        <Button size="large" onClick={() => setPhase("asistente")}>
          Comenzar configuración <Icon icon={ArrowRight} />
        </Button>
      </main>
    );
  }

  return (
    <main
      id="contenido"
      className="min-h-dvh bg-canvas px-group pt-chapter pb-16 text-ink sm:px-block"
    >
      <div className="mx-auto flex max-w-224 flex-col gap-block">
        <div className="flex flex-col gap-compact">
          <button
            type="button"
            onClick={() => setLeaving(true)}
            className="focus-ring flex cursor-pointer items-center gap-related self-start rounded-box text-reading text-ink-muted hover:text-ink"
          >
            <Icon icon={ArrowLeft} /> Volver
          </button>
          <h1 className="text-heading">Crear nueva obra</h1>
          <p className="text-body text-ink-muted">
            Configurá los detalles de tu nueva obra.
          </p>
        </div>
        <StepperToday steps={steps} current={current} />
        <section
          aria-labelledby="titulo-paso"
          className={cn(
            "rounded-surface border border-line bg-canvas-raised p-group shadow-hint sm:p-8.25",
            created && "opacity-40",
          )}
        >
          <h2
            id="titulo-paso"
            ref={heading}
            tabIndex={-1}
            className="mb-block text-section font-regular outline-none"
          >
            {step.title}
          </h2>
          {step.id === "basica" ? (
            <BasicInfoToday
              values={basic}
              errors={errors}
              onChange={(patch) => (
                setBasic({ ...basic, ...patch }),
                setErrors({})
              )}
            />
          ) : null}
          {step.id === "estructura" ? (
            <StructureToday state={config} onDelete={(_, run) => run()} />
          ) : null}
          {step.id === "rubros" ? (
            <RubrosToday state={config} onDelete={(run) => run()} />
          ) : null}
          {step.id === "por-unidad" ? <UnitTasksTree state={config} /> : null}
          {step.id === "estado" ? (
            <WorkStatusStep
              groups={config.groups}
              statuses={statuses}
              onChange={setStatuses}
            />
          ) : null}
          {step.id === "equipo" ? (
            <TeamToday members={members} onChange={setMembers} />
          ) : null}
        </section>
        {created ? null : (
          // Hoy en el celular los tres botones quedan apretados en una fila.
          <div className="flex flex-col-reverse gap-snug sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="outline"
              size="large"
              onClick={() =>
                current === 0 ? setPhase("etapa") : setCurrent(current - 1)
              }
            >
              <Icon icon={ArrowLeft} /> Anterior
            </Button>
            <div className="flex flex-col-reverse gap-snug sm:flex-row sm:gap-block">
              <Button
                variant="ghost"
                size="large"
                onClick={() => setAskDraft(true)}
              >
                Guardar borrador
              </Button>
              <Button size="large" onClick={next}>
                {current === steps.length - 1 ? "Crear obra" : "Siguiente"}{" "}
                <Icon
                  icon={current === steps.length - 1 ? Check : ArrowRight}
                />
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={askDraft}
        onOpenChange={setAskDraft}
        title="¿Guardar el borrador?"
        description="Se guarda lo que cargaste hasta acá. Podés retomar la configuración cuando quieras."
        confirmLabel="Guardar borrador"
        cancelLabel="Seguir editando"
        onConfirm={() => (setAskDraft(false), setDraftSaved(true))}
      />
      {/* Hoy no se puede cerrar: una sola salida. Acá también se puede seguir editando. */}
      <Dialog open={draftSaved} onOpenChange={setDraftSaved}>
        <DialogContent
          size="narrow"
          title="Borrador guardado"
          description="Podés continuar la configuración cuando quieras."
          footer={
            <>
              <Button variant="outline" onClick={() => setDraftSaved(false)}>
                Seguir editando
              </Button>
              <Button>Volver al inicio</Button>
            </>
          }
        >
          <span className="mx-auto grid size-20 place-items-center rounded-pill bg-action-soft text-action-text">
            <Icon icon={Save} size="lg" />
          </span>
        </DialogContent>
      </Dialog>
      <Dialog open={created} onOpenChange={() => undefined}>
        <DialogContent
          size="narrow"
          hideClose
          title="¡Obra creada!"
          description={`La obra ${basic.name || "Torre Alamo"} está lista para empezar.`}
          footer={<Button className="w-full">Entrar a la obra</Button>}
        >
          <span className="mx-auto grid size-20 place-items-center rounded-pill bg-fn-ok-canvas text-fn-ok">
            <Icon icon={CheckCircle2} size="lg" />
          </span>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={leaving}
        onOpenChange={setLeaving}
        title="¿Salir sin guardar?"
        description="Hoy al tocar «Volver» se pierde todo sin aviso. Si salís, se pierde lo que cargaste desde el último borrador."
        confirmLabel="Salir sin guardar"
        cancelLabel="Seguir editando"
        tone="danger"
        onConfirm={() => setLeaving(false)}
      />
    </main>
  );
}

/* ================================================================== Propuesta */

const proposalSteps = [
  {
    id: "datos",
    label: "Datos de la obra",
    description: "Nombre, lugar, fechas y etapa",
  },
  { id: "estructura", label: "Estructura", description: "Niveles y unidades" },
  {
    id: "rubros",
    label: "Rubros y tareas",
    description: "Desde una plantilla",
  },
  { id: "estado", label: "Estado actual", description: "Lo que ya está hecho" },
  { id: "equipo", label: "Equipo", description: "Opcional" },
  {
    id: "revisar",
    label: "Revisar y crear",
    description: "Todo de un vistazo",
  },
] as const;

const templates: {
  id: string;
  title: string;
  body: string;
  icon: LucideIcon;
}[] = [
  {
    id: "altura",
    title: "Edificio en altura",
    body: "6 grupos, 49 rubros con sus tareas. Estructura pesa 30%.",
    icon: Building2,
  },
  {
    id: "casa",
    title: "Casa o dúplex",
    body: "5 grupos, 31 rubros. Sin ascensor ni áreas comunes.",
    icon: Home,
  },
  {
    id: "otra-obra",
    title: "Copiar de otra obra",
    body: "Usá los rubros y pesos de Barrio Los Álamos o Edificio Mirador.",
    icon: ClipboardList,
  },
];

function CrearObraPropuesta() {
  const config = useConfigState();
  const [stage, setStage] = useState<Stage>("in_execution");
  const steps = proposalSteps.filter(
    (step) => stage === "in_execution" || step.id !== "estado",
  );
  const [current, setCurrent] = useState(0);
  const [template, setTemplate] = useState("altura");
  const [statuses, setStatuses] = useState<Record<string, TaskStatus>>({});
  const [invites, setInvites] = useState([
    { email: "ana.torres@grupoalamo.com.ar", role: "Admin:Project Manager" },
    { email: "", role: "" },
  ]);
  const heading = useRef<HTMLHeadingElement>(null);
  const step = steps[current];
  useEffect(() => heading.current?.focus(), [current]);

  const body: Record<(typeof proposalSteps)[number]["id"], ReactNode> = {
    datos: (
      <div className="grid max-w-reading gap-group">
        <Field label="Nombre de la obra" required>
          <Input defaultValue="Torre Alamo" />
        </Field>
        <Field
          label="Dirección"
          optional
          description="Se usa también para el clima del portal de clientes."
        >
          <InputGroup
            start={<Icon icon={MapPin} size="xs" />}
            defaultValue="Av. Siempreviva 742, Córdoba"
          />
        </Field>
        <div className="grid gap-group sm:grid-cols-2">
          <Field label="Inicio" required>
            <DatePicker
              value={new Date(2026, 5, 1)}
              onChange={() => undefined}
            />
          </Field>
          <Field label="Fin estimado" required description="10 meses de obra.">
            <DatePicker
              value={new Date(2027, 3, 30)}
              onChange={() => undefined}
            />
          </Field>
        </div>
        {/* La etapa como una pregunta más del formulario, en vez de una pantalla aparte antes de empezar. */}
        <div className="flex flex-col gap-compact">
          <p id="etapa-label" className="text-label">
            ¿En qué etapa está?
          </p>
          <Segmented
            label="Etapa de la obra"
            value={stage}
            onValueChange={(value) => setStage(value as Stage)}
            options={[
              { value: "not_started", label: "Todavía no empezó" },
              { value: "in_execution", label: "Ya está en ejecución" },
            ]}
            className="self-start"
          />
          <p className="text-meta text-ink-muted">
            {stage === "in_execution"
              ? "Después vas a marcar qué rubros ya están hechos."
              : "Todo arranca sin iniciar."}
          </p>
        </div>
      </div>
    ),
    estructura: <StructureProposal state={config} />,
    rubros: (
      <div className="flex flex-col gap-block">
        {/* Arrancar de una plantilla (como Notion o Procore), y ajustar después. */}
        <div
          role="radiogroup"
          aria-label="Plantilla de rubros"
          className="grid gap-snug md:grid-cols-3"
        >
          {templates.map((item) => (
            <label
              key={item.id}
              className={cn(
                "flex cursor-pointer flex-col gap-compact rounded-control border p-group has-[input:focus-visible]:[box-shadow:var(--focus-ring)]",
                template === item.id
                  ? "border-action bg-action-soft"
                  : "border-line hover:border-line-strong",
              )}
            >
              <input
                type="radio"
                name="plantilla"
                value={item.id}
                checked={template === item.id}
                onChange={() => setTemplate(item.id)}
                className="sr-only"
              />
              <Icon icon={item.icon} className="text-action-text" />
              <span className="text-label">{item.title}</span>
              <span className="text-meta text-ink-muted">{item.body}</span>
            </label>
          ))}
        </div>
        <RubrosProposal state={config} />
        <p className="text-meta text-ink-muted">
          Todas las tareas se aplican a todas las unidades. Las que no
          correspondan se quitan después en Configuración → Rubros por unidad.
        </p>
      </div>
    ),
    estado: (
      <WorkStatusStep
        groups={config.groups}
        statuses={statuses}
        onChange={setStatuses}
        sentence
      />
    ),
    equipo: (
      <div className="flex max-w-reading flex-col gap-group">
        <p className="text-body text-ink-muted">
          Invitá por mail; cada uno crea su cuenta. Podés hacerlo ahora o
          después desde Equipo.
        </p>
        {/* Invitar en filas (mail + rol), como Slack o Linear: sin nombre y apellido, que completa cada uno. */}
        <ul className="flex flex-col gap-snug">
          {invites.map((invite, index) => (
            <li
              key={index}
              className="grid items-end gap-compact sm:grid-cols-[minmax(0,1fr)_14rem_auto]"
            >
              <Field label={`Mail ${index + 1}`}>
                <Input
                  type="email"
                  value={invite.email}
                  placeholder="correo@ejemplo.com"
                  onChange={(event) =>
                    setInvites(
                      invites.map((item, i) =>
                        i === index
                          ? { ...item, email: event.target.value }
                          : item,
                      ),
                    )
                  }
                />
              </Field>
              <Field label={`Rol ${index + 1}`}>
                <RoleSelect
                  value={invite.role}
                  onChange={(role) =>
                    setInvites(
                      invites.map((item, i) =>
                        i === index ? { ...item, role } : item,
                      ),
                    )
                  }
                />
              </Field>
              <IconButton
                icon={Trash2}
                label={`Quitar la invitación ${index + 1}`}
                onClick={() =>
                  setInvites(invites.filter((_, i) => i !== index))
                }
              />
            </li>
          ))}
        </ul>
        <Button
          variant="outline"
          className="self-start"
          onClick={() => setInvites([...invites, { email: "", role: "" }])}
        >
          <Icon icon={Plus} /> Otra invitación
        </Button>
      </div>
    ),
    revisar: (
      <div className="grid max-w-reading gap-snug">
        <ul className="grid gap-snug">
          {[
            ["Obra", "Torre Alamo · Av. Siempreviva 742, Córdoba", 0],
            ["Fechas", "1 jun 2026 → 30 abr 2027", 0],
            [
              "Etapa",
              stage === "in_execution"
                ? `En ejecución · ${Object.values(statuses).filter((value) => value !== "pending").length} tareas ya marcadas`
                : "Todavía no empezó",
              0,
            ],
            [
              "Estructura",
              `${config.floors.length} niveles · ${config.floors.reduce((sum, floor) => sum + floor.units.length, 0)} unidades`,
              steps.findIndex((s) => s.id === "estructura"),
            ],
            [
              "Rubros",
              `${templates.find((item) => item.id === template)?.title} · ${config.groups.reduce((sum, group) => sum + group.rubros.length, 0)} rubros`,
              steps.findIndex((s) => s.id === "rubros"),
            ],
            [
              "Equipo",
              `${invites.filter((item) => item.email).length} invitaciones`,
              steps.findIndex((s) => s.id === "equipo"),
            ],
          ].map(([term, value, target]) => (
            <li
              key={term as string}
              className="flex items-start justify-between gap-snug rounded-control border border-line p-group"
            >
              <dl>
                <dt className="text-meta text-ink-muted">{term}</dt>
                <dd className="text-body">{value}</dd>
              </dl>
              <Button
                variant="ghost"
                size="compact"
                onClick={() => setCurrent(target as number)}
              >
                Cambiar
                <span className="sr-only"> {String(term).toLowerCase()}</span>
              </Button>
            </li>
          ))}
        </ul>
        {stage === "in_execution" ? (
          <p className="flex items-center gap-compact text-meta text-ink-muted">
            <Icon icon={AlertCircle} size="xs" /> El avance arranca desde lo que
            marcaste como hecho.
          </p>
        ) : null}
      </div>
    ),
  };

  return (
    <WizardLayout
      topbar={
        <Topbar
          start={<BrandMark />}
          title="Nueva obra"
          end={
            <Button variant="ghost" size="compact">
              <Icon icon={LogOut} /> Salir
            </Button>
          }
        />
      }
      steps={
        <Stepper
          steps={steps.map((item) => ({
            id: item.id,
            label: item.label,
            description: item.description,
          }))}
          current={current}
          onStepClick={setCurrent}
        />
      }
      footer={
        <WizardFooter
          current={current}
          total={steps.length}
          finishLabel="Crear obra"
          onBack={() => setCurrent(Math.max(0, current - 1))}
          onNext={() => setCurrent(Math.min(steps.length - 1, current + 1))}
          // Se guarda solo (como Google Docs): sin botón «Guardar borrador» ni modal que no se cierra.
          secondary={
            <p
              className="hidden items-center gap-related text-meta text-ink-muted sm:flex"
              aria-live="polite"
            >
              <Icon icon={Check} size="xs" /> Borrador guardado
            </p>
          }
        />
      }
    >
      <div className="flex flex-col gap-related">
        <h1 ref={heading} tabIndex={-1} className="text-title outline-none">
          {step.label}
        </h1>
        <p className="text-body text-ink-muted">{step.description}</p>
      </div>
      {body[step.id]}
    </WizardLayout>
  );
}

/* ------------------------------------------------------------------ Historias */

const meta = {
  title: "Pantallas/Crear obra",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;

export const ComoHoyEtapa: StoryObj = {
  name: "Como hoy · etapa",
  render: () => <CrearObraHoy />,
};
export const ComoHoyDatos: StoryObj = {
  name: "Como hoy · información básica",
  render: () => <CrearObraHoy startAt="basica" />,
};
export const ComoHoyEstado: StoryObj = {
  name: "Como hoy · estado actual",
  render: () => <CrearObraHoy startAt="estado" />,
};
export const ComoHoyEquipo: StoryObj = {
  name: "Como hoy · equipo",
  render: () => <CrearObraHoy startAt="equipo" />,
};
export const Propuesta: StoryObj = {
  name: "Propuesta",
  render: () => <CrearObraPropuesta />,
};
