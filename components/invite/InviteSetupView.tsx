"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Eye, EyeOff, Lock } from "lucide-react"
import { completeInvitationSetup, type InvitationSetupData } from "@/app/invite/setup/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getUserInitials } from "@/lib/profile/userInitials"
import {
  LOGIN_COLORS,
  LOGIN_TYPE,
} from "@/lib/login/designTokens"
import { cn } from "@/lib/utils"

type InviteSetupViewProps = {
  data: InvitationSetupData
}

export function InviteSetupView({ data }: InviteSetupViewProps) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({ password: "", confirmPassword: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const initials = getUserInitials(data.firstName, data.lastName, "")

  const validate = () => {
    const errors = { password: "", confirmPassword: "" }
    let ok = true

    if (!password) {
      errors.password = "La contraseña es requerida"
      ok = false
    } else if (password.length < 8) {
      errors.password = "La contraseña debe tener al menos 8 caracteres"
      ok = false
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Confirmá tu contraseña"
      ok = false
    } else if (confirmPassword !== password) {
      errors.confirmPassword = "Las contraseñas no coinciden"
      ok = false
    }

    setFieldErrors(errors)
    return ok
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    if (!validate()) return

    setLoading(true)
    try {
      const result = await completeInvitationSetup(data.invitationId, password)
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.replace(`/${result.projectId}`)
    } catch {
      setError("No pudimos completar la configuración. Intentá de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const inputClassName = cn(
    "h-[46px] w-full rounded-[10px] border bg-transparent pl-10 pr-10 shadow-none",
    LOGIN_TYPE.fieldInput,
    "focus-visible:border-[#e2e8f0] focus-visible:ring-0",
  )

  return (
    <div className="relative min-h-screen bg-[#f5f5f7]">
      <div className="pointer-events-none absolute inset-0 bg-black/40" aria-hidden />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
        <div
          className="relative z-10 w-full max-w-[448px] rounded-[16px] bg-white px-8 py-8 shadow-[0_0_39px_4px_rgba(0,0,0,0.08)]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-setup-title"
        >
          <div className="flex flex-col items-center text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-[#ffeae0] text-[20px] font-semibold text-[#321a10]">
              {initials}
            </div>
            <h1
              id="invite-setup-title"
              className="mt-4 font-recoleta text-[24px] font-normal leading-[1.05] text-[#272a2d]"
            >
              ¡Hola {data.firstName}!
            </h1>
            <p className="mt-3 text-[14px] leading-[1.4] text-[#43484e]">
              Antes de empezar, necesitamos que termines de crear tu contraseña para continuar.
            </p>
          </div>

          {error ? (
            <p
              className="mt-4 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <form className="mt-6 flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <Label className={LOGIN_TYPE.fieldLabel} style={{ color: LOGIN_COLORS.label }}>
                Crear Contraseña *
              </Label>
              <div className="relative h-[46px]">
                <Lock
                  className="pointer-events-none absolute top-[15px] left-3 size-4 text-[#64748b]"
                  aria-hidden
                />
                <Input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={cn(inputClassName, fieldErrors.password && "border-red-400")}
                  style={{
                    backgroundColor: LOGIN_COLORS.inputBg,
                    borderColor: fieldErrors.password ? undefined : LOGIN_COLORS.inputBorder,
                    color: "#0a0a0a",
                  }}
                />
                <button
                  type="button"
                  className="absolute top-[15px] right-3 text-[#64748b]"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden />
                  ) : (
                    <Eye className="size-4" aria-hidden />
                  )}
                </button>
              </div>
              {fieldErrors.password ? (
                <p className="text-sm text-red-600">{fieldErrors.password}</p>
              ) : (
                <p className="text-[12px] leading-[1.4] text-[#777b84]">Mínimo 8 caracteres</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className={LOGIN_TYPE.fieldLabel} style={{ color: LOGIN_COLORS.label }}>
                Confirmar Contraseña *
              </Label>
              <div className="relative h-[46px]">
                <Lock
                  className="pointer-events-none absolute top-[15px] left-3 size-4 text-[#64748b]"
                  aria-hidden
                />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className={cn(inputClassName, fieldErrors.confirmPassword && "border-red-400")}
                  style={{
                    backgroundColor: LOGIN_COLORS.inputBg,
                    borderColor: fieldErrors.confirmPassword
                      ? undefined
                      : LOGIN_COLORS.inputBorder,
                    color: "#0a0a0a",
                  }}
                />
                <button
                  type="button"
                  className="absolute top-[15px] right-3 text-[#64748b]"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  aria-label={
                    showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="size-4" aria-hidden />
                  ) : (
                    <Eye className="size-4" aria-hidden />
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword ? (
                <p className="text-sm text-red-600">{fieldErrors.confirmPassword}</p>
              ) : null}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className={cn(
                "mt-2 h-[46px] w-full rounded-[10px] py-2.5 hover:opacity-90",
                LOGIN_TYPE.button,
              )}
              style={{ backgroundColor: LOGIN_COLORS.primary, color: "#ffffff" }}
            >
              <Lock className="mr-2 size-4" aria-hidden />
              {loading ? "Configurando…" : "Configurar contraseña"}
            </Button>
          </form>

          <p className="mt-6 text-center text-[14px] leading-[1.4] text-[#43484e]">
            Has sido invitado a colaborar en{" "}
            <span className="font-medium text-[#272a2d]">{data.projectName}</span>
            {data.organizationName ? (
              <>
                {" "}
                de <span className="font-medium text-[#272a2d]">{data.organizationName}</span>
              </>
            ) : null}
            . Una contraseña es necesaria para continuar con el ingreso.
          </p>
        </div>
      </div>
    </div>
  )
}
