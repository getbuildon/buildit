"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { withGuestAuth } from "@/hoc/withGuestAuth"
import {
  signInWithGoogleClient,
  signUpClient,
} from "@/lib/auth/clientAuth"
import { BRAND_NAME } from "@/lib/brand"
import { useAuth } from "@/context/AuthContextSupabase"

function RegisterPage() {
  const router = useRouter()
  const { refreshSession } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const validateForm = useCallback(() => {
    const errors = { email: "", password: "", confirmPassword: "" }
    let ok = true
    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      errors.email = "El correo electrónico es requerido"
      ok = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = "Ingresá un correo electrónico válido"
      ok = false
    }

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
  }, [confirmPassword, email, password])

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setError("")
    setSuccess("")
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const result = await signUpClient(email, password)
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.needsEmailConfirmation) {
        setSuccess("Revisá tu correo para confirmar la cuenta antes de ingresar.")
        return
      }
      await refreshSession()
      router.push("/home")
      router.refresh()
    } catch {
      setError("Error al registrarse")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    setError("")
    try {
      const result = await signInWithGoogleClient()
      if (result.error) {
        setError(result.error)
        setGoogleLoading(false)
        return
      }
    } catch {
      setError("Error al registrarse con Google")
      setGoogleLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-10 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            {BRAND_NAME}
          </p>
          <h1 className="text-2xl font-bold">Crear cuenta</h1>
          <p className="text-sm text-muted-foreground">
            Placeholder hasta recibir diseño de Figma.{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Ya tengo cuenta
            </Link>
          </p>
        </div>

        {error ? (
          <p
            className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {success ? (
          <p
            className="mt-4 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary"
            role="status"
          >
            {success}
          </p>
        ) : null}

        <form className="mt-6 space-y-4" noValidate onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@mail.com"
              aria-invalid={Boolean(fieldErrors.email)}
            />
            {fieldErrors.email ? (
              <p className="text-sm text-destructive">{fieldErrors.email}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(fieldErrors.password)}
            />
            {fieldErrors.password ? (
              <p className="text-sm text-destructive">{fieldErrors.password}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
            />
            {fieldErrors.confirmPassword ? (
              <p className="text-sm text-destructive">{fieldErrors.confirmPassword}</p>
            ) : null}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creando cuenta…" : "Registrarme"}
          </Button>
        </form>

        <div className="my-6 h-px bg-border" />

        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={googleLoading}
          onClick={handleGoogle}
        >
          {googleLoading ? "Redirigiendo…" : "Continuar con Google"}
        </Button>
      </div>
    </div>
  )
}

export default withGuestAuth(RegisterPage)
