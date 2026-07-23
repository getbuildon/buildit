"use client"

import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle, Save } from "lucide-react"
import { BackButton } from "@/components/ui/BackButton"
import { getCompanyInfo, updateCompanyInfo, type CompanyInfo } from "../settings/actions"

type Feedback = { type: "success" | "error"; message: string } | null

const INPUT_CLASS =
  "h-[42px] w-full rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[14px] font-normal leading-5 text-[#0a0a0a] outline-none focus:border-[#ff7433] disabled:opacity-70"

type InformacionViewProps = {
  companyId: string
}

export function InformacionView({ companyId }: InformacionViewProps) {
  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [name, setName] = useState("")
  const [legalName, setLegalName] = useState("")
  const [country, setCountry] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)

  useEffect(() => {
    void getCompanyInfo(companyId).then((data) => {
      if (data) {
        setCompany(data)
        setName(data.name)
        setLegalName(data.legal_name || "")
        setCountry(data.country || "")
      }
      setLoading(false)
    })
  }, [companyId])

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    setFeedback(null)

    if (!name.trim()) {
      setFeedback({ type: "error", message: "El nombre de la empresa es obligatorio." })
      return
    }

    setSaving(true)
    const result = await updateCompanyInfo({
      companyId,
      name,
      legal_name: legalName,
      country,
    })
    setSaving(false)

    setFeedback(
      result.ok
        ? { type: "success", message: "Cambios guardados correctamente." }
        : { type: "error", message: result.error },
    )
  }

  if (loading) {
    return <p className="text-[14px] text-[#777b84]">Cargando...</p>
  }

  if (!company) {
    return <p className="text-[14px] text-[#b91c1c]">Empresa no encontrada.</p>
  }

  return (
    <div className="mx-auto w-full max-w-[720px]">
      <header className="mb-6 flex flex-col gap-4">
        <BackButton href="/home" />
        <div className="flex flex-col gap-0.5">
          <h1 className="font-recoleta text-[24px] font-normal leading-[1.05] text-[#272a2d]">
            Información
          </h1>
          <p className="text-[14px] leading-[1.4] text-[#272a2d]">
            Administrá los datos de tu empresa
          </p>
        </div>
      </header>

      <form
        onSubmit={handleSave}
        className="flex flex-col gap-4 rounded-[16px] border border-[#edeef0] bg-white p-[21px] shadow-[0_0_5px_rgba(243,103,31,0.08)]"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="company-name" className="text-[12px] leading-[1.4] text-[#43484e]">
            Nombre de la Empresa *
          </label>
          <input
            id="company-name"
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setFeedback(null)
            }}
            disabled={saving}
            className={INPUT_CLASS}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="legal-name" className="text-[12px] leading-[1.4] text-[#43484e]">
            Razón Social
          </label>
          <input
            id="legal-name"
            type="text"
            value={legalName}
            onChange={(event) => {
              setLegalName(event.target.value)
              setFeedback(null)
            }}
            disabled={saving}
            className={INPUT_CLASS}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="country" className="text-[12px] leading-[1.4] text-[#43484e]">
            País
          </label>
          <input
            id="country"
            type="text"
            value={country}
            onChange={(event) => {
              setCountry(event.target.value)
              setFeedback(null)
            }}
            disabled={saving}
            className={INPUT_CLASS}
          />
        </div>

        {feedback ? (
          <div
            className="flex items-start gap-2 rounded-[10px] border px-3 py-2.5"
            style={{
              backgroundColor: feedback.type === "success" ? "#f0fdf4" : "#fff1f0",
              borderColor: feedback.type === "success" ? "#bbf7d0" : "#fecaca",
            }}
          >
            {feedback.type === "success" ? (
              <CheckCircle className="mt-0.5 size-4 shrink-0 text-[#16a34a]" aria-hidden />
            ) : (
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-[#dc2626]" aria-hidden />
            )}
            <p
              className="text-[13px] leading-[18px]"
              style={{ color: feedback.type === "success" ? "#15803d" : "#b91c1c" }}
            >
              {feedback.message}
            </p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-[44px] w-fit items-center gap-2 rounded-[10px] bg-[#ff7433] px-4 py-3 text-[14px] font-normal text-white shadow-[0_0_5px_rgba(243,103,31,0.08)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Save className="size-4" aria-hidden />
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </form>
    </div>
  )
}
