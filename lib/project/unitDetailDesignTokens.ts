/** Tokens Figma — Detalle de unidad (node 1850:6330) */
export const UNIT_DETAIL_SHADOW = "0 0 5px rgba(243, 103, 31, 0.08)"

export const UNIT_DETAIL_TYPE = {
  floorName: "text-[14px] font-normal leading-[1.4] text-[#696e77]",
  unitTitle: "font-recoleta text-[28px] font-normal leading-[1.05] text-[#1d293d]",
  statValue: "font-recoleta text-[28px] font-normal leading-[1.05] text-[#1d293d] tabular-nums",
  statLabel: "text-[12px] font-normal leading-[1.4] tracking-[-0.36px] text-[#43484e]",
  sectionTitle: "text-[18px] font-medium leading-[18.9px] text-[#1d293d]",
  taskCode: "font-mono text-[12px] leading-[11px] tracking-[-0.275px] text-[#43484e]",
  taskName: "text-[14px] font-normal leading-[1.4] text-[#111113]",
  taskRubro: "text-[12px] font-normal leading-[1.4] tracking-[-0.36px] text-[#43484e]",
  taskMeta: "text-[12px] font-normal leading-[1.4] tracking-[-0.36px] text-[#43484e]",
} as const

export const UNIT_DETAIL_STATUS_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  completed: {
    label: "Completada",
    className: "bg-[#f4fbf7] text-[#208368]",
  },
  certified: {
    label: "Certificada",
    className: "bg-[#e6f4fe] text-[#0f5fa0]",
  },
  in_progress: {
    label: "En Proceso",
    className: "bg-[#fff7c2] text-[#4f3422]",
  },
  blocked: {
    label: "Bloqueado",
    className: "bg-[#ffdbdc] text-[#641723]",
  },
  pending: {
    label: "Sin iniciar",
    className: "bg-[#edeef0] text-[#43484e]",
  },
}
