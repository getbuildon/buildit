import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/*
 * Une clases y resuelve conflictos ("la última gana"), conociendo los roles de la
 * librería. Sin esta configuración, tailwind-merge confunde text-body (tamaño) con
 * text-ink (color) y borra uno de los dos.
 */
const textRoles = ["display", "title", "heading", "section", "reading", "body", "field", "hero", "hero-lede", "welcome", "welcome-lede", "headline", "label", "meta", "micro", "metric", "metric-compact", "code"]
const spacingRoles = [
  "related",
  "compact",
  "snug",
  "group",
  "block",
  "chapter",
  "stage",
  "control-compact",
  "control",
  "control-large",
  "hit",
  "icon-xs",
  "icon-sm",
  "icon-md",
  "icon-lg",
  "avatar-sm",
  "avatar-md",
  "avatar-lg",
]

const merge = extendTailwindMerge({
  extend: {
    theme: {
      spacing: spacingRoles,
      radius: ["box", "compact", "mark", "control", "surface", "panel", "pill"],
      shadow: ["hint", "near", "overlay", "modal", "action", "thumb", "lift", "float", "panel"],
      ease: ["standard", "emphasized"],
      animate: ["enter", "spin", "shimmer", "accordion-down", "accordion-up", "sheet-in"],
      container: ["page", "reading", "dialog-narrow", "dialog", "dialog-wide", "auth"],
      font: ["ui", "display", "mono"],
      "font-weight": ["regular", "medium", "semibold"],
    },
    classGroups: {
      "font-size": [{ text: textRoles }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return merge(clsx(inputs))
}
