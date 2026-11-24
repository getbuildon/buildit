import { Eye, EyeOff, Lock } from "lucide-react"
import { useState } from "react"
import { Icon } from "../../atoms/icon/Icon"
import { InputGroup, type InputGroupProps } from "../input-group/InputGroup"

export type PasswordInputProps = Omit<InputGroupProps, "type" | "end"> & {
  /** current-password (ingresar) o new-password (crear). Lo usa el gestor de contraseñas. */
  autoComplete: "current-password" | "new-password"
  /** Muestra el candado a la izquierda (como el acceso de hoy). */
  withIcon?: boolean
}

/**
 * Contraseña con «Mostrar / Ocultar». El botón del ojo de hoy no tiene foco visible y
 * mide 16 px; acá es un botón de 32 con foco y aria-pressed, y el texto que lee el
 * lector de pantalla cambia con el estado.
 */
export function PasswordInput({ autoComplete, withIcon = true, placeholder = "••••••••", ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  return (
    <InputGroup
      {...props}
      type={visible ? "text" : "password"}
      autoComplete={autoComplete}
      autoCapitalize="off"
      spellCheck={false}
      placeholder={placeholder}
      start={withIcon ? <Icon icon={Lock} /> : undefined}
      end={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          className="focus-ring state-veil -mr-compact inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-compact text-ink-muted"
        >
          <Icon icon={visible ? EyeOff : Eye} />
        </button>
      }
    />
  )
}
