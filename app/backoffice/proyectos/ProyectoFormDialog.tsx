"use client"

import { useEffect, useState, useTransition } from "react"
import { Plus, X } from "lucide-react"
import { useRouter } from "next/navigation"

import {
  createBackofficeProject,
  searchBackofficeProjectCompanyCandidates,
  updateBackofficeProject,
  type BackofficeProjectCompanyCandidate,
  type BackofficeProjectRow,
} from "@/app/backoffice/proyectos/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

const FIELD_CLASSNAME =
  "h-[42px] rounded-xl border-[#edeef0] bg-white text-sm leading-[1.4] text-[#18191b] placeholder:text-[#696e77] shadow-none focus-visible:border-[#ff7433] focus-visible:ring-0"

const LABEL_CLASSNAME = "text-xs font-medium leading-[1.4] text-[#5a6169]"

const PROJECT_STATUS_OPTIONS = [
  { value: "active", label: "Activo" },
  { value: "draft", label: "Borrador" },
  { value: "paused", label: "Pausado" },
  { value: "completed", label: "Completado" },
  { value: "archived", label: "Archivado" },
] as const

type CompanySelection = {
  id: string
  name: string
}

type ProyectoFormState = {
  name: string
  company: CompanySelection | null
  location: string
  status: string
  totalSurfaceM2: string
}

function emptyFormState(): ProyectoFormState {
  return {
    name: "",
    company: null,
    location: "",
    status: "active",
    totalSurfaceM2: "",
  }
}

function formFromProject(project: BackofficeProjectRow): ProyectoFormState {
  return {
    name: project.name,
    company: project.company
      ? { id: project.company.id, name: project.company.name }
      : null,
    location: project.location ?? "",
    status: project.status,
    totalSurfaceM2:
      project.totalSurfaceM2 != null ? String(project.totalSurfaceM2) : "",
  }
}

type ProyectoFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: BackofficeProjectRow | null
}

export function ProyectoFormDialog({
  open,
  onOpenChange,
  project,
}: ProyectoFormDialogProps) {
  const router = useRouter()
  const isEditing = project !== null
  const [form, setForm] = useState(emptyFormState)
  const [formError, setFormError] = useState<string | null>(null)
  const [companySearch, setCompanySearch] = useState("")
  const [companyCandidates, setCompanyCandidates] = useState<
    BackofficeProjectCompanyCandidate[]
  >([])
  const [isSearchingCompany, setIsSearchingCompany] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) {
      setForm(emptyFormState())
      setFormError(null)
      setCompanySearch("")
      setCompanyCandidates([])
      return
    }

    setForm(project ? formFromProject(project) : emptyFormState())
    setFormError(null)
    setCompanySearch("")
    setCompanyCandidates([])
  }, [open, project])

  useEffect(() => {
    if (!open || form.company) {
      setCompanyCandidates([])
      return
    }

    const term = companySearch.trim()
    if (term.length < 2) {
      setCompanyCandidates([])
      return
    }

    const timeout = window.setTimeout(async () => {
      setIsSearchingCompany(true)

      try {
        const candidates = await searchBackofficeProjectCompanyCandidates(term)
        setCompanyCandidates(candidates)
      } catch {
        setCompanyCandidates([])
      } finally {
        setIsSearchingCompany(false)
      }
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [open, companySearch, form.company])

  const updateField = <K extends keyof ProyectoFormState>(
    key: K,
    value: ProyectoFormState[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
    if (formError) setFormError(null)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)

    if (!form.name.trim()) {
      setFormError("El nombre del proyecto es obligatorio.")
      return
    }

    if (!form.company) {
      setFormError("La empresa es obligatoria.")
      return
    }

    startTransition(async () => {
      const payload = {
        name: form.name,
        companyId: form.company!.id,
        location: form.location,
        status: form.status,
        totalSurfaceM2: form.totalSurfaceM2,
      }

      const result = isEditing
        ? await updateBackofficeProject(project.id, payload)
        : await createBackofficeProject(payload)

      if (!result.ok) {
        setFormError(result.error)
        return
      }

      onOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px] gap-0 overflow-visible p-0">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="border-b border-[#f4f5f6] px-6 py-5">
            <DialogHeader className="gap-1.5">
              <DialogTitle className="font-recoleta text-[22px] font-normal leading-[1.2] text-[#272a2d]">
                {isEditing ? "Editar proyecto" : "Nuevo proyecto"}
              </DialogTitle>
              <DialogDescription className="text-sm leading-[1.4] text-[#777b84]">
                {isEditing
                  ? "Actualizá los datos del proyecto."
                  : "Completá los datos para registrar un nuevo proyecto."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex flex-col gap-4 px-6 py-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="project-name" className={LABEL_CLASSNAME}>
                Nombre
              </Label>
              <Input
                id="project-name"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Edificio Las Palmas"
                className={FIELD_CLASSNAME}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="project-company" className={LABEL_CLASSNAME}>
                Empresa
              </Label>

              {form.company ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-[#edeef0] bg-[#fafafa] px-3 py-2.5">
                  <p className="truncate text-sm font-medium leading-5 text-[#18191b]">
                    {form.company.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setForm((current) => ({ ...current, company: null }))
                      setCompanySearch("")
                      setCompanyCandidates([])
                      if (formError) setFormError(null)
                    }}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-[#777b84] transition-colors hover:bg-white hover:text-[#363a3f]"
                    aria-label="Cambiar empresa"
                  >
                    <X className="size-4" strokeWidth={1.75} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <Input
                    id="project-company"
                    value={companySearch}
                    onChange={(event) => setCompanySearch(event.target.value)}
                    placeholder="Buscar empresa..."
                    className={FIELD_CLASSNAME}
                  />

                  {isSearchingCompany ? (
                    <p className="text-xs leading-4 text-[#777b84]">Buscando...</p>
                  ) : null}

                  {!isSearchingCompany && companySearch.trim().length >= 2 ? (
                    companyCandidates.length > 0 ? (
                      <ul className="max-h-48 w-full overflow-y-auto rounded-xl border border-[#edeef0] bg-white py-1 shadow-[0_0_10px_rgba(243,103,31,0.08)]">
                        {companyCandidates.map((candidate) => (
                          <li key={candidate.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setForm((current) => ({
                                  ...current,
                                  company: {
                                    id: candidate.id,
                                    name: candidate.name,
                                  },
                                }))
                                setCompanySearch("")
                                setCompanyCandidates([])
                                if (formError) setFormError(null)
                              }}
                              className="flex w-full px-3 py-2 text-left text-sm leading-5 text-[#18191b] transition-colors hover:bg-[#f4f5f6]"
                            >
                              {candidate.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs leading-4 text-[#777b84]">
                        No encontramos empresas con esa búsqueda.
                      </p>
                    )
                  ) : null}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="project-location" className={LABEL_CLASSNAME}>
                Ubicación
              </Label>
              <Input
                id="project-location"
                value={form.location}
                onChange={(event) => updateField("location", event.target.value)}
                placeholder="Av. Libertador 1234"
                className={FIELD_CLASSNAME}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="project-status" className={LABEL_CLASSNAME}>
                  Estado
                </Label>
                <select
                  id="project-status"
                  value={form.status}
                  onChange={(event) => updateField("status", event.target.value)}
                  className={cn(FIELD_CLASSNAME, "px-3")}
                >
                  {PROJECT_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="project-surface" className={LABEL_CLASSNAME}>
                  Superficie (m²)
                </Label>
                <Input
                  id="project-surface"
                  value={form.totalSurfaceM2}
                  onChange={(event) =>
                    updateField("totalSurfaceM2", event.target.value)
                  }
                  placeholder="2500"
                  className={FIELD_CLASSNAME}
                />
              </div>
            </div>

            {formError ? (
              <p className="text-sm leading-[1.4] text-[#dc3e42]">{formError}</p>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[#f4f5f6] px-6 py-4">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              className="h-10 rounded-[10px] border-[#edeef0] bg-white px-4 text-sm font-medium text-[#43484e] shadow-none hover:bg-[#f4f5f6]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="brand"
              disabled={isPending}
              className="px-4 text-sm font-medium"
            >
              {isPending ? (
                <Spinner className="size-4" />
              ) : (
                <Plus className="size-4" />
              )}
              {isPending
                ? "Guardando..."
                : isEditing
                  ? "Guardar cambios"
                  : "Crear proyecto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function NuevoProyectoButton({
  onClick,
  disabled,
}: {
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <Button
      type="button"
      variant="brand"
      size="brand"
      disabled={disabled}
      onClick={onClick}
      className="shrink-0 px-4 text-sm font-medium"
    >
      <Plus className="size-4" strokeWidth={1.75} />
      Nuevo proyecto
    </Button>
  )
}
