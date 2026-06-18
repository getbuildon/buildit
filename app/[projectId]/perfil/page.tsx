"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { User, Mail, Lock, Save } from "lucide-react"
import { useAuth } from "@/context/AuthContextSupabase"
import { userProfileFromEmail } from "@/lib/projects/mockProjects"

export default function PerfilPage() {
  const router = useRouter()
  const { user } = useAuth()
  const profile = userProfileFromEmail(user?.email)

  const [email, setEmail] = useState(user?.email ?? "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: wire to Supabase updateUser
  }

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: wire to Supabase updateUser
  }

  return (
    <div style={{ maxWidth: "747px" }}>

      {/* Back button */}
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-1.5 transition-opacity hover:opacity-70"
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M7.99992 12.6673L3.33325 8.00065L7.99992 3.33398" stroke="#43484E" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12.6666 8H3.33325" stroke="#43484E" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ fontSize: "14px", fontWeight: 500, color: "#43484e", lineHeight: "20px" }}>
          Volver
        </span>
      </button>

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
          <div className="flex items-center" style={{ gap: "8px" }}>
            <User aria-hidden style={{ width: "16px", height: "16px", color: "#ff7433", strokeWidth: 1.5, flexShrink: 0 }} />
            <h2 style={{ fontSize: "18px", fontWeight: 400, color: "#272a2d", lineHeight: "24px", margin: 0 }}>
              Información Personal
            </h2>
          </div>

          {/* Avatar + name/email/badge row */}
          <div className="flex items-center" style={{ gap: "16px" }}>
            <div
              className="flex shrink-0 items-center justify-center"
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "9999px",
                backgroundColor: "#ff7433",
                color: "#ffffff",
                fontSize: "20px",
                fontWeight: 600,
              }}
            >
              {profile.initials}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <p style={{ fontSize: "16px", fontWeight: 500, color: "#1d293d", lineHeight: "22px", margin: 0 }}>
                {profile.fullName}
              </p>
              <p style={{ fontSize: "14px", fontWeight: 400, color: "#272a2d", lineHeight: "20px", margin: 0 }}>
                {user?.email}
              </p>
              <div className="flex items-center" style={{ gap: "6px", marginTop: "2px" }}>
                <span
                  style={{
                    display: "inline-block",
                    backgroundColor: "#ffeae0",
                    borderRadius: "12px",
                    padding: "4px 8px",
                    fontSize: "10px",
                    fontWeight: 500,
                    color: "#321a10",
                    lineHeight: "14px",
                  }}
                >
                  Admin
                </span>
                <span style={{ fontSize: "12px", fontWeight: 400, color: "#321a10", lineHeight: "17px" }}>
                  Administrador
                </span>
              </div>
            </div>
          </div>

          {/* Read-only fields grid */}
          <div className="grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
            <FieldReadOnly label="Nombre Completo" value={profile.fullName} />
            <FieldReadOnly label="Rol" value="Administrador" />
            <FieldReadOnly label="Departamento" value="Administración" />
          </div>
        </div>

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
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  height: "42px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                  fontSize: "14px",
                  fontWeight: 400,
                  color: "#0a0a0a",
                  lineHeight: "20px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#ff7433" }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0" }}
              />
            </div>
            <button
              type="submit"
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
                cursor: "pointer",
              }}
            >
              <Save aria-hidden style={{ width: "16px", height: "16px", strokeWidth: 1.5 }} />
              Guardar Correo
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
              label="Contraseña Actual *"
              value={currentPassword}
              onChange={setCurrentPassword}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <PasswordField
                id="new-password"
                label="Nueva Contraseña *"
                value={newPassword}
                onChange={setNewPassword}
              />
              <p style={{ fontSize: "10px", fontWeight: 400, color: "#777b84", lineHeight: "14px", margin: "4px 0 0" }}>
                Mínimo 8 caracteres
              </p>
            </div>
            <PasswordField
              id="confirm-password"
              label="Confirmar Nueva Contraseña *"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
            <button
              type="submit"
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
                cursor: "pointer",
                marginTop: "4px",
              }}
            >
              <Lock aria-hidden style={{ width: "16px", height: "16px", strokeWidth: 1.5 }} />
              Cambiar Contraseña
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

function FieldReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label style={{ fontSize: "12px", fontWeight: 400, color: "#43484e", lineHeight: "16px" }}>
        {label}
      </label>
      <div
        style={{
          height: "42px",
          padding: "10px 12px",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
          backgroundColor: "#f8fafc",
          fontSize: "14px",
          fontWeight: 400,
          color: "#314158",
          lineHeight: "20px",
          display: "flex",
          alignItems: "center",
          boxSizing: "border-box",
        }}
      >
        {value}
      </div>
    </div>
  )
}

function PasswordField({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label htmlFor={id} style={{ fontSize: "12px", fontWeight: 400, color: "#43484e", lineHeight: "16px" }}>
        {label}
      </label>
      <input
        id={id}
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="••••••••"
        style={{
          width: "100%",
          height: "42px",
          padding: "10px 12px",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
          backgroundColor: "#f8fafc",
          fontSize: "14px",
          fontWeight: 400,
          color: "#0a0a0a",
          lineHeight: "20px",
          outline: "none",
          boxSizing: "border-box",
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "#ff7433" }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0" }}
      />
    </div>
  )
}
