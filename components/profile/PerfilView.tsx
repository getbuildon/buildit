"use client"

import Image from "next/image"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle, Eye, EyeOff, Lock, Mail, User } from "lucide-react"
import { BackButton } from "@/components/ui/BackButton"
import { useAuth } from "@/context/AuthContextSupabase"
import { updateEmailClient, updatePasswordClient } from "@/lib/auth/clientAuth"
import {
  compressProfileAvatar,
  uploadProfileAvatar,
} from "@/lib/profile/profileAvatar.client"
import { updateProfileData, getProfileData } from "@/app/[projectId]/perfil/actions"

type FeedbackState = { type: "success" | "error"; message: string } | null

type PerfilViewProps = {
  projectId?: string
  showBackButton?: boolean
}

const CARD_CLASS =
  "flex flex-col gap-4 rounded-[16px] border border-[#edeef0] bg-white p-[21px] shadow-[0_0_5px_rgba(243,103,31,0.08)]"

const PERSONAL_INPUT_CLASS =
  "h-[42px] w-full rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[14px] font-normal leading-5 text-[#314158] outline-none focus:border-[#ff7433] disabled:opacity-70"

const DEFAULT_INPUT_CLASS =
  "h-[42px] w-full rounded-[10px] border border-[#e2e8f0] bg-white px-3 text-[14px] font-normal leading-5 text-[#272a2d] outline-none focus:border-[#ff7433] disabled:opacity-70"

function getInitials(firstName: string, lastName: string, email?: string | null): string {
  const first = firstName.trim().charAt(0)
  const last = lastName.trim().charAt(0)
  if (first || last) return `${first}${last}`.toUpperCase()
  const local = email?.split("@")[0]?.trim()
  return local ? local.slice(0, 2).toUpperCase() : "U"
}

function SectionHeading({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 py-px">
      {icon}
      <h2 className="text-[18px] font-normal leading-[1.05] tracking-[0.36px] text-[#272a2d]">
        {title}
      </h2>
    </div>
  )
}

function SaveCheckIcon() {
  return (
    <Image
      src="/profile/save-check-icon.svg"
      alt=""
      width={16}
      height={16}
      className="size-4 shrink-0"
      aria-hidden
    />
  )
}

function BrandSaveButton({
  loading,
  loadingLabel,
  label,
  type = "submit",
  onClick,
}: {
  loading: boolean
  loadingLabel: string
  label: string
  type?: "submit" | "button"
  onClick?: () => void
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className="inline-flex h-[44px] items-center gap-2 self-start rounded-[10px] bg-[#ff7433] px-4 py-3 text-[14px] font-normal leading-[1.4] text-white shadow-[0_0_5px_rgba(243,103,31,0.08)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <SaveCheckIcon />
      {loading ? loadingLabel : label}
    </button>
  )
}

export function PerfilView({ projectId, showBackButton = false }: PerfilViewProps) {
  const router = useRouter()
  const { user, refreshSession } = useAuth()
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [roleBadge, setRoleBadge] = useState<string | null>(null)
  const [roleLabel, setRoleLabel] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [profileFeedback, setProfileFeedback] = useState<FeedbackState>(null)
  const [avatarFeedback, setAvatarFeedback] = useState<FeedbackState>(null)

  const [email, setEmail] = useState(user?.email ?? "")
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailFeedback, setEmailFeedback] = useState<FeedbackState>(null)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordFeedback, setPasswordFeedback] = useState<FeedbackState>(null)

  useEffect(() => {
    if (!user?.id) return
    void getProfileData(projectId).then((data) => {
      if (!data) return
      setFirstName(data.first_name)
      setLastName(data.last_name)
      setPhone(data.phone || "")
      setEmail(data.email)
      setAvatarUrl(data.avatar_url)
      setRoleBadge(data.role_badge)
      setRoleLabel(data.role_label)
    })
  }, [user?.id, projectId])

  const fullName =
    [firstName.trim(), lastName.trim()].filter(Boolean).join(" ") ||
    user?.email?.split("@")[0] ||
    "Usuario"

  const handleAvatarSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file || !user?.id) return

    setAvatarFeedback(null)
    setAvatarLoading(true)

    try {
      const compressed = await compressProfileAvatar(file)
      const result = await uploadProfileAvatar(user.id, compressed)
      if (!result.ok) {
        setAvatarFeedback({ type: "error", message: result.error })
        return
      }
      setAvatarUrl(result.publicUrl)
      setAvatarFeedback({ type: "success", message: "Avatar actualizado correctamente." })
      router.refresh()
    } catch (error) {
      setAvatarFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "No se pudo subir la imagen.",
      })
    } finally {
      setAvatarLoading(false)
    }
  }

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault()
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
      router.refresh()
    } else {
      setProfileFeedback({ type: "error", message: result.error })
    }
  }

  const handleSaveEmail = async (event: React.FormEvent) => {
    event.preventDefault()
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
        message:
          "Te enviamos un correo de confirmación. El cambio se aplicará cuando lo confirmes.",
      })
    }
  }

  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordFeedback(null)

    const form = event.currentTarget
    const data = new FormData(form)
    const currentPwd = (data.get("current-password") as string | null)?.trim() ?? ""
    const newPwd = (data.get("new-password") as string | null) ?? ""
    const confirmPwd = (data.get("confirm-password") as string | null) ?? ""

    if (!currentPwd) {
      setPasswordFeedback({ type: "error", message: "Ingresá tu contraseña actual." })
      return
    }
    if (newPwd.length < 8) {
      setPasswordFeedback({
        type: "error",
        message: "La nueva contraseña debe tener al menos 8 caracteres.",
      })
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
    <div className="mx-auto w-full max-w-[720px]">
      {showBackButton ? (
        <header className="mb-6 flex flex-col gap-4">
          <BackButton href="/home" />
        </header>
      ) : null}

      <div className="mb-[22px] flex flex-col gap-0.5">
        <h1 className="font-recoleta text-[24px] font-normal leading-[1.05] text-[#272a2d]">
          Mi Perfil
        </h1>
        <p className="text-[14px] font-normal leading-[1.4] text-[#272a2d]">
          Administra tu información personal y credenciales
        </p>
      </div>

      <div className="flex flex-col gap-[22px]">
        <form onSubmit={handleSaveProfile} className={CARD_CLASS}>
          <SectionHeading
            icon={
              <User
                aria-hidden
                className="size-4 shrink-0 text-[#ff7433]"
                strokeWidth={1.5}
              />
            }
            title="Información Personal"
          />

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarLoading}
              className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#ff7433] transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
              aria-label="Cambiar foto de perfil"
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="64px"
                  unoptimized
                />
              ) : (
                <span className="text-[20px] font-semibold leading-7 tracking-[-0.45px] text-white">
                  {getInitials(firstName, lastName, user?.email)}
                </span>
              )}
              {avatarLoading ? (
                <span className="absolute inset-0 flex items-center justify-center bg-[#ff7433]/80 text-[11px] font-medium text-white">
                  …
                </span>
              ) : null}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarSelect}
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-medium leading-[1.4] text-[#1d293d]">
                {fullName}
              </p>
              <p className="truncate text-[14px] font-normal leading-[1.4] text-[#272a2d]">
                {user?.email ?? email}
              </p>
              {roleBadge || roleLabel ? (
                <div className="mt-1 flex items-center gap-1.5">
                  {roleBadge ? (
                    <span className="rounded-[12px] bg-[#ffeae0] px-2 py-1 text-[10px] font-medium leading-none tracking-[-0.5px] text-[#321a10]">
                      {roleBadge}
                    </span>
                  ) : null}
                  {roleLabel ? (
                    <span className="text-[12px] font-normal leading-[1.4] tracking-[-0.36px] text-[#321a10]">
                      {roleLabel}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="firstName" className="text-[12px] leading-[1.4] tracking-[-0.36px] text-[#43484e]">
                Nombre
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(event) => {
                  setFirstName(event.target.value)
                  setProfileFeedback(null)
                }}
                disabled={profileLoading}
                className={PERSONAL_INPUT_CLASS}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="lastName" className="text-[12px] leading-[1.4] tracking-[-0.36px] text-[#43484e]">
                Apellido
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(event) => {
                  setLastName(event.target.value)
                  setProfileFeedback(null)
                }}
                disabled={profileLoading}
                className={PERSONAL_INPUT_CLASS}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="phone" className="text-[12px] leading-[1.4] tracking-[-0.36px] text-[#43484e]">
              Teléfono
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value)
                setProfileFeedback(null)
              }}
              disabled={profileLoading}
              placeholder="+54 9 1234 567890"
              className={PERSONAL_INPUT_CLASS}
            />
          </div>

          {avatarFeedback ? <Feedback state={avatarFeedback} /> : null}
          {profileFeedback ? <Feedback state={profileFeedback} /> : null}

          <BrandSaveButton
            loading={profileLoading}
            loadingLabel="Guardando..."
            label="Guardar Cambios"
          />
        </form>

        <form onSubmit={handleSaveEmail} className={CARD_CLASS}>
          <SectionHeading
            icon={
              <Mail
                aria-hidden
                className="size-4 shrink-0 text-[#ff7433]"
                strokeWidth={1.5}
              />
            }
            title="Correo Electrónico"
          />

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-[12px] leading-[1.4] tracking-[-0.36px] text-[#43484e]">
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setEmailFeedback(null)
              }}
              disabled={emailLoading}
              className={DEFAULT_INPUT_CLASS}
            />
          </div>

          {emailFeedback ? <Feedback state={emailFeedback} /> : null}

          <BrandSaveButton
            loading={emailLoading}
            loadingLabel="Guardando..."
            label="Guardar Correo"
          />
        </form>

        <form onSubmit={handleChangePassword} className={CARD_CLASS}>
          <SectionHeading
            icon={
              <Lock
                aria-hidden
                className="size-4 shrink-0 text-[#ff7433]"
                strokeWidth={1.5}
              />
            }
            title="Cambiar Contraseña"
          />

          <div className="flex flex-col gap-3">
            <PasswordField
              id="current-password"
              name="current-password"
              autoComplete="current-password"
              label="Contraseña Actual *"
              value={currentPassword}
              onChange={(value) => {
                setCurrentPassword(value)
                setPasswordFeedback(null)
              }}
              disabled={passwordLoading}
            />
            <div className="flex flex-col gap-1">
              <PasswordField
                id="new-password"
                name="new-password"
                autoComplete="new-password"
                label="Nueva Contraseña *"
                value={newPassword}
                onChange={(value) => {
                  setNewPassword(value)
                  setPasswordFeedback(null)
                }}
                disabled={passwordLoading}
              />
              <p className="text-[10px] font-normal leading-[1.4] tracking-[-0.5px] text-[#777b84]">
                Mínimo 8 caracteres
              </p>
            </div>
            <PasswordField
              id="confirm-password"
              name="confirm-password"
              autoComplete="new-password"
              label="Confirmar Nueva Contraseña *"
              value={confirmPassword}
              onChange={(value) => {
                setConfirmPassword(value)
                setPasswordFeedback(null)
              }}
              disabled={passwordLoading}
            />
          </div>

          {passwordFeedback ? <Feedback state={passwordFeedback} /> : null}

          <BrandSaveButton
            loading={passwordLoading}
            loadingLabel="Actualizando..."
            label="Cambiar Contraseña"
          />
        </form>
      </div>
    </div>
  )
}

function Feedback({ state }: { state: { type: "success" | "error"; message: string } }) {
  const isSuccess = state.type === "success"
  return (
    <div
      className="flex items-start gap-2 rounded-[10px] border px-3 py-2.5"
      style={{
        backgroundColor: isSuccess ? "#f0fdf4" : "#fff1f0",
        borderColor: isSuccess ? "#bbf7d0" : "#fecaca",
      }}
    >
      {isSuccess ? (
        <CheckCircle
          aria-hidden
          className="mt-0.5 size-4 shrink-0 text-[#16a34a]"
        />
      ) : (
        <AlertCircle
          aria-hidden
          className="mt-0.5 size-4 shrink-0 text-[#dc2626]"
        />
      )}
      <p
        className="text-[13px] leading-[18px]"
        style={{ color: isSuccess ? "#15803d" : "#b91c1c" }}
      >
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
  onChange: (value: string) => void
  disabled?: boolean
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[12px] leading-[1.4] tracking-[-0.36px] text-[#43484e]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          autoComplete={autoComplete}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          placeholder="••••••••"
          className={`${DEFAULT_INPUT_CLASS} pr-10`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center text-[#777b84] transition-opacity hover:opacity-70 disabled:cursor-not-allowed"
        >
          {visible ? (
            <EyeOff aria-hidden className="size-4" strokeWidth={1.5} />
          ) : (
            <Eye aria-hidden className="size-4" strokeWidth={1.5} />
          )}
        </button>
      </div>
    </div>
  )
}
