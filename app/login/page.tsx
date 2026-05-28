"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import { Lock, Mail } from "lucide-react"
import { BuiltItIsoIcon } from "@/components/brand/BuiltItIsoIcon"
import { AuthHealthBanner } from "@/components/auth/AuthHealthBanner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { withGuestAuth } from "@/hoc/withGuestAuth"
import {
  getClientSessionUser,
  signInWithGoogleClient,
  signInWithPasswordClient,
} from "@/lib/auth/clientAuth"
import { BRAND_NAME } from "@/lib/brand"
import {
  LOGIN_CARD,
  LOGIN_COLORS,
  LOGIN_GRADIENT_LEFT,
  LOGIN_GRADIENT_MAIN,
  LOGIN_GRADIENT_RIGHT,
  LOGIN_TYPE,
} from "@/lib/login/designTokens"
import { cn } from "@/lib/utils"

function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const callbackError = searchParams.get("error")
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
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
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

      router.replace("/home")
    } catch {
      setError("Error al iniciar sesión")
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
      setError("Error al iniciar sesión con Google")
      setGoogleLoading(false)
    }
  }

  const inputClassName = cn(
    "h-[46px] w-full rounded-[10px] border bg-transparent pl-10 shadow-none",
    LOGIN_TYPE.fieldInput,
    "focus-visible:border-[#e2e8f0] focus-visible:ring-0",
  )

  return (
    <div
      className="relative min-h-screen text-white"
      style={{ backgroundImage: LOGIN_GRADIENT_MAIN }}
    >
      <main className="grid min-h-screen lg:grid-cols-[901.5fr_997.5fr]">
        <section
          className="relative hidden min-h-screen overflow-hidden lg:block"
          style={{ backgroundImage: LOGIN_GRADIENT_LEFT }}
        >
          <div className="absolute inset-0 opacity-30">
            <Image
              src="/login/hero-bg.jpg"
              alt=""
              fill
              priority
              className="object-cover"
              sizes="50vw"
            />
          </div>

          <div className="relative flex min-h-screen flex-col">
            <div className="flex flex-1 flex-col justify-center pl-24 pr-16">
              <div className="w-full max-w-[576px]">
                <div className="mb-10 flex items-center gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-white/10 px-2.5">
                    <BuiltItIsoIcon className="size-7 text-white" />
                  </div>
                  <span className={LOGIN_TYPE.brand}>{BRAND_NAME}</span>
                </div>

                <div className="flex flex-col gap-6">
                  <h1 className={LOGIN_TYPE.heroTitle}>
                    Seguimiento de obra claro, centralizado y en tiempo real
                  </h1>
                  <p
                    className={cn(LOGIN_TYPE.heroBody)}
                    style={{ color: LOGIN_COLORS.subtitle }}
                  >
                    Gestiona tus proyectos de construcción con total visibilidad.
                    Monitorea avances, coordina equipos y mantén informados a tus
                    clientes desde una sola plataforma.
                  </p>
                </div>
              </div>
            </div>

            <p
              className={cn("pb-16 pl-24", LOGIN_TYPE.heroFooter)}
              style={{ color: LOGIN_COLORS.footer }}
            >
              Desarrollado por Elemental Haus
            </p>
          </div>
        </section>

        <section
          className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10 lg:px-16 xl:px-20"
          style={{ backgroundImage: LOGIN_GRADIENT_RIGHT }}
        >
          <div
            className="flex w-full flex-col items-center"
            style={{ maxWidth: LOGIN_CARD.maxWidth }}
          >
            <div className="mb-6 flex items-center gap-3 self-start lg:hidden">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-white/10 px-2.5">
                <BuiltItIsoIcon className="size-7 text-white" />
              </div>
              <span className={LOGIN_TYPE.brand}>{BRAND_NAME}</span>
            </div>

            <div
              className="w-full rounded-[16px] border bg-white shadow-[0_20px_12.5px_rgba(0,0,0,0.1),0_8px_5px_rgba(0,0,0,0.1)]"
              style={{ borderColor: LOGIN_COLORS.inputBorder }}
            >
              <div
                className="flex flex-col gap-4"
                style={{
                  paddingLeft: LOGIN_CARD.paddingX,
                  paddingRight: LOGIN_CARD.paddingX,
                  paddingTop: LOGIN_CARD.paddingTop,
                  paddingBottom: LOGIN_CARD.paddingBottom,
                }}
              >
                <h2
                  className={LOGIN_TYPE.cardTitle}
                  style={{ color: LOGIN_COLORS.title }}
                >
                  Inicia sesión en tu cuenta
                </h2>

                {(mergedBanner || error) ? (
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
                    <div className="relative h-[46px]">
                      <Mail
                        className="pointer-events-none absolute top-[15px] left-3 size-4 text-[#64748b]"
                        aria-hidden
                      />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@ejemplo.com"
                        aria-invalid={Boolean(fieldErrors.email)}
                        className={cn(
                          inputClassName,
                          "placeholder:text-[rgba(10,10,10,0.5)]",
                          fieldErrors.email && "border-red-400",
                        )}
                        style={{
                          backgroundColor: LOGIN_COLORS.inputBg,
                          borderColor: fieldErrors.email
                            ? undefined
                            : LOGIN_COLORS.inputBorder,
                          color: "#0a0a0a",
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
                    <div className="relative h-[46px]">
                      <Lock
                        className="pointer-events-none absolute top-[15px] left-3 size-4 text-[#64748b]"
                        aria-hidden
                      />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        aria-invalid={Boolean(fieldErrors.password)}
                        className={cn(
                          inputClassName,
                          "placeholder:text-[rgba(10,10,10,0.5)]",
                          fieldErrors.password && "border-red-400",
                        )}
                        style={{
                          backgroundColor: LOGIN_COLORS.inputBg,
                          borderColor: fieldErrors.password
                            ? undefined
                            : LOGIN_COLORS.inputBorder,
                          color: "#0a0a0a",
                        }}
                      />
                    </div>
                    {fieldErrors.password ? (
                      <p className="text-sm text-red-600">{fieldErrors.password}</p>
                    ) : null}
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
                    {isLoading ? "Ingresando…" : "Iniciar Sesión"}
                  </Button>

                  <div className="pt-3 text-center">
                    <Link
                      href="/recovery-password"
                      className={cn(LOGIN_TYPE.link, "hover:underline")}
                      style={{ color: LOGIN_COLORS.primary }}
                    >
                      No recuerdo mi contraseña
                    </Link>
                  </div>
                </form>
              </div>
            </div>

            <div className="mt-5 flex w-full flex-col items-center gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={googleLoading}
                onClick={handleGoogle}
                className="h-[44px] w-full rounded-[10px] border-white/20 bg-white/10 text-sm font-medium text-white hover:bg-white/15 hover:text-white"
              >
                {googleLoading ? "Redirigiendo…" : "Continuar con Google"}
              </Button>

              <p className="text-center text-sm text-[#bedbff]">
                ¿No tenés cuenta?{" "}
                <Link href="/register" className="font-medium text-white hover:underline">
                  Registrarse
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default withGuestAuth(LoginPage)
