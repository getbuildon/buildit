"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, Save, CheckCircle, AlertCircle } from "lucide-react"
import { createCompany } from "./actions"

type Feedback = { type: "success" | "error"; message: string } | null

export default function NewCompanyPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [legalName, setLegalName] = useState("")
  const [country, setCountry] = useState("")
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)

    if (!name.trim()) {
      setFeedback({ type: "error", message: "El nombre de la empresa es obligatorio." })
      return
    }

    setSaving(true)
    const result = await createCompany({
      name,
      legal_name: legalName,
      country,
    })
    setSaving(false)

    if (result.ok) {
      setFeedback({ type: "success", message: "Empresa creada exitosamente." })
      setTimeout(() => {
        router.push("/home")
        router.refresh()
      }, 1000)
    } else {
      setFeedback({ type: "error", message: result.error })
    }
  }

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center px-6 py-8"
      style={{ backgroundColor: "#f8f9fa" }}
    >
      <div
        style={{
          maxWidth: "747px",
          width: "100%",
          margin: "0 auto",
        }}
      >
        <header style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
          <Link
            href="/home"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: 500, color: "#43484E", textDecoration: "none", width: "fit-content", lineHeight: 1.4, transition: "opacity 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.7" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden style={{ flexShrink: 0, marginTop: "-1px" }}>
              <path d="M7.99992 12.6673L3.33325 8.00065L7.99992 3.33398" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12.6666 8H3.33325" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Volver
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-orange-500" />
              <h1 className="font-recoleta text-2xl font-normal text-gray-900">Nueva Empresa</h1>
            </div>
            <p className="text-sm text-gray-600 mt-1">Crea una empresa para comenzar a gestionar tus proyectos</p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
                placeholder="Ej: Mi Empresa"
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
                placeholder="Ej: Mi Empresa S.L."
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
                placeholder="Ej: Argentina"
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
              {saving ? "Creando..." : "Crear Empresa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
