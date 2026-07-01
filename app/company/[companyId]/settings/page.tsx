"use client"

import { use, useEffect, useState } from "react"
import { Save, CheckCircle, AlertCircle } from "lucide-react"
import { BackButton } from "@/components/ui/BackButton"
import { getCompanyInfo, updateCompanyInfo, type CompanyInfo } from "./actions"

type Feedback = { type: "success" | "error"; message: string } | null

export default function CompanySettingsPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params)
  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [name, setName] = useState("")
  const [legalName, setLegalName] = useState("")
  const [country, setCountry] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)

  useEffect(() => {
    const loadCompany = async () => {
      const data = await getCompanyInfo(companyId)
      if (data) {
        setCompany(data)
        setName(data.name)
        setLegalName(data.legal_name || "")
        setCountry(data.country || "")
      }
      setLoading(false)
    }
    loadCompany()
  }, [companyId])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)

    if (!name.trim()) {
      setFeedback({ type: "error", message: "El nombre de la empresa es obligatorio." })
      return
    }

    setSaving(true)
    const result = await updateCompanyInfo({
      companyId: companyId,
      name,
      legal_name: legalName,
      country,
    })
    setSaving(false)

    if (result.ok) {
      setFeedback({ type: "success", message: "Cambios guardados correctamente." })
    } else {
      setFeedback({ type: "error", message: result.error })
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa", padding: "40px 24px" }}>
        <div style={{ maxWidth: "747px", margin: "0 auto" }}>Cargando...</div>
      </div>
    )
  }

  if (!company) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa", padding: "40px 24px" }}>
        <div style={{ maxWidth: "747px", margin: "0 auto", color: "#dc2626" }}>Empresa no encontrada</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa", padding: "40px 24px" }}>
      <div
        style={{
          maxWidth: "747px",
          width: "100%",
          margin: "0 auto",
        }}
      >
        <header style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
          <BackButton href="/home" />
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <h1 style={{ fontSize: "24px", fontWeight: 400, lineHeight: "32px", color: "#272a2d", fontFamily: "var(--font-recoleta, serif)", margin: 0 }}>
              Configuración de Empresa
            </h1>
            <p style={{ fontSize: "14px", fontWeight: 400, color: "#272a2d", lineHeight: "20px", margin: 0 }}>
              Administrá los datos de tu empresa
            </p>
          </div>
        </header>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #edeef0",
            padding: "21px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label htmlFor="name" style={{ fontSize: "12px", fontWeight: 400, color: "#43484e" }}>
              Nombre de la Empresa *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setFeedback(null)
              }}
              disabled={saving}
              style={{
                width: "100%",
                height: "42px",
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                backgroundColor: saving ? "#f1f5f9" : "#f8fafc",
                fontSize: "14px",
                fontWeight: 400,
                color: "#0a0a0a",
                lineHeight: "20px",
                outline: "none",
                boxSizing: "border-box",
                opacity: saving ? 0.7 : 1,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#ff7433"
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0"
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label htmlFor="legalName" style={{ fontSize: "12px", fontWeight: 400, color: "#43484e" }}>
              Razón Social
            </label>
            <input
              id="legalName"
              type="text"
              value={legalName}
              onChange={(e) => {
                setLegalName(e.target.value)
                setFeedback(null)
              }}
              disabled={saving}
              style={{
                width: "100%",
                height: "42px",
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                backgroundColor: saving ? "#f1f5f9" : "#f8fafc",
                fontSize: "14px",
                fontWeight: 400,
                color: "#0a0a0a",
                lineHeight: "20px",
                outline: "none",
                boxSizing: "border-box",
                opacity: saving ? 0.7 : 1,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#ff7433"
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0"
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label htmlFor="country" style={{ fontSize: "12px", fontWeight: 400, color: "#43484e" }}>
              País
            </label>
            <input
              id="country"
              type="text"
              value={country}
              onChange={(e) => {
                setCountry(e.target.value)
                setFeedback(null)
              }}
              disabled={saving}
              style={{
                width: "100%",
                height: "42px",
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                backgroundColor: saving ? "#f1f5f9" : "#f8fafc",
                fontSize: "14px",
                fontWeight: 400,
                color: "#0a0a0a",
                lineHeight: "20px",
                outline: "none",
                boxSizing: "border-box",
                opacity: saving ? 0.7 : 1,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#ff7433"
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0"
              }}
            />
          </div>

          {feedback && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                padding: "10px 12px",
                borderRadius: "10px",
                backgroundColor: feedback.type === "success" ? "#f0fdf4" : "#fff1f0",
                border: `1px solid ${feedback.type === "success" ? "#bbf7d0" : "#fecaca"}`,
              }}
            >
              {feedback.type === "success" ? (
                <CheckCircle style={{ width: "16px", height: "16px", color: "#16a34a", flexShrink: 0, marginTop: "2px" }} />
              ) : (
                <AlertCircle style={{ width: "16px", height: "16px", color: "#dc2626", flexShrink: 0, marginTop: "2px" }} />
              )}
              <p style={{ fontSize: "13px", fontWeight: 400, color: feedback.type === "success" ? "#15803d" : "#b91c1c", lineHeight: "18px", margin: 0 }}>
                {feedback.message}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              alignSelf: "flex-start",
              height: "44px",
              padding: "12px 16px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#ff7433",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 400,
              lineHeight: "20px",
              gap: "8px",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              transition: "opacity 0.2s",
            }}
          >
            <Save style={{ width: "16px", height: "16px" }} />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
      </div>
    </div>
  )
}
