"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Building2, CheckCircle, Save } from "lucide-react"
import { BackButton } from "@/components/ui/BackButton"
import { CompanyLogoMark } from "@/components/company/CompanyLogoMark"
import {
  compressCompanyLogo,
  revokeCompanyLogoPreview,
  uploadCompanyLogo,
  type CompanyLogoDraft,
} from "@/lib/company/companyLogo.client"
import { cn } from "@/lib/utils"
import { getCompanyInfo, updateCompanyInfo, type CompanyInfo } from "../settings/actions"

type Feedback = { type: "success" | "error"; message: string } | null

const INPUT_CLASS =
  "h-[42px] w-full rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[14px] font-normal leading-5 text-[#0a0a0a] outline-none focus:border-[#ff7433] disabled:opacity-70"

type InformacionViewProps = {
  companyId: string
}

export function InformacionView({ companyId }: InformacionViewProps) {
  const router = useRouter()
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [name, setName] = useState("")
  const [legalName, setLegalName] = useState("")
  const [country, setCountry] = useState("")
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoDraft, setLogoDraft] = useState<CompanyLogoDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoProcessing, setLogoProcessing] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const previewLogoUrl = logoDraft?.previewUrl ?? logoUrl

  useEffect(() => {
    void getCompanyInfo(companyId).then((data) => {
      if (data) {
        setCompany(data)
        setName(data.name)
        setLegalName(data.legal_name || "")
        setCountry(data.country || "")
        setLogoUrl(data.logo_url)
      }
      setLoading(false)
    })
  }, [companyId])

  const handleLogoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    event.target.value = ""
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setFeedback({ type: "error", message: "Seleccioná una imagen válida." })
      return
    }

    setFeedback(null)
    setLogoProcessing(true)

    try {
      const compressed = await compressCompanyLogo(file)
      revokeCompanyLogoPreview(logoDraft)
      setLogoDraft({
        file: compressed,
        previewUrl: URL.createObjectURL(compressed),
      })
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "No se pudo procesar el logo."
      setFeedback({ type: "error", message })
    } finally {
      setLogoProcessing(false)
    }
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    setFeedback(null)

    if (!name.trim()) {
      setFeedback({ type: "error", message: "El nombre de la empresa es obligatorio." })
      return
    }

    setSaving(true)

    let nextLogoUrl: string | undefined
    if (logoDraft) {
      const upload = await uploadCompanyLogo(companyId, logoDraft.file)
      if (!upload.ok) {
        setSaving(false)
        setFeedback({ type: "error", message: upload.error })
        return
      }
      nextLogoUrl = upload.publicUrl
    }

    const result = await updateCompanyInfo({
      companyId,
      name,
      legal_name: legalName,
      country,
      ...(nextLogoUrl !== undefined ? { logo_url: nextLogoUrl } : {}),
    })

    if (result.ok) {
      if (nextLogoUrl !== undefined) {
        revokeCompanyLogoPreview(logoDraft)
        setLogoDraft(null)
        setLogoUrl(nextLogoUrl)
      }
      router.refresh()
    }

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
        <div className="flex flex-col gap-2">
          <p className="text-[12px] leading-[1.4] text-[#43484e]">Logo de la empresa</p>
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            disabled={saving || logoProcessing}
            className="group flex w-full items-center gap-4 rounded-[12px] border border-transparent p-2 text-left transition-colors hover:border-[#edeef0] hover:bg-[#fafafa] disabled:cursor-wait disabled:opacity-70"
          >
            <span
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-[10px] border border-[#e2e8f0] transition-colors group-hover:border-[#cad5e2]",
                previewLogoUrl ? "bg-transparent" : "bg-[#ff7433]",
              )}
            >
              <CompanyLogoMark
                logoUrl={previewLogoUrl}
                alt="Logo de la empresa"
                className="size-16"
                fallback={<Building2 className="size-7 text-white" aria-hidden />}
              />
              {logoProcessing ? (
                <span className="absolute inset-0 flex items-center justify-center bg-[#ff7433]/80 text-[11px] font-medium text-white">
                  …
                </span>
              ) : null}
            </span>
            <span className="min-w-0">
              <span className="block text-[14px] font-medium leading-[1.4] text-[#1d293d] transition-colors group-hover:text-[#ff7433]">
                {previewLogoUrl ? "Cambiar logo" : "Subir logo"}
              </span>
              <span className="block text-[12px] leading-[1.4] text-[#696e77]">
                Se muestra en el menú y en las obras. JPG, PNG o WebP, hasta 10 MB.
              </span>
            </span>
          </button>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => void handleLogoSelect(event)}
          />
        </div>

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
          disabled={saving || logoProcessing}
          className="inline-flex h-[44px] w-fit items-center gap-2 rounded-[10px] bg-[#ff7433] px-4 py-3 text-[14px] font-normal text-white shadow-[0_0_5px_rgba(243,103,31,0.08)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Save className="size-4" aria-hidden />
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </form>
    </div>
  )
}
