"use client"

import { useEffect, useState, useTransition } from "react"
import { Plus, X } from "lucide-react"
import { useRouter } from "next/navigation"

import {
  cancelBackofficeProjectSubscription,
  createBackofficeProject,
  getBackofficeProjectSubscription,
  listBackofficeSubscriptionPlans,
  searchBackofficeProjectCompanyCandidates,
  updateBackofficeProject,
  type BackofficeProjectCompanyCandidate,
  type BackofficeProjectRow,
  type BackofficeProjectSubscriptionDetails,
  type BackofficeSubscriptionPlanOption,
} from "@/app/backoffice/proyectos/actions"
import {
  emptyProjectSubscriptionFormValue,
  ProjectSubscriptionFormFields,
  type ProjectSubscriptionFormValue,
} from "@/app/backoffice/proyectos/ProjectSubscriptionFormFields"
import { subscriptionFormValueFromDetails } from "@/lib/backoffice/projectSubscriptionForm"
import { Button } from "@/components/ui/button"
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog"
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
  subscription: ProjectSubscriptionFormValue
}

function emptyFormState(): ProyectoFormState {
  return {
    name: "",
    company: null,
    location: "",
    status: "active",
    totalSurfaceM2: "",
    subscription: emptyProjectSubscriptionFormValue(),
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
    subscription: emptyProjectSubscriptionFormValue(),
  }
}

function mergePlansForForm(
  catalogPlans: BackofficeSubscriptionPlanOption[],
  subscription: BackofficeProjectSubscriptionDetails | null,
): BackofficeSubscriptionPlanOption[] {
  if (!subscription?.plan.isCustom) return catalogPlans

  const customPlan = subscription.plan
  if (catalogPlans.some((plan) => plan.id === customPlan.id)) {
    return catalogPlans
  }

  return [...catalogPlans, customPlan]
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
  const [subscriptionPlans, setSubscriptionPlans] = useState<
    BackofficeSubscriptionPlanOption[]
  >([])
  const [subscriptionDetails, setSubscriptionDetails] =
    useState<BackofficeProjectSubscriptionDetails | null>(null)
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false)
  const [isSearchingCompany, setIsSearchingCompany] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isCancelling, startCancelTransition] = useTransition()

  useEffect(() => {
    if (!open) {
      setForm(emptyFormState())
      setFormError(null)
      setCompanySearch("")
      setCompanyCandidates([])
      setSubscriptionPlans([])
      setSubscriptionDetails(null)
      setCancelDialogOpen(false)
      return
    }

    setForm(project ? formFromProject(project) : emptyFormState())
    setFormError(null)
    setCompanySearch("")
    setCompanyCandidates([])
    setSubscriptionDetails(null)

    setIsLoadingSubscription(true)

    const loadSubscriptionData = project
      ? Promise.all([
          listBackofficeSubscriptionPlans(),
          getBackofficeProjectSubscription(project.id),
        ])
      : Promise.all([listBackofficeSubscriptionPlans(), Promise.resolve(null)])

    loadSubscriptionData
      .then(([plans, subscription]) => {
        setSubscriptionPlans(mergePlansForForm(plans, subscription))
        setSubscriptionDetails(subscription)

        if (project) {
          setForm((current) => ({
            ...current,
            subscription: subscription
              ? subscriptionFormValueFromDetails(subscription)
              : emptyProjectSubscriptionFormValue(),
          }))
        }
      })
      .catch(() => {
        setSubscriptionPlans([])
        setSubscriptionDetails(null)
      })
      .finally(() => setIsLoadingSubscription(false))
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

  const handleCancelSubscription = () => {
    if (!project) return

    startCancelTransition(async () => {
      const result = await cancelBackofficeProjectSubscription(project.id)

      if (!result.ok) {
        setFormError(result.error)
        return
      }

      setCancelDialogOpen(false)
      setSubscriptionDetails((current) =>
        current ? { ...current, status: "cancelled" } : current,
      )
      router.refresh()
    })
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
        ? await updateBackofficeProject(project.id, {
            ...payload,
            subscription:
              subscriptionDetails?.status === "cancelled"
                ? undefined
                : form.subscription,
          })
        : await createBackofficeProject({
            ...payload,
            subscription: form.subscription,
          })

      if (!result.ok) {
        setFormError(result.error)
        return
      }

      onOpenChange(false)
      router.refresh()
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[560px] gap-0 overflow-visible p-0">
          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="border-b border-[#f4f5f6] px-6 py-5">
              <DialogHeader className="gap-1.5">
                <DialogTitle className="font-recoleta text-[22px] font-normal leading-[1.2] text-[#272a2d]">
                  {isEditing ? "Editar proyecto" : "Nuevo proyecto"}
                </DialogTitle>
                <DialogDescription className="text-sm leading-[1.4] text-[#777b84]">
                  {isEditing
                    ? "Actualizá los datos del proyecto y su subscripción."
                    : "Completá los datos para registrar un nuevo proyecto."}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="flex max-h-[min(70vh,640px)] flex-col gap-4 overflow-y-auto px-6 py-5">
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

              {isLoadingSubscription ? (
                <p className="text-sm leading-5 text-[#777b84]">
                  Cargando subscripción...
                </p>
              ) : (
                <ProjectSubscriptionFormFields
                  mode={isEditing ? "edit" : "create"}
                  value={form.subscription}
                  plans={subscriptionPlans}
                  subscriptionStatus={subscriptionDetails?.status ?? null}
                  onChange={(subscription) => updateField("subscription", subscription)}
                  onCancelSubscription={
                    isEditing && subscriptionDetails?.status !== "cancelled"
                      ? () => setCancelDialogOpen(true)
                      : undefined
                  }
                  isCancelling={isCancelling}
                />
              )}

              {formError ? (
                <p className="text-sm leading-[1.4] text-[#dc3e42]">{formError}</p>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#f4f5f6] px-6 py-4">
              <Button
                type="button"
                variant="outline"
                disabled={isPending || isCancelling}
                onClick={() => onOpenChange(false)}
                className="h-10 rounded-[10px] border-[#edeef0] bg-white px-4 text-sm font-medium text-[#43484e] shadow-none hover:bg-[#f4f5f6]"
              >
                Cerrar
              </Button>
              <Button
                type="submit"
                variant="brand"
                size="brand"
                disabled={isPending || isCancelling || isLoadingSubscription}
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

      <ConfirmActionDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancelar subscripción"
        description="La subscripción quedará deshabilitada. Podés seguir viendo los datos del plan, pero no se podrán modificar."
        confirmLabel="Cancelar subscripción"
        loading={isCancelling}
        loadingLabel="Cancelando..."
        onConfirm={handleCancelSubscription}
      />
    </>
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
