import { Root } from "@radix-ui/react-visually-hidden"
import type { ComponentProps } from "react"

/** Texto que no se ve pero que el lector de pantalla lee. */
export function VisuallyHidden(props: ComponentProps<typeof Root>) {
  return <Root {...props} />
}
