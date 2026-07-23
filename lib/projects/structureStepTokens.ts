import { cn } from "@/lib/utils"

/** Layout — Figma 1128:5511 / 1833:3243 */
export const STRUCTURE_STEP_LAYOUT = {
  /** Ancho del contenido interno del paso estructura */
  contentMaxWidth: "830px",
  /** Ancho de cada card de piso + unidades */
  floorCardMaxWidth: "798px",
  /** Ancho útil dentro de la card blanca (798 − 24px padding) */
  floorCardInnerWidth: "774px",
  /** Alto mínimo de cada fila de unidad — Figma 1833:3276 */
  unitRowMinHeight: "74px",
  unitTypeWidth: "169px",
  unitCompactWidth: "80px",
  unitAttachWidth: "120px",
} as const

/** Tokens compartidos — Figma 1833:3243 (pisos y unidades). */
export const STRUCTURE_STEP_COLORS = {
  labelDefault: "#43484e",
  labelMuted: "#45556c",
  placeholder: "#777b84",
  inputText: "#272a2d",
  unitFieldText: "#43484e",
  floorInputBorder: "#edeef0",
  unitInputBorder: "#e2e8f0",
  unitRowBg: "#fefcfb",
  floorAction: "#321a10",
  delete: "#ce2c31",
  summaryBg: "#fff6f1",
  summaryBorder: "#ffeae0",
  summaryText: "#321a10",
} as const

export const structureLabelClassName =
  "text-[12px] font-normal leading-[1.4] tracking-[-0.36px]"

export const structureFloorLabelStyle = { color: STRUCTURE_STEP_COLORS.labelDefault } as const
export const structureMutedLabelStyle = { color: STRUCTURE_STEP_COLORS.labelMuted } as const

export const structureFloorInputClassName = cn(
  "h-[34px] w-full rounded-[4px] border bg-transparent px-3 py-1.5",
  "text-[14px] font-normal leading-normal tracking-[-0.15px] text-[#272a2d]",
  "shadow-none placeholder:text-[#afb3ba]",
  "focus-visible:border-[#ff7433] focus-visible:ring-0",
)

export const structureFloorInputStyle = {
  borderColor: STRUCTURE_STEP_COLORS.floorInputBorder,
} as const

export const structureUnitInputClassName = cn(
  "h-auto w-full rounded-[4px] border bg-white px-2 py-1.5",
  "text-[12px] font-normal leading-[1.4] tracking-[-0.36px]",
  "shadow-none placeholder:text-[#777b84]",
  "focus-visible:border-[#ff7433] focus-visible:ring-0",
)

export const structureUnitInputStyle = {
  borderColor: STRUCTURE_STEP_COLORS.unitInputBorder,
  color: STRUCTURE_STEP_COLORS.unitFieldText,
} as const

export const structureUnitSelectTriggerClassName = cn(
  "h-auto min-h-[30px] w-full min-w-0 rounded-[4px] border border-[#e2e8f0] bg-white px-2 py-1.5",
  "text-[12px] font-normal leading-[1.4] tracking-[-0.36px] text-[#43484e] shadow-none",
  "focus:border-[#ff7433] focus:ring-0 data-[placeholder]:text-[#777b84]",
  "[&_svg]:size-3",
)

export const structureUnitSelectItemClassName = "text-[12px] leading-[1.4] tracking-[-0.36px]"

/** Figma 1833:3277 — anchos fijos por columna de unidad. */
export const structureUnitFieldColumnClassName = {
  type: "w-[169px] shrink-0",
  compact: "w-20 shrink-0",
  attach: "w-[120px] shrink-0",
} as const

export const structureAttachButtonClassName = cn(
  "flex w-full min-w-0 cursor-pointer items-center justify-center gap-1 rounded-[4px] border bg-white px-2 py-1.5",
  "text-[12px] font-normal leading-[1.4] tracking-[-0.36px] text-[#43484e]",
  "transition-colors hover:bg-[#fafafa]",
)

export const structureAttachButtonStyle = {
  borderColor: STRUCTURE_STEP_COLORS.unitInputBorder,
} as const
