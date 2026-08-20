"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react"
import { AuthFormCard, AuthSplitLayout } from "@/components/auth/AuthSplitLayout"
import {
  AUTH_FORM_TITLE_CLASSNAME,
  AUTH_INPUT_CLASSNAME,
  AUTH_PASSWORD_INPUT_CLASSNAME,
  AuthFieldIcon,
  AuthFieldToggle,
} from "@/components/auth/authFormStyles"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/context/AuthContextSupabase"
import {
  requestPasswordResetClient,
  updatePasswordClient,
} from "@/lib/auth/clientAuth"
import { validateNewPasswordFields, PASSWORD_REQUIREMENTS_HINT } from "@/lib/auth/passwordValidation"
import {
  isValidEmail,
  sanitizeEmailInput,
} from "@/lib/landing/emailInput"
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
  const { user, loading: authLoading } = useAuth()
  const supabase = useMemo(() => createClient(), [])

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
    let cancelled = false

    async function verify() {
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
    if (!isValidEmail(trimmed)) {
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
    const { errors, ok } = validateNewPasswordFields(password, confirmPassword)
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
        router.push("/acceso-equipo")
      }, 2000)
    } catch {
      setUpdateError("No pudimos actualizar la contraseña. Intentá de nuevo.")
    } finally {
      setUpdateLoading(false)
    }
  }

  const inputStyle = {
    backgroundColor: LOGIN_COLORS.inputBg,
    borderColor: LOGIN_COLORS.inputBorder,
    color: "#0a0a0a",
  }

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
          <h2 className={AUTH_FORM_TITLE_CLASSNAME} style={{ color: LOGIN_COLORS.title }}>
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
      <AuthSplitLayout>
        <AuthFormCard>
          <h2 className={AUTH_FORM_TITLE_CLASSNAME} style={{ color: LOGIN_COLORS.title }}>
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
              href="/acceso-equipo"
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
          <h2 className={AUTH_FORM_TITLE_CLASSNAME} style={{ color: LOGIN_COLORS.title }}>
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
              <div className="relative">
                <AuthFieldIcon>
                  <Lock className="size-4" strokeWidth={1.75} aria-hidden />
                </AuthFieldIcon>
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
                    AUTH_PASSWORD_INPUT_CLASSNAME,
                    "placeholder:text-[rgba(10,10,10,0.5)]",
                    passwordFieldErrors.password && "border-red-400",
                  )}
                  style={{
                    ...inputStyle,
                    borderColor: passwordFieldErrors.password
                      ? undefined
                      : LOGIN_COLORS.inputBorder,
                  }}
                />
                <AuthFieldToggle
                  label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden />
                  ) : (
                    <Eye className="size-4" aria-hidden />
                  )}
                </AuthFieldToggle>
              </div>
              {passwordFieldErrors.password ? (
                <p className="text-sm text-red-600">{passwordFieldErrors.password}</p>
              ) : (
                <p className="text-[12px] leading-[1.4] text-[#777b84]">
                  {PASSWORD_REQUIREMENTS_HINT}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="recovery-confirm-password"
                className={LOGIN_TYPE.fieldLabel}
                style={{ color: LOGIN_COLORS.label }}
              >
                Confirmar contraseña
              </Label>
              <div className="relative">
                <AuthFieldIcon>
                  <Lock className="size-4" strokeWidth={1.75} aria-hidden />
                </AuthFieldIcon>
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
                    AUTH_PASSWORD_INPUT_CLASSNAME,
                    "placeholder:text-[rgba(10,10,10,0.5)]",
                    passwordFieldErrors.confirmPassword && "border-red-400",
                  )}
                  style={{
                    ...inputStyle,
                    borderColor: passwordFieldErrors.confirmPassword
                      ? undefined
                      : LOGIN_COLORS.inputBorder,
                  }}
                />
                <AuthFieldToggle
                  label={
                    showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="size-4" aria-hidden />
                  ) : (
                    <Eye className="size-4" aria-hidden />
                  )}
                </AuthFieldToggle>
              </div>
              {passwordFieldErrors.confirmPassword ? (
                <p className="text-sm text-red-600">{passwordFieldErrors.confirmPassword}</p>
              ) : null}
            </div>

            <Button
              type="submit"
              disabled={updateLoading || updateSuccess}
              className={cn(
                "h-11 w-full rounded-[10px] py-2.5 hover:opacity-90 sm:h-[44px]",
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
    <AuthSplitLayout>
      <AuthFormCard>
        <h2 className={AUTH_FORM_TITLE_CLASSNAME} style={{ color: LOGIN_COLORS.title }}>
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
            <div className="relative">
              <AuthFieldIcon>
                <Mail className="size-4" strokeWidth={1.75} aria-hidden />
              </AuthFieldIcon>
              <Input
                id="recovery-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(sanitizeEmailInput(e.target.value))}
                placeholder="tu@ejemplo.com"
                aria-invalid={Boolean(fieldError)}
                className={cn(
                  AUTH_INPUT_CLASSNAME,
                  "pr-4 placeholder:text-[rgba(10,10,10,0.5)]",
                  fieldError && "border-red-400",
                )}
                style={{
                  ...inputStyle,
                  borderColor: fieldError ? undefined : LOGIN_COLORS.inputBorder,
                }}
              />
            </div>
            {fieldError ? <p className="text-sm text-red-600">{fieldError}</p> : null}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className={cn(
              "h-11 w-full rounded-[10px] py-2.5 hover:opacity-90 sm:h-[44px]",
              LOGIN_TYPE.button,
            )}
            style={{ backgroundColor: LOGIN_COLORS.primary, color: "#ffffff" }}
          >
            {isLoading ? "Enviando…" : "Enviar enlace de recuperación"}
          </Button>

          <div className="flex justify-center pt-3">
            <Link
              href="/acceso-equipo"
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
