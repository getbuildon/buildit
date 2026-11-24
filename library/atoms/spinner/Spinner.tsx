import { LoaderCircle } from "lucide-react"
import { cn } from "../../lib/cn"
import { Icon, type IconSize } from "../icon/Icon"

export type SpinnerProps = {
  size?: IconSize
  /** Qué se está cargando. Lo lee el lector de pantalla. */
  label?: string
  className?: string
}

/**
 * Indicador de carga. Anuncia "Cargando" en español (el de la app decía "Loading").
 * Con reduced-motion gira más lento en vez de desaparecer: sigue diciendo que algo pasa.
 */
export function Spinner({ size = "sm", label = "Cargando", className }: SpinnerProps) {
  return (
    <span role="status" className={cn("inline-flex", className)}>
      <Icon icon={LoaderCircle} size={size} className="animate-spin motion-reduce:[animation-duration:2.4s]" />
      <span className="sr-only">{label}</span>
    </span>
  )
}
