"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import { Eye, EyeOff, Lock, Mail } from "lucide-react"
import { AuthFormCard, AuthSplitLayout } from "@/components/auth/AuthSplitLayout"
import {
  AUTH_FORM_TITLE_CLASSNAME,
  AUTH_INPUT_CLASSNAME,
  AUTH_PASSWORD_INPUT_CLASSNAME,
  AuthFieldIcon,
  AuthFieldToggle,
} from "@/components/auth/authFormStyles"
import { AuthHealthBanner } from "@/components/auth/AuthHealthBanner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { withGuestAuth } from "@/hoc/withGuestAuth"
import {
  getClientSessionUser,
  signInWithPasswordClient,
} from "@/lib/auth/clientAuth"
import {
  isValidEmail,
  sanitizeEmailInput,
} from "@/lib/landing/emailInput"
import { LOGIN_COLORS, LOGIN_TYPE } from "@/lib/login/designTokens"
import { cn } from "@/lib/utils"

function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const callbackError = searchParams.get("error")
  const nextPath = searchParams.get("next")
  const safeNextPath =
    nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/home"
  const mergedBanner =
    callbackError === "callback"
      ? "No pudimos completar el inicio de sesión. Intentá de nuevo."
      : callbackError === "config"
        ? "Supabase no está configurado en el servidor."
        : ""

  const validateForm = useCallback(() => {
    const errors = { email: "", password: "" }
    let ok = true
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      errors.email = "El correo electrónico es requerido"
      ok = false
    } else if (!isValidEmail(trimmedEmail)) {
      errors.email = "Ingresá un correo electrónico válido"
      ok = false
    }
    if (!password) {
      errors.password = "La contraseña es requerida"
      ok = false
    }
    setFieldErrors(errors)
    return ok
  }, [email, password])

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setError("")
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const result = await signInWithPasswordClient(email, password)
      if (result.error) {
        setError(result.error)
        return
      }
      if (!result.signedIn) {
        setError("No pudimos iniciar sesión. Intentá de nuevo.")
        return
      }

      const sessionUser = await getClientSessionUser()
      const loginEmail = email.trim().toLowerCase()
      if (!sessionUser || sessionUser.email.toLowerCase() !== loginEmail) {
        setError("No pudimos validar la sesión. Intentá de nuevo.")
        return
      }

      router.replace(safeNextPath)
    } catch {
      setError("Error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  const inputStyle = {
    backgroundColor: LOGIN_COLORS.inputBg,
    borderColor: LOGIN_COLORS.inputBorder,
    color: LOGIN_COLORS.title,
  }

  return (
    <AuthSplitLayout>
      <AuthFormCard>
        <h2 className={AUTH_FORM_TITLE_CLASSNAME} style={{ color: LOGIN_COLORS.title }}>
          Inicia sesión en tu cuenta
        </h2>

        {mergedBanner || error ? (
          <p
            className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
            role="alert"
          >
            {error || mergedBanner}
          </p>
        ) : null}

        <AuthHealthBanner className="rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800" />

        <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="email"
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
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(sanitizeEmailInput(e.target.value))}
                placeholder="tu@ejemplo.com"
                aria-invalid={Boolean(fieldErrors.email)}
                className={cn(
                  AUTH_INPUT_CLASSNAME,
                  "pr-4",
                  fieldErrors.email && "border-red-400",
                )}
                style={{
                  ...inputStyle,
                  borderColor: fieldErrors.email ? undefined : LOGIN_COLORS.inputBorder,
                }}
              />
            </div>
            {fieldErrors.email ? (
              <p className="text-sm text-red-600">{fieldErrors.email}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="password"
              className={LOGIN_TYPE.fieldLabel}
              style={{ color: LOGIN_COLORS.label }}
            >
              Contraseña
            </Label>
            <div className="relative">
              <AuthFieldIcon>
                <Lock className="size-4" strokeWidth={1.75} aria-hidden />
              </AuthFieldIcon>
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                aria-invalid={Boolean(fieldErrors.password)}
                className={cn(
                  AUTH_PASSWORD_INPUT_CLASSNAME,
                  fieldErrors.password && "border-red-400",
                )}
                style={{
                  ...inputStyle,
                  borderColor: fieldErrors.password ? undefined : LOGIN_COLORS.inputBorder,
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
            {fieldErrors.password ? (
              <p className="text-sm text-red-600">{fieldErrors.password}</p>
            ) : null}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className={cn(
              "h-11 w-full rounded-[10px] py-2.5 hover:opacity-90 sm:h-[44px]",
              LOGIN_TYPE.button,
            )}
            style={{
              backgroundColor: LOGIN_COLORS.buttonBg,
              color: "#ffffff",
            }}
          >
            {isLoading ? "Ingresando…" : "Iniciar Sesión"}
          </Button>

          <div className="pt-2 text-center sm:pt-3">
            <Link
              href="/recovery-password"
              className={cn(LOGIN_TYPE.link, "hover:underline")}
              style={{ color: LOGIN_COLORS.label }}
            >
              No recuerdo mi contraseña
            </Link>
          </div>
        </form>
      </AuthFormCard>
    </AuthSplitLayout>
  )
}

export default withGuestAuth(LoginPage)
