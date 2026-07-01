"use client"

import { useEffect, useState } from "react"
import { Users, AlertCircle, CheckCircle, Trash2 } from "lucide-react"
import { getCompanyMembers, updateMemberRole, removeMember, type CompanyMember } from "./actions"

type Feedback = { type: "success" | "error"; message: string } | null

export default function CompanyMembersPage({ params }: { params: { companyId: string } }) {
  const [members, setMembers] = useState<CompanyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  useEffect(() => {
    const loadMembers = async () => {
      const result = await getCompanyMembers(params.companyId)
      if (result.ok) {
        setMembers(result.members)
      } else {
        setFeedback({ type: "error", message: result.error })
      }
      setLoading(false)
    }
    loadMembers()
  }, [params.companyId])

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setActionInProgress(memberId)
    const result = await updateMemberRole(params.companyId, memberId, newRole as any)

    if (result.ok) {
      setMembers(members.map((m) => (m.id === memberId ? { ...m, role: newRole as any } : m)))
      setFeedback({ type: "success", message: "Rol actualizado correctamente." })
    } else {
      setFeedback({ type: "error", message: result.error })
    }
    setActionInProgress(null)
  }

  const handleRemove = async (memberId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este miembro?")) return

    setActionInProgress(memberId)
    const result = await removeMember(params.companyId, memberId)

    if (result.ok) {
      setMembers(members.filter((m) => m.id !== memberId))
      setFeedback({ type: "success", message: "Miembro eliminado correctamente." })
    } else {
      setFeedback({ type: "error", message: result.error })
    }
    setActionInProgress(null)
  }

  if (loading) {
    return <div className="p-6">Cargando...</div>
  }

  const roleColors: Record<string, { bg: string; text: string }> = {
    owner: { bg: "#fff1f0", text: "#dc2626" },
    admin: { bg: "#fff7ed", text: "#ea580c" },
    billing: { bg: "#fef3c7", text: "#b45309" },
    member: { bg: "#f0fdf4", text: "#16a34a" },
  }

  return (
    <div
      style={{
        maxWidth: "747px",
        width: "100%",
        margin: "0 auto",
      }}
    >
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-orange-500" />
          <h1 className="font-recoleta text-2xl font-normal text-gray-900">Miembros de la Empresa</h1>
        </div>
        <p className="text-sm text-gray-600 mt-1">Gestiona los miembros y sus roles</p>
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
            marginBottom: "16px",
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

      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #edeef0",
          overflow: "hidden",
        }}
      >
        {members.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", color: "#777b84" }}>
            No hay miembros en esta empresa aún.
          </div>
        ) : (
          <div>
            {members.map((member, index) => {
              const colors = roleColors[member.role] || roleColors.member
              return (
                <div
                  key={member.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 21px",
                    borderBottom: index < members.length - 1 ? "1px solid #edeef0" : "none",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 500, color: "#1d293d", marginBottom: "4px" }}>
                      {member.email}
                    </div>
                    <div style={{ fontSize: "12px", color: "#777b84" }}>
                      Se unió el {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : "N/A"}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      disabled={actionInProgress === member.id}
                      style={{
                        padding: "6px 8px",
                        borderRadius: "6px",
                        border: "1px solid #e2e8f0",
                        backgroundColor: colors.bg,
                        color: colors.text,
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: actionInProgress === member.id ? "not-allowed" : "pointer",
                        opacity: actionInProgress === member.id ? 0.7 : 1,
                      }}
                    >
                      <option value="owner">Propietario</option>
                      <option value="admin">Administrador</option>
                      <option value="billing">Facturación</option>
                      <option value="member">Miembro</option>
                    </select>

                    <button
                      onClick={() => handleRemove(member.id)}
                      disabled={actionInProgress === member.id}
                      style={{
                        padding: "6px 8px",
                        borderRadius: "6px",
                        border: "1px solid #fecaca",
                        backgroundColor: "#fff1f0",
                        color: "#dc2626",
                        cursor: actionInProgress === member.id ? "not-allowed" : "pointer",
                        opacity: actionInProgress === member.id ? 0.7 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Trash2 style={{ width: "14px", height: "14px" }} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ marginTop: "24px", padding: "16px", backgroundColor: "#f0fdf4", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
        <p style={{ fontSize: "13px", fontWeight: 500, color: "#15803d", margin: "0 0 8px 0" }}>
          💡 Roles disponibles
        </p>
        <ul style={{ fontSize: "12px", color: "#166534", margin: 0, paddingLeft: "20px" }}>
          <li><strong>Propietario:</strong> Acceso completo a la empresa y sus proyectos</li>
          <li><strong>Administrador:</strong> Gestiona usuarios, proyectos y configuración</li>
          <li><strong>Facturación:</strong> Acceso a la facturación y pagos</li>
          <li><strong>Miembro:</strong> Acceso de lectura a los datos de la empresa</li>
        </ul>
      </div>
    </div>
  )
}
