"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Eye, EyeOff, Lock } from "lucide-react"

import { completeRegisterSetup } from "@/app/register/confirm/actions"
import { validateNewPasswordFields, PASSWORD_REQUIREMENTS_HINT } from "@/lib/auth/passwordValidation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LOGIN_COLORS, LOGIN_TYPE } from "@/lib/login/designTokens"
import { getUserInitials } from "@/lib/profile/userInitials"
import { cn } from "@/lib/utils"

type RegisterConfirmViewProps = {
  firstName: string
  lastName: string
  email: string
}

export function RegisterConfirmView({
  firstName,
  lastName,
  email,
}: RegisterConfirmViewProps) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const initials = getUserInitials(firstName, lastName, email)
  const greetingName = firstName.trim() || email

  const validate = () => {
    const { errors, ok } = validateNewPasswordFields(password, confirmPassword)
    setFieldErrors(errors)
    return ok
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    if (!validate()) return

    setLoading(true)
    try {
      const result = await completeRegisterSetup(password)
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.replace("/home")
    } catch {
      setError("No pudimos completar el registro. Intentá de nuevo.")
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
          aria-labelledby="register-confirm-title"
        >
          <div className="flex flex-col items-center text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-[#ffeae0] text-[20px] font-semibold text-[#321a10]">
              {initials}
            </div>
            <h1
              id="register-confirm-title"
              className="mt-4 font-recoleta text-[24px] font-normal leading-[1.05] text-[#272a2d]"
            >
              ¡Hola {greetingName}!
            </h1>
            <p className="mt-3 text-[14px] leading-[1.4] text-[#43484e]">
              Confirmá tu registro creando una contraseña para acceder a BuildOn.
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
                Crear contraseña *
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
                <p className="text-[12px] leading-[1.4] text-[#777b84]">{PASSWORD_REQUIREMENTS_HINT}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className={LOGIN_TYPE.fieldLabel} style={{ color: LOGIN_COLORS.label }}>
                Confirmar contraseña *
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
              {loading ? "Guardando…" : "Confirmar registro"}
            </Button>
          </form>

          <p className="mt-6 text-center text-[14px] leading-[1.4] text-[#43484e]">
            Tu cuenta{" "}
            <span className="font-medium text-[#272a2d]">{email}</span> quedará
            activa cuando guardes tu contraseña.
          </p>
        </div>
      </div>
    </div>
  )
}
