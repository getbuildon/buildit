"use client"

import { useState } from "react"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function MigrationsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const handleApplyMigration = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/apply-invitation-migration", {
        method: "POST",
      })
      const data = await response.json()

      if (data.ok) {
        setResult({ type: "success", message: data.message })
      } else {
        setResult({ type: "error", message: data.error })
      }
    } catch (error) {
      setResult({ type: "error", message: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa", padding: "40px 24px" }}>
      <div style={{ maxWidth: "747px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 400, marginBottom: "16px", color: "#272a2d" }}>
          Migraciones de Base de Datos
        </h1>

        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #edeef0",
            padding: "21px",
            marginBottom: "24px",
          }}
        >
          <h2 style={{ fontSize: "16px", fontWeight: 500, marginBottom: "12px", color: "#1d293d" }}>
            Invitaciones de Empresa
          </h2>
          <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "16px", lineHeight: "1.5" }}>
            Esta migración crea la tabla `company_invitations` para gestionar invitaciones pendientes a usuarios.
          </p>

          <button
            onClick={handleApplyMigration}
            disabled={loading}
            style={{
              padding: "12px 24px",
              backgroundColor: "#ff7433",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Aplicando..." : "Aplicar Migración"}
          </button>
        </div>

        {result && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: "16px",
              backgroundColor: result.type === "success" ? "#f0fdf4" : "#fff1f0",
              border: `1px solid ${result.type === "success" ? "#bbf7d0" : "#fecaca"}`,
              borderRadius: "10px",
            }}
          >
            {result.type === "success" ? (
              <CheckCircle style={{ width: "20px", height: "20px", color: "#16a34a", flexShrink: 0 }} />
            ) : (
              <AlertCircle style={{ width: "20px", height: "20px", color: "#dc2626", flexShrink: 0 }} />
            )}
            <p style={{ fontSize: "14px", color: result.type === "success" ? "#15803d" : "#b91c1c", margin: 0 }}>
              {result.message}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
