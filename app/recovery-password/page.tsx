"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react"
import { AuthFormCard, AuthSplitLayout } from "@/components/auth/AuthSplitLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/context/AuthContextSupabase"
import {
  requestPasswordResetClient,
  updatePasswordClient,
} from "@/lib/auth/clientAuth"
import { isSupabaseConfigured } from "@/lib/auth/config"
import {
  LOGIN_COLORS,
  LOGIN_TYPE,
} from "@/lib/login/designTokens"
import { cn } from "@/lib/utils"
import { createClient } from "@/utils/supabase/client"

type Phase =
  | "verifying"
  | "request"
  | "email-sent"
  | "new-password"
  | "fatal"

function RecoveryPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading, authMode } = useAuth()
  const supabase = useMemo(() => (isSupabaseConfigured() ? createClient() : null), [])

  const paso = searchParams.get("paso")
  const tokenHash = searchParams.get("token_hash")
  const typeParam = searchParams.get("type")

  const [phase, setPhase] = useState<Phase>("verifying")
  const [fatalMessage, setFatalMessage] = useState("")

  const [email, setEmail] = useState("")
  const [fieldError, setFieldError] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordFieldErrors, setPasswordFieldErrors] = useState({
    password: "",
    confirmPassword: "",
  })
  const [updateError, setUpdateError] = useState("")
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [updateLoading, setUpdateLoading] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setPhase("request")
      return
    }

    let cancelled = false

    async function verify() {
      if (!supabase) {
        setPhase("request")
        return
      }

      if (tokenHash && typeParam) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          type: typeParam as
            | "signup"
            | "invite"
            | "magiclink"
            | "recovery"
            | "email_change"
            | "email",
          token_hash: tokenHash,
        })
        if (cancelled) return
        if (verifyError) {
          setFatalMessage(
            "El enlace de recuperación es inválido o expiró. Solicitá uno nuevo.",
          )
          setPhase("fatal")
          return
        }
        setPhase("new-password")
        return
      }

      if (paso === "nueva") {
        await new Promise((resolve) => setTimeout(resolve, 500))
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (cancelled) return
        if (!session) {
          setFatalMessage(
            "No hay una sesión activa. Solicitá un nuevo enlace desde recuperación de contraseña.",
          )
          setPhase("fatal")
          return
        }
        setPhase("new-password")
        return
      }

      if (!cancelled) setPhase("request")
    }

    void verify()
    return () => {
      cancelled = true
    }
  }, [paso, tokenHash, typeParam, supabase])

  useEffect(() => {
    if (phase !== "request" || authLoading || !user) return
    router.replace("/home")
  }, [phase, authLoading, user, router])

  const validateEmail = useCallback(() => {
    const trimmed = email.trim()
    if (!trimmed) {
      setFieldError("El correo electrónico es requerido")
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setFieldError("Ingresá un correo electrónico válido")
      return false
    }
    setFieldError("")
    return true
  }, [email])

  const handleSendEmail = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setError("")
    if (!validateEmail()) return

    setIsLoading(true)
    try {
      const result = await requestPasswordResetClient(email)
      if (result.error) {
        setError(result.error)
        return
      }
      setPhase("email-sent")
    } catch {
      setError("No pudimos enviar el enlace. Intentá de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const validatePasswordForm = useCallback(() => {
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

    setPasswordFieldErrors(errors)
    return ok
  }, [confirmPassword, password])

  const handleUpdatePassword = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setUpdateError("")
    if (!validatePasswordForm()) return

    setUpdateLoading(true)
    try {
      const result = await updatePasswordClient(password)
      if (result.error) {
        setUpdateError(result.error)
        return
      }
      setUpdateSuccess(true)
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch {
      setUpdateError("No pudimos actualizar la contraseña. Intentá de nuevo.")
    } finally {
      setUpdateLoading(false)
    }
  }

  const inputClassName = cn(
    "h-[46px] w-full rounded-[10px] border bg-transparent pl-10 shadow-none",
    LOGIN_TYPE.fieldInput,
    "focus-visible:border-[#e2e8f0] focus-visible:ring-0",
  )

  const passwordInputClassName = cn(inputClassName, "pr-10")

  const belowCard =
    authMode === "mock" && phase === "request" ? (
      <p className="text-center text-xs leading-relaxed text-[#bedbff]/90">
        Modo demo: no se envía correo real. Con Supabase configurado, el enlace llegará al email
        ingresado.
      </p>
    ) : null

  if (phase === "verifying" || (phase === "request" && (authLoading || user))) {
    return (
      <AuthSplitLayout>
        <AuthFormCard>
          <div className="flex flex-col items-center gap-3 py-8">
            <Spinner className="size-8 text-[#64748b]" />
            <p className={LOGIN_TYPE.cardDescription} style={{ color: LOGIN_COLORS.cardDescription }}>
              Verificando enlace…
            </p>
          </div>
        </AuthFormCard>
      </AuthSplitLayout>
    )
  }

  if (phase === "fatal") {
    return (
      <AuthSplitLayout>
        <AuthFormCard>
          <h2 className={LOGIN_TYPE.cardTitle} style={{ color: LOGIN_COLORS.title }}>
            Enlace inválido
          </h2>
          <p
            className={LOGIN_TYPE.cardDescription}
            style={{ color: LOGIN_COLORS.cardDescription }}
            role="alert"
          >
            {fatalMessage}
          </p>
          <div className="flex justify-center pt-2">
            <Link
              href="/recovery-password"
              className={cn(LOGIN_TYPE.link, "hover:opacity-80")}
              style={{ color: LOGIN_COLORS.linkMuted }}
            >
              Solicitar un nuevo enlace
            </Link>
          </div>
        </AuthFormCard>
      </AuthSplitLayout>
    )
  }

  if (phase === "email-sent") {
    return (
      <AuthSplitLayout belowCard={belowCard}>
        <AuthFormCard>
          <h2 className={LOGIN_TYPE.cardTitle} style={{ color: LOGIN_COLORS.title }}>
            Revisá tu correo
          </h2>
          <p
            className="rounded-[10px] border border-[#dbeafe] bg-[#eff6ff] px-3 py-2 text-sm text-[#1e40af]"
            role="status"
          >
            Si existe una cuenta con ese correo, te enviamos un enlace para restablecer tu
            contraseña.
          </p>
          <div className="flex justify-center pt-3">
            <Link
              href="/login"
              className={cn(
                LOGIN_TYPE.link,
                "inline-flex items-center gap-2 hover:opacity-80",
              )}
              style={{ color: LOGIN_COLORS.linkMuted }}
            >
              <ArrowLeft className="size-4 shrink-0" aria-hidden />
              Volver al inicio de sesión
            </Link>
          </div>
        </AuthFormCard>
      </AuthSplitLayout>
    )
  }

  if (phase === "new-password") {
    return (
      <AuthSplitLayout>
        <AuthFormCard>
          <h2 className={LOGIN_TYPE.cardTitle} style={{ color: LOGIN_COLORS.title }}>
            Nueva contraseña
          </h2>
          <p className={LOGIN_TYPE.cardDescription} style={{ color: LOGIN_COLORS.cardDescription }}>
            Elegí una contraseña nueva para tu cuenta.
          </p>

          {updateError ? (
            <p
              className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
              role="alert"
            >
              {updateError}
            </p>
          ) : null}

          {updateSuccess ? (
            <p
              className="rounded-[10px] border border-[#dbeafe] bg-[#eff6ff] px-3 py-2 text-sm text-[#1e40af]"
              role="status"
            >
              Contraseña actualizada. Redirigiendo al inicio de sesión…
            </p>
          ) : null}

          <form className="flex flex-col gap-4" noValidate onSubmit={handleUpdatePassword}>
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="recovery-password"
                className={LOGIN_TYPE.fieldLabel}
                style={{ color: LOGIN_COLORS.label }}
              >
                Nueva contraseña
              </Label>
              <div className="relative h-[46px]">
                <Lock
                  className="pointer-events-none absolute top-[15px] left-3 size-4 text-[#64748b]"
                  aria-hidden
                />
                <Input
                  id="recovery-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(passwordFieldErrors.password)}
                  disabled={updateSuccess}
                  className={cn(
                    passwordInputClassName,
                    "placeholder:text-[rgba(10,10,10,0.5)]",
                    passwordFieldErrors.password && "border-red-400",
                  )}
                  style={{
                    backgroundColor: LOGIN_COLORS.inputBg,
                    borderColor: passwordFieldErrors.password
                      ? undefined
                      : LOGIN_COLORS.inputBorder,
                    color: "#0a0a0a",
                  }}
                />
                <button
                  type="button"
                  className="absolute top-[15px] right-3 text-[#64748b]"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden />
                  ) : (
                    <Eye className="size-4" aria-hidden />
                  )}
                </button>
              </div>
              {passwordFieldErrors.password ? (
                <p className="text-sm text-red-600">{passwordFieldErrors.password}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="recovery-confirm-password"
                className={LOGIN_TYPE.fieldLabel}
                style={{ color: LOGIN_COLORS.label }}
              >
                Confirmar contraseña
              </Label>
              <div className="relative h-[46px]">
                <Lock
                  className="pointer-events-none absolute top-[15px] left-3 size-4 text-[#64748b]"
                  aria-hidden
                />
                <Input
                  id="recovery-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  aria-invalid={Boolean(passwordFieldErrors.confirmPassword)}
                  disabled={updateSuccess}
                  className={cn(
                    passwordInputClassName,
                    "placeholder:text-[rgba(10,10,10,0.5)]",
                    passwordFieldErrors.confirmPassword && "border-red-400",
                  )}
                  style={{
                    backgroundColor: LOGIN_COLORS.inputBg,
                    borderColor: passwordFieldErrors.confirmPassword
                      ? undefined
                      : LOGIN_COLORS.inputBorder,
                    color: "#0a0a0a",
                  }}
                />
                <button
                  type="button"
                  className="absolute top-[15px] right-3 text-[#64748b]"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
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
              {passwordFieldErrors.confirmPassword ? (
                <p className="text-sm text-red-600">{passwordFieldErrors.confirmPassword}</p>
              ) : null}
            </div>

            <Button
              type="submit"
              disabled={updateLoading || updateSuccess}
              className={cn(
                "h-[44px] w-full rounded-[10px] py-2.5 hover:opacity-90",
                LOGIN_TYPE.button,
              )}
              style={{ backgroundColor: LOGIN_COLORS.primary, color: "#ffffff" }}
            >
              {updateLoading ? "Guardando…" : "Guardar contraseña"}
            </Button>
          </form>
        </AuthFormCard>
      </AuthSplitLayout>
    )
  }

  return (
    <AuthSplitLayout belowCard={belowCard}>
      <AuthFormCard>
        <h2 className={LOGIN_TYPE.cardTitle} style={{ color: LOGIN_COLORS.title }}>
          Recuperar contraseña
        </h2>

        <p className={LOGIN_TYPE.cardDescription} style={{ color: LOGIN_COLORS.cardDescription }}>
          Ingresá tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        {error ? (
          <p
            className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <form className="flex flex-col gap-4" noValidate onSubmit={handleSendEmail}>
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="recovery-email"
              className={LOGIN_TYPE.fieldLabel}
              style={{ color: LOGIN_COLORS.label }}
            >
              Correo electrónico
            </Label>
            <div className="relative h-[46px]">
              <Mail
                className="pointer-events-none absolute top-[15px] left-3 size-4 text-[#64748b]"
                aria-hidden
              />
              <Input
                id="recovery-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@ejemplo.com"
                aria-invalid={Boolean(fieldError)}
                className={cn(
                  inputClassName,
                  "placeholder:text-[rgba(10,10,10,0.5)]",
                  fieldError && "border-red-400",
                )}
                style={{
                  backgroundColor: LOGIN_COLORS.inputBg,
                  borderColor: fieldError ? undefined : LOGIN_COLORS.inputBorder,
                  color: "#0a0a0a",
                }}
              />
            </div>
            {fieldError ? <p className="text-sm text-red-600">{fieldError}</p> : null}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className={cn(
              "h-[44px] w-full rounded-[10px] py-2.5 hover:opacity-90",
              LOGIN_TYPE.button,
            )}
            style={{ backgroundColor: LOGIN_COLORS.primary, color: "#ffffff" }}
          >
            {isLoading ? "Enviando…" : "Enviar enlace de recuperación"}
          </Button>

          <div className="flex justify-center pt-3">
            <Link
              href="/login"
              className={cn(
                LOGIN_TYPE.link,
                "inline-flex items-center gap-2 hover:opacity-80",
              )}
              style={{ color: LOGIN_COLORS.linkMuted }}
            >
              <ArrowLeft className="size-4 shrink-0" aria-hidden />
              Volver al inicio de sesión
            </Link>
          </div>
        </form>
      </AuthFormCard>
    </AuthSplitLayout>
  )
}

export default RecoveryPasswordPage
