"use client"

import { useEffect, useState, use } from "react"
import { BackButton } from "@/components/ui/BackButton"
import { AlertCircle, CheckCircle, Trash2, Plus, Clock } from "lucide-react"
import { getCompanyMembers, updateMemberRole, removeMember, inviteMember, revokeInvitation, type CompanyMember } from "./actions"

type Feedback = { type: "success" | "error"; message: string } | null

export default function CompanyMembersPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params)
  const [members, setMembers] = useState<CompanyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"member" | "admin" | "billing" | "owner">("member")
  const [inviteLoading, setInviteLoading] = useState(false)

  useEffect(() => {
    const loadMembers = async () => {
      const result = await getCompanyMembers(companyId)
      if (result.ok) {
        setMembers(result.members)
      } else {
        setFeedback({ type: "error", message: result.error })
      }
      setLoading(false)
    }
    loadMembers()
  }, [companyId])

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setActionInProgress(memberId)
    const result = await updateMemberRole(companyId, memberId, newRole as any)

    if (result.ok) {
      setMembers(members.map((m) => (m.id === memberId ? { ...m, role: newRole as any } : m)))
      setFeedback({ type: "success", message: "Rol actualizado correctamente." })
    } else {
      setFeedback({ type: "error", message: result.error })
    }
    setActionInProgress(null)
  }

  const handleRemove = async (memberId: string) => {
    const member = members.find((m) => m.id === memberId)
    const isInvitation = member?.user_id === null
    const message = isInvitation
      ? "¿Estás seguro de que deseas revocar esta invitación?"
      : "¿Estás seguro de que deseas eliminar este miembro?"

    if (!confirm(message)) return

    setActionInProgress(memberId)

    // Si es una invitación pendiente (user_id es null), revocar invitación
    if (isInvitation) {
      const result = await revokeInvitation(companyId, memberId)
      if (result.ok) {
        setMembers(members.filter((m) => m.id !== memberId))
        setFeedback({ type: "success", message: "Invitación revocada correctamente." })
      } else {
        setFeedback({ type: "error", message: result.error })
      }
    } else {
      // Si es miembro activo, eliminarlo
      const result = await removeMember(companyId, memberId)
      if (result.ok) {
        setMembers(members.filter((m) => m.id !== memberId))
        setFeedback({ type: "success", message: "Miembro eliminado correctamente." })
      } else {
        setFeedback({ type: "error", message: result.error })
      }
    }
    setActionInProgress(null)
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)

    if (!inviteEmail.trim()) {
      setFeedback({ type: "error", message: "Ingresá un email válido." })
      return
    }

    setInviteLoading(true)
    const result = await inviteMember(companyId, inviteEmail, inviteRole)
    setInviteLoading(false)

    if (result.ok) {
      setFeedback({ type: "success", message: "Miembro agregado correctamente." })
      setInviteEmail("")
      setInviteRole("member")
      setShowAddForm(false)
      // Recargar la lista de miembros
      const membersResult = await getCompanyMembers(companyId)
      if (membersResult.ok) {
        setMembers(membersResult.members)
      }
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

  const roleColors: Record<string, { bg: string; text: string }> = {
    owner: { bg: "#fff1f0", text: "#dc2626" },
    admin: { bg: "#fff7ed", text: "#ea580c" },
    billing: { bg: "#fef3c7", text: "#b45309" },
    member: { bg: "#f0fdf4", text: "#16a34a" },
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
          <div>
            <h1 className="font-recoleta text-2xl font-normal text-gray-900">Miembros de la Empresa</h1>
            <p className="text-sm text-gray-600 mt-1">Gestiona los miembros y sus roles</p>
          </div>
        </header>

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

      {/* Botón para agregar miembro */}
      {!showAddForm && (
        <div style={{ marginBottom: "16px" }}>
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              borderRadius: "10px",
              backgroundColor: "#ff7433",
              color: "#ffffff",
              border: "none",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.9" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1" }}
          >
            <Plus style={{ width: "16px", height: "16px" }} />
            Agregar Miembro
          </button>
        </div>
      )}

      {/* Formulario para agregar miembro */}
      {showAddForm && (
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #edeef0",
            padding: "21px",
            marginBottom: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
              <label htmlFor="email" style={{ fontSize: "12px", fontWeight: 500, color: "#43484e" }}>
                Email del usuario
              </label>
              <input
                id="email"
                type="email"
                value={inviteEmail}
                onChange={(e) => { setInviteEmail(e.target.value); setFeedback(null) }}
                disabled={inviteLoading}
                placeholder="usuario@example.com"
                style={{
                  width: "100%",
                  height: "42px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: inviteLoading ? "#f1f5f9" : "#f8fafc",
                  fontSize: "14px",
                  color: "#0a0a0a",
                  outline: "none",
                  boxSizing: "border-box",
                  opacity: inviteLoading ? 0.7 : 1,
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#ff7433" }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label htmlFor="role" style={{ fontSize: "12px", fontWeight: 500, color: "#43484e" }}>
                Rol
              </label>
              <select
                id="role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                disabled={inviteLoading}
                style={{
                  height: "42px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: inviteLoading ? "#f1f5f9" : "#f8fafc",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#0a0a0a",
                  outline: "none",
                  cursor: inviteLoading ? "not-allowed" : "pointer",
                  opacity: inviteLoading ? 0.7 : 1,
                  fontFamily: "system-ui, -apple-system, sans-serif",
                }}
              >
                <option value="member">Miembro</option>
                <option value="billing">Facturación</option>
                <option value="admin">Administrador</option>
                <option value="owner">Propietario</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleInvite}
                disabled={inviteLoading}
                style={{
                  height: "42px",
                  padding: "10px 16px",
                  borderRadius: "10px",
                  backgroundColor: "#ff7433",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: inviteLoading ? "not-allowed" : "pointer",
                  opacity: inviteLoading ? 0.7 : 1,
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!inviteLoading) (e.currentTarget as HTMLButtonElement).style.opacity = "0.9"
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = "1"
                }}
              >
                {inviteLoading ? "Agregando..." : "Agregar"}
              </button>

              <button
                onClick={() => { setShowAddForm(false); setInviteEmail(""); setInviteRole("member"); setFeedback(null) }}
                disabled={inviteLoading}
                style={{
                  height: "42px",
                  padding: "10px 16px",
                  borderRadius: "10px",
                  backgroundColor: "#f3f4f6",
                  color: "#6b7280",
                  border: "1px solid #e5e7eb",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: inviteLoading ? "not-allowed" : "pointer",
                  opacity: inviteLoading ? 0.7 : 1,
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!inviteLoading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#e5e7eb"
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#f3f4f6"
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
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
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 500, color: "#1d293d" }}>
                        {member.email}
                      </span>
                      {member.user_id === null && (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 500, color: "#7c3aed", backgroundColor: "#ede9fe", padding: "2px 6px", borderRadius: "4px" }}>
                          <Clock style={{ width: "12px", height: "12px" }} />
                          Invitación pendiente
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: "12px", color: "#777b84" }}>
                      {member.user_id === null
                        ? `Invitado el ${member.joined_at ? new Date(member.joined_at).toLocaleDateString() : "N/A"}`
                        : `Se unió el ${member.joined_at ? new Date(member.joined_at).toLocaleDateString() : "N/A"}`}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {member.user_id !== null && (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        disabled={actionInProgress === member.id}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "10px",
                          border: "1px solid #edeef0",
                          backgroundColor: colors.bg,
                          color: colors.text,
                          fontSize: "13px",
                          fontWeight: 500,
                          fontFamily: "system-ui, -apple-system, sans-serif",
                          cursor: actionInProgress === member.id ? "not-allowed" : "pointer",
                          opacity: actionInProgress === member.id ? 0.6 : 1,
                          transition: "all 0.15s",
                          outline: "none",
                        }}
                        onMouseEnter={(e) => {
                          if (actionInProgress !== member.id) {
                            const sel = e.currentTarget as HTMLSelectElement
                            sel.style.borderColor = "#d1d5db"
                          }
                        }}
                        onMouseLeave={(e) => {
                          const sel = e.currentTarget as HTMLSelectElement
                          sel.style.borderColor = "#edeef0"
                        }}
                      >
                        <option value="owner">Propietario</option>
                        <option value="admin">Administrador</option>
                        <option value="billing">Facturación</option>
                        <option value="member">Miembro</option>
                      </select>
                    )}

                    <button
                      onClick={() => handleRemove(member.id)}
                      disabled={actionInProgress === member.id || (member.user_id !== null && member.role === "owner")}
                      title={
                        member.user_id === null
                          ? "Revocar invitación"
                          : member.role === "owner"
                          ? "No se puede eliminar al propietario"
                          : "Eliminar miembro"
                      }
                      style={{
                        padding: "8px 10px",
                        borderRadius: "10px",
                        border: "1px solid #f3d4d0",
                        backgroundColor: "#fef5f3",
                        color: "#dc2626",
                        cursor: actionInProgress === member.id || (member.user_id !== null && member.role === "owner") ? "not-allowed" : "pointer",
                        opacity: actionInProgress === member.id || (member.user_id !== null && member.role === "owner") ? 0.4 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        if (actionInProgress !== member.id && (member.user_id === null || member.role !== "owner")) {
                          const btn = e.currentTarget as HTMLButtonElement
                          btn.style.backgroundColor = "#fce4e0"
                          btn.style.borderColor = "#f08774"
                        }
                      }}
                      onMouseLeave={(e) => {
                        const btn = e.currentTarget as HTMLButtonElement
                        btn.style.backgroundColor = "#fef5f3"
                        btn.style.borderColor = "#f3d4d0"
                      }}
                    >
                      <Trash2 style={{ width: "16px", height: "16px", strokeWidth: 1.5 }} />
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
    </div>
  )
}
