"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Camera, Check, Lock, Mail, User, X, type LucideIcon } from "lucide-react"
import { useEffect, useId, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react"

import { Avatar } from "@/library/atoms/avatar/Avatar"
import { Badge } from "@/library/atoms/badge/Badge"
import { Button } from "@/library/atoms/button/Button"
import { Icon } from "@/library/atoms/icon/Icon"
import { Input } from "@/library/atoms/input/Input"
import { Skeleton } from "@/library/atoms/skeleton/Skeleton"
import { Spinner } from "@/library/atoms/spinner/Spinner"
import { cn } from "@/library/lib/cn"
import { Field } from "@/library/molecules/field/Field"
import { InputGroup } from "@/library/molecules/input-group/InputGroup"
import { Notice } from "@/library/molecules/notice/Notice"
import { PasswordInput } from "@/library/molecules/password-input/PasswordInput"

import { getProfileData, updateProfileData } from "@/app/project/[projectId]/perfil/actions"
import { useAppRouteNavigation } from "@/components/navigation/AppRouteLoadingProvider"
import { useAuth } from "@/context/AuthContextSupabase"
import { AVISO_SIN_SENAL_PARA_CAMBIOS, useEnLinea } from "@/lib/api/useEnLinea"
import { updateEmailClient, updatePasswordClient, verifyCurrentPasswordClient } from "@/lib/auth/clientAuth"
import { PASSWORD_REQUIREMENTS_HINT, validateNewPasswordFields } from "@/lib/auth/passwordValidation"
import { compressProfileAvatar, uploadProfileAvatar } from "@/lib/profile/profileAvatar.client"

/*
 * Mi perfil: datos personales y foto, correo y contraseña.
 * Se usa fuera de una obra (/perfil, con «Volver») y dentro de una obra (…/perfil).
 * Solo dibuja el contenido: el marco de la página lo pone quien lo usa.
 */

type Aviso = { tipo: "ok" | "error"; mensaje: string } | null

type ErroresDeContrasena = { actual?: string; nueva?: string; confirmacion?: string }

const VOLVER_A = "/home"

/** Mensaje de resultado debajo del formulario. El de error se anuncia apenas aparece. */
function LineaDeAviso({ aviso }: { aviso: Aviso }) {
  if (!aviso) return null
  const ok = aviso.tipo === "ok"
  return (
    <p
      role={ok ? "status" : "alert"}
      className={cn("flex items-start gap-compact text-body", ok ? "text-fn-ok" : "text-fn-danger")}
    >
      <Icon icon={ok ? Check : X} size="xs" className="mt-1" />
      {aviso.mensaje}
    </p>
  )
}

/** Tarjeta con título e ícono; cada una es su propio formulario. */
function Tarjeta({
  icono,
  titulo,
  onSubmit,
  ocupada,
  children,
}: {
  icono: LucideIcon
  titulo: string
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  ocupada?: boolean
  children: ReactNode
}) {
  const id = useId()
  return (
    <form
      aria-labelledby={id}
      aria-busy={ocupada || undefined}
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-group rounded-surface border border-line bg-canvas-raised p-group shadow-hint sm:p-block"
    >
      <h2 id={id} className="flex items-center gap-compact text-section font-regular text-ink">
        <Icon icon={icono} className="text-action" />
        {titulo}
      </h2>
      {children}
    </form>
  )
}

/** «Volver» al inicio, con la misma carga de ruta que el resto de la app. */
function Volver() {
  const { navigate } = useAppRouteNavigation()
  return (
    <Button asChild variant="ghost" size="compact" className="self-start">
      <Link
        href={VOLVER_A}
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey) return
          event.preventDefault()
          navigate(VOLVER_A)
        }}
      >
        <Icon icon={ArrowLeft} size="xs" /> Volver
      </Link>
    </Button>
  )
}

/** Mientras cargan los datos: la forma de la pantalla, sin contenido. */
function MiPerfilCargando({ showBackButton }: { showBackButton: boolean }) {
  return (
    <div aria-busy="true" aria-label="Cargando tu perfil" className="mx-auto flex w-full max-w-reading flex-col gap-5.5">
      {showBackButton ? <Skeleton className="h-8 w-24" /> : null}
      <div className="flex flex-col gap-compact">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-[min(100%,320px)]" />
      </div>
      <div className="flex flex-col gap-group rounded-surface border border-line bg-canvas-raised p-group sm:p-block">
        <Skeleton className="h-6 w-48" />
        <div className="flex items-center gap-group">
          <Skeleton shape="circle" className="size-16 shrink-0" />
          <div className="flex flex-1 flex-col gap-compact">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <div className="grid gap-snug sm:grid-cols-2">
          <Skeleton className="h-control" />
          <Skeleton className="h-control" />
        </div>
        <Skeleton className="h-control" />
      </div>
      {[0, 1].map((indice) => (
        <div key={indice} className="flex flex-col gap-group rounded-surface border border-line bg-canvas-raised p-group sm:p-block">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-control" />
        </div>
      ))}
    </div>
  )
}

export function MiPerfil({ projectId, showBackButton = false }: { projectId?: string; showBackButton?: boolean }) {
  const router = useRouter()
  const { user, loading: cargandoSesion, refreshSession } = useAuth()
  const enLinea = useEnLinea()
  const sinSenal = !enLinea

  // Datos personales y foto
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [telefono, setTelefono] = useState("")
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)
  const [rolInsignia, setRolInsignia] = useState<string | null>(null)
  const [rolNombre, setRolNombre] = useState<string | null>(null)
  // Para qué usuario y obra ya se trajeron los datos (así, al cambiar de obra, vuelve a cargar).
  const [cargadoPara, setCargadoPara] = useState<string | null>(null)
  const [guardandoPerfil, setGuardandoPerfil] = useState(false)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [avisoPerfil, setAvisoPerfil] = useState<Aviso>(null)
  const [avisoFoto, setAvisoFoto] = useState<Aviso>(null)

  // Correo
  const [correo, setCorreo] = useState(user?.email ?? "")
  const [guardandoCorreo, setGuardandoCorreo] = useState(false)
  const [avisoCorreo, setAvisoCorreo] = useState<Aviso>(null)

  // Contraseña
  const [contrasenaActual, setContrasenaActual] = useState("")
  const [contrasenaNueva, setContrasenaNueva] = useState("")
  const [confirmacion, setConfirmacion] = useState("")
  const [cambiandoContrasena, setCambiandoContrasena] = useState(false)
  const [erroresContrasena, setErroresContrasena] = useState<ErroresDeContrasena>({})
  const [avisoContrasena, setAvisoContrasena] = useState<Aviso>(null)

  useEffect(() => {
    if (cargandoSesion || !user?.id) return

    const clave = `${user.id}:${projectId ?? ""}`
    let cancelado = false
    void getProfileData(projectId)
      .then((datos) => {
        if (cancelado || !datos) return
        setNombre(datos.first_name)
        setApellido(datos.last_name)
        setTelefono(datos.phone || "")
        setCorreo(datos.email)
        setFotoUrl(datos.avatar_url)
        setRolInsignia(datos.role_badge)
        setRolNombre(datos.role_label)
      })
      .finally(() => {
        if (!cancelado) setCargadoPara(clave)
      })
    return () => {
      cancelado = true
    }
  }, [user?.id, projectId, cargandoSesion])

  const perfilListo = !user?.id || cargadoPara === `${user.id}:${projectId ?? ""}`
  if (cargandoSesion || !perfilListo) {
    return <MiPerfilCargando showBackButton={showBackButton} />
  }

  const nombreCompleto =
    [nombre.trim(), apellido.trim()].filter(Boolean).join(" ") || user?.email?.split("@")[0] || "Usuario"

  const alElegirFoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0]
    event.target.value = ""
    if (!archivo || !user?.id) return
    if (sinSenal) {
      setAvisoFoto({ tipo: "error", mensaje: AVISO_SIN_SENAL_PARA_CAMBIOS })
      return
    }

    setAvisoFoto(null)
    setSubiendoFoto(true)
    try {
      const comprimida = await compressProfileAvatar(archivo)
      const resultado = await uploadProfileAvatar(user.id, comprimida)
      if (!resultado.ok) {
        setAvisoFoto({ tipo: "error", mensaje: resultado.error })
        return
      }
      setFotoUrl(resultado.publicUrl)
      setAvisoFoto({ tipo: "ok", mensaje: "Avatar actualizado correctamente." })
      router.refresh()
    } catch (error) {
      setAvisoFoto({
        tipo: "error",
        mensaje: error instanceof Error ? error.message : "No se pudo subir la imagen.",
      })
    } finally {
      setSubiendoFoto(false)
    }
  }

  const guardarPerfil = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAvisoPerfil(null)
    if (sinSenal) return

    if (!nombre.trim() || !apellido.trim()) {
      setAvisoPerfil({ tipo: "error", mensaje: "El nombre y apellido son obligatorios." })
      return
    }

    setGuardandoPerfil(true)
    const resultado = await updateProfileData(nombre, apellido, telefono || null)
    setGuardandoPerfil(false)

    if (resultado.ok) {
      setAvisoPerfil({ tipo: "ok", mensaje: "Perfil actualizado correctamente." })
      router.refresh()
    } else {
      setAvisoPerfil({ tipo: "error", mensaje: resultado.error })
    }
  }

  const guardarCorreo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAvisoCorreo(null)
    if (sinSenal) return

    const limpio = correo.trim()
    if (!limpio) {
      setAvisoCorreo({ tipo: "error", mensaje: "Ingresá un correo válido." })
      return
    }
    if (limpio === user?.email) {
      setAvisoCorreo({ tipo: "error", mensaje: "El correo es igual al actual." })
      return
    }

    setGuardandoCorreo(true)
    const resultado = await updateEmailClient(limpio)
    setGuardandoCorreo(false)

    if (resultado.error) {
      setAvisoCorreo({ tipo: "error", mensaje: resultado.error })
    } else {
      setAvisoCorreo({
        tipo: "ok",
        mensaje: "Te enviamos un correo de confirmación. El cambio se aplicará cuando lo confirmes.",
      })
    }
  }

  const cambiarContrasena = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAvisoContrasena(null)
    if (sinSenal) return

    // Se leen del formulario (y no solo del estado) por si el gestor de contraseñas los completó.
    const datos = new FormData(event.currentTarget)
    const actual = (datos.get("current-password") as string | null) ?? ""
    const nueva = (datos.get("new-password") as string | null) ?? ""
    const repetida = (datos.get("confirm-password") as string | null) ?? ""

    const validacion = validateNewPasswordFields(nueva, repetida)
    const errores: ErroresDeContrasena = {
      actual: actual.trim() ? undefined : "Ingresá tu contraseña actual.",
      nueva: validacion.errors.password || undefined,
      confirmacion: validacion.errors.confirmPassword || undefined,
    }
    setErroresContrasena(errores)
    if (errores.actual || !validacion.ok) return

    if (!user?.email) {
      setAvisoContrasena({ tipo: "error", mensaje: "No pudimos identificar tu cuenta. Volvé a iniciar sesión." })
      return
    }

    setCambiandoContrasena(true)
    const verificacion = await verifyCurrentPasswordClient(user.email, actual)
    if (verificacion.error) {
      setCambiandoContrasena(false)
      setAvisoContrasena({ tipo: "error", mensaje: verificacion.error })
      return
    }

    const resultado = await updatePasswordClient(nueva)
    setCambiandoContrasena(false)

    if (resultado.error) {
      setAvisoContrasena({ tipo: "error", mensaje: resultado.error })
    } else {
      setAvisoContrasena({ tipo: "ok", mensaje: "Contraseña actualizada correctamente." })
      setContrasenaActual("")
      setContrasenaNueva("")
      setConfirmacion("")
      await refreshSession()
    }
  }

  const fotoBloqueada = subiendoFoto || sinSenal
  const correoMostrado = user?.email ?? correo

  return (
    <div className="mx-auto flex w-full max-w-reading flex-col gap-5.5">
      {showBackButton ? <Volver /> : null}

      <div className="flex flex-col gap-0.5">
        <h1 className="text-heading text-ink">Mi Perfil</h1>
        <p className="text-body text-ink">Administrá tu información personal y tus credenciales</p>
      </div>

      {sinSenal ? <Notice tone="caution">{AVISO_SIN_SENAL_PARA_CAMBIOS}</Notice> : null}

      <Tarjeta icono={User} titulo="Información Personal" onSubmit={guardarPerfil} ocupada={guardandoPerfil}>
        <div className="flex items-center gap-group">
          {/* La foto se cambia tocando el círculo; la cámara lo indica a la vista. */}
          <label
            className={cn(
              "relative shrink-0 rounded-pill has-[input:focus-visible]:[box-shadow:var(--focus-ring)]",
              fotoBloqueada ? "cursor-not-allowed" : "cursor-pointer",
            )}
          >
            <Avatar name={nombreCompleto} src={fotoUrl} size="xl" tone="naranja" />
            {subiendoFoto ? (
              <span className="absolute inset-0 grid place-items-center rounded-pill bg-canvas-inverse/60 text-ink-inverse">
                <Spinner label="Subiendo la foto" />
              </span>
            ) : null}
            <span
              aria-hidden
              className="absolute -right-1 -bottom-1 grid size-7 place-items-center rounded-pill border-2 border-canvas-raised bg-canvas-inverse text-ink-inverse"
            >
              <Icon icon={Camera} size="xs" />
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              aria-label="Cambiar foto de perfil"
              disabled={fotoBloqueada}
              onChange={alElegirFoto}
            />
          </label>
          <div className="min-w-0 flex-1">
            <p className="truncate text-reading font-medium text-ink">{nombreCompleto}</p>
            <p className="truncate text-body text-ink-muted">{correoMostrado}</p>
            {rolInsignia || rolNombre ? (
              <p className="mt-related flex items-center gap-1.5">
                {rolInsignia ? (
                  <Badge tone="action" size="compact">
                    {rolInsignia}
                  </Badge>
                ) : null}
                {rolNombre ? <span className="text-meta text-ink">{rolNombre}</span> : null}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-snug sm:grid-cols-2">
          <Field
            label="Nombre"
            required
            error={avisoPerfil?.tipo === "error" && !nombre.trim() ? "Ingresá tu nombre." : undefined}
          >
            <Input
              value={nombre}
              autoComplete="given-name"
              disabled={guardandoPerfil}
              onChange={(event) => {
                setNombre(event.target.value)
                setAvisoPerfil(null)
              }}
            />
          </Field>
          <Field
            label="Apellido"
            required
            error={avisoPerfil?.tipo === "error" && !apellido.trim() ? "Ingresá tu apellido." : undefined}
          >
            <Input
              value={apellido}
              autoComplete="family-name"
              disabled={guardandoPerfil}
              onChange={(event) => {
                setApellido(event.target.value)
                setAvisoPerfil(null)
              }}
            />
          </Field>
        </div>
        <Field label="Teléfono" optional>
          <Input
            type="tel"
            value={telefono}
            autoComplete="tel"
            placeholder="+54 9 1234 567890"
            disabled={guardandoPerfil}
            onChange={(event) => {
              setTelefono(event.target.value)
              setAvisoPerfil(null)
            }}
          />
        </Field>

        <LineaDeAviso aviso={avisoFoto} />
        <LineaDeAviso aviso={avisoPerfil} />

        <Button type="submit" className="self-end" loading={guardandoPerfil} loadingLabel="Guardando" disabled={sinSenal}>
          {guardandoPerfil ? null : <Icon icon={Check} />}
          {guardandoPerfil ? "Guardando..." : "Guardar cambios"}
        </Button>
      </Tarjeta>

      <Tarjeta icono={Mail} titulo="Correo electrónico" onSubmit={guardarCorreo} ocupada={guardandoCorreo}>
        <Field label="Correo electrónico" error={avisoCorreo?.tipo === "error" ? avisoCorreo.mensaje : undefined}>
          <InputGroup
            type="email"
            start={<Icon icon={Mail} size="xs" />}
            value={correo}
            autoComplete="email"
            disabled={guardandoCorreo}
            onChange={(event) => {
              setCorreo(event.target.value)
              setAvisoCorreo(null)
            }}
          />
        </Field>
        {avisoCorreo?.tipo === "ok" ? <LineaDeAviso aviso={avisoCorreo} /> : null}
        <Button type="submit" className="self-end" loading={guardandoCorreo} loadingLabel="Guardando" disabled={sinSenal}>
          {guardandoCorreo ? null : <Icon icon={Check} />}
          {guardandoCorreo ? "Guardando..." : "Guardar correo"}
        </Button>
      </Tarjeta>

      <Tarjeta icono={Lock} titulo="Cambiar contraseña" onSubmit={cambiarContrasena} ocupada={cambiandoContrasena}>
        <Field label="Contraseña actual" required error={erroresContrasena.actual}>
          <PasswordInput
            name="current-password"
            autoComplete="current-password"
            value={contrasenaActual}
            disabled={cambiandoContrasena}
            onChange={(event) => {
              setContrasenaActual(event.target.value)
              setErroresContrasena((previos) => ({ ...previos, actual: undefined }))
              setAvisoContrasena(null)
            }}
          />
        </Field>
        <Field
          label="Contraseña nueva"
          required
          description={PASSWORD_REQUIREMENTS_HINT}
          error={erroresContrasena.nueva}
        >
          <PasswordInput
            name="new-password"
            autoComplete="new-password"
            value={contrasenaNueva}
            disabled={cambiandoContrasena}
            onChange={(event) => {
              setContrasenaNueva(event.target.value)
              setErroresContrasena((previos) => ({ ...previos, nueva: undefined }))
              setAvisoContrasena(null)
            }}
          />
        </Field>
        <Field label="Confirmar contraseña nueva" required error={erroresContrasena.confirmacion}>
          <PasswordInput
            name="confirm-password"
            autoComplete="new-password"
            value={confirmacion}
            disabled={cambiandoContrasena}
            onChange={(event) => {
              setConfirmacion(event.target.value)
              setErroresContrasena((previos) => ({ ...previos, confirmacion: undefined }))
              setAvisoContrasena(null)
            }}
          />
        </Field>
        <LineaDeAviso aviso={avisoContrasena} />
        <Button
          type="submit"
          className="self-end"
          loading={cambiandoContrasena}
          loadingLabel="Actualizando"
          disabled={sinSenal}
        >
          {cambiandoContrasena ? null : <Icon icon={Check} />}
          {cambiandoContrasena ? "Actualizando..." : "Cambiar contraseña"}
        </Button>
      </Tarjeta>
    </div>
  )
}
