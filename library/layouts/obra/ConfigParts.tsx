/* Piezas de la configuración de la obra (estructura, rubros, tareas por unidad), en las
   dos versiones. Las usan Configuración y Crear obra. Es de los ejemplos del catálogo. */
import { useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  Building2,
  Check,
  ChevronDown,
  Copy,
  GripVertical,
  Info,
  Plus,
  SquarePen,
  SquarePlus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "../../atoms/button/Button";
import { IconButton } from "../../atoms/button/IconButton";
import { Checkbox } from "../../atoms/checkbox/Checkbox";
import { Icon } from "../../atoms/icon/Icon";
import { Input } from "../../atoms/input/Input";
import { Link } from "../../atoms/link/Link";
import { Progress } from "../../atoms/progress/Progress";
import { Tooltip } from "../../atoms/tooltip/Tooltip";
import { formatArea, formatPercent } from "../../foundations/format/format";
import { cn } from "../../lib/cn";
import { Dialog, DialogContent } from "../../molecules/dialog/Dialog";
import { Field } from "../../molecules/field/Field";
import { InputGroup } from "../../molecules/input-group/InputGroup";
import { Notice } from "../../molecules/notice/Notice";
import { Segmented } from "../../molecules/segmented/Segmented";
import { Select, SelectGroup, SelectItem } from "../../molecules/select/Select";
import { FloorPlan, FloorPlanCell } from "../../organisms/floor-plan/FloorPlan";

export type UnitRow = {
  id: string;
  code: string;
  type: string;
  m2: string;
  rooms: string;
  size: string;
};
export type FloorRow = {
  id: string;
  name: string;
  identifier: string;
  level: string;
  units: UnitRow[];
};
export type TaskRow = { id: string; name: string };
export type RubroRow = {
  id: string;
  name: string;
  weight: string;
  tasks: TaskRow[];
};
export type GroupRow = { id: string; name: string; rubros: RubroRow[] };

export const unitTypes = [
  {
    label: "Unidad funcional",
    types: ["Departamento", "Oficina", "Estacionamiento", "SUM"],
  },
  {
    label: "Área común",
    types: ["Lobby", "Piscina", "Patio", "Terraza", "Ascensor", "Palier"],
  },
];

export const initialFloors: FloorRow[] = [
  {
    id: "pb",
    name: "Planta Baja",
    identifier: "PB",
    level: "0.00",
    units: [
      {
        id: "u1",
        code: "PB-01",
        type: "Lobby",
        m2: "85,00",
        rooms: "",
        size: "M",
      },
      {
        id: "u2",
        code: "PB-02",
        type: "SUM",
        m2: "60,00",
        rooms: "",
        size: "L",
      },
    ],
  },
  {
    id: "p1",
    name: "Piso 1",
    identifier: "P1",
    level: "+3.00",
    units: [
      {
        id: "u3",
        code: "1A",
        type: "Departamento",
        m2: "72,50",
        rooms: "3",
        size: "",
      },
      {
        id: "u4",
        code: "1B",
        type: "Departamento",
        m2: "58,00",
        rooms: "2",
        size: "",
      },
      {
        id: "u5",
        code: "1C",
        type: "Departamento",
        m2: "56,40",
        rooms: "2",
        size: "",
      },
      {
        id: "u6",
        code: "1D",
        type: "Departamento",
        m2: "41,20",
        rooms: "1",
        size: "",
      },
    ],
  },
];

let seq = 0;
export const uid = (prefix: string) => `${prefix}-${++seq}`;
const tasksOf = (...names: string[]) =>
  names.map((name) => ({ id: uid("t"), name }));

export const initialGroups: GroupRow[] = [
  {
    id: "g1",
    name: "Obra Gruesa",
    rubros: [
      {
        id: "r11",
        name: "Estructura de Fundación",
        weight: "10",
        tasks: tasksOf("Excavación", "Bases", "Vigas de fundación"),
      },
      {
        id: "r12",
        name: "Estructura Vertical",
        weight: "10",
        tasks: tasksOf("Columnas", "Tabiques"),
      },
      {
        id: "r13",
        name: "Estructura Horizontal",
        weight: "10",
        tasks: tasksOf("Losas", "Vigas"),
      },
      {
        id: "r14",
        name: "Mampostería",
        weight: "",
        tasks: tasksOf("Ladrillo hueco", "Ladrillo común"),
      },
    ],
  },
  {
    id: "g2",
    name: "Instalaciones Eléctricas",
    rubros: [
      {
        id: "r21",
        name: "Cañerías",
        weight: "",
        tasks: tasksOf("Cañerías embutidas", "Cajas"),
      },
      {
        id: "r22",
        name: "Cableado",
        weight: "",
        tasks: tasksOf("Cableado de tomas", "Tablero seccional"),
      },
    ],
  },
  {
    id: "g3",
    name: "Obra Fina",
    rubros: [
      {
        id: "r31",
        name: "Revoques",
        weight: "",
        tasks: tasksOf("Revoque grueso", "Revoque fino"),
      },
      {
        id: "r32",
        name: "Pintura",
        weight: "",
        tasks: tasksOf("Enduido", "Pintura látex"),
      },
    ],
  },
];

export const toNumber = (value: string) =>
  Number(value.replace(/\./g, "").replace(",", ".")) || 0;

/** El reparto de hoy: los rubros en Auto se reparten en partes iguales lo que dejan los manuales. */
export function weightsOf(groups: GroupRow[]) {
  const rubros = groups.flatMap((group) => group.rubros);
  const manual = rubros
    .filter((rubro) => rubro.weight !== "")
    .reduce((sum, rubro) => sum + toNumber(rubro.weight), 0);
  const autos = rubros.filter((rubro) => rubro.weight === "").length;
  const auto = autos ? Math.max(0, 100 - manual) / autos : 0;
  return {
    manual,
    auto,
    over: manual > 100,
    of: (rubro: RubroRow) =>
      rubro.weight === "" ? auto : toNumber(rubro.weight),
  };
}

export function move<T>(list: T[], index: number, delta: number) {
  const next = [...list];
  const target = index + delta;
  if (target < 0 || target >= next.length) return list;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function useConfigState() {
  const [floors, setFloors] = useState(initialFloors);
  const [groups, setGroups] = useState(initialGroups);
  const [excluded, setExcluded] = useState<Record<string, string[]>>({
    u1: groups[1].rubros.flatMap((rubro) => rubro.tasks.map((task) => task.id)),
  });
  const [dirty, setDirty] = useState(false);
  const touch =
    <A extends unknown[]>(fn: (...args: A) => void) =>
    (...args: A) => {
      fn(...args);
      setDirty(true);
    };
  return {
    floors,
    groups,
    excluded,
    dirty,
    setDirty,
    setFloors: touch(setFloors),
    setGroups: touch(setGroups),
    setExcluded: touch(setExcluded),
    reset: () => {
      setFloors(initialFloors);
      setGroups(initialGroups);
      setExcluded({});
      setDirty(false);
    },
  };
}

export function UnitTypeSelect({
  value,
  onChange,
  ...aria
}: {
  value: string;
  onChange: (value: string) => void;
  "aria-label"?: string;
  id?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange} size="compact" {...aria}>
      {unitTypes.map((group) => (
        <SelectGroup key={group.label} label={group.label}>
          {group.types.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectGroup>
      ))}
    </Select>
  );
}

/** Nombre que se edita en el lugar: Enter guarda, Escape cancela. Vacío no se guarda, y avisa. */
export function EditableName({
  value,
  onSave,
  label,
  className,
}: {
  value: string;
  onSave: (value: string) => void;
  label: string;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState(false);
  if (!editing) {
    return (
      <span className={cn("flex min-w-0 items-center gap-related", className)}>
        <span className="truncate">
          {value || <span className="text-ink-muted">Sin nombre</span>}
        </span>
        <IconButton
          icon={SquarePen}
          label={`Editar ${label}`}
          size="compact"
          onClick={() => (setDraft(value), setEditing(true))}
        />
      </span>
    );
  }
  const save = () => {
    if (!draft.trim()) {
      setError(true);
      return;
    }
    onSave(draft.trim());
    setEditing(false);
    setError(false);
  };
  return (
    <span className="flex min-w-0 flex-1 items-center gap-related">
      <Input
        autoFocus
        size="compact"
        value={draft}
        aria-label={`Nombre de ${label}`}
        invalid={error}
        onChange={(event) => (setDraft(event.target.value), setError(false))}
        onKeyDown={(event) => {
          if (event.key === "Enter") save();
          if (event.key === "Escape") setEditing(false);
        }}
        className="min-w-0 flex-1"
      />
      <IconButton icon={Check} label="Guardar" size="compact" onClick={save} />
      <IconButton
        icon={X}
        label="Cancelar"
        size="compact"
        onClick={() => setEditing(false)}
      />
      {error ? (
        <span role="alert" className="sr-only">
          El nombre no puede quedar vacío.
        </span>
      ) : null}
    </span>
  );
}

/* ================================================================== Como hoy */

export function SettingsCard({
  title,
  children,
  collapsible = false,
  defaultOpen = true,
  id,
}: {
  title: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  id: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section
      aria-labelledby={`${id}-titulo`}
      className="flex flex-col rounded-surface border border-line bg-canvas-raised p-group shadow-hint sm:p-block"
    >
      <h2 id={`${id}-titulo`} className="text-reading">
        {collapsible ? (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={`${id}-contenido`}
            onClick={() => setOpen((value) => !value)}
            className="focus-ring flex w-full cursor-pointer items-center gap-compact rounded-box text-left"
          >
            <span className="flex-1">{title}</span>
            <Icon
              icon={ChevronDown}
              className={cn(
                "text-ink-muted transition-transform duration-(--duration-base)",
                open && "rotate-180",
              )}
            />
          </button>
        ) : (
          title
        )}
      </h2>
      {open ? (
        <div id={`${id}-contenido`} className="mt-5 flex flex-col gap-5">
          {children}
        </div>
      ) : null}
    </section>
  );
}

export function StructureToday({
  state,
  onDelete,
}: {
  state: ReturnType<typeof useConfigState>;
  onDelete: (what: "nivel" | "local", run: () => void) => void;
}) {
  const { floors, setFloors } = state;
  const unitCount = floors.reduce((sum, floor) => sum + floor.units.length, 0);
  const updateFloor = (floorId: string, patch: Partial<FloorRow>) =>
    setFloors(
      floors.map((floor) =>
        floor.id === floorId ? { ...floor, ...patch } : floor,
      ),
    );
  const updateUnit = (
    floorId: string,
    unitId: string,
    patch: Partial<UnitRow>,
  ) =>
    setFloors(
      floors.map((floor) =>
        floor.id === floorId
          ? {
              ...floor,
              units: floor.units.map((unit) =>
                unit.id === unitId ? { ...unit, ...patch } : unit,
              ),
            }
          : floor,
      ),
    );
  const addUnit = (floorId: string) =>
    setFloors(
      floors.map((floor) =>
        floor.id === floorId
          ? {
              ...floor,
              units: [
                ...floor.units,
                {
                  id: uid("u"),
                  code: "",
                  type: "Departamento",
                  m2: "",
                  rooms: "",
                  size: "",
                },
              ],
            }
          : floor,
      ),
    );
  const addFloor = () =>
    setFloors([
      ...floors,
      {
        id: uid("f"),
        name: `Nivel ${floors.length + 1}`,
        identifier: "",
        level: "",
        units: [],
      },
    ]);

  return (
    <div className="flex max-w-207.5 flex-col gap-group">
      <div className="flex flex-col gap-snug sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-meta text-ink-muted">Cantidad de niveles</p>
          <p className="text-heading">
            {floors.length} {floors.length === 1 ? "nivel" : "niveles"}
          </p>
          <p className="text-meta text-ink-muted">
            Agregá o eliminá niveles según sea necesario.
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={addFloor}>
          <Icon icon={Plus} /> Agregar nivel
        </Button>
      </div>

      <div className="flex flex-col gap-snug rounded-control bg-action-soft p-group">
        <div>
          <h3 className="text-label">Locales por Nivel</h3>
          <p className="text-meta text-ink-muted">
            Configurá los locales de cada nivel:
          </p>
        </div>
        {floors.map((floor) => (
          <section
            key={floor.id}
            aria-label={floor.name || "Nivel sin nombre"}
            className="flex flex-col gap-snug rounded-control bg-canvas-raised p-group shadow-hint"
          >
            <div className="flex flex-col gap-snug lg:flex-row lg:items-end">
              <div className="grid flex-1 grid-cols-1 gap-snug sm:grid-cols-3">
                <Field
                  label="Nombre del Nivel"
                  required
                  error={
                    floor.name
                      ? undefined
                      : "El nombre del nivel es obligatorio."
                  }
                >
                  <Input
                    size="compact"
                    value={floor.name}
                    placeholder="Ej. Planta Baja"
                    onChange={(event) =>
                      updateFloor(floor.id, { name: event.target.value })
                    }
                  />
                </Field>
                <Field
                  label="Identificador"
                  required
                  description="Nombre corto: PB, P01, SS."
                  error={
                    floor.identifier
                      ? undefined
                      : "El identificador es obligatorio."
                  }
                >
                  <Input
                    size="compact"
                    maxLength={32}
                    value={floor.identifier}
                    placeholder="Ej. PB"
                    onChange={(event) =>
                      updateFloor(floor.id, { identifier: event.target.value })
                    }
                  />
                </Field>
                <Field label="Nivel" optional>
                  <Input
                    size="compact"
                    value={floor.level}
                    placeholder="Ej. +1.90"
                    onChange={(event) =>
                      updateFloor(floor.id, { level: event.target.value })
                    }
                  />
                </Field>
              </div>
              <div className="flex flex-wrap items-center gap-related">
                <Button
                  variant="ghost"
                  size="compact"
                  onClick={() =>
                    setFloors([
                      ...floors,
                      {
                        ...floor,
                        id: uid("f"),
                        name: `${floor.name} (copia)`,
                        identifier: `${floor.identifier} (copia)`,
                        units: floor.units.map((unit) => ({
                          ...unit,
                          id: uid("u"),
                          code: `${unit.code} (copia)`,
                        })),
                      },
                    ])
                  }
                >
                  <Icon icon={Copy} size="xs" /> Duplicar nivel
                </Button>
                <Button
                  variant="ghost"
                  size="compact"
                  onClick={() => addUnit(floor.id)}
                >
                  <Icon icon={SquarePlus} size="xs" /> Agregar local
                </Button>
                <IconButton
                  icon={Trash2}
                  label={`Eliminar ${floor.name || "nivel sin nombre"}`}
                  size="compact"
                  onClick={() =>
                    onDelete("nivel", () =>
                      setFloors(floors.filter((item) => item.id !== floor.id)),
                    )
                  }
                />
              </div>
            </div>

            <ul
              className="flex flex-col gap-compact overflow-x-auto"
              aria-label={`Locales de ${floor.name}`}
            >
              {floor.units.map((unit, index) => (
                <li
                  key={unit.id}
                  className="flex min-w-190 items-end gap-snug rounded-control bg-action-soft p-snug"
                >
                  {/* Hoy se reordena solo arrastrando con el mouse. El agarre ahora también se mueve con las flechas del teclado. */}
                  <Tooltip content="Mover con las flechas ↑ ↓">
                    <button
                      type="button"
                      aria-label={`Mover el local ${unit.code || index + 1}. Usá las flechas arriba y abajo.`}
                      onKeyDown={(event) => {
                        if (
                          event.key !== "ArrowUp" &&
                          event.key !== "ArrowDown"
                        )
                          return;
                        event.preventDefault();
                        updateFloor(floor.id, {
                          units: move(
                            floor.units,
                            index,
                            event.key === "ArrowUp" ? -1 : 1,
                          ),
                        });
                      }}
                      className="focus-ring grid h-11 w-6 shrink-0 cursor-grab place-items-center self-center rounded-compact bg-canvas-raised/70 text-action-text"
                    >
                      <Icon icon={GripVertical} size="xs" />
                    </button>
                  </Tooltip>
                  <Field label="Tipo" className="w-42">
                    <UnitTypeSelect
                      value={unit.type}
                      onChange={(type) =>
                        updateUnit(floor.id, unit.id, { type })
                      }
                    />
                  </Field>
                  <Field label="ID" required className="w-24">
                    <Input
                      size="compact"
                      maxLength={32}
                      value={unit.code}
                      placeholder="Ej. 101"
                      onChange={(event) =>
                        updateUnit(floor.id, unit.id, {
                          code: event.target.value,
                        })
                      }
                    />
                  </Field>
                  <Field label="m²" required className="w-24">
                    <Input
                      size="compact"
                      inputMode="decimal"
                      value={unit.m2}
                      placeholder="Ej. 45,50"
                      onChange={(event) =>
                        updateUnit(floor.id, unit.id, {
                          m2: event.target.value,
                        })
                      }
                    />
                  </Field>
                  {unit.type === "Departamento" ? (
                    <Field label="Ambientes" className="w-24">
                      <Select
                        size="compact"
                        value={unit.rooms || undefined}
                        onValueChange={(rooms) =>
                          updateUnit(floor.id, unit.id, { rooms })
                        }
                        placeholder="Cant."
                      >
                        {["1", "2", "3", "4", "5"].map((value) => (
                          <SelectItem key={value} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                      </Select>
                    </Field>
                  ) : (
                    <Field label="Tamaño" className="w-24">
                      <Select
                        size="compact"
                        value={unit.size || undefined}
                        onValueChange={(size) =>
                          updateUnit(floor.id, unit.id, { size })
                        }
                        placeholder="Tamaño"
                      >
                        {["S", "M", "L", "XL"].map((value) => (
                          <SelectItem key={value} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                      </Select>
                    </Field>
                  )}
                  {(["Planta", "Render"] as const).map((kind) => (
                    <div key={kind} className="flex w-28 flex-col gap-compact">
                      <span className="text-label">{kind}</span>
                      <Button variant="outline" size="compact">
                        <Icon icon={Upload} size="xs" /> Adjuntar
                        <span className="sr-only">
                          {" "}
                          {kind.toLowerCase()} de {unit.code}
                        </span>
                      </Button>
                    </div>
                  ))}
                  <div className="ml-auto flex items-center gap-related self-center">
                    <IconButton
                      icon={Copy}
                      label={`Duplicar el local ${unit.code}`}
                      size="compact"
                      onClick={() =>
                        updateFloor(floor.id, {
                          units: [
                            ...floor.units.slice(0, index + 1),
                            {
                              ...unit,
                              id: uid("u"),
                              code: `${unit.code} (copia)`,
                            },
                            ...floor.units.slice(index + 1),
                          ],
                        })
                      }
                    />
                    <IconButton
                      icon={Trash2}
                      label={`Eliminar el local ${unit.code}`}
                      size="compact"
                      onClick={() =>
                        onDelete("local", () =>
                          updateFloor(floor.id, {
                            units: floor.units.filter(
                              (item) => item.id !== unit.id,
                            ),
                          }),
                        )
                      }
                    />
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => addUnit(floor.id)}
              className="focus-ring motion-color flex h-10 cursor-pointer items-center justify-center gap-compact rounded-control border border-dashed border-line-strong text-label text-ink-muted hover:border-action hover:text-action-text"
            >
              <Icon icon={Plus} size="xs" /> Agregar local
              <span className="sr-only"> a {floor.name}</span>
            </button>
          </section>
        ))}
      </div>

      <p className="flex items-center gap-compact rounded-control border border-action/20 bg-action-soft px-group py-snug text-body">
        <Icon icon={Building2} className="text-action-text" />
        <span>
          <span className="font-medium">Resumen del Proyecto</span> · Total:{" "}
          {floors.length} niveles • {unitCount} unidades
        </span>
      </p>
    </div>
  );
}

export function WeightControl({
  rubro,
  value,
  onChange,
}: {
  rubro: RubroRow;
  value: number;
  onChange: (weight: string) => void;
}) {
  const manual = rubro.weight !== "";
  // Hoy es una píldora-botón con los radios Auto/Manual adentro (controles anidados, de 10 px).
  return (
    <div className="flex items-center gap-compact">
      <Tooltip content="Incidencia del rubro en el avance total. Auto: se recalcula solo. Manual: queda fijo.">
        <button
          type="button"
          aria-label={`Qué es la incidencia de ${rubro.name}`}
          className="focus-ring grid size-6 cursor-help place-items-center rounded-pill text-ink-muted"
        >
          <Icon icon={Info} size="xs" />
        </button>
      </Tooltip>
      {manual ? (
        <InputGroup
          size="compact"
          end="%"
          inputMode="decimal"
          aria-label={`Incidencia de ${rubro.name}`}
          value={rubro.weight}
          onChange={(event) =>
            onChange(event.target.value.replace(/[^\d,]/g, "") || "0")
          }
          groupClassName="w-20"
        />
      ) : (
        <span className="w-20 text-right text-label tabular-nums">
          {formatPercent(value, 1)}
        </span>
      )}
      <Segmented
        size="compact"
        label={`Cómo se calcula la incidencia de ${rubro.name}`}
        value={manual ? "manual" : "auto"}
        onValueChange={(mode) =>
          onChange(
            mode === "manual"
              ? String(Math.round(value * 10) / 10).replace(".", ",")
              : "",
          )
        }
        options={[
          { value: "auto", label: "Auto" },
          { value: "manual", label: "Manual" },
        ]}
      />
    </div>
  );
}

export function RubrosToday({
  state,
  onDelete,
}: {
  state: ReturnType<typeof useConfigState>;
  onDelete: (run: () => void) => void;
}) {
  const { groups, setGroups } = state;
  const weights = weightsOf(groups);
  const [newGroup, setNewGroup] = useState("");
  const [openGroups, setOpenGroups] = useState<string[]>([groups[0].id]);
  const [helpOpen, setHelpOpen] = useState(false);
  const mapRubro = (rubroId: string, fn: (rubro: RubroRow) => RubroRow) =>
    setGroups(
      groups.map((group) => ({
        ...group,
        rubros: group.rubros.map((rubro) =>
          rubro.id === rubroId ? fn(rubro) : rubro,
        ),
      })),
    );

  return (
    <div className="flex flex-col gap-group">
      <p className="text-body text-ink-muted">
        Los rubros están organizados en grupos. Podés agregar, eliminar o editar
        grupos, rubros y tareas, y configurar el porcentaje de incidencia de
        cada rubro en el avance general de la obra.
      </p>
      <Link
        href="#ayuda"
        className="self-start"
        onClick={(event) => (event.preventDefault(), setHelpOpen(true))}
      >
        ¿Cómo se calcula el avance de la obra?
      </Link>
      {weights.over ? (
        <Notice
          tone="danger"
          title="La suma de los porcentajes manuales supera el 100%"
        >
          Hoy suman {formatPercent(weights.manual, 1)}. Ajustá los valores para
          que el total no pase del 100%.
        </Notice>
      ) : null}
      <form
        className="flex flex-col gap-compact sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          if (!newGroup.trim()) return;
          setGroups([
            ...groups,
            { id: uid("g"), name: newGroup.trim(), rubros: [] },
          ]);
          setNewGroup("");
        }}
      >
        <Input
          value={newGroup}
          onChange={(event) => setNewGroup(event.target.value)}
          placeholder="Nombre del nuevo grupo de rubros"
          aria-label="Nuevo grupo de rubros"
          className="flex-1"
        />
        <Button type="submit" disabled={!newGroup.trim()}>
          <Icon icon={Plus} /> Agregar grupo
        </Button>
      </form>

      <ol className="flex flex-col gap-compact">
        {groups.map((group, groupIndex) => {
          const open = openGroups.includes(group.id);
          const taskCount = group.rubros.reduce(
            (sum, rubro) => sum + rubro.tasks.length,
            0,
          );
          return (
            <li
              key={group.id}
              className={cn(
                "overflow-hidden rounded-control border",
                open ? "border-line-strong shadow-hint" : "border-line",
              )}
            >
              <div
                className={cn(
                  "flex min-h-15.5 items-center gap-snug px-group",
                  open && "bg-action-soft",
                )}
              >
                {/* Hoy el nombre también abre el grupo pero no dice si está abierto: un solo botón con aria-expanded. */}
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() =>
                    setOpenGroups(
                      open
                        ? openGroups.filter((id) => id !== group.id)
                        : [...openGroups, group.id],
                    )
                  }
                  className="focus-ring flex min-w-0 flex-1 cursor-pointer items-center gap-snug rounded-box py-compact text-left"
                >
                  <Icon
                    icon={ChevronDown}
                    className={cn(
                      "text-ink-muted transition-transform",
                      !open && "-rotate-90",
                    )}
                  />
                  <span className="grid size-7 shrink-0 place-items-center rounded-control bg-action text-label text-action-ink">
                    {groupIndex + 1}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-label">{group.name}</span>
                    <span className="text-meta text-ink-muted">
                      {group.rubros.length} rubros • {taskCount} tareas
                    </span>
                  </span>
                </button>
                <IconButton
                  icon={Trash2}
                  label={`Eliminar el grupo ${group.name}`}
                  size="compact"
                  onClick={() =>
                    onDelete(() =>
                      setGroups(groups.filter((item) => item.id !== group.id)),
                    )
                  }
                />
              </div>
              {open ? (
                <div className="flex flex-col gap-compact border-t border-line p-snug">
                  {group.rubros.map((rubro, rubroIndex) => (
                    <div
                      key={rubro.id}
                      className="rounded-control border border-line bg-canvas"
                    >
                      <div className="flex flex-col gap-compact px-snug py-compact lg:flex-row lg:items-center">
                        <span className="flex min-w-0 flex-1 items-center gap-compact">
                          <span className="rounded-compact bg-action-soft px-1.5 text-meta font-medium text-action-text tabular-nums">
                            {groupIndex + 1}.{rubroIndex + 1}
                          </span>
                          <EditableName
                            value={rubro.name}
                            label={`el rubro ${rubro.name}`}
                            onSave={(name) =>
                              mapRubro(rubro.id, (item) => ({ ...item, name }))
                            }
                            className="text-label"
                          />
                          <span className="shrink-0 text-meta text-ink-muted">
                            | {rubro.tasks.length} tareas
                          </span>
                        </span>
                        <WeightControl
                          rubro={rubro}
                          value={weights.of(rubro)}
                          onChange={(weight) =>
                            mapRubro(rubro.id, (item) => ({ ...item, weight }))
                          }
                        />
                      </div>
                      <ul className="flex flex-col gap-related px-snug pb-snug">
                        {rubro.tasks.map((task, taskIndex) => (
                          <li
                            key={task.id}
                            className="flex min-h-10 items-center gap-compact rounded-compact bg-canvas-sunken px-compact"
                          >
                            <span className="text-meta text-ink-muted tabular-nums">
                              {groupIndex + 1}.{rubroIndex + 1}.{taskIndex + 1}
                            </span>
                            <EditableName
                              value={task.name}
                              label={`la tarea ${task.name}`}
                              className="flex-1 text-body"
                              onSave={(name) =>
                                mapRubro(rubro.id, (item) => ({
                                  ...item,
                                  tasks: item.tasks.map((t) =>
                                    t.id === task.id ? { ...t, name } : t,
                                  ),
                                }))
                              }
                            />
                            <IconButton
                              icon={Trash2}
                              label={`Eliminar la tarea ${task.name}`}
                              size="compact"
                              onClick={() =>
                                onDelete(() =>
                                  mapRubro(rubro.id, (item) => ({
                                    ...item,
                                    tasks: item.tasks.filter(
                                      (t) => t.id !== task.id,
                                    ),
                                  })),
                                )
                              }
                            />
                          </li>
                        ))}
                        <li>
                          <Button
                            variant="ghost"
                            size="compact"
                            onClick={() =>
                              mapRubro(rubro.id, (item) => ({
                                ...item,
                                tasks: [
                                  ...item.tasks,
                                  { id: uid("t"), name: "Nueva tarea" },
                                ],
                              }))
                            }
                          >
                            <Icon icon={Plus} size="xs" /> Agregar tarea
                            <span className="sr-only"> a {rubro.name}</span>
                          </Button>
                        </li>
                      </ul>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="compact"
                    className="self-start border-dashed"
                    onClick={() =>
                      setGroups(
                        groups.map((item) =>
                          item.id === group.id
                            ? {
                                ...item,
                                rubros: [
                                  ...item.rubros,
                                  {
                                    id: uid("r"),
                                    name: "Nuevo rubro",
                                    weight: "",
                                    tasks: [],
                                  },
                                ],
                              }
                            : item,
                        ),
                      )
                    }
                  >
                    <Icon icon={Plus} size="xs" /> Agregar rubro
                    <span className="sr-only"> a {group.name}</span>
                  </Button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent title="Cómo se calcula el avance de la obra" size="wide">
          <div className="flex flex-col gap-snug text-body">
            <p>
              Cada rubro pesa un porcentaje del avance total. Por defecto, los
              tres rubros de estructura suman el 30% y el resto se reparte en
              partes iguales.
            </p>
            <p>
              Podés cambiar estos valores si tu obra necesita otra distribución.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function UnitTasksTree({
  state,
}: {
  state: ReturnType<typeof useConfigState>;
}) {
  const { floors, groups, excluded, setExcluded } = state;
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const isOpen = (id: string, fallback: boolean) => open[id] ?? fallback;
  const toggle = (id: string, fallback: boolean) =>
    setOpen({ ...open, [id]: !isOpen(id, fallback) });
  const rubros = groups.flatMap((group, groupIndex) =>
    group.rubros.map((rubro, rubroIndex) => ({
      rubro,
      number: `${groupIndex + 1}.${rubroIndex + 1}`,
    })),
  );
  const setTasks = (unitId: string, taskIds: string[], include: boolean) => {
    const current = new Set(excluded[unitId] ?? []);
    taskIds.forEach((id) => (include ? current.delete(id) : current.add(id)));
    setExcluded({ ...excluded, [unitId]: [...current] });
  };
  const disclosure = (
    id: string,
    fallback: boolean,
    children: ReactNode,
    className?: string,
  ) => (
    <button
      type="button"
      aria-expanded={isOpen(id, fallback)}
      onClick={() => toggle(id, fallback)}
      className={cn(
        "focus-ring flex min-h-10 flex-1 cursor-pointer items-center gap-compact rounded-box text-left text-body",
        className,
      )}
    >
      <Icon
        icon={ChevronDown}
        size="xs"
        className={cn(
          "text-ink-muted transition-transform",
          !isOpen(id, fallback) && "-rotate-90",
        )}
      />
      {children}
    </button>
  );

  return (
    <div className="flex flex-col gap-snug">
      <p className="text-body text-ink-muted">
        Todos los rubros y tareas se asignaron a todas las unidades. Revisá cada
        unidad y quitá los rubros o tareas que no le correspondan.
      </p>
      <ul className="flex flex-col gap-related">
        {floors.map((floor) => (
          <li key={floor.id} className="rounded-box bg-canvas-sunken/50">
            {disclosure(
              floor.id,
              true,
              <>{floor.name}</>,
              "px-compact font-medium",
            )}
            {isOpen(floor.id, true) ? (
              <ul className="pb-compact">
                {floor.units.map((unit) => (
                  <li key={unit.id} className="pl-group">
                    {disclosure(
                      unit.id,
                      true,
                      <>
                        {unit.type} · {unit.code}
                      </>,
                    )}
                    {isOpen(unit.id, true) ? (
                      <ul className="pl-8">
                        {rubros.map(({ rubro, number }) => {
                          const ids = rubro.tasks.map((task) => task.id);
                          const off = excluded[unit.id] ?? [];
                          const included = ids.filter(
                            (id) => !off.includes(id),
                          ).length;
                          const checked =
                            included === 0
                              ? false
                              : included === ids.length
                                ? true
                                : "indeterminate";
                          const key = `${unit.id}-${rubro.id}`;
                          return (
                            <li
                              key={rubro.id}
                              className="border-b-2 border-canvas-raised"
                            >
                              <div className="flex items-center gap-compact pr-compact">
                                {disclosure(
                                  key,
                                  false,
                                  <>
                                    {number}. {rubro.name}
                                  </>,
                                )}
                                {/* Hoy las casillas son botones sin nombre: el lector dice «casilla, no marcada». */}
                                <Checkbox
                                  aria-label={`${rubro.name} en ${unit.code}`}
                                  checked={checked}
                                  disabled={ids.length === 0}
                                  onCheckedChange={() =>
                                    setTasks(unit.id, ids, checked !== true)
                                  }
                                />
                              </div>
                              {isOpen(key, false) ? (
                                <ul className="pl-8">
                                  {rubro.tasks.map((task, index) => (
                                    <li
                                      key={task.id}
                                      className="flex min-h-9 items-center gap-compact pr-compact text-body"
                                    >
                                      <label
                                        htmlFor={`${key}-${task.id}`}
                                        className="flex-1 cursor-pointer"
                                      >
                                        {number}.{index + 1}. {task.name}
                                      </label>
                                      <Checkbox
                                        id={`${key}-${task.id}`}
                                        checked={!off.includes(task.id)}
                                        onCheckedChange={(value) =>
                                          setTasks(
                                            unit.id,
                                            [task.id],
                                            value === true,
                                          )
                                        }
                                      />
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ================================================================== Propuesta */

export function StructureProposal({
  state,
}: {
  state: ReturnType<typeof useConfigState>;
}) {
  const { floors, setFloors } = state;
  const [floorId, setFloorId] = useState(floors[1]?.id ?? floors[0].id);
  const [bulk, setBulk] = useState({
    count: "4",
    type: "Departamento",
    prefix: "2",
  });
  const floor = floors.find((item) => item.id === floorId) ?? floors[0];
  const used = floors
    .flatMap((item) => item.units)
    .reduce((sum, unit) => sum + toNumber(unit.m2), 0);
  const updateUnits = (units: UnitRow[]) =>
    setFloors(
      floors.map((item) => (item.id === floor.id ? { ...item, units } : item)),
    );

  return (
    <div className="grid gap-block xl:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="flex flex-col gap-group">
        <div className="flex flex-wrap items-end gap-snug">
          <Field label="Nivel" className="w-56">
            <Select value={floor.id} onValueChange={setFloorId}>
              {floors.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name} · {item.units.length} unidades
                </SelectItem>
              ))}
            </Select>
          </Field>
          <Button
            variant="outline"
            onClick={() => {
              const id = uid("f");
              setFloors([
                ...floors,
                {
                  id,
                  name: `Piso ${floors.length}`,
                  identifier: `P${floors.length}`,
                  level: "",
                  units: [],
                },
              ]);
              setFloorId(id);
            }}
          >
            <Icon icon={Plus} /> Nuevo nivel
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              const id = uid("f");
              setFloors([
                ...floors,
                {
                  ...floor,
                  id,
                  name: `${floor.name} (copia)`,
                  units: floor.units.map((unit) => ({ ...unit, id: uid("u") })),
                },
              ]);
              setFloorId(id);
            }}
          >
            <Icon icon={Copy} /> Duplicar este nivel
          </Button>
        </div>

        {/* Una grilla tipo planilla (como Airtable): todo el nivel a la vista, se edita en el lugar. */}
        <div
          role="region"
          aria-label={`Unidades de ${floor.name}`}
          tabIndex={0}
          className="focus-ring overflow-x-auto rounded-control border border-line"
        >
          <table className="w-full min-w-160 border-collapse text-body">
            <caption className="sr-only">Unidades de {floor.name}</caption>
            <thead className="bg-canvas-sunken text-left text-meta text-ink-muted">
              <tr>
                {["Orden", "ID", "Tipo", "m²", "Amb. / tamaño", ""].map(
                  (header) => (
                    <th
                      key={header}
                      scope="col"
                      className="px-compact py-compact font-medium"
                    >
                      {header || <span className="sr-only">Acciones</span>}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {floor.units.map((unit, index) => (
                <tr key={unit.id} className="border-t border-line">
                  <td className="px-compact py-related">
                    <span className="flex">
                      <IconButton
                        icon={ArrowUp}
                        label={`Subir ${unit.code}`}
                        size="compact"
                        tooltip={false}
                        disabled={index === 0}
                        onClick={() =>
                          updateUnits(move(floor.units, index, -1))
                        }
                      />
                      <IconButton
                        icon={ArrowDown}
                        label={`Bajar ${unit.code}`}
                        size="compact"
                        tooltip={false}
                        disabled={index === floor.units.length - 1}
                        onClick={() => updateUnits(move(floor.units, index, 1))}
                      />
                    </span>
                  </td>
                  <td className="px-compact py-related">
                    <Input
                      size="compact"
                      aria-label={`ID de la unidad ${index + 1}`}
                      value={unit.code}
                      onChange={(event) =>
                        updateUnits(
                          floor.units.map((u) =>
                            u.id === unit.id
                              ? { ...u, code: event.target.value }
                              : u,
                          ),
                        )
                      }
                      className="w-20"
                    />
                  </td>
                  <td className="px-compact py-related">
                    <UnitTypeSelect
                      aria-label={`Tipo de ${unit.code}`}
                      value={unit.type}
                      onChange={(type) =>
                        updateUnits(
                          floor.units.map((u) =>
                            u.id === unit.id ? { ...u, type } : u,
                          ),
                        )
                      }
                    />
                  </td>
                  <td className="px-compact py-related">
                    <InputGroup
                      size="compact"
                      end="m²"
                      inputMode="decimal"
                      aria-label={`Superficie de ${unit.code}`}
                      value={unit.m2}
                      onChange={(event) =>
                        updateUnits(
                          floor.units.map((u) =>
                            u.id === unit.id
                              ? { ...u, m2: event.target.value }
                              : u,
                          ),
                        )
                      }
                      groupClassName="w-28"
                    />
                  </td>
                  <td className="px-compact py-related text-ink-muted">
                    {unit.type === "Departamento"
                      ? `${unit.rooms || "—"} amb.`
                      : unit.size || "—"}
                  </td>
                  <td className="px-compact py-related text-right">
                    <IconButton
                      icon={Trash2}
                      label={`Eliminar ${unit.code}`}
                      size="compact"
                      onClick={() =>
                        updateUnits(floor.units.filter((u) => u.id !== unit.id))
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Alta en serie: hoy cada local se agrega de a uno. */}
        <fieldset className="flex flex-wrap items-end gap-snug rounded-control border border-dashed border-line-strong p-snug">
          <legend className="px-related text-label">
            Agregar varias unidades
          </legend>
          <Field label="Cantidad" className="w-24">
            <Input
              size="compact"
              inputMode="numeric"
              value={bulk.count}
              onChange={(event) =>
                setBulk({ ...bulk, count: event.target.value })
              }
            />
          </Field>
          <Field label="Tipo" className="w-44">
            <UnitTypeSelect
              value={bulk.type}
              onChange={(type) => setBulk({ ...bulk, type })}
            />
          </Field>
          <Field
            label="IDs desde"
            description="Se completan A, B, C…"
            className="w-32"
          >
            <Input
              size="compact"
              value={bulk.prefix}
              onChange={(event) =>
                setBulk({ ...bulk, prefix: event.target.value })
              }
            />
          </Field>
          <Button
            size="compact"
            onClick={() =>
              updateUnits([
                ...floor.units,
                ...Array.from(
                  { length: Math.min(26, Number(bulk.count) || 0) },
                  (_, index) => ({
                    id: uid("u"),
                    code: `${bulk.prefix}${String.fromCharCode(65 + index)}`,
                    type: bulk.type,
                    m2: "",
                    rooms: "",
                    size: "",
                  }),
                ),
              ])
            }
          >
            <Icon icon={Plus} size="xs" /> Agregar {bulk.count || 0}
          </Button>
        </fieldset>
      </div>

      <aside className="flex flex-col gap-group">
        <div className="flex flex-col gap-compact rounded-control border border-line p-group">
          <p className="text-label">Superficie del plan</p>
          <Progress
            value={(used / 2000) * 100}
            label="Superficie usada del plan"
            tone={used > 2000 ? "danger" : "action"}
          />
          <p className="text-meta text-ink-muted">
            {formatArea(used)} de {formatArea(2000)} usados en unidades
          </p>
        </div>
        <FloorPlan
          label="Vista previa del edificio"
          floors={[...floors].reverse().map((item) => ({
            id: item.id,
            label: item.identifier || item.name,
            units: item.units.map((unit) => ({
              id: unit.id,
              name: unit.code || "—",
              progress: 0,
              status: "sin-empezar" as const,
            })),
          }))}
          selectedId={undefined}
          renderLink={(unit) => (
            <a href={`#${unit.id}`}>
              <FloorPlanCell unit={unit} />
            </a>
          )}
        />
      </aside>
    </div>
  );
}

export function RubrosProposal({
  state,
}: {
  state: ReturnType<typeof useConfigState>;
}) {
  const { groups, setGroups } = state;
  const weights = weightsOf(groups);
  const total = groups
    .flatMap((group) => group.rubros)
    .reduce((sum, rubro) => sum + weights.of(rubro), 0);
  return (
    <div className="flex flex-col gap-group">
      {/* El reparto completo a la vista (como un presupuesto): cuánto pesa cada grupo y si suma 100%. */}
      <div className="flex flex-col gap-compact rounded-control border border-line p-group">
        <div className="flex items-center justify-between">
          <p className="text-label">Cómo se reparte el avance</p>
          <p
            className={cn(
              "text-label tabular-nums",
              weights.over ? "text-fn-danger" : "text-fn-ok",
            )}
          >
            {weights.over
              ? `${formatPercent(weights.manual, 1)} · se pasa del 100%`
              : `${formatPercent(total, 1)} asignado`}
          </p>
        </div>
        <div
          aria-hidden
          className="flex h-3 overflow-hidden rounded-pill bg-canvas-track"
        >
          {groups.map((group, index) => {
            const value = group.rubros.reduce(
              (sum, rubro) => sum + weights.of(rubro),
              0,
            );
            return (
              <span
                key={group.id}
                className={cn(
                  "h-full",
                  [
                    "bg-action",
                    "bg-fn-info-solid",
                    "bg-fn-ok-solid",
                    "bg-fn-caution-solid",
                  ][index % 4],
                )}
                style={{ width: `${Math.min(100, value)}%` }}
              />
            );
          })}
        </div>
        <ul className="flex flex-wrap gap-x-group gap-y-related text-meta text-ink-muted">
          {groups.map((group, index) => (
            <li key={group.id} className="flex items-center gap-related">
              <span
                aria-hidden
                className={cn(
                  "size-2.5 rounded-pill",
                  [
                    "bg-action",
                    "bg-fn-info-solid",
                    "bg-fn-ok-solid",
                    "bg-fn-caution-solid",
                  ][index % 4],
                )}
              />
              {group.name} ·{" "}
              {formatPercent(
                group.rubros.reduce((sum, rubro) => sum + weights.of(rubro), 0),
                1,
              )}
            </li>
          ))}
        </ul>
      </div>
      {weights.over ? (
        <Notice tone="danger">
          Los porcentajes fijos suman {formatPercent(weights.manual, 1)}. Bajá
          alguno para poder guardar.
        </Notice>
      ) : null}

      <div className="overflow-x-auto rounded-control border border-line">
        <table className="w-full min-w-160 border-collapse text-body">
          <caption className="sr-only">Rubros, tareas e incidencia</caption>
          <thead className="bg-canvas-sunken text-left text-meta text-ink-muted">
            <tr>
              <th scope="col" className="px-group py-compact font-medium">
                Rubro
              </th>
              <th scope="col" className="px-group py-compact font-medium">
                Tareas
              </th>
              <th scope="col" className="w-40 px-group py-compact font-medium">
                Incidencia
              </th>
              <th scope="col" className="w-36 px-group py-compact font-medium">
                Fija
              </th>
            </tr>
          </thead>
          {groups.map((group) => (
            <tbody key={group.id}>
              <tr className="border-t border-line bg-canvas">
                <th
                  scope="colgroup"
                  colSpan={4}
                  className="px-group py-compact text-left text-label"
                >
                  {group.name}
                </th>
              </tr>
              {group.rubros.map((rubro) => (
                <tr key={rubro.id} className="border-t border-line">
                  <th
                    scope="row"
                    className="px-group py-compact text-left font-regular"
                  >
                    {rubro.name}
                  </th>
                  <td className="px-group py-compact text-ink-muted">
                    {rubro.tasks.map((task) => task.name).join(", ")}
                  </td>
                  <td className="px-group py-compact">
                    {rubro.weight === "" ? (
                      <span className="tabular-nums">
                        {formatPercent(weights.of(rubro), 1)}
                      </span>
                    ) : (
                      <InputGroup
                        size="compact"
                        end="%"
                        inputMode="decimal"
                        aria-label={`Incidencia fija de ${rubro.name}`}
                        value={rubro.weight}
                        onChange={(event) =>
                          setGroups(
                            groups.map((g) => ({
                              ...g,
                              rubros: g.rubros.map((r) =>
                                r.id === rubro.id
                                  ? {
                                      ...r,
                                      weight:
                                        event.target.value.replace(
                                          /[^\d,]/g,
                                          "",
                                        ) || "0",
                                    }
                                  : r,
                              ),
                            })),
                          )
                        }
                        groupClassName="w-24"
                      />
                    )}
                  </td>
                  <td className="px-group py-compact">
                    <label className="inline-flex cursor-pointer items-center gap-compact">
                      <Checkbox
                        checked={rubro.weight !== ""}
                        onCheckedChange={(value) =>
                          setGroups(
                            groups.map((g) => ({
                              ...g,
                              rubros: g.rubros.map((r) =>
                                r.id === rubro.id
                                  ? {
                                      ...r,
                                      weight:
                                        value === true
                                          ? String(
                                              Math.round(weights.of(r) * 10) /
                                                10,
                                            ).replace(".", ",")
                                          : "",
                                    }
                                  : r,
                              ),
                            })),
                          )
                        }
                      />
                      <span className="text-meta">
                        Fijar
                        <span className="sr-only">
                          {" "}
                          la incidencia de {rubro.name}
                        </span>
                      </span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}

export function UnitTasksMatrix({
  state,
}: {
  state: ReturnType<typeof useConfigState>;
}) {
  const { floors, groups, excluded, setExcluded } = state;
  const [floorId, setFloorId] = useState(floors[1]?.id ?? floors[0].id);
  const floor = floors.find((item) => item.id === floorId) ?? floors[0];
  const rubros = groups.flatMap((group) => group.rubros);
  const has = (unitId: string, rubro: RubroRow) =>
    rubro.tasks.some((task) => !(excluded[unitId] ?? []).includes(task.id));
  const set = (unitId: string, rubro: RubroRow, value: boolean) => {
    const current = new Set(excluded[unitId] ?? []);
    rubro.tasks.forEach((task) =>
      value ? current.delete(task.id) : current.add(task.id),
    );
    setExcluded({ ...excluded, [unitId]: [...current] });
  };
  return (
    <div className="flex flex-col gap-group">
      <div className="flex flex-wrap items-end justify-between gap-snug">
        <Field label="Nivel" className="w-56">
          <Select value={floor.id} onValueChange={setFloorId}>
            {floors.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </Select>
        </Field>
        <p className="text-meta text-ink-muted">
          Marcá qué rubros lleva cada unidad. Las tareas de cada rubro se
          ajustan desde la unidad.
        </p>
      </div>
      {/* Matriz rubro × unidad (como una planilla): todo el nivel de un vistazo, en vez de un árbol de 4 niveles. */}
      <div
        role="region"
        aria-label={`Rubros por unidad de ${floor.name}`}
        tabIndex={0}
        className="focus-ring overflow-x-auto rounded-control border border-line"
      >
        <table className="w-full border-collapse text-body">
          <caption className="sr-only">
            Rubros por unidad de {floor.name}
          </caption>
          <thead className="bg-canvas-sunken text-meta text-ink-muted">
            <tr>
              <th
                scope="col"
                className="px-group py-compact text-left font-medium"
              >
                Rubro
              </th>
              {floor.units.map((unit) => (
                <th
                  key={unit.id}
                  scope="col"
                  className="px-compact py-compact text-center font-medium"
                >
                  {unit.code}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rubros.map((rubro) => (
              <tr key={rubro.id} className="border-t border-line">
                <th
                  scope="row"
                  className="px-group py-compact text-left font-regular"
                >
                  {rubro.name}
                </th>
                {floor.units.map((unit) => (
                  <td
                    key={unit.id}
                    className="px-compact py-compact text-center"
                  >
                    <Checkbox
                      aria-label={`${rubro.name} en ${unit.code}`}
                      checked={has(unit.id, rubro)}
                      onCheckedChange={(value) =>
                        set(unit.id, rubro, value === true)
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
