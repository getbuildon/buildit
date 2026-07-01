"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { User, Mail, Lock, Save, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/context/AuthContextSupabase"
import { updateEmailClient, updatePasswordClient } from "@/lib/auth/clientAuth"
import { updateProfileData, getProfileData } from "@/app/[projectId]/perfil/actions"

type FeedbackState = { type: "success" | "error"; message: string } | null

export default function PerfilStandalonePage() {
  const { user, refreshSession } = useAuth()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileFeedback, setProfileFeedback] = useState<FeedbackState>(null)

  const [email, setEmail] = useState(user?.email ?? "")
  const [emailTouched, setEmailTouched] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailFeedback, setEmailFeedback] = useState<FeedbackState>(null)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordFeedback, setPasswordFeedback] = useState<FeedbackState>(null)

  useEffect(() => {
    if (!user?.id) return
    getProfileData().then((data) => {
      if (data) {
        setFirstName(data.first_name)
        setLastName(data.last_name)
        setPhone(data.phone || "")
        setEmail(data.email)
      }
    })
  }, [user?.id])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileFeedback(null)
    if (!firstName.trim() || !lastName.trim()) {
      setProfileFeedback({ type: "error", message: "El nombre y apellido son obligatorios." })
      return
    }
    setProfileLoading(true)
    const result = await updateProfileData(firstName, lastName, phone || null)
    setProfileLoading(false)
    setProfileFeedback(result.ok
      ? { type: "success", message: "Perfil actualizado correctamente." }
      : { type: "error", message: result.error }
    )
  }

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailFeedback(null)
    const trimmed = email.trim()
    if (!trimmed) {
      setEmailFeedback({ type: "error", message: "Ingresá un correo válido." })
      return
    }
    if (trimmed === user?.email) {
      setEmailFeedback({ type: "error", message: "El correo es igual al actual." })
      return
    }
    setEmailLoading(true)
    const result = await updateEmailClient(trimmed)
    setEmailLoading(false)
    if (result.error) {
      setEmailFeedback({ type: "error", message: result.error })
    } else {
      setEmailFeedback({ type: "success", message: "Te enviamos un correo de confirmación. El cambio se aplicará cuando lo confirmes." })
    }
  }

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPasswordFeedback(null)
    const form = e.currentTarget
    const data = new FormData(form)
    const currentPwd = (data.get("current-password") as string | null)?.trim() ?? ""
    const newPwd = (data.get("new-password") as string | null) ?? ""
    const confirmPwd = (data.get("confirm-password") as string | null) ?? ""
    if (!currentPwd) {
      setPasswordFeedback({ type: "error", message: "Ingresá tu contraseña actual." })
      return
    }
    if (newPwd.length < 8) {
      setPasswordFeedback({ type: "error", message: "La nueva contraseña debe tener al menos 8 caracteres." })
      return
    }
    if (newPwd !== confirmPwd) {
      setPasswordFeedback({ type: "error", message: "Las contraseñas no coinciden." })
      return
    }
    setPasswordLoading(true)
    const result = await updatePasswordClient(newPwd)
    setPasswordLoading(false)
    if (result.error) {
      setPasswordFeedback({ type: "error", message: result.error })
    } else {
      setPasswordFeedback({ type: "success", message: "Contraseña actualizada correctamente." })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      await refreshSession()
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: "747px", width: "100%", margin: "0 auto" }}>
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
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <h1 style={{ fontSize: "24px", fontWeight: 400, lineHeight: "32px", color: "#272a2d", fontFamily: "var(--font-recoleta, serif)", margin: 0 }}>
              Mi Perfil
            </h1>
            <p style={{ fontSize: "14px", fontWeight: 400, color: "#272a2d", lineHeight: "20px", margin: 0 }}>
              Administra tu información personal y credenciales
            </p>
          </div>
        </header>

        <div className="flex flex-col" style={{ gap: "16px" }}>
          {/* Información Personal */}
          <form onSubmit={handleSaveProfile} style={cardStyle}>
            <div className="flex items-center" style={{ gap: "8px" }}>
              <User aria-hidden style={{ width: "16px", height: "16px", color: "#ff7433", strokeWidth: 1.5, flexShrink: 0 }} />
              <h2 style={sectionTitle}>Información Personal</h2>
            </div>
            <div className="grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
              <Field label="Nombre" id="firstName" value={firstName} onChange={(v) => { setFirstName(v); setProfileFeedback(null) }} disabled={profileLoading} />
              <Field label="Apellido" id="lastName" value={lastName} onChange={(v) => { setLastName(v); setProfileFeedback(null) }} disabled={profileLoading} />
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Teléfono" id="phone" type="tel" placeholder="+54 9 1234 567890" value={phone} onChange={(v) => { setPhone(v); setProfileFeedback(null) }} disabled={profileLoading} />
              </div>
            </div>
            {profileFeedback && <Feedback state={profileFeedback} />}
            <SaveButton loading={profileLoading} label="Guardar Cambios" />
          </form>

          {/* Correo */}
          <form onSubmit={handleSaveEmail} style={cardStyle}>
            <div className="flex items-center" style={{ gap: "8px" }}>
              <Mail aria-hidden style={{ width: "16px", height: "16px", color: "#ff7433", strokeWidth: 1.5, flexShrink: 0 }} />
              <h2 style={sectionTitle}>Correo Electrónico</h2>
            </div>
            <Field label="Correo Electrónico" id="email" type="email" value={email} onChange={(v) => { setEmail(v); setEmailTouched(true); setEmailFeedback(null) }} disabled={emailLoading} />
            {emailFeedback && <Feedback state={emailFeedback} />}
            <SaveButton loading={emailLoading} label="Guardar Correo" />
          </form>

          {/* Contraseña */}
          <form onSubmit={handleChangePassword} style={cardStyle}>
            <div className="flex items-center" style={{ gap: "8px" }}>
              <Lock aria-hidden style={{ width: "16px", height: "16px", color: "#ff7433", strokeWidth: 1.5, flexShrink: 0 }} />
              <h2 style={sectionTitle}>Cambiar Contraseña</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <PasswordField id="current-password" name="current-password" autoComplete="current-password" label="Contraseña Actual *" value={currentPassword} onChange={(v) => { setCurrentPassword(v); setPasswordFeedback(null) }} disabled={passwordLoading} />
              <div>
                <PasswordField id="new-password" name="new-password" autoComplete="new-password" label="Nueva Contraseña *" value={newPassword} onChange={(v) => { setNewPassword(v); setPasswordFeedback(null) }} disabled={passwordLoading} />
                <p style={{ fontSize: "10px", color: "#777b84", margin: "4px 0 0" }}>Mínimo 8 caracteres</p>
              </div>
              <PasswordField id="confirm-password" name="confirm-password" autoComplete="new-password" label="Confirmar Nueva Contraseña *" value={confirmPassword} onChange={(v) => { setConfirmPassword(v); setPasswordFeedback(null) }} disabled={passwordLoading} />
            </div>
            {passwordFeedback && <Feedback state={passwordFeedback} />}
            <SaveButton loading={passwordLoading} label="Cambiar Contraseña" icon={<Lock style={{ width: "16px", height: "16px", strokeWidth: 1.5 }} />} />
          </form>
        </div>
      </div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  border: "1px solid #edeef0",
  padding: "21px",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
}

const sectionTitle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 400,
  color: "#272a2d",
  lineHeight: "24px",
  margin: 0,
}

function Field({ label, id, value, onChange, disabled, type = "text", placeholder }: {
  label: string; id: string; value: string; onChange: (v: string) => void
  disabled?: boolean; type?: string; placeholder?: string
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label htmlFor={id} style={{ fontSize: "12px", fontWeight: 400, color: "#43484e" }}>{label}</label>
      <input
        id={id} type={type} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} disabled={disabled}
        style={{ width: "100%", height: "42px", padding: "10px 12px", borderRadius: "10px", border: "1px solid #e2e8f0", backgroundColor: disabled ? "#f1f5f9" : "#f8fafc", fontSize: "14px", color: "#0a0a0a", outline: "none", boxSizing: "border-box", opacity: disabled ? 0.7 : 1 }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "#ff7433" }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0" }}
      />
    </div>
  )
}

function SaveButton({ loading, label, icon }: { loading: boolean; label: string; icon?: React.ReactNode }) {
  return (
    <button type="submit" disabled={loading} style={{ alignSelf: "flex-start", height: "44px", padding: "12px 16px", borderRadius: "10px", border: "none", backgroundColor: "#ff7433", color: "#ffffff", fontSize: "14px", fontWeight: 400, gap: "8px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center" }}>
      {icon ?? <Save style={{ width: "16px", height: "16px", strokeWidth: 1.5 }} />}
      {loading ? "Guardando..." : label}
    </button>
  )
}

function Feedback({ state }: { state: { type: "success" | "error"; message: string } }) {
  const ok = state.type === "success"
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "10px 12px", borderRadius: "10px", backgroundColor: ok ? "#f0fdf4" : "#fff1f0", border: `1px solid ${ok ? "#bbf7d0" : "#fecaca"}` }}>
      {ok
        ? <CheckCircle style={{ width: "16px", height: "16px", color: "#16a34a", flexShrink: 0, marginTop: "2px" }} />
        : <AlertCircle style={{ width: "16px", height: "16px", color: "#dc2626", flexShrink: 0, marginTop: "2px" }} />}
      <p style={{ fontSize: "13px", color: ok ? "#15803d" : "#b91c1c", lineHeight: "18px", margin: 0 }}>{state.message}</p>
    </div>
  )
}

function PasswordField({ id, name, autoComplete, label, value, onChange, disabled }: {
  id: string; name?: string; autoComplete?: string; label: string
  value: string; onChange: (v: string) => void; disabled?: boolean
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label htmlFor={id} style={{ fontSize: "12px", fontWeight: 400, color: "#43484e" }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input id={id} name={name} autoComplete={autoComplete} type={visible ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder="••••••••"
          style={{ width: "100%", height: "42px", padding: "10px 40px 10px 12px", borderRadius: "10px", border: "1px solid #e2e8f0", backgroundColor: disabled ? "#f1f5f9" : "#f8fafc", fontSize: "14px", color: "#0a0a0a", outline: "none", boxSizing: "border-box", opacity: disabled ? 0.7 : 1 }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "#ff7433" }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0" }}
        />
        <button type="button" onClick={() => setVisible((v) => !v)} disabled={disabled}
          style={{ position: "absolute", top: "50%", right: "8px", transform: "translateY(-50%)", width: "28px", height: "28px", padding: 0, background: "none", border: "none", cursor: disabled ? "not-allowed" : "pointer", color: "#777b84", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {visible ? <EyeOff style={{ width: "16px", height: "16px" }} /> : <Eye style={{ width: "16px", height: "16px" }} />}
        </button>
      </div>
    </div>
  )
}
