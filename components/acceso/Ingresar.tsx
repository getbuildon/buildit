"use client"

import NextLink from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, type FormEvent } from "react"

import { CampoDeCorreo, PantallaDeAcceso } from "@/components/acceso/PantallaDeAcceso"
import { useAuthHealthCheck } from "@/hooks/useAuthHealthCheck"
import { Button } from "@/library/atoms/button/Button"
import { Link } from "@/library/atoms/link/Link"
import { Field } from "@/library/molecules/field/Field"
import { Notice } from "@/library/molecules/notice/Notice"
import { PasswordInput } from "@/library/molecules/password-input/PasswordInput"
import { AuthCard } from "@/library/organisms/auth/Auth"
import {
  getClientSessionUser,
  signInWithPasswordClient,
  signOutClient,
} from "@/lib/auth/clientAuth"
import { finalizeAccessLogin } from "@/lib/auth/loginAccess"
import { writeLoginAudienceCookie, type LoginAudience } from "@/lib/auth/loginAudience"
import { setLoginAudience } from "@/lib/auth/loginAudienceActions"
import { isValidEmail } from "@/lib/landing/emailInput"

/** Ingresar (equipo y clientes) con la librería BuildOn. Misma lógica que antes. */
export function Ingresar({ audience }: { audience: LoginAudience }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const salud = useAuthHealthCheck()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    writeLoginAudienceCookie(audience)
    void setLoginAudience(audience)
  }, [audience])

  const callbackError = searchParams.get("error")
  const nextPath = searchParams.get("next")
  const safeNextPath =
    audience === "cliente"
      ? null
      : nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
        ? nextPath
        : "/home"
  const aviso =
    error ||
    (callbackError === "callback"
      ? "No pudimos completar el inicio de sesión. Intentá de nuevo."
      : callbackError === "config"
        ? "Supabase no está configurado en el servidor."
        : "")

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError("")
    const trimmedEmail = email.trim()
    const next = {
      email: !trimmedEmail
        ? "Escribí tu correo electrónico."
        : !isValidEmail(trimmedEmail)
          ? "Ingresá un correo electrónico válido."
          : undefined,
      password: !password ? "Escribí tu contraseña." : undefined,
    }
    setErrors(next)
    if (next.email || next.password) return

    setLoading(true)
    writeLoginAudienceCookie(audience)
    void setLoginAudience(audience)
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
      if (!sessionUser || sessionUser.email.toLowerCase() !== trimmedEmail.toLowerCase()) {
        setError("No pudimos validar la sesión. Intentá de nuevo.")
        return
      }

      const access = await finalizeAccessLogin(audience)
      if (!access.ok) {
        await signOutClient()
        setError(access.error)
        return
      }

      router.replace(audience === "equipo" && safeNextPath ? safeNextPath : access.redirectTo)
    } catch {
      setError("No pudimos iniciar sesión. Intentá de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <PantallaDeAcceso audience={audience}>
      <AuthCard title="Iniciá sesión en tu cuenta">
        {aviso ? <Notice tone="danger">{aviso}</Notice> : null}
        {salud.checked && !salud.ok && salud.message ? (
          <Notice tone="caution">{salud.message}</Notice>
        ) : null}
        <form className="flex flex-col gap-group" noValidate onSubmit={submit}>
          <CampoDeCorreo value={email} onChange={setEmail} error={errors.email} />
          <Field label="Contraseña" error={errors.password}>
            <PasswordInput
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          <Button type="submit" variant="ink" fullWidth loading={loading} loadingLabel="Ingresando">
            Iniciar sesión
          </Button>
          <p className="pt-compact text-center text-body">
            <Link asChild tone="ink" className="no-underline hover:underline">
              <NextLink href="/recovery-password">No recuerdo mi contraseña</NextLink>
            </Link>
          </p>
        </form>
      </AuthCard>
    </PantallaDeAcceso>
  )
}
