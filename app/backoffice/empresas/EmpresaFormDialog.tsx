"use client"

import { useEffect, useState, useTransition, type FormEvent, type ReactNode } from "react"
import { Plus, X } from "lucide-react"

import {
  addBackofficeCompanyMember,
  createBackofficeCompany,
  getBackofficeCompanyMembers,
  removeBackofficeCompanyMember,
  searchBackofficeMemberCandidates,
  searchBackofficeOwnerCandidates,
  updateBackofficeCompany,
  type BackofficeCompanyMember,
  type BackofficeCompanyRole,
  type BackofficeCompanyRow,
  type BackofficeOwnerCandidate,
} from "@/app/backoffice/empresas/actions"
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
import { useInvalidateBackoffice } from "@/lib/backoffice/invalidateBackofficeQueries"
import { COMPANY_ROLES, formatCompanyRole } from "@/lib/company/formatCompanyRole"
import { cn } from "@/lib/utils"

const FIELD_CLASSNAME =
  "h-[42px] rounded-xl border-[#edeef0] bg-white text-sm leading-[1.4] text-[#18191b] placeholder:text-[#696e77] shadow-none focus-visible:border-[#ff7433] focus-visible:ring-0"

const LABEL_CLASSNAME = "text-xs font-medium leading-[1.4] text-[#5a6169]"

function FieldLabel({
  htmlFor,
  required,
  children,
}: {
  htmlFor?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <Label htmlFor={htmlFor} className={LABEL_CLASSNAME}>
      {children}
      {required ? <span className="text-[#ff7433]"> *</span> : null}
    </Label>
  )
}

type OwnerSelection = {
  userId: string
  name: string
  email: string
}

type EmpresaFormState = {
  name: string
  legalName: string
  country: string
  taxId: string
  owner: OwnerSelection | null
}

function emptyFormState(): EmpresaFormState {
  return {
    name: "",
    legalName: "",
    country: "",
    taxId: "",
    owner: null,
  }
}

function formFromCompany(company: BackofficeCompanyRow): EmpresaFormState {
  return {
    name: company.name,
    legalName: company.legalName ?? "",
    country: company.country ?? "",
    taxId: company.taxId ?? "",
    owner: company.owner
      ? {
          userId: company.owner.userId,
          name: company.owner.name,
          email: company.owner.email,
        }
      : null,
  }
}

type EmpresaFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  company: BackofficeCompanyRow | null
}

export function EmpresaFormDialog({
  open,
  onOpenChange,
  company,
}: EmpresaFormDialogProps) {
  const invalidateBackoffice = useInvalidateBackoffice()
  const isEditing = company !== null
  const [form, setForm] = useState(emptyFormState)
  const [formError, setFormError] = useState<string | null>(null)
  const [ownerSearch, setOwnerSearch] = useState("")
  const [ownerCandidates, setOwnerCandidates] = useState<BackofficeOwnerCandidate[]>(
    [],
  )
  const [isSearchingOwner, setIsSearchingOwner] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [members, setMembers] = useState<BackofficeCompanyMember[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [addingRole, setAddingRole] = useState<BackofficeCompanyRole | null>(null)
  const [memberSearch, setMemberSearch] = useState("")
  const [memberCandidates, setMemberCandidates] = useState<BackofficeOwnerCandidate[]>(
    [],
  )
  const [isSearchingMembers, setIsSearchingMembers] = useState(false)
  const [memberActionId, setMemberActionId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setForm(emptyFormState())
      setFormError(null)
      setOwnerSearch("")
      setOwnerCandidates([])
      setMembers([])
      setAddingRole(null)
      setMemberSearch("")
      setMemberCandidates([])
      return
    }

    setForm(company ? formFromCompany(company) : emptyFormState())
    setFormError(null)
    setOwnerSearch("")
    setOwnerCandidates([])
    setMembers([])
    setAddingRole(null)
    setMemberSearch("")
    setMemberCandidates([])
  }, [open, company])

  useEffect(() => {
    if (!open || !company) return

    let cancelled = false
    setIsLoadingMembers(true)

    void getBackofficeCompanyMembers(company.id)
      .then((nextMembers) => {
        if (!cancelled) setMembers(nextMembers)
      })
      .catch(() => {
        if (!cancelled) setFormError("No pudimos cargar los miembros.")
      })
      .finally(() => {
        if (!cancelled) setIsLoadingMembers(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, company])

  useEffect(() => {
    if (!open || form.owner) {
      setOwnerCandidates([])
      return
    }

    const term = ownerSearch.trim()
    if (term.length < 2) {
      setOwnerCandidates([])
      return
    }

    const timeout = window.setTimeout(async () => {
      setIsSearchingOwner(true)

      try {
        const candidates = await searchBackofficeOwnerCandidates(term, {
          exceptCompanyId: company?.id,
        })
        setOwnerCandidates(candidates)
      } catch {
        setOwnerCandidates([])
      } finally {
        setIsSearchingOwner(false)
      }
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [open, ownerSearch, form.owner, company?.id])

  useEffect(() => {
    if (!open || !isEditing || !company || !addingRole) {
      setMemberCandidates([])
      return
    }

    const term = memberSearch.trim()
    if (term.length < 2) {
      setMemberCandidates([])
      return
    }

    const timeout = window.setTimeout(async () => {
      setIsSearchingMembers(true)

      try {
        const candidates = await searchBackofficeMemberCandidates(term, {
          companyId: company.id,
          role: addingRole,
        })
        setMemberCandidates(candidates)
      } catch {
        setMemberCandidates([])
      } finally {
        setIsSearchingMembers(false)
      }
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [open, isEditing, company, addingRole, memberSearch])

  const updateField = <K extends keyof EmpresaFormState>(
    key: K,
    value: EmpresaFormState[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
    if (formError) setFormError(null)
  }

  const refreshMembers = async () => {
    if (!company) return
    const nextMembers = await getBackofficeCompanyMembers(company.id)
    setMembers(nextMembers)
    void invalidateBackoffice()
  }

  const handleAddMember = async (
    role: BackofficeCompanyRole,
    candidate: BackofficeOwnerCandidate,
  ) => {
    if (!company) return

    setMemberActionId(candidate.id)
    setFormError(null)

    const result = await addBackofficeCompanyMember(company.id, candidate.id, role)
    setMemberActionId(null)

    if (!result.ok) {
      setFormError(result.error)
      return
    }

    setAddingRole(null)
    setMemberSearch("")
    setMemberCandidates([])
    await refreshMembers()
  }

  const handleRemoveMember = async (member: BackofficeCompanyMember) => {
    if (!company) return

    setMemberActionId(member.id)
    setFormError(null)

    const result = await removeBackofficeCompanyMember(company.id, member.id)
    setMemberActionId(null)

    if (!result.ok) {
      setFormError(result.error)
      return
    }

    await refreshMembers()
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)

    if (!form.name.trim()) {
      setFormError("El nombre de la empresa es obligatorio.")
      return
    }

    startTransition(async () => {
      const payload = {
        name: form.name,
        legalName: form.legalName,
        country: form.country,
        taxId: form.taxId,
        ownerUserId: isEditing ? undefined : form.owner?.userId ?? null,
      }

      const result = isEditing
        ? await updateBackofficeCompany(company.id, payload)
        : await createBackofficeCompany(payload)

      if (!result.ok) {
        setFormError(result.error)
        return
      }

      onOpenChange(false)
      void invalidateBackoffice()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-[560px] flex-col gap-0 overflow-hidden p-0">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-[#f4f5f6] px-6 py-5">
            <DialogHeader className="gap-1.5">
              <DialogTitle className="font-recoleta text-[22px] font-normal leading-[1.2] text-[#272a2d]">
                {isEditing ? "Editar empresa" : "Nueva empresa"}
              </DialogTitle>
              <DialogDescription className="text-sm leading-[1.4] text-[#777b84]">
                {isEditing
                  ? "Actualizá los datos de la empresa."
                  : "Completá los datos para registrar una nueva empresa."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="company-name" required>
                Nombre
              </FieldLabel>
              <Input
                id="company-name"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Grupo Álamo"
                className={FIELD_CLASSNAME}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="company-legal-name">Razón social</FieldLabel>
              <Input
                id="company-legal-name"
                value={form.legalName}
                onChange={(event) => updateField("legalName", event.target.value)}
                placeholder="Grupo Álamo S.A."
                className={FIELD_CLASSNAME}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="company-country">País</FieldLabel>
                <Input
                  id="company-country"
                  value={form.country}
                  onChange={(event) => updateField("country", event.target.value)}
                  placeholder="Argentina"
                  className={FIELD_CLASSNAME}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="company-tax-id">CUIT / Tax ID</FieldLabel>
                <Input
                  id="company-tax-id"
                  value={form.taxId}
                  onChange={(event) => updateField("taxId", event.target.value)}
                  placeholder="30-12345678-9"
                  className={FIELD_CLASSNAME}
                />
              </div>
            </div>

            {!isEditing ? (
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="company-owner">Owner</FieldLabel>

              {form.owner ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-[#edeef0] bg-[#fafafa] px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium leading-5 text-[#18191b]">
                      {form.owner.name}
                    </p>
                    <p className="truncate text-xs leading-4 text-[#696e77]">
                      {form.owner.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setForm((current) => ({ ...current, owner: null }))
                      setOwnerSearch("")
                      setOwnerCandidates([])
                      if (formError) setFormError(null)
                    }}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-[#777b84] transition-colors hover:bg-white hover:text-[#363a3f]"
                    aria-label="Cambiar owner"
                  >
                    <X className="size-4" strokeWidth={1.75} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <Input
                    id="company-owner"
                    value={ownerSearch}
                    onChange={(event) => setOwnerSearch(event.target.value)}
                    placeholder="Buscar por nombre o email..."
                    className={FIELD_CLASSNAME}
                  />

                  {isSearchingOwner ? (
                    <p className="text-xs leading-4 text-[#777b84]">Buscando...</p>
                  ) : null}

                  {!isSearchingOwner && ownerSearch.trim().length >= 2 ? (
                    ownerCandidates.length > 0 ? (
                      <ul className="max-h-48 w-full overflow-y-auto rounded-xl border border-[#edeef0] bg-white py-1 shadow-[0_0_10px_rgba(243,103,31,0.08)]">
                        {ownerCandidates.map((candidate) => (
                          <li key={candidate.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setForm((current) => ({
                                  ...current,
                                  owner: {
                                    userId: candidate.id,
                                    name: candidate.name,
                                    email: candidate.email,
                                  },
                                }))
                                setOwnerSearch("")
                                setOwnerCandidates([])
                                if (formError) setFormError(null)
                              }}
                              className="flex w-full flex-col px-3 py-2 text-left transition-colors hover:bg-[#f4f5f6]"
                            >
                              <span className="truncate text-sm leading-5 text-[#18191b]">
                                {candidate.name}
                              </span>
                              <span className="truncate text-xs leading-4 text-[#696e77]">
                                {candidate.email}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs leading-4 text-[#777b84]">
                        No encontramos usuarios con esa búsqueda.
                      </p>
                    )
                  ) : null}
                </div>
              )}
            </div>
            ) : (
            <div className="flex flex-col gap-3">
              <p className={LABEL_CLASSNAME}>Miembros por rol</p>
              {isLoadingMembers ? (
                <p className="text-xs leading-4 text-[#777b84]">Cargando miembros...</p>
              ) : (
                COMPANY_ROLES.map((role) => {
                  const roleMembers = members.filter((member) => member.role === role)
                  const isAdding = addingRole === role

                  return (
                    <div
                      key={role}
                      className="flex flex-col gap-2 rounded-xl border border-[#edeef0] bg-[#fafafa] p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium leading-5 text-[#18191b]">
                          {formatCompanyRole(role)}
                          <span className="ml-1.5 text-xs font-normal text-[#777b84]">
                            {roleMembers.length}
                          </span>
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setAddingRole(isAdding ? null : role)
                            setMemberSearch("")
                            setMemberCandidates([])
                            if (formError) setFormError(null)
                          }}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors",
                            isAdding
                              ? "bg-white text-[#43484e]"
                              : "text-[#ff7433] hover:bg-white",
                          )}
                        >
                          {isAdding ? (
                            <>
                              <X className="size-3.5" aria-hidden />
                              Cancelar
                            </>
                          ) : (
                            <>
                              <Plus className="size-3.5" aria-hidden />
                              Agregar
                            </>
                          )}
                        </button>
                      </div>

                      {roleMembers.length === 0 ? (
                        <p className="text-xs leading-4 text-[#777b84]">
                          Sin miembros en este rol.
                        </p>
                      ) : (
                        <ul className="flex flex-col gap-1.5">
                          {roleMembers.map((member) => (
                            <li
                              key={member.id}
                              className="flex items-center justify-between gap-2 rounded-lg border border-[#edeef0] bg-white px-2.5 py-2"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium leading-5 text-[#18191b]">
                                  {member.name}
                                </p>
                                <p className="truncate text-xs leading-4 text-[#696e77]">
                                  {member.email}
                                </p>
                              </div>
                              <button
                                type="button"
                                disabled={memberActionId === member.id}
                                onClick={() => void handleRemoveMember(member)}
                                className="grid size-7 shrink-0 place-items-center rounded-lg text-[#777b84] transition-colors hover:bg-[#f4f5f6] hover:text-[#dc3e42] disabled:opacity-50"
                                aria-label={`Quitar a ${member.name} de ${formatCompanyRole(role)}`}
                              >
                                {memberActionId === member.id ? (
                                  <Spinner className="size-3.5" />
                                ) : (
                                  <X className="size-3.5" strokeWidth={1.75} />
                                )}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      {isAdding ? (
                        <div className="flex flex-col gap-1">
                          <Input
                            value={memberSearch}
                            onChange={(event) => setMemberSearch(event.target.value)}
                            placeholder="Buscar por nombre o email..."
                            className={FIELD_CLASSNAME}
                          />
                          {isSearchingMembers ? (
                            <p className="text-xs leading-4 text-[#777b84]">Buscando...</p>
                          ) : null}
                          {!isSearchingMembers && memberSearch.trim().length >= 2 ? (
                            memberCandidates.length > 0 ? (
                              <ul className="max-h-40 overflow-y-auto rounded-xl border border-[#edeef0] bg-white py-1">
                                {memberCandidates.map((candidate) => (
                                  <li key={candidate.id}>
                                    <button
                                      type="button"
                                      disabled={memberActionId === candidate.id}
                                      onClick={() => void handleAddMember(role, candidate)}
                                      className="flex w-full flex-col px-3 py-2 text-left transition-colors hover:bg-[#edeef0] disabled:opacity-50"
                                    >
                                      <span className="truncate text-sm leading-5 text-[#18191b]">
                                        {candidate.name}
                                      </span>
                                      <span className="truncate text-xs leading-4 text-[#696e77]">
                                        {candidate.email}
                                      </span>
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs leading-4 text-[#777b84]">
                                No encontramos usuarios con esa búsqueda.
                              </p>
                            )
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  )
                })
              )}
            </div>
            )}

            {formError ? (
              <p className="text-sm leading-[1.4] text-[#dc3e42]">{formError}</p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[#f4f5f6] px-6 py-4">
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
                  : "Crear empresa"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function NuevaEmpresaButton({
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
      Nueva empresa
    </Button>
  )
}
