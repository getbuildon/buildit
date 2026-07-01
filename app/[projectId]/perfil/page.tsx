"use client"

import { useEffect, useState } from "react"
import { User, Mail, Lock, Save, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/context/AuthContextSupabase"
import { userProfileFromEmail } from "@/lib/projects/mockProjects"
import { updateEmailClient, updatePasswordClient } from "@/lib/auth/clientAuth"
import { updateProfileData, getProfileData } from "./actions"

type FeedbackState = { type: "success" | "error"; message: string } | null

export default function PerfilPage() {
  const { user, refreshSession } = useAuth()
  const profile = userProfileFromEmail(user?.email)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileFeedback, setProfileFeedback] = useState<FeedbackState>(null)

  const [email, setEmail] = useState(user?.email ?? "")
  const [emailTouched, setEmailTouched] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailFeedback, setEmailFeedback] = useState<FeedbackState>(null)

  // Cargar datos del perfil
  useEffect(() => {
    if (!user?.id) return
    const loadProfile = async () => {
      const data = await getProfileData()
      if (data) {
        setFirstName(data.first_name)
        setLastName(data.last_name)
        setPhone(data.phone || "")
        setEmail(data.email)
      }
    }
    loadProfile()
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

    if (result.ok) {
      setProfileFeedback({ type: "success", message: "Perfil actualizado correctamente." })
    } else {
      setProfileFeedback({ type: "error", message: result.error })
    }
  }

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordFeedback, setPasswordFeedback] = useState<FeedbackState>(null)

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
      setEmailFeedback({
        type: "success",
        message: "Te enviamos un correo de confirmación. El cambio se aplicará cuando lo confirmes.",
      })
    }
  }

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPasswordFeedback(null)

    // Leemos los valores reales del DOM: si el navegador o un gestor de
    // contraseñas autocompleta los campos, no siempre dispara el onChange de
    // React y el estado quedaría desincronizado con lo que se ve en pantalla.
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
        maxWidth: "747px",
        width: "100%",
        margin: "0 auto",
      }}
    >

      {/* Page header */}
      <div className="mb-6" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 400,
            lineHeight: "32px",
            color: "#272a2d",
            fontFamily: "var(--font-recoleta, serif)",
            margin: 0,
          }}
        >
          Mi Perfil
        </h1>
        <p style={{ fontSize: "14px", fontWeight: 400, color: "#272a2d", lineHeight: "20px", margin: 0 }}>
          Administra tu información personal y credenciales
        </p>
      </div>

      <div className="flex flex-col" style={{ gap: "16px" }}>

        {/* Card: Información Personal */}
        <form
          onSubmit={handleSaveProfile}
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
          <div className="flex items-center" style={{ gap: "8px" }}>
            <User aria-hidden style={{ width: "16px", height: "16px", color: "#ff7433", strokeWidth: 1.5, flexShrink: 0 }} />
            <h2 style={{ fontSize: "18px", fontWeight: 400, color: "#272a2d", lineHeight: "24px", margin: 0 }}>
              Información Personal
            </h2>
          </div>

          {/* Editable fields grid */}
          <div className="grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label htmlFor="firstName" style={{ fontSize: "12px", fontWeight: 400, color: "#43484e", lineHeight: "16px" }}>
                Nombre
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); setProfileFeedback(null) }}
                disabled={profileLoading}
                style={{
                  width: "100%",
                  height: "42px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: profileLoading ? "#f1f5f9" : "#f8fafc",
                  fontSize: "14px",
                  fontWeight: 400,
                  color: "#0a0a0a",
                  lineHeight: "20px",
                  outline: "none",
                  boxSizing: "border-box",
                  opacity: profileLoading ? 0.7 : 1,
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#ff7433" }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label htmlFor="lastName" style={{ fontSize: "12px", fontWeight: 400, color: "#43484e", lineHeight: "16px" }}>
                Apellido
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); setProfileFeedback(null) }}
                disabled={profileLoading}
                style={{
                  width: "100%",
                  height: "42px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: profileLoading ? "#f1f5f9" : "#f8fafc",
                  fontSize: "14px",
                  fontWeight: 400,
                  color: "#0a0a0a",
                  lineHeight: "20px",
                  outline: "none",
                  boxSizing: "border-box",
                  opacity: profileLoading ? 0.7 : 1,
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#ff7433" }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0" }}
              />
            </div>
            <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "4px" }}>
              <label htmlFor="phone" style={{ fontSize: "12px", fontWeight: 400, color: "#43484e", lineHeight: "16px" }}>
                Teléfono
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setProfileFeedback(null) }}
                disabled={profileLoading}
                placeholder="+54 9 1234 567890"
                style={{
                  width: "100%",
                  height: "42px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: profileLoading ? "#f1f5f9" : "#f8fafc",
                  fontSize: "14px",
                  fontWeight: 400,
                  color: "#0a0a0a",
                  lineHeight: "20px",
                  outline: "none",
                  boxSizing: "border-box",
                  opacity: profileLoading ? 0.7 : 1,
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#ff7433" }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0" }}
              />
            </div>
          </div>

          {profileFeedback && <Feedback state={profileFeedback} />}

          <button
            type="submit"
            disabled={profileLoading}
            className="flex items-center transition-opacity hover:opacity-90"
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
              cursor: profileLoading ? "not-allowed" : "pointer",
              opacity: profileLoading ? 0.7 : 1,
            }}
          >
            <Save aria-hidden style={{ width: "16px", height: "16px", strokeWidth: 1.5 }} />
            {profileLoading ? "Guardando..." : "Guardar Cambios"}
          </button>
        </form>

        {/* Card: Correo Electrónico */}
        <form
          onSubmit={handleSaveEmail}
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
          <div className="flex items-center" style={{ gap: "8px" }}>
            <Mail aria-hidden style={{ width: "16px", height: "16px", color: "#ff7433", strokeWidth: 1.5, flexShrink: 0 }} />
            <h2 style={{ fontSize: "18px", fontWeight: 400, color: "#272a2d", lineHeight: "24px", margin: 0 }}>
              Correo Electrónico
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label htmlFor="email" style={{ fontSize: "12px", fontWeight: 400, color: "#43484e", lineHeight: "16px" }}>
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailTouched(true); setEmailFeedback(null) }}
                disabled={emailLoading}
                style={{
                  width: "100%",
                  height: "42px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: emailLoading ? "#f1f5f9" : "#f8fafc",
                  fontSize: "14px",
                  fontWeight: 400,
                  color: "#0a0a0a",
                  lineHeight: "20px",
                  outline: "none",
                  boxSizing: "border-box",
                  opacity: emailLoading ? 0.7 : 1,
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#ff7433" }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0" }}
              />
            </div>

            {emailFeedback && <Feedback state={emailFeedback} />}

            <button
              type="submit"
              disabled={emailLoading}
              className="flex items-center transition-opacity hover:opacity-90"
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
                cursor: emailLoading ? "not-allowed" : "pointer",
                opacity: emailLoading ? 0.7 : 1,
              }}
            >
              <Save aria-hidden style={{ width: "16px", height: "16px", strokeWidth: 1.5 }} />
              {emailLoading ? "Guardando..." : "Guardar Correo"}
            </button>
          </div>
        </form>

        {/* Card: Cambiar Contraseña */}
        <form
          onSubmit={handleChangePassword}
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
          <div className="flex items-center" style={{ gap: "8px" }}>
            <Lock aria-hidden style={{ width: "16px", height: "16px", color: "#ff7433", strokeWidth: 1.5, flexShrink: 0 }} />
            <h2 style={{ fontSize: "18px", fontWeight: 400, color: "#272a2d", lineHeight: "24px", margin: 0 }}>
              Cambiar Contraseña
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <PasswordField
              id="current-password"
              name="current-password"
              autoComplete="current-password"
              label="Contraseña Actual *"
              value={currentPassword}
              onChange={(v) => { setCurrentPassword(v); setPasswordFeedback(null) }}
              disabled={passwordLoading}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <PasswordField
                id="new-password"
                name="new-password"
                autoComplete="new-password"
                label="Nueva Contraseña *"
                value={newPassword}
                onChange={(v) => { setNewPassword(v); setPasswordFeedback(null) }}
                disabled={passwordLoading}
              />
              <p style={{ fontSize: "10px", fontWeight: 400, color: "#777b84", lineHeight: "14px", margin: "4px 0 0" }}>
                Mínimo 8 caracteres
              </p>
            </div>
            <PasswordField
              id="confirm-password"
              name="confirm-password"
              autoComplete="new-password"
              label="Confirmar Nueva Contraseña *"
              value={confirmPassword}
              onChange={(v) => { setConfirmPassword(v); setPasswordFeedback(null) }}
              disabled={passwordLoading}
            />

            {passwordFeedback && <Feedback state={passwordFeedback} />}

            <button
              type="submit"
              disabled={passwordLoading}
              className="flex items-center transition-opacity hover:opacity-90"
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
                cursor: passwordLoading ? "not-allowed" : "pointer",
                opacity: passwordLoading ? 0.7 : 1,
                marginTop: "4px",
              }}
            >
              <Lock aria-hidden style={{ width: "16px", height: "16px", strokeWidth: 1.5 }} />
              {passwordLoading ? "Actualizando..." : "Cambiar Contraseña"}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

function Feedback({ state }: { state: { type: "success" | "error"; message: string } }) {
  const isSuccess = state.type === "success"
  return (
    <div
      className="flex items-start"
      style={{
        gap: "8px",
        padding: "10px 12px",
        borderRadius: "10px",
        backgroundColor: isSuccess ? "#f0fdf4" : "#fff1f0",
        border: `1px solid ${isSuccess ? "#bbf7d0" : "#fecaca"}`,
      }}
    >
      {isSuccess
        ? <CheckCircle aria-hidden style={{ width: "16px", height: "16px", color: "#16a34a", flexShrink: 0, marginTop: "2px" }} />
        : <AlertCircle aria-hidden style={{ width: "16px", height: "16px", color: "#dc2626", flexShrink: 0, marginTop: "2px" }} />
      }
      <p style={{ fontSize: "13px", fontWeight: 400, color: isSuccess ? "#15803d" : "#b91c1c", lineHeight: "18px", margin: 0 }}>
        {state.message}
      </p>
    </div>
  )
}

function PasswordField({
  id,
  name,
  autoComplete,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string
  name?: string
  autoComplete?: string
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label htmlFor={id} style={{ fontSize: "12px", fontWeight: 400, color: "#43484e", lineHeight: "16px" }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          name={name}
          autoComplete={autoComplete}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="••••••••"
          style={{
            width: "100%",
            height: "42px",
            padding: "10px 40px 10px 12px",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            backgroundColor: disabled ? "#f1f5f9" : "#f8fafc",
            fontSize: "14px",
            fontWeight: 400,
            color: "#0a0a0a",
            lineHeight: "20px",
            outline: "none",
            boxSizing: "border-box",
            opacity: disabled ? 0.7 : 1,
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "#ff7433" }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0" }}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          title={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="flex items-center justify-center transition-opacity hover:opacity-70"
          style={{
            position: "absolute",
            top: "50%",
            right: "8px",
            transform: "translateY(-50%)",
            width: "28px",
            height: "28px",
            padding: 0,
            background: "none",
            border: "none",
            cursor: disabled ? "not-allowed" : "pointer",
            color: "#777b84",
          }}
        >
          {visible
            ? <EyeOff aria-hidden style={{ width: "16px", height: "16px", strokeWidth: 1.5 }} />
            : <Eye aria-hidden style={{ width: "16px", height: "16px", strokeWidth: 1.5 }} />
          }
        </button>
      </div>
    </div>
  )
}
