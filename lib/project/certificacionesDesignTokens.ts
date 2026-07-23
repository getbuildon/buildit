/** Tokens Figma — Certificación de Tareas (node 1734:3493) */
export const CERTIFICACIONES_COLORS = {
  title: "#272a2d",
  subtitle: "#43484e",
  statNumber: "#111113",
  statLabel: "#212225",
  taskTitle: "#111113",
  taskRubro: "#696e77",
  taskMeta: "#43484e",
  taskComment: "#5a6169",
  label: "#777b84",
  selectAll: "#43484e",
  toggleActive: "#272a2d",
  toggleInactive: "#696e77",
  border: "#edeef0",
  inputBorder: "#afb3ba",
  toggleTrack: "#edeef0",
  brand: "#ff7433",
  infoIconBg: "#e6f4fe",
  errorIconBg: "#feebec",
  urgentBg: "#feebec",
  urgentText: "#ce2c31",
  warningBg: "#fefbe9",
  warningText: "#ab6400",
  neutralBadgeBg: "#edeef0",
  neutralBadgeText: "#43484e",
  actionMutedBg: "#edeef0",
  paginationMuted: "#45556c",
} as const

export const CERTIFICACIONES_SHADOW = {
  card: "0 0 5px rgba(243, 103, 31, 0.08)",
  mainCard: "0 0 10px rgba(243, 103, 31, 0.08)",
  toggleActive: "0 0 2px rgba(0, 0, 0, 0.15)",
} as const

export const CERTIFICACIONES_TYPE = {
  pageTitle: "font-recoleta text-[28px] font-normal leading-[1.05] text-[#272a2d]",
  pageSubtitle: "text-[14px] font-normal leading-[1.4] text-[#43484e]",
  statNumber: "font-recoleta text-[28px] font-normal leading-[1.05] text-[#111113] tabular-nums",
  statLabel: "text-[14px] font-normal leading-[1.4] text-[#212225]",
  filterLabel: "text-[12px] font-normal leading-[1.4] tracking-[-0.36px] text-[#777b84]",
  taskTitle: "text-[14px] font-normal leading-[1.4] text-[#111113]",
  taskRubro: "text-[12px] font-normal leading-[1.4] tracking-[-0.36px] text-[#696e77]",
  taskMeta: "text-[12px] font-normal leading-[1.4] tracking-[-0.36px] text-[#43484e]",
  taskComment: "text-[12px] font-normal leading-[1.4] tracking-[-0.36px] text-[#5a6169]",
  selectAll: "text-[14px] font-medium leading-[1.4] text-[#43484e]",
  toggle: "text-[12px] font-medium leading-[1.4]",
  badge: "text-[12px] font-medium leading-[1.4]",
  certificarBtn: "text-[14px] font-medium leading-5 tracking-[-0.15px] text-white",
  footer: "text-[12px] font-normal leading-[1.4] tracking-[-0.36px] text-[#777b84]",
  paginationBtn: "text-[12px] font-medium leading-[1.4]",
} as const

/** Figma node 1743:5542 — modal detalle de tarea en certificaciones */
export const CERTIFICACION_MODAL = {
  overlay: "bg-[rgba(17,17,19,0.6)] backdrop-blur-[5px]",
  content: "w-[672px] max-w-[calc(100vw-32px)] gap-0 rounded-[16px] border-0 p-0 shadow-none",
  headerBorder: "border-[#e2e8f0]",
  title: "text-[18px] font-medium leading-[1.05] text-[#272a2d]",
  metaPrimary: "text-[14px] font-normal leading-[1.4] text-[#43484e]",
  metaSecondary: "text-[12px] font-normal leading-[1.4] tracking-[-0.36px] text-[#43484e]",
  editBtn:
    "inline-flex items-center gap-1.5 rounded-[10px] bg-[#fefcfb] px-2 py-1.5 text-[14px] font-medium leading-5 tracking-[-0.15px] text-[#ff7433] transition-colors hover:bg-[#fff8f5]",
  label: "text-[12px] font-normal leading-[1.4] tracking-[-0.36px] text-[#5a6169]",
  statusBadge:
    "inline-flex w-fit self-start items-center gap-2 rounded-[10px] bg-[#d6f1e3] px-[9px] py-2 text-[14px] font-medium leading-5 tracking-[-0.15px] text-[#208368]",
  statusBadgeCertified:
    "inline-flex w-fit self-start items-center gap-[5px] rounded-[10px] bg-[#e6f4fe] px-[9px] py-1 text-[12px] font-medium leading-[1.4] text-[#0f5fa0]",
  readonlyBox: "rounded-[10px] bg-[#f9f9fb] p-3 text-[14px] font-normal leading-[1.4] text-[#272a2d]",
  metaValue: "text-[14px] font-normal leading-[1.4] text-[#314158]",
  historyBtn:
    "inline-flex items-center gap-2 text-[14px] font-medium leading-[1.4] text-[#696e77] transition-colors hover:text-[#43484e]",
  footerBorder: "border-[#e2e8f0]",
  closeBtn:
    "flex flex-1 items-center justify-center rounded-[10px] border border-[#696e77] px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#363a3f] transition-colors hover:bg-[#fafafa]",
  certifyBtn:
    "flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-[#ff7433] px-4 py-2.5 text-[16px] font-medium leading-6 tracking-[-0.31px] text-white shadow-[0_0_10px_rgba(243,103,31,0.3)] transition-colors hover:bg-[#ff7433]/90 disabled:opacity-50",
} as const

/** Figma node 1745:2499 — confirmación de certificación */
export const CERTIFICACION_CONFIRM = {
  content:
    "z-[60] w-full max-w-[680px] gap-6 rounded-[16px] border border-[#e2e8f0] px-[33px] py-[41px] shadow-[0_0_5px_rgba(243,103,31,0.08)]",
  overlay: "z-[60] bg-[rgba(17,17,19,0.6)] backdrop-blur-[5px]",
  title: "font-recoleta text-[24px] font-normal leading-[1.05] text-[#18191b]",
  description: "pt-2 text-[16px] font-normal leading-[1.4] text-[#18191b]",
  summaryCard: "flex flex-col gap-1 rounded-[10px] bg-[#fff6f1] p-3",
  summaryTitle: "text-[16px] font-medium leading-[1.4] text-[#272a2d]",
  summaryMeta: "text-[14px] font-normal leading-[1.4] text-[#5a6169]",
  summaryMetaValue: "font-medium text-[#272a2d]",
  notesLabel: "text-[12px] font-normal leading-[1.4] tracking-[-0.36px] text-[#45556c]",
  notesInput:
    "min-h-[72px] w-full resize-none rounded-[10px] border border-[#cad5e2] px-3 py-2 text-[14px] font-normal leading-[1.4] text-[#272a2d] outline-none placeholder:text-[#777b84] focus:border-[#ff7433]",
  cancelBtn:
    "flex flex-1 items-center justify-center rounded-[10px] border border-[#696e77] px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#363a3f] transition-colors hover:bg-[#fafafa]",
  confirmBtn:
    "flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-[#ff7433] px-4 py-2.5 text-[16px] font-medium leading-6 tracking-[-0.31px] text-white shadow-[0_0_10px_rgba(243,103,31,0.3)] transition-colors hover:bg-[#ff7433]/90 disabled:opacity-50",
  bulkNotesLabel:
    "text-[12px] font-normal leading-[1.4] tracking-[-0.36px] text-[#45556c]",
  bulkTaskList: "flex max-h-[140px] flex-col gap-1 overflow-y-auto",
  bulkTaskItem: "flex items-center gap-2 text-[14px] font-normal leading-[1.4] text-[#272a2d]",
} as const

/** Figma node 1734:4466 — checkbox de selección en certificaciones */
export const CERTIFICACION_CHECKBOX = {
  base: "flex size-4 shrink-0 items-center justify-center rounded-[2px] border transition-colors",
  unchecked: "border-[#18191b] bg-white",
  checked: "border-[#18191b] bg-[#18191b]",
  disabled: "cursor-not-allowed opacity-40",
} as const

/** Figma node 1850:6502 — badge estado Certificada */
export const CERTIFICADA_BADGE = {
  className: "bg-[#e6f4fe] text-[#0f5fa0]",
  pill: "inline-flex w-fit items-center gap-[5px] rounded-[10px] bg-[#e6f4fe] px-[9px] py-1 text-[12px] font-medium leading-[1.4] text-[#0f5fa0]",
} as const
