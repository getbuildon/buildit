"use client"

import { useEffect, useState } from "react"
import { Building2, Calendar, Check, ChevronDown, MapPin, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  CreateProjectFormField,
  createProjectInputClassName,
  createProjectInputStyle,
} from "@/components/projects/new/CreateProjectFormField"
import {
  CREATE_PROJECT_COLORS,
} from "@/lib/projects/createProjectTokens"
import type { CreateProjectDraft } from "@/lib/projects/createProjectDraft"
import { getUserCompanies, type CompanyData } from "@/lib/company/getCompanies"
import { cn } from "@/lib/utils"

type Props = {
  draft: CreateProjectDraft
  onChange: (patch: Partial<CreateProjectDraft>) => void
}

export function CreateProjectBasicInfoStep({ draft, onChange }: Props) {
  const [companies, setCompanies] = useState<CompanyData[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showNewCompanyInput, setShowNewCompanyInput] = useState(false)

  useEffect(() => {
    getUserCompanies().then((data) => {
      setCompanies(data)
      if (data.length > 0 && !draft.companyId) {
        onChange({ companyId: data[0].id, companyName: data[0].name })
      }
      setLoadingCompanies(false)
    })
  }, [])

  const selectedCompany = draft.companyId
    ? companies.find((c) => c.id === draft.companyId)
    : null

  const displayLabel = selectedCompany
    ? selectedCompany.name
    : showNewCompanyInput
      ? ""
      : "Seleccionar empresa..."

  function handleSelectCompany(company: CompanyData) {
    onChange({ companyId: company.id, companyName: company.name })
    setShowNewCompanyInput(false)
    setDropdownOpen(false)
  }

  function handleNewCompany() {
    onChange({ companyId: null, companyName: "" })
    setShowNewCompanyInput(true)
    setDropdownOpen(false)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Empresa */}
      <CreateProjectFormField label="Empresa" htmlFor="project-company">
        {!showNewCompanyInput ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen((v) => !v)}
              className={cn(
                createProjectInputClassName,
                "flex items-center justify-between gap-2 cursor-pointer",
              )}
              style={createProjectInputStyle}
            >
              <span className="flex items-center gap-2 truncate">
                <Building2 className="size-4 shrink-0 text-[#90a1b9]" />
                <span className={selectedCompany ? "text-[#0a0a0a]" : "text-[#777b84]"}>
                  {loadingCompanies ? "Cargando..." : displayLabel}
                </span>
              </span>
              <ChevronDown
                className={cn("size-4 shrink-0 text-[#90a1b9] transition-transform", dropdownOpen && "rotate-180")}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-[10px] border border-[#e2e8f0] bg-white shadow-lg">
                {companies.map((company) => (
                  <button
                    key={company.id}
                    type="button"
                    onClick={() => handleSelectCompany(company)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-[14px] hover:bg-[#f9f9fb]"
                  >
                    <Building2 className="size-4 shrink-0 text-[#90a1b9]" />
                    <span className="flex-1 truncate text-[#0a0a0a]">{company.name}</span>
                    {draft.companyId === company.id && (
                      <Check className="size-4 shrink-0 text-[#ff7433]" />
                    )}
                  </button>
                ))}
                <div className="border-t border-[#edeef0]">
                  <button
                    type="button"
                    onClick={handleNewCompany}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-[14px] font-medium text-[#ff7433] hover:bg-[#fff5f1]"
                  >
                    <Plus className="size-4 shrink-0" />
                    Nueva empresa
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Building2
                className="pointer-events-none absolute top-[13px] left-3 size-4 text-[#90a1b9]"
                aria-hidden
              />
              <Input
                id="project-company"
                autoFocus
                placeholder="Nombre de la empresa"
                value={draft.companyName}
                onChange={(e) => onChange({ companyName: e.target.value })}
                className={cn(createProjectInputClassName, "pl-10")}
                style={createProjectInputStyle}
              />
            </div>
            {companies.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setShowNewCompanyInput(false)
                  if (companies[0]) handleSelectCompany(companies[0])
                }}
                className="self-start text-[13px] text-[#ff7433] hover:underline"
              >
                ← Seleccionar empresa existente
              </button>
            )}
          </div>
        )}
      </CreateProjectFormField>

      {/* Nombre del Proyecto */}
      <CreateProjectFormField label="Nombre del Proyecto" htmlFor="project-name">
        <Input
          id="project-name"
          name="project-name"
          placeholder="Ej: Edificio Las Palmas"
          value={draft.projectName}
          onChange={(e) => onChange({ projectName: e.target.value })}
          className={createProjectInputClassName}
          style={createProjectInputStyle}
        />
      </CreateProjectFormField>

      <CreateProjectFormField label="Ubicación" htmlFor="project-location">
        <div className="relative">
          <MapPin
            className="pointer-events-none absolute top-[13px] left-3 size-4 text-[#90a1b9]"
            aria-hidden
          />
          <Input
            id="project-location"
            name="project-location"
            placeholder="Dirección completa"
            value={draft.location}
            onChange={(e) => onChange({ location: e.target.value })}
            className={cn(createProjectInputClassName, "pl-10")}
            style={createProjectInputStyle}
          />
        </div>
      </CreateProjectFormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <CreateProjectFormField label="Fecha de Inicio" htmlFor="project-start">
          <div className="relative">
            <Calendar
              className="pointer-events-none absolute top-[13px] left-3 size-4 text-[#90a1b9]"
              aria-hidden
            />
            <Input
              id="project-start"
              name="project-start"
              type="date"
              value={draft.startDate}
              onChange={(e) => onChange({ startDate: e.target.value })}
              className={cn(createProjectInputClassName, "pl-10")}
              style={createProjectInputStyle}
            />
          </div>
        </CreateProjectFormField>

        <CreateProjectFormField label="Fecha de Finalización Estimada" htmlFor="project-end">
          <div className="relative">
            <Calendar
              className="pointer-events-none absolute top-[13px] left-3 size-4 text-[#90a1b9]"
              aria-hidden
            />
            <Input
              id="project-end"
              name="project-end"
              type="date"
              value={draft.endDate}
              onChange={(e) => onChange({ endDate: e.target.value })}
              className={cn(createProjectInputClassName, "pl-10")}
              style={createProjectInputStyle}
            />
          </div>
        </CreateProjectFormField>
      </div>
    </div>
  )
}
