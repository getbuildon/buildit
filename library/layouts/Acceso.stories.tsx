import { useEffect, useState, type FormEvent } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { ArrowLeft, Mail, MailCheck } from "lucide-react"
import { Avatar } from "../atoms/avatar/Avatar"
import { Button } from "../atoms/button/Button"
import { Icon } from "../atoms/icon/Icon"
import { Link } from "../atoms/link/Link"
import { Logo } from "../atoms/logo/Logo"
import { Spinner } from "../atoms/spinner/Spinner"
import { CodeField } from "../molecules/code-field/CodeField"
import { Field } from "../molecules/field/Field"
import { InputGroup } from "../molecules/input-group/InputGroup"
import { Notice } from "../molecules/notice/Notice"
import { PasswordInput } from "../molecules/password-input/PasswordInput"
import { AuthCard, AuthHero, MessageCard } from "../organisms/auth/Auth"
import { AuthLayout, CenteredLayout } from "./auth/AuthLayout"

/* Pantallas de acceso de BuildOn, armadas con la librería. Mismo contenido y misma
   forma que la app (components/auth), con los arreglos de buenas prácticas. */

const HERO_IMAGE = "/login/hero-bg.jpg"

const heroes = {
  equipo: {
    title: "Seguimiento de obra claro, centralizado y en tiempo real.",
    highlight: "centralizado",
    subtitle:
      "Gestiona tus proyectos de construcción con total visibilidad. Monitorea avances, coordina equipos y mantén informados a tus clientes desde una sola plataforma.",
  },
  cliente: {
    title: "Seguí el avance de tu inversión con total transparencia.",
    highlight: "transparencia",
    subtitle: "Consultá el progreso de tus unidades, recibí novedades y accedé a toda la información del proyecto desde un solo lugar.",
  },
} as const

type Audience = keyof typeof heroes

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

function passwordError(password: string): string | undefined {
  if (!password.trim()) return "Escribí una contraseña."
  if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres."
  if (!/[a-z]/.test(password)) return "Incluí al menos una letra minúscula (a-z)."
  if (!/[A-Z]/.test(password)) return "Incluí al menos una letra mayúscula (A-Z)."
  if (!/[0-9]/.test(password)) return "Incluí al menos un número (0-9)."
  if (!/[^a-zA-Z0-9]/.test(password)) return "Incluí al menos un carácter especial (por ejemplo: ! @ # $ %)."
  return undefined
}

const PASSWORD_HINT = "Mínimo 8 caracteres, con mayúsculas, minúsculas, un número y un carácter especial."

/* ------------------------------------------------------------------ Piezas comunes */

/** Arriba de la card en celular (logo) y tablet (logo y frase). Tinta oscura sobre el naranja. */
function Intro({ audience }: { audience: Audience }) {
  return (
    <>
      <Logo size="md" className="text-action-ink" />
      <p className="hidden max-w-auth text-title text-action-ink md:block">{heroes[audience].title}</p>
    </>
  )
}

function Screen({ audience = "equipo", children, belowCard }: { audience?: Audience; children: React.ReactNode; belowCard?: React.ReactNode }) {
  const hero = heroes[audience]
  return (
    <AuthLayout
      hero={<AuthHero imageSrc={HERO_IMAGE} title={hero.title} highlight={hero.highlight} subtitle={hero.subtitle} footer="Desarrollado por Elemental Haus" logoHref="#inicio" />}
      intro={<Intro audience={audience} />}
      belowCard={belowCard}
    >
      {children}
    </AuthLayout>
  )
}

function EmailField({ value, onChange, error }: { value: string; onChange: (value: string) => void; error?: string }) {
  return (
    <Field label="Correo electrónico" error={error}>
      <InputGroup
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="off"
        spellCheck={false}
        placeholder="tu@ejemplo.com"
        start={<Icon icon={Mail} />}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\s/g, ""))}
      />
    </Field>
  )
}

/* ------------------------------------------------------------------ Ingresar */

function Login({ audience, initialError }: { audience: Audience; initialError?: string }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [error, setError] = useState(initialError)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(undefined)
    const next = {
      email: !email.trim() ? "Escribí tu correo electrónico." : !isEmail(email) ? "Ingresá un correo electrónico válido." : undefined,
      password: !password ? "Escribí tu contraseña." : undefined,
    }
    setErrors(next)
    if (next.email || next.password) return
    setLoading(true)
    await wait(900)
    setLoading(false)
    if (password !== "Obra2026!") {
      setError("El correo o la contraseña no son correctos.")
      return
    }
    setDone(true)
  }

  return (
    <Screen audience={audience}>
      <AuthCard title="Iniciá sesión en tu cuenta">
        {error ? <Notice tone="danger">{error}</Notice> : null}
        {done ? <Notice tone="ok">Listo: en la app, acá entrarías a {audience === "cliente" ? "tu portal" : "tus obras"}.</Notice> : null}
        <form className="flex flex-col gap-group" noValidate onSubmit={submit}>
          <EmailField value={email} onChange={setEmail} error={errors.email} />
          <Field label="Contraseña" error={errors.password}>
            <PasswordInput autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </Field>
          <Button type="submit" variant="ink" fullWidth loading={loading} loadingLabel="Ingresando">
            Iniciar sesión
          </Button>
          <p className="pt-compact text-center text-body">
            <Link href="#recuperar" tone="ink" className="no-underline hover:underline">
              No recuerdo mi contraseña
            </Link>
          </p>
        </form>
      </AuthCard>
    </Screen>
  )
}

/* ------------------------------------------------------------------ Recuperar */

function RecoveryRequest() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const message = !email.trim() ? "Escribí tu correo electrónico." : !isEmail(email) ? "Ingresá un correo electrónico válido." : undefined
    setError(message)
    if (message) return
    setLoading(true)
    await wait(900)
    setLoading(false)
    setSent(true)
  }

  if (sent) return <RecoveryCode email={email} />

  return (
    <Screen>
      <AuthCard title="Recuperar contraseña" description="Ingresá tu correo electrónico y te enviaremos un código para elegir una contraseña nueva.">
        <form className="flex flex-col gap-group" noValidate onSubmit={submit}>
          <EmailField value={email} onChange={setEmail} error={error} />
          <Button type="submit" variant="ink" fullWidth loading={loading} loadingLabel="Enviando">
            Enviar código
          </Button>
          <p className="pt-compact text-center text-body">
            <Link href="#ingresar" tone="ink" className="no-underline hover:underline">
              Volver al inicio de sesión
            </Link>
          </p>
        </form>
      </AuthCard>
    </Screen>
  )
}

/** Paso del código (como en la app): el código correcto de la demo es 123456. */
function RecoveryCode({ email = "lucia@constructora.com", initialError }: { email?: string; initialError?: string }) {
  const [code, setCode] = useState("")
  const [error, setError] = useState(initialError)
  const [loading, setLoading] = useState(false)
  const [resendIn, setResendIn] = useState(60)
  const [resent, setResent] = useState(false)
  const [ok, setOk] = useState(false)

  useEffect(() => {
    if (resendIn <= 0) return
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendIn])

  const verify = async (value: string) => {
    if (value.length !== 6) {
      setError("Escribí los 6 dígitos del código.")
      return
    }
    setLoading(true)
    await wait(700)
    setLoading(false)
    if (value !== "123456") {
      setError("El código no es correcto o ya venció. Revisalo o pedí otro.")
      return
    }
    setOk(true)
  }

  if (ok) return <RecoveryNewPassword />

  return (
    <Screen>
      <AuthCard
        title="Revisá tu correo"
        description={
          <>
            Si existe una cuenta con <strong className="text-ink">{email}</strong>, te enviamos un código de 6 dígitos. Escribilo acá para elegir una contraseña nueva.
          </>
        }
      >
        {resent ? <Notice tone="ok">Te enviamos un código nuevo. El anterior ya no sirve.</Notice> : null}
        <form
          className="flex flex-col gap-group"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            void verify(code)
          }}
        >
          <CodeField
            value={code}
            disabled={loading}
            description="Vence en 1 hora. Si no lo ves, revisá la carpeta de correo no deseado."
            error={error}
            onChange={(value) => {
              setCode(value)
              setError(undefined)
            }}
            onComplete={(value) => void verify(value)}
          />
          <Button type="submit" variant="ink" fullWidth loading={loading} loadingLabel="Verificando">
            Continuar
          </Button>
          <Button
            variant="ghost"
            fullWidth
            disabled={resendIn > 0}
            onClick={() => {
              setResent(true)
              setCode("")
              setResendIn(60)
            }}
          >
            {resendIn > 0 ? `Reenviar el código en ${resendIn} s` : "Reenviar el código"}
          </Button>
          <p className="text-center text-body">
            <Link href="#recuperar" tone="ink" className="no-underline hover:underline">
              Usar otro correo
            </Link>
          </p>
        </form>
        <Link href="#ingresar" tone="ink" className="self-center no-underline hover:underline">
          <Icon icon={ArrowLeft} /> Volver al inicio de sesión
        </Link>
      </AuthCard>
    </Screen>
  )
}

function RecoveryNewPassword() {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next = {
      password: passwordError(password),
      confirm: !confirm ? "Confirmá tu contraseña." : confirm !== password ? "Las contraseñas no coinciden." : undefined,
    }
    setErrors(next)
    if (next.password || next.confirm) return
    setLoading(true)
    await wait(900)
    setLoading(false)
    setDone(true)
  }

  return (
    <Screen>
      <AuthCard title="Nueva contraseña" description="Elegí una contraseña nueva para tu cuenta.">
        {done ? <Notice tone="ok">Contraseña actualizada. Entrando…</Notice> : null}
        <form className="flex flex-col gap-group" noValidate onSubmit={submit}>
          <Field label="Nueva contraseña" description={PASSWORD_HINT} error={errors.password}>
            <PasswordInput autoComplete="new-password" value={password} disabled={done} onChange={(event) => setPassword(event.target.value)} />
          </Field>
          <Field label="Confirmar contraseña" error={errors.confirm}>
            <PasswordInput autoComplete="new-password" value={confirm} disabled={done} onChange={(event) => setConfirm(event.target.value)} />
          </Field>
          <Button type="submit" variant="ink" fullWidth loading={loading} loadingLabel="Guardando" disabled={done}>
            Guardar contraseña
          </Button>
        </form>
      </AuthCard>
    </Screen>
  )
}

function RecoveryInvalid() {
  return (
    <Screen>
      <AuthCard title="Enlace inválido">
        <Notice tone="danger">El enlace de recuperación es inválido o expiró. Solicitá uno nuevo.</Notice>
        <Button asChild variant="ink" fullWidth>
          <a href="#recuperar">Solicitar un nuevo enlace</a>
        </Button>
      </AuthCard>
    </Screen>
  )
}

function RecoveryChecking() {
  return (
    <Screen>
      <AuthCard title="Verificando enlace">
        <p className="flex items-center gap-compact text-body text-ink-muted" aria-live="polite">
          <Spinner label="Verificando enlace" /> Estamos revisando que el enlace sea válido…
        </p>
      </AuthCard>
    </Screen>
  )
}

/* ------------------------------------------------------------------ Confirmar registro e invitaciones */

function RegisterConfirm() {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({})
  const [loading, setLoading] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next = {
      password: passwordError(password),
      confirm: !confirm ? "Confirmá tu contraseña." : confirm !== password ? "Las contraseñas no coinciden." : undefined,
    }
    setErrors(next)
    if (next.password || next.confirm) return
    setLoading(true)
    await wait(900)
    setLoading(false)
  }
  return (
    <CenteredLayout dimmed>
      <MessageCard
        media={<Avatar name="Lucía Fernández" size="xl" tone="naranja" />}
        title="¡Hola Lucía!"
        description="Confirmá tu registro creando una contraseña para acceder a BuildOn."
      >
        <form className="flex flex-col gap-group" noValidate onSubmit={submit}>
          <Field label="Crear contraseña" required description={PASSWORD_HINT} error={errors.password}>
            <PasswordInput autoComplete="new-password" withIcon={false} value={password} onChange={(event) => setPassword(event.target.value)} />
          </Field>
          <Field label="Confirmar contraseña" required error={errors.confirm}>
            <PasswordInput autoComplete="new-password" withIcon={false} value={confirm} onChange={(event) => setConfirm(event.target.value)} />
          </Field>
          <Button type="submit" variant="ink" fullWidth loading={loading} loadingLabel="Guardando">
            Confirmar registro
          </Button>
        </form>
      </MessageCard>
    </CenteredLayout>
  )
}

function InviteMessage({ title, description }: { title: string; description: string }) {
  return (
    <CenteredLayout>
      <MessageCard media={<Icon icon={MailCheck} size="lg" className="text-ink-muted" />} title={title} description={description}>
        <Link href="#ingresar" className="self-center">
          Ir al inicio de sesión
        </Link>
      </MessageCard>
    </CenteredLayout>
  )
}

const meta = { title: "Pantallas/Acceso", parameters: { layout: "fullscreen" } } satisfies Meta

export default meta

export const IngresarEquipo: StoryObj = { name: "Ingresar · equipo", render: () => <Login audience="equipo" /> }
export const IngresarClientes: StoryObj = { name: "Ingresar · clientes", render: () => <Login audience="cliente" /> }
export const IngresarError: StoryObj = { name: "Ingresar · con error", render: () => <Login audience="equipo" initialError="No pudimos completar el inicio de sesión. Intentá de nuevo." /> }
export const RecuperarPedir: StoryObj = { name: "Recuperar · pedir enlace", render: () => <RecoveryRequest /> }
export const RecuperarCodigo: StoryObj = { name: "Recuperar · código", render: () => <RecoveryCode /> }
export const RecuperarCodigoError: StoryObj = {
  name: "Recuperar · código incorrecto",
  render: () => <RecoveryCode initialError="El código no es correcto o ya venció. Revisalo o pedí otro." />,
}
export const RecuperarVerificando: StoryObj = { name: "Recuperar · verificando", render: () => <RecoveryChecking /> }
export const RecuperarNueva: StoryObj = { name: "Recuperar · nueva contraseña", render: () => <RecoveryNewPassword /> }
export const RecuperarInvalido: StoryObj = { name: "Recuperar · enlace inválido", render: () => <RecoveryInvalid /> }
export const ConfirmarRegistro: StoryObj = { name: "Confirmar registro", render: () => <RegisterConfirm /> }
export const InvitacionNoValida: StoryObj = {
  name: "Invitación no válida",
  render: () => (
    <InviteMessage
      title="Invitación no válida"
      description="El enlace expiró, ya fue usado o no coincide con tu sesión. Abrí el correo de invitación nuevamente o pedí una nueva invitación al administrador del proyecto."
    />
  ),
}
export const SesionIncorrecta: StoryObj = {
  name: "Sesión incorrecta",
  render: () => (
    <InviteMessage title="Sesión incorrecta" description="Esta invitación es para juan.perez@mail.com. Cerrá sesión e ingresá con ese correo para aceptarla." />
  ),
}
