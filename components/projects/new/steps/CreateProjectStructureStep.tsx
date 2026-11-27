"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Building2, Copy, GripVertical, Plus, SquarePlus, Trash2 } from "lucide-react"
import { Button } from "@/library/atoms/button/Button"
import { IconButton } from "@/library/atoms/button/IconButton"
import { Icon } from "@/library/atoms/icon/Icon"
import { Input } from "@/library/atoms/input/Input"
import { Tooltip } from "@/library/atoms/tooltip/Tooltip"
import { cn } from "@/library/lib/cn"
import { ConfirmDialog } from "@/library/molecules/confirm-dialog/ConfirmDialog"
import { Field } from "@/library/molecules/field/Field"
import { Notice } from "@/library/molecules/notice/Notice"
import { Select, SelectItem } from "@/library/molecules/select/Select"
import { RequestPlanUpgradeModal } from "@/components/team/RequestPlanUpgradeModal"
import {
  newItemHighlightClass,
  useNewItemHighlight,
} from "@/components/projects/new/useNewItemHighlight"
import { AdjuntarImagen } from "@/components/projects/new/steps/estructura/AdjuntarImagen"
import { SelectorDeTipo } from "@/components/projects/new/steps/estructura/SelectorDeTipo"
import {
  finalizeTotalSurfaceInput,
  normalizeTotalSurfaceInput,
} from "@/lib/projects/totalSurfaceInput"
import {
  cloneStructureFloor,
  cloneStructureUnit,
  countStructureUnits,
  createDefaultFloor,
  createDefaultUnit,
  nextDuplicateCopyLabel,
  type CreateProjectDraft,
  type StructureFloorDraft,
  type StructureUnitDraft,
} from "@/lib/projects/createProjectDraft"
import {
  getUnitVariantField,
  getUnitVariantFieldLabel,
  isUnitTypeGroupId,
  isUnitVariantFieldEnabled,
  OFFICE_SIZE_OPTIONS,
  UNIT_ROOM_COUNT_OPTIONS,
} from "@/lib/projects/unitTypes"
import type {
  StructureFloorFieldErrors,
  StructureStepFieldErrors,
  StructureUnitFieldErrors,
} from "@/lib/projects/createProjectStructureValidation"
import {
  formatSquareMeters,
  getStructureSurfaceLimitState,
  scrollToStructureSurfaceLimitBanner,
} from "@/lib/projects/structureSurfaceLimits"

const STRUCTURE_DELETE_CONFIRM = {
  title: "Confirmar cambios",
  confirmLabel: "Confirmar",
  floorDescription:
    "Al eliminar el nivel se eliminan todas las unidades y, con ellas, todas las asignaciones de tareas que tienen. ¿Deseás continuar?",
  unitDescription:
    "Al eliminar esta unidad se eliminan todas las asignaciones de tareas que tiene. ¿Deseás continuar?",
} as const

type PendingStructureDelete =
  | { kind: "floor"; floorId: string }
  | { kind: "unit"; floorId: string; unitId: string }

function stripUnitTaskExclusions(
  exclusions: CreateProjectDraft["unitTaskExclusions"],
  unitIds: string[],
): CreateProjectDraft["unitTaskExclusions"] {
  if (unitIds.length === 0) return exclusions

  const next = { ...exclusions }
  for (const unitId of unitIds) {
    delete next[unitId]
  }
  return next
}

function copyUnitTaskExclusions(
  exclusions: CreateProjectDraft["unitTaskExclusions"],
  pairs: Array<{ from: string; to: string }>,
): CreateProjectDraft["unitTaskExclusions"] {
  if (pairs.length === 0) return exclusions

  let next: CreateProjectDraft["unitTaskExclusions"] | null = null
  for (const { from, to } of pairs) {
    const source = exclusions[from]
    if (!source?.length) continue
    if (!next) next = { ...exclusions }
    next[to] = [...source]
  }
  return next ?? exclusions
}

type CreateProjectStructureStepProps = {
  draft: CreateProjectDraft
  onChange: (patch: Partial<CreateProjectDraft>) => void
  fieldErrors?: StructureStepFieldErrors
  projectId?: string | null
  planSurfaceMaxM2?: number | null
}

export function CreateProjectStructureStep({
  draft,
  onChange,
  fieldErrors = {},
  projectId = null,
  planSurfaceMaxM2 = null,
}: CreateProjectStructureStepProps) {
  const { markAsNew, isHighlighted } = useNewItemHighlight()
  const [pendingDelete, setPendingDelete] = useState<PendingStructureDelete | null>(null)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const surfaceLimitState = useMemo(
    () => getStructureSurfaceLimitState(draft.floors, planSurfaceMaxM2),
    [draft.floors, planSurfaceMaxM2],
  )
  const wasOverSurfaceLimit = useRef(false)

  useEffect(() => {
    if (surfaceLimitState.isOverLimit && !wasOverSurfaceLimit.current) {
      scrollToStructureSurfaceLimitBanner()
    }
    wasOverSurfaceLimit.current = surfaceLimitState.isOverLimit
  }, [surfaceLimitState.isOverLimit, surfaceLimitState.unitsSurfaceM2])
  const floorCount = draft.floors.length
  const unitCount = countStructureUnits(draft.floors)

  const setFloors = (floors: StructureFloorDraft[]) => {
    onChange({ floors })
  }

  const updateFloor = (
    floorId: string,
    patch: Partial<StructureFloorDraft>,
  ) => {
    setFloors(
      draft.floors.map((floor) =>
        floor.id === floorId ? { ...floor, ...patch } : floor,
      ),
    )
  }

  const addFloor = () => {
    const floor = createDefaultFloor(draft.floors.length + 1)
    setFloors([...draft.floors, floor])
    markAsNew(floor.id)
  }

  const removeFloor = (floorId: string) => {
    const floor = draft.floors.find((item) => item.id === floorId)
    const unitIds = floor?.units.map((unit) => unit.id) ?? []

    onChange({
      floors: draft.floors.filter((item) => item.id !== floorId),
      unitTaskExclusions: stripUnitTaskExclusions(draft.unitTaskExclusions, unitIds),
    })
  }

  const addUnit = (floorId: string) => {
    const unit = createDefaultUnit()
    updateFloor(floorId, {
      units: [
        ...(draft.floors.find((f) => f.id === floorId)?.units ?? []),
        unit,
      ],
    })
    markAsNew(unit.id)
  }

  const collectStructureIds = () => [
    ...draft.floors.map((item) => item.identifier),
    ...draft.floors.flatMap((item) => item.units.map((unit) => unit.code)),
  ]

  const duplicateFloor = (floorId: string) => {
    const floor = draft.floors.find((item) => item.id === floorId)
    if (!floor) return
    const clone = cloneStructureFloor(floor)
    const takenIds = collectStructureIds()
    clone.name = nextDuplicateCopyLabel(
      floor.name,
      draft.floors.map((item) => item.name),
    )
    clone.identifier = nextDuplicateCopyLabel(floor.identifier, takenIds, {
      caseInsensitive: true,
    })
    if (clone.identifier) takenIds.push(clone.identifier)
    clone.units = clone.units.map((unit, unitIndex) => {
      const code = nextDuplicateCopyLabel(
        floor.units[unitIndex]?.code ?? unit.code,
        takenIds,
        { caseInsensitive: true },
      )
      if (code) takenIds.push(code)
      return { ...unit, code }
    })
    const index = draft.floors.findIndex((item) => item.id === floorId)
    const next = [...draft.floors]
    next.splice(index + 1, 0, clone)
    onChange({
      floors: next,
      unitTaskExclusions: copyUnitTaskExclusions(
        draft.unitTaskExclusions,
        floor.units.map((unit, unitIndex) => ({
          from: unit.id,
          to: clone.units[unitIndex].id,
        })),
      ),
    })
    markAsNew(clone.id)
    for (const unit of clone.units) markAsNew(unit.id)
  }

  const duplicateUnit = (floorId: string, unitId: string) => {
    const floor = draft.floors.find((item) => item.id === floorId)
    const unit = floor?.units.find((item) => item.id === unitId)
    if (!floor || !unit) return
    const clone = {
      ...cloneStructureUnit(unit),
      code: nextDuplicateCopyLabel(unit.code, collectStructureIds(), {
        caseInsensitive: true,
      }),
    }
    const index = floor.units.findIndex((item) => item.id === unitId)
    const units = [...floor.units]
    units.splice(index + 1, 0, clone)
    onChange({
      floors: draft.floors.map((item) =>
        item.id === floorId ? { ...item, units } : item,
      ),
      unitTaskExclusions: copyUnitTaskExclusions(draft.unitTaskExclusions, [
        { from: unit.id, to: clone.id },
      ]),
    })
    markAsNew(clone.id)
  }

  const reorderUnits = (floorId: string, activeId: string, overId: string) => {
    const floor = draft.floors.find((item) => item.id === floorId)
    if (!floor || activeId === overId) return
    const oldIndex = floor.units.findIndex((unit) => unit.id === activeId)
    const newIndex = floor.units.findIndex((unit) => unit.id === overId)
    if (oldIndex < 0 || newIndex < 0) return
    updateFloor(floorId, { units: arrayMove(floor.units, oldIndex, newIndex) })
  }

  /** Mueve un local un lugar arriba o abajo (desde el teclado, con el agarre). */
  const moveUnit = (floorId: string, unitId: string, delta: -1 | 1) => {
    const floor = draft.floors.find((item) => item.id === floorId)
    if (!floor) return
    const oldIndex = floor.units.findIndex((unit) => unit.id === unitId)
    const newIndex = oldIndex + delta
    if (oldIndex < 0 || newIndex < 0 || newIndex >= floor.units.length) return
    updateFloor(floorId, { units: arrayMove(floor.units, oldIndex, newIndex) })
  }

  const updateUnit = (
    floorId: string,
    unitId: string,
    patch: Partial<StructureUnitDraft>,
  ) => {
    const floor = draft.floors.find((f) => f.id === floorId)
    if (!floor) return
    updateFloor(floorId, {
      units: floor.units.map((unit) =>
        unit.id === unitId ? { ...unit, ...patch } : unit,
      ),
    })
  }

  const removeUnit = (floorId: string, unitId: string) => {
    onChange({
      floors: draft.floors.map((item) =>
        item.id === floorId
          ? { ...item, units: item.units.filter((unit) => unit.id !== unitId) }
          : item,
      ),
      unitTaskExclusions: stripUnitTaskExclusions(draft.unitTaskExclusions, [unitId]),
    })
  }

  const requestRemoveFloor = (floorId: string) => {
    setPendingDelete({ kind: "floor", floorId })
  }

  const requestRemoveUnit = (floorId: string, unitId: string) => {
    setPendingDelete({ kind: "unit", floorId, unitId })
  }

  const handleConfirmDelete = () => {
    if (!pendingDelete) return

    if (pendingDelete.kind === "floor") {
      removeFloor(pendingDelete.floorId)
    } else {
      removeUnit(pendingDelete.floorId, pendingDelete.unitId)
    }

    setPendingDelete(null)
  }

  const pendingDeleteDescription =
    pendingDelete?.kind === "floor"
      ? STRUCTURE_DELETE_CONFIRM.floorDescription
      : pendingDelete?.kind === "unit"
        ? STRUCTURE_DELETE_CONFIRM.unitDescription
        : ""


  const surfaceLimitBanner =
    surfaceLimitState.isOverLimit && surfaceLimitState.planSurfaceMaxM2 != null ? (
      <div data-structure-surface-limit-banner>
        <Notice
          tone="info"
          title={`Superaste la superficie permitida por tu plan (${formatSquareMeters(surfaceLimitState.planSurfaceMaxM2)}).`}
          action={
            <Button variant="outline" size="compact" onClick={() => setUpgradeModalOpen(true)}>
              Mejorar Plan
            </Button>
          }
        >
          Para poder agregar más metros cuadrados, debés solicitar una mejora del plan al
          administrador de la organización.
        </Notice>
      </div>
    ) : null

  return (
    <div className="flex w-full max-w-207.5 flex-col gap-group">
      {surfaceLimitBanner}

      <div className="flex flex-col gap-snug sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-meta text-ink-muted">Cantidad de niveles</p>
          <p className="text-heading">
            {floorCount} {floorCount === 1 ? "nivel" : "niveles"}
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
          <p className="text-meta text-ink-muted">Configurá los locales de cada nivel:</p>
        </div>

        {draft.floors.length === 0 ? (
          <p className="rounded-control bg-canvas-raised py-block text-center text-meta text-ink-muted">
            Todavía no hay niveles. Usá &quot;Agregar nivel&quot; para empezar.
          </p>
        ) : (
          draft.floors.map((floor) => (
            <StructureFloorCard
              key={floor.id}
              floor={floor}
              isHighlighted={isHighlighted(floor.id)}
              fieldErrors={fieldErrors[floor.id]}
              onUpdateFloor={(patch) => updateFloor(floor.id, patch)}
              onRemoveFloor={() => requestRemoveFloor(floor.id)}
              onDuplicateFloor={() => duplicateFloor(floor.id)}
              onAddUnit={() => addUnit(floor.id)}
              onUpdateUnit={(unitId, patch) => updateUnit(floor.id, unitId, patch)}
              onDuplicateUnit={(unitId) => duplicateUnit(floor.id, unitId)}
              onRemoveUnit={(unitId) => requestRemoveUnit(floor.id, unitId)}
              onReorderUnits={(activeId, overId) => reorderUnits(floor.id, activeId, overId)}
              onMoveUnit={(unitId, delta) => moveUnit(floor.id, unitId, delta)}
              isUnitHighlighted={isHighlighted}
            />
          ))
        )}

        <BotonAgregar onClick={addFloor}>Agregar nivel</BotonAgregar>
      </div>

      <p className="flex items-center gap-compact rounded-control border border-action/20 bg-action-soft px-group py-snug text-body">
        <Icon icon={Building2} className="text-action-text" />
        <span>
          <span className="font-medium">Resumen del Proyecto</span> · Total: {floorCount}{" "}
          {floorCount === 1 ? "nivel" : "niveles"} • {unitCount}{" "}
          {unitCount === 1 ? "unidad" : "unidades"}
        </span>
      </p>

      <ConfirmDialog
        open={pendingDelete != null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title={STRUCTURE_DELETE_CONFIRM.title}
        description={pendingDeleteDescription}
        confirmLabel={STRUCTURE_DELETE_CONFIRM.confirmLabel}
        tone="danger"
        onConfirm={handleConfirmDelete}
      />

      <RequestPlanUpgradeModal
        projectId={projectId}
        surfaceLimit={
          surfaceLimitState.isOverLimit && surfaceLimitState.planSurfaceMaxM2 != null
            ? {
                planSurfaceMaxM2: surfaceLimitState.planSurfaceMaxM2,
                unitsSurfaceM2: surfaceLimitState.unitsSurfaceM2,
              }
            : null
        }
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
      />
    </div>
  )
}

/** Botón de borde punteado para sumar un nivel o un local. */
function BotonAgregar({
  onClick,
  children,
  detalle,
}: {
  onClick: () => void
  children: string
  /** Texto solo para el lector de pantalla: « a Planta Baja». */
  detalle?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-ring motion-color flex h-10 w-full cursor-pointer items-center justify-center gap-compact rounded-control border border-dashed border-line-strong bg-canvas-raised text-label text-ink-muted hover:border-action hover:text-action-text"
    >
      <Icon icon={Plus} size="xs" /> {children}
      {detalle ? <span className="sr-only">{detalle}</span> : null}
    </button>
  )
}

type StructureFloorCardProps = {
  floor: StructureFloorDraft
  isHighlighted: boolean
  fieldErrors?: StructureFloorFieldErrors
  onUpdateFloor: (patch: Partial<StructureFloorDraft>) => void
  onRemoveFloor: () => void
  onDuplicateFloor: () => void
  onAddUnit: () => void
  onUpdateUnit: (unitId: string, patch: Partial<StructureUnitDraft>) => void
  onDuplicateUnit: (unitId: string) => void
  onRemoveUnit: (unitId: string) => void
  onReorderUnits: (activeId: string, overId: string) => void
  onMoveUnit: (unitId: string, delta: -1 | 1) => void
  isUnitHighlighted: (unitId: string) => boolean
}

function StructureFloorCard({
  floor,
  isHighlighted,
  fieldErrors,
  onUpdateFloor,
  onRemoveFloor,
  onDuplicateFloor,
  onAddUnit,
  onUpdateUnit,
  onDuplicateUnit,
  onRemoveUnit,
  onReorderUnits,
  onMoveUnit,
  isUnitHighlighted,
}: StructureFloorCardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )
  const [isDraggingUnits, setIsDraggingUnits] = useState(false)
  const floorLabel = floor.name || "Nivel sin nombre"

  function handleDragStart() {
    setIsDraggingUnits(true)
  }

  function handleDragEnd(event: DragEndEvent) {
    setIsDraggingUnits(false)
    const overId = event.over?.id
    if (!overId) return
    onReorderUnits(String(event.active.id), String(overId))
  }

  function handleDragCancel() {
    setIsDraggingUnits(false)
  }

  return (
    <section
      aria-label={floorLabel}
      data-new-item-id={floor.id}
      data-structure-floor-id={floor.id}
      className={cn(
        "flex flex-col gap-snug rounded-control bg-canvas-raised p-group shadow-hint",
        newItemHighlightClass(isHighlighted),
      )}
    >
      <div className="flex flex-col gap-snug lg:flex-row lg:items-end">
        <div className="grid flex-1 grid-cols-1 gap-snug sm:grid-cols-3">
          <Field
            id={`floor-name-${floor.id}`}
            label="Nombre del Nivel"
            required
            error={fieldErrors?.name}
          >
            <Input
              size="compact"
              value={floor.name}
              placeholder="Ej. Planta Baja"
              onChange={(event) => onUpdateFloor({ name: event.target.value })}
            />
          </Field>
          <Field
            id={`floor-identifier-${floor.id}`}
            label="Identificador"
            required
            description="Nombre corto: PB, P01, SS."
            error={fieldErrors?.identifier}
          >
            <Input
              size="compact"
              maxLength={32}
              value={floor.identifier}
              placeholder="Ej. PB, P01, SS."
              onChange={(event) => onUpdateFloor({ identifier: event.target.value })}
            />
          </Field>
          <Field id={`floor-level-${floor.id}`} label="Nivel" optional>
            <Input
              size="compact"
              value={floor.level}
              placeholder="Ej: +1.90"
              onChange={(event) => onUpdateFloor({ level: event.target.value })}
            />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-related">
          <Button variant="ghost" size="compact" onClick={onDuplicateFloor}>
            <Icon icon={Copy} size="xs" /> Duplicar nivel
            <span className="sr-only"> {floorLabel}</span>
          </Button>
          <Button variant="ghost" size="compact" onClick={onAddUnit}>
            <Icon icon={SquarePlus} size="xs" /> Agregar local
            <span className="sr-only"> a {floorLabel}</span>
          </Button>
          <IconButton
            icon={Trash2}
            label={`Eliminar ${floor.name || "nivel sin nombre"}`}
            size="compact"
            onClick={onRemoveFloor}
          />
        </div>
      </div>

      {floor.units.length > 0 ? (
        <div className={cn("w-full", isDraggingUnits ? "overflow-hidden" : "overflow-x-auto")}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            autoScroll={false}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext
              items={floor.units.map((unit) => unit.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="flex flex-col gap-compact" aria-label={`Locales de ${floorLabel}`}>
                {floor.units.map((unit, index) => (
                  <StructureUnitRow
                    key={unit.id}
                    unit={unit}
                    index={index}
                    isHighlighted={isUnitHighlighted(unit.id)}
                    fieldErrors={fieldErrors?.unitErrors?.[unit.id]}
                    onUpdateUnit={(patch) => onUpdateUnit(unit.id, patch)}
                    onDuplicateUnit={() => onDuplicateUnit(unit.id)}
                    onRemoveUnit={() => onRemoveUnit(unit.id)}
                    onMove={(delta) => onMoveUnit(unit.id, delta)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </div>
      ) : null}

      <BotonAgregar onClick={onAddUnit} detalle={` a ${floorLabel}`}>
        Agregar local
      </BotonAgregar>
    </section>
  )
}

type StructureUnitRowProps = {
  unit: StructureUnitDraft
  index: number
  isHighlighted: boolean
  fieldErrors?: StructureUnitFieldErrors
  onUpdateUnit: (patch: Partial<StructureUnitDraft>) => void
  onDuplicateUnit: () => void
  onRemoveUnit: () => void
  onMove: (delta: -1 | 1) => void
}

function StructureUnitRow({
  unit,
  index,
  isHighlighted,
  fieldErrors,
  onUpdateUnit,
  onDuplicateUnit,
  onRemoveUnit,
  onMove,
}: StructureUnitRowProps) {
  const variantEnabled = isUnitVariantFieldEnabled(unit.type)
  const variantLabel = getUnitVariantFieldLabel(unit.type)
  const variantField = getUnitVariantField(unit.type)
  const variantValue = variantField === "officeSize" ? unit.officeSize : unit.roomCount
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: unit.id })
  const unitLabel = unit.code || String(index + 1)

  return (
    <li
      ref={setNodeRef}
      data-new-item-id={unit.id}
      data-structure-unit-id={unit.id}
      className={cn(
        "flex min-w-190 items-start gap-snug rounded-control bg-action-soft p-snug",
        isDragging && "opacity-55",
        newItemHighlightClass(isHighlighted),
      )}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {/* Se reordena arrastrando con el mouse o, con el foco en el agarre, con las flechas. */}
      <Tooltip content="Arrastrá o mové con las flechas ↑ ↓">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-roledescription="agarre para reordenar"
          aria-label={`Mover el local ${unitLabel}. Arrastrá o usá las flechas arriba y abajo.`}
          onKeyDown={(event) => {
            if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return
            event.preventDefault()
            onMove(event.key === "ArrowUp" ? -1 : 1)
          }}
          className="focus-ring grid h-11 w-6 shrink-0 cursor-grab touch-none place-items-center self-center rounded-compact bg-canvas-raised/70 text-action-text active:cursor-grabbing"
        >
          <Icon icon={GripVertical} size="xs" />
        </button>
      </Tooltip>

      <Field id={`unit-type-${unit.id}`} label="Tipo" className="w-42">
        <SelectorDeTipo
          value={unit.type}
          groupId={unit.typeCategory}
          onValueChange={(type, groupId) =>
            onUpdateUnit({
              type,
              typeCategory: isUnitTypeGroupId(groupId) ? groupId : unit.typeCategory,
              roomCount: type === "Departamento" ? unit.roomCount : "",
              officeSize: type === "Departamento" ? "" : unit.officeSize,
            })
          }
        />
      </Field>

      <Field id={`unit-code-${unit.id}`} label="ID" required error={fieldErrors?.code} className="w-24">
        <Input
          size="compact"
          maxLength={32}
          value={unit.code}
          placeholder="Ej. 101"
          onChange={(event) => onUpdateUnit({ code: event.target.value })}
        />
      </Field>

      <Field
        id={`unit-m2-${unit.id}`}
        label="m²"
        required
        error={fieldErrors?.squareMeters}
        className="w-24"
      >
        <Input
          size="compact"
          inputMode="decimal"
          value={unit.squareMeters}
          placeholder="Ej. 45,50"
          onChange={(event) =>
            onUpdateUnit({ squareMeters: normalizeTotalSurfaceInput(event.target.value) })
          }
          onBlur={() =>
            onUpdateUnit({ squareMeters: finalizeTotalSurfaceInput(unit.squareMeters) })
          }
        />
      </Field>

      <Field id={`unit-variant-${unit.id}`} label={variantLabel} className="w-24">
        <Select
          size="compact"
          value={variantValue || undefined}
          disabled={!variantEnabled}
          placeholder={variantField === "officeSize" ? "Tamaño" : "Cant."}
          onValueChange={(value) => {
            if (variantField === "officeSize") {
              onUpdateUnit({ officeSize: value })
              return
            }
            onUpdateUnit({ roomCount: value })
          }}
        >
          {variantField === "officeSize"
            ? OFFICE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))
            : UNIT_ROOM_COUNT_OPTIONS.map((count) => (
                <SelectItem key={count} value={String(count)}>
                  {count}
                </SelectItem>
              ))}
        </Select>
      </Field>

      <div className="flex w-28 flex-col gap-compact">
        <span className="text-label">Planta</span>
        <AdjuntarImagen
          descripcion={`planta del local ${unitLabel}`}
          value={unit.planImage}
          existingUrl={unit.planUrl}
          onChange={(planImage) =>
            onUpdateUnit({
              planImage,
              ...(planImage ? { planRemoved: false } : {}),
            })
          }
          onRemoveExisting={() =>
            onUpdateUnit({
              planImage: null,
              planUrl: null,
              planRemoved: true,
            })
          }
        />
      </div>

      <div className="flex w-28 flex-col gap-compact">
        <span className="text-label">Render</span>
        <AdjuntarImagen
          descripcion={`render del local ${unitLabel}`}
          value={unit.renderImage}
          existingUrl={unit.renderUrl}
          onChange={(renderImage) =>
            onUpdateUnit({
              renderImage,
              ...(renderImage ? { renderRemoved: false } : {}),
            })
          }
          onRemoveExisting={() =>
            onUpdateUnit({
              renderImage: null,
              renderUrl: null,
              renderRemoved: true,
            })
          }
        />
      </div>

      <div className="ml-auto flex items-center gap-related self-center">
        <IconButton
          icon={Copy}
          label={`Duplicar el local ${unitLabel}`}
          size="compact"
          onClick={onDuplicateUnit}
        />
        <IconButton
          icon={Trash2}
          label={`Eliminar el local ${unitLabel}`}
          size="compact"
          onClick={onRemoveUnit}
        />
      </div>
    </li>
  )
}
