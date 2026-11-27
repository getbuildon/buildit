"use client"

import NextLink from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { useEffect, useMemo, useState, type FormEvent } from "react"

import { CampoDeCorreo, PantallaDeAcceso } from "@/components/acceso/PantallaDeAcceso"
import { useAuth } from "@/context/AuthContextSupabase"
import { Button } from "@/library/atoms/button/Button"
import { Icon } from "@/library/atoms/icon/Icon"
import { Link } from "@/library/atoms/link/Link"
import { Spinner } from "@/library/atoms/spinner/Spinner"
import { CodeField } from "@/library/molecules/code-field/CodeField"
import { Field } from "@/library/molecules/field/Field"
import { Notice } from "@/library/molecules/notice/Notice"
import { PasswordInput } from "@/library/molecules/password-input/PasswordInput"
import { AuthCard } from "@/library/organisms/auth/Auth"
import { requestPasswordResetClient, updatePasswordClient } from "@/lib/auth/clientAuth"
import { finalizeAccessLogin } from "@/lib/auth/loginAccess"
import {
  getLoginAudienceFromDocument,
  loginPathForAudience,
  postLoginPath,
  type LoginAudience,
} from "@/lib/auth/loginAudience"
import {
  PASSWORD_REQUIREMENTS_HINT,
  validateNewPasswordFields,
} from "@/lib/auth/passwordValidation"
import { isValidEmail } from "@/lib/landing/emailInput"
import { createClient } from "@/utils/supabase/client"

type Phase = "verifying" | "request" | "code" | "new-password" | "fatal"

const CODE_LENGTH = 6
/** Supabase no manda otro mail a la misma persona antes de este tiempo. */
const RESEND_WAIT_SECONDS = 60

type OtpType = "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email"

/**
 * Recuperar contraseña con la librería BuildOn, con código de 6 dígitos:
 *   pedir el código → escribir el código que llegó por mail → elegir la contraseña nueva.
 * No depende de abrir un enlace: sirve aunque el mail se lea en otro dispositivo y
 * aunque el correo de la empresa "abra" los enlaces antes que la persona.
 * Los enlaces viejos (token_hash, paso=nueva) siguen funcionando.
 */
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
  // Por dónde entró la persona (equipo o clientes): ahí vuelve el link de inicio de sesión.
  const [audience, setAudience] = useState<LoginAudience>("equipo")

  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState<string>()
  const [requestError, setRequestError] = useState("")
  const [requestLoading, setRequestLoading] = useState(false)

  const [code, setCode] = useState("")
  const [codeError, setCodeError] = useState<string>()
  const [codeLoading, setCodeLoading] = useState(false)
  const [resendIn, setResendIn] = useState(0)
  const [resent, setResent] = useState(false)

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [passwordErrors, setPasswordErrors] = useState<{ password?: string; confirm?: string }>({})
  const [updateError, setUpdateError] = useState("")
  const [updateLoading, setUpdateLoading] = useState(false)
  const [done, setDone] = useState(false)

  const loginPath = loginPathForAudience(audience)

  useEffect(() => {
    let cancelled = false

    async function verify() {
      const fromCookie = getLoginAudienceFromDocument()
      if (fromCookie && !cancelled) setAudience(fromCookie)

      if (tokenHash && typeParam) {
        const { error } = await supabase.auth.verifyOtp({
          type: typeParam as OtpType,
          token_hash: tokenHash,
        })
        if (cancelled) return
        if (error) {
          setFatalMessage("El enlace de recuperación es inválido o expiró. Solicitá uno nuevo.")
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

  const sendEmail = async (event: FormEvent) => {
    event.preventDefault()
    setRequestError("")
    const trimmed = email.trim()
    const message = !trimmed
      ? "Escribí tu correo electrónico."
      : !isValidEmail(trimmed)
        ? "Ingresá un correo electrónico válido."
        : undefined
    setEmailError(message)
    if (message) return

    setRequestLoading(true)
    try {
      const result = await requestPasswordResetClient(email)
      if (result.error) {
        setRequestError(result.error)
        return
      }
      setCode("")
      setCodeError(undefined)
      setResent(false)
      setResendIn(RESEND_WAIT_SECONDS)
      setPhase("code")
    } catch {
      setRequestError("No pudimos enviar el código. Intentá de nuevo.")
    } finally {
      setRequestLoading(false)
    }
  }

  // Cuenta regresiva para poder pedir otro código.
  useEffect(() => {
    if (resendIn <= 0) return
    const timer = setTimeout(() => setResendIn((seconds) => seconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendIn])

  const verifyCode = async (value: string) => {
    if (codeLoading) return
    if (value.length !== CODE_LENGTH) {
      setCodeError(`Escribí los ${CODE_LENGTH} dígitos del código.`)
      return
    }
    setCodeError(undefined)
    setCodeLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: value,
        type: "recovery",
      })
      if (error) {
        setCodeError("El código no es correcto o ya venció. Revisalo o pedí otro.")
        return
      }
      setPhase("new-password")
    } catch {
      setCodeError("No pudimos verificar el código. Revisá tu conexión e intentá de nuevo.")
    } finally {
      setCodeLoading(false)
    }
  }

  const resendCode = async () => {
    if (resendIn > 0) return
    setCodeError(undefined)
    setResent(false)
    setResendIn(RESEND_WAIT_SECONDS)
    const result = await requestPasswordResetClient(email).catch(() => ({ error: "error" }))
    if ("error" in result && result.error) {
      setCodeError("No pudimos enviar otro código. Esperá un momento e intentá de nuevo.")
      return
    }
    setCode("")
    setResent(true)
  }

  const updatePassword = async (event: FormEvent) => {
    event.preventDefault()
    setUpdateError("")
    const { errors, ok } = validateNewPasswordFields(password, confirm)
    setPasswordErrors({
      password: errors.password || undefined,
      confirm: errors.confirmPassword || undefined,
    })
    if (!ok) return

    setUpdateLoading(true)
    try {
      const result = await updatePasswordClient(password)
      if (result.error) {
        setUpdateError(result.error)
        return
      }
      setDone(true)
      // Ya tiene la sesión iniciada: entra directo, como al ingresar (mismo control de acceso).
      const access = await finalizeAccessLogin(audience).catch(() => null)
      router.replace(access?.ok ? access.redirectTo : postLoginPath(audience))
    } catch {
      setUpdateError("No pudimos actualizar la contraseña. Intentá de nuevo.")
    } finally {
      setUpdateLoading(false)
    }
  }

  const volver = (
    <Link asChild tone="ink" className="self-center no-underline hover:underline">
      <NextLink href={loginPath}>
        <Icon icon={ArrowLeft} /> Volver al inicio de sesión
      </NextLink>
    </Link>
  )

  if (phase === "verifying" || (phase === "request" && (authLoading || user))) {
    return (
      <PantallaDeAcceso audience={audience}>
        <AuthCard title="Verificando enlace">
          <p className="flex items-center gap-compact text-body text-ink-muted" aria-live="polite">
            <Spinner label="Verificando enlace" /> Estamos revisando que el enlace sea válido…
          </p>
        </AuthCard>
      </PantallaDeAcceso>
    )
  }

  if (phase === "fatal") {
    return (
      <PantallaDeAcceso audience={audience}>
        <AuthCard title="Enlace inválido">
          <Notice tone="danger">{fatalMessage}</Notice>
          <Button asChild variant="ink" fullWidth>
            <NextLink href="/recovery-password">Solicitar un nuevo enlace</NextLink>
          </Button>
        </AuthCard>
      </PantallaDeAcceso>
    )
  }

  if (phase === "code") {
    return (
      <PantallaDeAcceso audience={audience}>
        <AuthCard
          title="Revisá tu correo"
          description={
            <>
              Si existe una cuenta con <strong className="text-ink">{email.trim()}</strong>, te
              enviamos un código de {CODE_LENGTH} dígitos. Escribilo acá para elegir una contraseña
              nueva.
            </>
          }
        >
          {resent ? <Notice tone="ok">Te enviamos un código nuevo. El anterior ya no sirve.</Notice> : null}
          <form
            className="flex flex-col gap-group"
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              void verifyCode(code)
            }}
          >
            <CodeField
              length={CODE_LENGTH}
              value={code}
              disabled={codeLoading}
              autoFocus
              description="Vence en 1 hora. Si no lo ves, revisá la carpeta de correo no deseado."
              error={codeError}
              onChange={(value) => {
                setCode(value)
                if (codeError) setCodeError(undefined)
              }}
              onComplete={(value) => void verifyCode(value)}
            />
            <Button type="submit" variant="ink" fullWidth loading={codeLoading} loadingLabel="Verificando">
              Continuar
            </Button>
            <Button
              variant="ghost"
              fullWidth
              disabled={resendIn > 0}
              onClick={() => void resendCode()}
            >
              {resendIn > 0 ? `Reenviar el código en ${resendIn} s` : "Reenviar el código"}
            </Button>
            <p className="text-center text-body">
              <Link asChild tone="ink" className="no-underline hover:underline">
                <NextLink
                  href="/recovery-password"
                  onClick={(event) => {
                    event.preventDefault()
                    setPhase("request")
                  }}
                >
                  Usar otro correo
                </NextLink>
              </Link>
            </p>
          </form>
          {volver}
        </AuthCard>
      </PantallaDeAcceso>
    )
  }

  if (phase === "new-password") {
    return (
      <PantallaDeAcceso audience={audience}>
        <AuthCard title="Nueva contraseña" description="Elegí una contraseña nueva para tu cuenta.">
          {updateError ? <Notice tone="danger">{updateError}</Notice> : null}
          {done ? (
            <Notice tone="ok">Contraseña actualizada. Entrando…</Notice>
          ) : null}
          <form className="flex flex-col gap-group" noValidate onSubmit={updatePassword}>
            <Field
              label="Nueva contraseña"
              description={PASSWORD_REQUIREMENTS_HINT}
              error={passwordErrors.password}
            >
              <PasswordInput
                name="password"
                autoComplete="new-password"
                value={password}
                disabled={done}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>
            <Field label="Confirmar contraseña" error={passwordErrors.confirm}>
              <PasswordInput
                name="confirmPassword"
                autoComplete="new-password"
                value={confirm}
                disabled={done}
                onChange={(event) => setConfirm(event.target.value)}
              />
            </Field>
            <Button
              type="submit"
              variant="ink"
              fullWidth
              loading={updateLoading}
              loadingLabel="Guardando"
              disabled={done}
            >
              Guardar contraseña
            </Button>
          </form>
        </AuthCard>
      </PantallaDeAcceso>
    )
  }

  return (
    <PantallaDeAcceso audience={audience}>
      <AuthCard
        title="Recuperar contraseña"
        description="Ingresá tu correo electrónico y te enviaremos un código para elegir una contraseña nueva."
      >
        {requestError ? <Notice tone="danger">{requestError}</Notice> : null}
        <form className="flex flex-col gap-group" noValidate onSubmit={sendEmail}>
          <CampoDeCorreo value={email} onChange={setEmail} error={emailError} />
          <Button
            type="submit"
            variant="ink"
            fullWidth
            loading={requestLoading}
            loadingLabel="Enviando"
          >
            Enviar código
          </Button>
          <p className="pt-compact text-center text-body">
            <Link asChild tone="ink" className="no-underline hover:underline">
              <NextLink href={loginPath}>Volver al inicio de sesión</NextLink>
            </Link>
          </p>
        </form>
      </AuthCard>
    </PantallaDeAcceso>
  )
}

export default RecoveryPasswordPage
