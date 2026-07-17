"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Building2, Info, MapPin, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getRubrosForUnits,
  getTasksForRubroAndUnits,
  getUnitDisplayLabel,
  getUnitDisplayTitle,
  hasTaskDraftContent,
  type CargarAvanceTaskDraft,
} from "@/lib/projects/cargarAvance"
import { getFloorShortLabel } from "@/lib/projects/floorLabels"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ConfirmarAvanceDialog } from "./ConfirmarAvanceDialog"
import { CargarAvanceTaskPanel } from "./CargarAvanceTaskPanel"
import { saveCargarAvance } from "./actions"
import type { TrabajoDiarioFloor, TrabajoDiarioRubroGroup } from "./actions"

const INSTRUCTIONS = [
  "Selecciona el piso donde se realizó el trabajo",
  "Selecciona las unidades/locales trabajados",
  "Elige el rubro correspondiente",
  "Para cada tarea, haz click para expandirla y agregar estado, comentarios y fotos",
  "Guarda el registro para que pueda ser inspeccionado",
] as const

type SelectionPillProps = {
  label: string
  title: string
  selected: boolean
  onClick: () => void
}

function SelectionPill({ label, title, selected, onClick }: SelectionPillProps) {
  const isLongLabel = label.length > 12

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={title}
      title={title}
      className={cn(
        "inline-flex h-11 min-w-[85px] max-w-full shrink-0 items-center justify-center rounded-[10px] px-3 py-3 text-[14px] leading-[1.4] transition-colors",
        selected
          ? "bg-[#ff7433] font-medium text-white"
          : "bg-[#edeef0] font-normal text-[#272a2d] hover:bg-[#d8d9db]",
      )}
    >
      <span className={cn(isLongLabel && "max-w-36 truncate")}>{label}</span>
    </button>
  )
}

function SelectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className="rounded-[14px] border border-[#edeef0] bg-white p-6 shadow-[0_0_5px_rgba(243,103,31,0.08)]">
      <div className="mb-3 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          {icon}
          <p className="text-[16px] font-normal leading-[1.4] text-[#314158]">{title}</p>
        </div>
        {description ? (
          <p className="text-[14px] leading-[1.4] text-[#777b84]">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  )
}

type CargarAvanceViewProps = {
  projectId: string
  floors: TrabajoDiarioFloor[]
  rubroGroups: TrabajoDiarioRubroGroup[]
  assignmentsByUnit: Record<string, string[]>
  selectedFloorId: string | null
  selectedRubroId: string | null
  onSelectFloor: (floorId: string) => void
  onSelectRubro: (rubroId: string) => void
  onClose: () => void
  onSaved: () => void
}

export function CargarAvanceView({
  projectId,
  floors,
  rubroGroups,
  assignmentsByUnit,
  selectedFloorId,
  selectedRubroId,
  onSelectFloor,
  onSelectRubro,
  onClose,
  onSaved,
}: CargarAvanceViewProps) {
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([])
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set())
  const [taskDrafts, setTaskDrafts] = useState<Record<string, CargarAvanceTaskDraft>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showConfirmSave, setShowConfirmSave] = useState(false)
  const [pendingRubroId, setPendingRubroId] = useState<string | null>(null)
  const [showRubroChangeConfirm, setShowRubroChangeConfirm] = useState(false)

  const selectedFloor = floors.find((floor) => floor.id === selectedFloorId) ?? null
  const floorUnits = selectedFloor?.units ?? []

  const availableRubros = useMemo(() => {
    return getRubrosForUnits(selectedUnitIds, rubroGroups, assignmentsByUnit)
  }, [assignmentsByUnit, rubroGroups, selectedUnitIds])

  const availableTasks = useMemo(() => {
    if (!selectedRubroId || selectedUnitIds.length === 0) return []
    return getTasksForRubroAndUnits(
      selectedRubroId,
      rubroGroups,
      selectedUnitIds,
      assignmentsByUnit,
    )
  }, [assignmentsByUnit, rubroGroups, selectedRubroId, selectedUnitIds])

  const selectedRubroName =
    availableRubros.find((rubro) => rubro.id === selectedRubroId)?.name ?? "—"

  const unitLabels = useMemo(() => {
    if (!selectedFloor) return []

    return selectedUnitIds.map((unitId) => {
      const index = selectedFloor.units.findIndex((item) => item.id === unitId)
      if (index === -1) return unitId.slice(0, 8)
      return getUnitDisplayLabel(selectedFloor.name, index + 1)
    })
  }, [selectedFloor, selectedUnitIds])

  const reviewTasks = useMemo(() => {
    return availableTasks
      .filter((task) =>
        hasTaskDraftContent(taskDrafts[task.id] ?? { taskStatus: "pending", comment: "" }),
      )
      .map((task) => ({
        id: task.id,
        name: task.name,
        status: taskDrafts[task.id]?.taskStatus ?? ("pending" as const),
      }))
  }, [availableTasks, taskDrafts])

  const showWorkSections = selectedUnitIds.length > 0

  useEffect(() => {
    setSelectedUnitIds([])
    setExpandedTaskIds(new Set())
    setTaskDrafts({})
    setSaveError(null)
    setShowConfirmSave(false)
  }, [selectedFloorId])

  useEffect(() => {
    if (selectedUnitIds.length === 0) return

    const rubros = getRubrosForUnits(selectedUnitIds, rubroGroups, assignmentsByUnit)
    if (rubros.length === 0) return

    if (!selectedRubroId || !rubros.some((rubro) => rubro.id === selectedRubroId)) {
      onSelectRubro(rubros[0].id)
    }
  }, [assignmentsByUnit, onSelectRubro, rubroGroups, selectedRubroId, selectedUnitIds])

  useEffect(() => {
    setExpandedTaskIds(new Set())
    setTaskDrafts({})
    setSaveError(null)
    setShowConfirmSave(false)
  }, [selectedRubroId, selectedUnitIds])

  useEffect(() => {
    setTaskDrafts((current) => {
      const next: Record<string, CargarAvanceTaskDraft> = {}
      for (const task of availableTasks) {
        next[task.id] = current[task.id] ?? { taskStatus: "pending", comment: "" }
      }
      return next
    })
  }, [availableTasks])

  const toggleUnit = (unitId: string) => {
    setSelectedUnitIds((current) =>
      current.includes(unitId)
        ? current.filter((id) => id !== unitId)
        : [...current, unitId],
    )
  }

  const toggleTaskExpanded = (taskId: string) => {
    setExpandedTaskIds((current) => {
      const next = new Set(current)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  const updateTaskDraft = (taskId: string, patch: Partial<CargarAvanceTaskDraft>) => {
    setTaskDrafts((current) => ({
      ...current,
      [taskId]: {
        ...{ taskStatus: "pending" as const, comment: "" },
        ...current[taskId],
        ...patch,
      },
    }))
  }

  const canSave = useMemo(
    () => Object.values(taskDrafts).some(hasTaskDraftContent),
    [taskDrafts],
  )

  const handleRubroChangeRequest = (rubroId: string) => {
    if (rubroId === selectedRubroId) return

    if (canSave) {
      setPendingRubroId(rubroId)
      setShowRubroChangeConfirm(true)
      return
    }

    onSelectRubro(rubroId)
  }

  const confirmRubroChange = () => {
    if (pendingRubroId) onSelectRubro(pendingRubroId)
    setPendingRubroId(null)
    setShowRubroChangeConfirm(false)
  }

  const cancelRubroChange = () => {
    setPendingRubroId(null)
    setShowRubroChangeConfirm(false)
  }

  const handleReview = () => {
    if (!canSave) return
    setSaveError(null)
    setShowConfirmSave(true)
  }

  const handleConfirmSave = async () => {
    if (!selectedFloorId || !selectedRubroId || selectedUnitIds.length === 0) return

    setSaveError(null)
    setSaving(true)

    const result = await saveCargarAvance({
      projectId,
      floorId: selectedFloorId,
      rubroId: selectedRubroId,
      unitIds: selectedUnitIds,
      tasks: availableTasks.map((task) => ({
        taskId: task.id,
        taskStatus: taskDrafts[task.id]?.taskStatus ?? "pending",
        comment: taskDrafts[task.id]?.comment ?? null,
      })),
    })

    setSaving(false)

    if (!result.ok) {
      setSaveError(result.error)
      return
    }

    setShowConfirmSave(false)
    onSaved()
  }

  return (
    <section className="rounded-[14px] border border-[#edeef0] bg-white p-6 shadow-[0_0_5px_rgba(243,103,31,0.08)]">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-[20px] font-normal leading-7 text-[#1d293d]">
          Carga de Trabajo Diario
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar carga de avance"
          className="flex size-5 items-center justify-center rounded text-[#43484e] transition-colors hover:bg-[#edeef0]"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div className="flex flex-col gap-6">
        <SelectionCard
          icon={<MapPin className="size-4 text-[#314158]" aria-hidden />}
          title="Seleccionar Piso"
        >
          {floors.length === 0 ? (
            <p className="text-[14px] text-[#777b84]">
              No hay pisos configurados en este proyecto.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {floors.map((floor) => (
                <SelectionPill
                  key={floor.id}
                  label={getFloorShortLabel(floor.name)}
                  title={floor.name}
                  selected={selectedFloorId === floor.id}
                  onClick={() => onSelectFloor(floor.id)}
                />
              ))}
            </div>
          )}
        </SelectionCard>

        {selectedFloor ? (
          <SelectionCard
            icon={<Building2 className="size-4 text-[#314158]" aria-hidden />}
            title="Unidades/Locales"
            description="Selecciona una o más unidades donde se realizó el trabajo"
          >
            {floorUnits.length === 0 ? (
              <p className="text-[14px] text-[#777b84]">
                No hay unidades configuradas en este piso.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {floorUnits.map((unit, index) => (
                  <SelectionPill
                    key={unit.id}
                    label={getUnitDisplayLabel(selectedFloor.name, index + 1)}
                    title={getUnitDisplayTitle(unit, selectedFloor.name, index + 1)}
                    selected={selectedUnitIds.includes(unit.id)}
                    onClick={() => toggleUnit(unit.id)}
                  />
                ))}
              </div>
            )}
          </SelectionCard>
        ) : null}

        {showWorkSections && selectedRubroId ? (
          <CargarAvanceTaskPanel
            availableRubros={availableRubros}
            selectedRubroId={selectedRubroId}
            onSelectRubro={handleRubroChangeRequest}
            tasks={availableTasks}
            expandedTaskIds={expandedTaskIds}
            taskDrafts={taskDrafts}
            onToggleTask={toggleTaskExpanded}
            onUpdateTaskDraft={updateTaskDraft}
            canSave={canSave}
            saving={saving}
            saveError={saveError}
            onReview={handleReview}
          />
        ) : null}

        {!selectedFloor ? (
          <div className="flex gap-4 rounded-[10px] border border-[#d5efff] bg-[#f4faff] p-[17px]">
            <Info className="mt-0.5 size-5 shrink-0 text-[#113264]" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium leading-[1.4] text-[#113264]">Instrucciones:</p>
              <ol className="mt-1 list-decimal space-y-1 pl-5 text-[14px] leading-[1.4] text-[#113264]">
                {INSTRUCTIONS.map((instruction) => (
                  <li key={instruction}>{instruction}</li>
                ))}
              </ol>
            </div>
          </div>
        ) : null}
      </div>

      <ConfirmarAvanceDialog
        open={showConfirmSave}
        onOpenChange={setShowConfirmSave}
        floorLabel={selectedFloor?.name ?? "—"}
        unitLabels={unitLabels}
        rubroName={selectedRubroName}
        tasks={reviewTasks}
        saving={saving}
        saveError={saveError}
        onConfirm={handleConfirmSave}
      />

      <AlertDialog
        open={showRubroChangeConfirm}
        onOpenChange={(open) => {
          if (!open) cancelRubroChange()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cambiar rubro?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos los avances cargados en las tareas se perderán. ¿Estás seguro de que querés
              continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRubroChange}>Sí, cambiar rubro</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
