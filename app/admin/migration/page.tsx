"use client"

import { useState } from "react"
import { AlertCircle, CheckCircle, Loader } from "lucide-react"

export default function MigrationPage() {
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const handleApplyMigration = async () => {
    setLoading(true)
    setFeedback(null)

    try {
      const response = await fetch("/api/admin/apply-rls-fix", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        setFeedback({
          type: "error",
          message: data.error || "Error applying migration",
        })
      } else {
        setFeedback({
          type: "success",
          message: data.message || "Migration applied successfully",
        })
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: "24px", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>
        Fix Companies RLS Policy
      </h1>

      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          padding: "24px",
        }}
      >
        <p style={{ marginBottom: "16px", color: "#666" }}>
          This will fix the RLS policy for companies table to allow authenticated users to create companies.
        </p>

        {feedback && (
          <div
            style={{
              display: "flex",
              gap: "12px",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "16px",
              backgroundColor: feedback.type === "success" ? "#f0fdf4" : "#fff1f0",
              border: `1px solid ${feedback.type === "success" ? "#bbf7d0" : "#fecaca"}`,
            }}
          >
            {feedback.type === "success" ? (
              <CheckCircle style={{ width: "20px", height: "20px", color: "#16a34a" }} />
            ) : (
              <AlertCircle style={{ width: "20px", height: "20px", color: "#dc2626" }} />
            )}
            <span style={{ color: feedback.type === "success" ? "#166534" : "#991b1b" }}>
              {feedback.message}
            </span>
          </div>
        )}

        <button
          onClick={handleApplyMigration}
          disabled={loading}
          style={{
            padding: "12px 24px",
            borderRadius: "8px",
            backgroundColor: loading ? "#ccc" : "#ff7433",
            color: "#fff",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "16px",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {loading && <Loader style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />}
          {loading ? "Applying..." : "Apply Migration"}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
