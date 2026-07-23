"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import { Lock, Mail } from "lucide-react"
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
  LOGIN_ACCENT,
  LOGIN_BG,
  LOGIN_CARD,
  LOGIN_COLORS,
  LOGIN_GRADIENT_LEFT,
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

      router.replace(safeNextPath)
    } catch {
      setError("Error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  const inputClassName = cn(
    "h-[46px] w-full rounded-[10px] border bg-transparent pl-10 pr-4 shadow-none",
    LOGIN_TYPE.fieldInput,
    "placeholder:text-[#696E77] focus-visible:ring-0",
  )

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: LOGIN_BG }}>
      <main className="grid min-h-screen lg:grid-cols-[902fr_997fr]">
        {/* Left panel */}
        <section className="relative hidden min-h-screen overflow-hidden lg:flex lg:flex-col">
          <div className="absolute inset-0">
            <Image
              src="/login/hero-bg.jpg"
              alt=""
              fill
              priority
              className="object-cover grayscale"
              sizes="50vw"
            />
          </div>
          <div
            className="absolute inset-0"
            style={{ backgroundImage: LOGIN_GRADIENT_LEFT }}
          />

          <div className="relative flex min-h-screen flex-col px-20 pb-20 pt-20">
            <div className="flex flex-1 flex-col justify-center pr-[120px]">
              <Image
                src="/logo-build-on.svg"
                alt="BuildOn"
                width={200}
                height={42}
                priority
                className="mb-20 h-[42px] w-auto self-start"
              />

              <div className="flex flex-col gap-6">
                <h1
                  className={LOGIN_TYPE.heroTitle}
                  style={{ color: LOGIN_COLORS.heroText }}
                >
                  Seguimiento de obra claro,{" "}
                  <span style={{ color: LOGIN_ACCENT }}>centralizado</span> y en
                  tiempo real.
                </h1>
                <p
                  className={LOGIN_TYPE.heroBody}
                  style={{ color: LOGIN_COLORS.heroText }}
                >
                  Gestiona tus proyectos de construcción con total visibilidad.
                  Monitorea avances, coordina equipos y mantén informados a tus
                  clientes desde una sola plataforma.
                </p>
              </div>
            </div>

            <p
              className={LOGIN_TYPE.heroFooter}
              style={{ color: LOGIN_COLORS.footer }}
            >
              Desarrollado por Elemental Haus
            </p>
          </div>
        </section>

        {/* Right panel */}
        <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
          {/* Circle decoration */}
          <Image
            src="/login/circle-decoration.svg"
            alt=""
            width={931}
            height={1011}
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 hidden w-[931px] max-w-none -translate-x-1/2 -translate-y-1/2 select-none lg:block"
          />

          <div
            className="relative w-full"
            style={{ maxWidth: LOGIN_CARD.maxWidth }}
          >
            {/* Mobile logo */}
            <Image
              src="/logo-build-on.svg"
              alt="BuildOn"
              width={200}
              height={42}
              className="mb-6 h-[42px] w-auto lg:hidden"
            />

            {/* Card */}
            <div
              className="w-full rounded-2xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.12)]"
              style={{
                paddingLeft: LOGIN_CARD.paddingX,
                paddingRight: LOGIN_CARD.paddingX,
                paddingTop: LOGIN_CARD.paddingTop,
                paddingBottom: LOGIN_CARD.paddingBottom,
              }}
            >
              <div className="flex flex-col gap-6">
                <h2
                  className={LOGIN_TYPE.cardTitle}
                  style={{ color: LOGIN_COLORS.title }}
                >
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

                <form
                  className="flex flex-col gap-4"
                  noValidate
                  onSubmit={handleSubmit}
                >
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
                        className="pointer-events-none absolute left-3 top-[15px] size-4"
                        style={{ color: LOGIN_COLORS.placeholder }}
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
                          fieldErrors.email && "border-red-400",
                        )}
                        style={{
                          backgroundColor: LOGIN_COLORS.inputBg,
                          borderColor: fieldErrors.email
                            ? undefined
                            : LOGIN_COLORS.inputBorder,
                          color: LOGIN_COLORS.title,
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
                        className="pointer-events-none absolute left-3 top-[15px] size-4"
                        style={{ color: LOGIN_COLORS.placeholder }}
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
                          fieldErrors.password && "border-red-400",
                        )}
                        style={{
                          backgroundColor: LOGIN_COLORS.inputBg,
                          borderColor: fieldErrors.password
                            ? undefined
                            : LOGIN_COLORS.inputBorder,
                          color: LOGIN_COLORS.title,
                        }}
                      />
                    </div>
                    {fieldErrors.password ? (
                      <p className="text-sm text-red-600">
                        {fieldErrors.password}
                      </p>
                    ) : null}
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className={cn(
                      "h-[44px] w-full rounded-[10px] py-2.5 hover:opacity-90",
                      LOGIN_TYPE.button,
                    )}
                    style={{
                      backgroundColor: LOGIN_COLORS.buttonBg,
                      color: "#ffffff",
                    }}
                  >
                    {isLoading ? "Ingresando…" : "Iniciar Sesión"}
                  </Button>

                  <div className="pt-3 text-center">
                    <Link
                      href="/recovery-password"
                      className={cn(LOGIN_TYPE.link, "hover:underline")}
                      style={{ color: LOGIN_COLORS.label }}
                    >
                      No recuerdo mi contraseña
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default withGuestAuth(LoginPage)
