"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, Mail } from "lucide-react"
import { AuthFormCard, AuthSplitLayout } from "@/components/auth/AuthSplitLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/AuthContextSupabase"
import { requestPasswordResetClient } from "@/lib/auth/clientAuth"
import { isSupabaseConfigured } from "@/lib/auth/config"
import {
  LOGIN_COLORS,
  LOGIN_TYPE,
} from "@/lib/login/designTokens"
import { cn } from "@/lib/utils"

function RecoveryPasswordPage() {
  const router = useRouter()
  const { user, loading: authLoading, authMode } = useAuth()

  const [email, setEmail] = useState("")
  const [fieldError, setFieldError] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (authLoading || !user) return
    router.replace("/home")
  }, [authLoading, user, router])

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

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setError("")
    setSuccess(false)
    if (!validateEmail()) return

    setIsLoading(true)
    try {
      const result = await requestPasswordResetClient(email)
      if (result.error) {
        setError(result.error)
        return
      }
      setSuccess(true)
    } catch {
      setError("No pudimos enviar el enlace. Intentá de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const inputClassName = cn(
    "h-[46px] w-full rounded-[10px] border bg-transparent pl-10 shadow-none",
    LOGIN_TYPE.fieldInput,
    "focus-visible:border-[#e2e8f0] focus-visible:ring-0",
  )

  if (authLoading || user) {
    return null
  }

  return (
    <AuthSplitLayout
      belowCard={
        authMode === "mock" ? (
          <p className="text-center text-xs leading-relaxed text-[#bedbff]/90">
            Modo demo: no se envía correo real. Con Supabase configurado, el enlace llegará al
            email ingresado.
          </p>
        ) : null
      }
    >
      <AuthFormCard>
        <h2 className={LOGIN_TYPE.cardTitle} style={{ color: LOGIN_COLORS.title }}>
          Recuperar contraseña
        </h2>

        <p className={LOGIN_TYPE.cardDescription} style={{ color: LOGIN_COLORS.cardDescription }}>
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu
          contraseña.
        </p>

        {error ? (
          <p
            className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {success ? (
          <p
            className="rounded-[10px] border border-[#dbeafe] bg-[#eff6ff] px-3 py-2 text-sm text-[#1e40af]"
            role="status"
          >
            {isSupabaseConfigured()
              ? "Si existe una cuenta con ese correo, te enviamos un enlace para restablecer tu contraseña."
              : "En modo demo simulamos el envío. Cuando conectes Supabase, el enlace llegará por email."}
          </p>
        ) : null}

        <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
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
                disabled={success}
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
            disabled={isLoading || success}
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
