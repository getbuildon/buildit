"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import { Eye, EyeOff, Lock, Mail } from "lucide-react"
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
  LOGIN_COLORS,
  LOGIN_GRADIENT_LEFT,
  LOGIN_TYPE,
} from "@/lib/login/designTokens"
import {
  isValidEmail,
  sanitizeEmailInput,
} from "@/lib/landing/emailInput"
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

  const inputClassName = cn(
    "h-[46px] w-full rounded-[10px] border bg-transparent pl-10 shadow-none",
    LOGIN_TYPE.fieldInput,
    "placeholder:text-[#696E77] focus-visible:ring-0",
  )

  const passwordInputClassName = cn(inputClassName, "pr-10")

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: LOGIN_BG }}>
      <main className="grid min-h-screen lg:grid-cols-[902fr_997fr]">
        {/* Left panel — desktop */}
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

          <div className="relative flex min-h-screen flex-col px-12 pb-16 pt-16 xl:px-20 xl:pb-20 xl:pt-20">
            <div className="flex flex-1 flex-col justify-center pr-8 xl:pr-[120px]">
              <Image
                src="/logo-build-on.svg"
                alt="BuildOn"
                width={200}
                height={42}
                priority
                className="mb-12 h-[42px] w-auto self-start xl:mb-20"
              />

              <div className="flex flex-col gap-5 xl:gap-6">
                <h1
                  className="font-recoleta text-[40px] font-normal leading-[1.05] xl:text-[64px] xl:leading-[67.2px]"
                  style={{ color: LOGIN_COLORS.heroText }}
                >
                  Seguimiento de obra claro,{" "}
                  <span style={{ color: LOGIN_ACCENT }}>centralizado</span> y en
                  tiempo real.
                </h1>
                <p
                  className="text-[17px] font-normal leading-[26px] tracking-[0.3px] xl:text-[20px] xl:leading-[28px] xl:tracking-[0.4px]"
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
        <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 sm:px-8 sm:py-12 md:px-10 md:py-14 lg:px-6 lg:py-12">
          {/* Circle decoration */}
          <Image
            src="/login/circle-decoration.svg"
            alt=""
            width={931}
            height={1011}
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 hidden w-[min(92vw,680px)] max-w-none -translate-x-1/2 -translate-y-1/2 select-none opacity-35 md:block lg:w-[931px] lg:opacity-100"
          />

          <div className="relative mx-auto w-full max-w-[446px] sm:max-w-[480px] md:max-w-[520px] lg:max-w-[446px]">
            {/* Tablet hero copy */}
            <div className="mb-8 hidden text-center md:block lg:hidden">
              <Image
                src="/logo-build-on.svg"
                alt="BuildOn"
                width={200}
                height={42}
                className="mx-auto mb-6 h-[42px] w-auto"
              />
              <h1
                className="font-recoleta text-[32px] font-normal leading-[1.1] text-white sm:text-[36px]"
              >
                Seguimiento de obra claro,{" "}
                <span className="text-[#212225]">centralizado</span> y en tiempo
                real.
              </h1>
              <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-white/95">
                Gestiona tus proyectos con visibilidad total desde una sola
                plataforma.
              </p>
            </div>

            {/* Mobile logo */}
            <Image
              src="/logo-build-on.svg"
              alt="BuildOn"
              width={200}
              height={42}
              className="mx-auto mb-6 h-[42px] w-auto md:hidden"
            />

            {/* Card */}
            <div className="w-full rounded-2xl bg-white px-6 py-10 shadow-[0_20px_50px_rgba(0,0,0,0.12)] sm:px-8 sm:py-12 md:px-10 md:py-14 lg:px-8 lg:py-14">
              <div className="flex flex-col gap-5 sm:gap-6">
                <h2
                  className="font-recoleta text-[24px] font-normal leading-[1.15] sm:text-[26px] md:text-[28px] md:leading-[29.4px]"
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
                        inputMode="email"
                        autoComplete="email"
                        spellCheck={false}
                        value={email}
                        onChange={(e) => setEmail(sanitizeEmailInput(e.target.value))}
                        placeholder="tu@ejemplo.com"
                        aria-invalid={Boolean(fieldErrors.email)}
                        className={cn(
                          inputClassName,
                          "pr-4",
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
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        aria-invalid={Boolean(fieldErrors.password)}
                        className={cn(
                          passwordInputClassName,
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
                      <button
                        type="button"
                        className="absolute top-[15px] right-3 text-[#696E77]"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={
                          showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" aria-hidden />
                        ) : (
                          <Eye className="size-4" aria-hidden />
                        )}
                      </button>
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
