export const SHELL_COLORS = {
  sidebarBg: "#fefcfb",
  sidebarBorder: "#f0eeec",
  mainBg: "#fefcfb",
  headerBg: "#ffffff",
  headerBorder: "#e8e9eb",
  navText: "#18191b",
  navHoverBg: "#f5f3f1",
  navHoverText: "#18191b",
  navActiveBg: "#18191b",
  navActiveText: "#ffffff",
  orgName: "#18191b",
  projectName: "#494e55",
  userCardBg: "#f3f3f5",
  userName: "#18191b",
  userRole: "#494e55",
  avatarBg: "#ff7433",
  avatarText: "#ffffff",
  iconButtonBorder: "#e2e8f0",
  iconButtonText: "#64748b",
  notificationDot: "#155dfc",
  headerUserName: "#1d293d",
  headerUserChevron: "#64748b",
  headerAvatarBg: "#dbeafe",
  headerAvatarText: "#155dfc",
  headerButtonHoverBg: "#f8fafc",
  pageTitle: "#1d293d",
  pageSubtitle: "#62748e",
  cardBorder: "#e2e8f0",
  cardBg: "#ffffff",
} as const

export const SHELL_LAYOUT = {
  sidebarWidth: "254px",
  sidebarMargin: "12px",
  sidebarBrandHeight: "76px",
  sidebarBrandPadding: "16px",
  headerHeight: "65px",
  headerPaddingX: "24px",
  headerActionsGap: "12px",
  contentMaxWidth: "1280px",
  contentPadding: "24px",
  navItemHeight: "40px",
  navItemWidth: "232px",
  navSectionPaddingX: "12px",
  navSectionPaddingTop: "16px",
  userFooterHeight: "89px",
} as const

export const SHELL_TYPE = {
  orgName: "text-[14px] font-semibold leading-5 tracking-[-0.1504px]",
  projectName: "text-[12px] font-normal leading-4",
  navItem: "text-[14px] font-medium leading-5 tracking-[-0.1504px]",
  navItemActive: "text-[14px] font-semibold leading-5 tracking-[-0.1504px]",
  userName: "text-[14px] font-medium leading-5",
  userRole: "text-[12px] font-normal leading-4",
  headerUser: "text-[14px] font-medium leading-5 tracking-[-0.1504px]",
  avatarSidebar: "text-[12px] font-semibold leading-4",
  avatarHeader: "text-[11px] font-semibold leading-4",
  pageTitle: "text-[36px] font-bold leading-[36px] tracking-[0.3691px]",
  pageSubtitle: "text-[14px] font-normal leading-5 tracking-[-0.1504px]",
} as const

export const PROJECT_ICON_GRADIENT =
  "linear-gradient(135deg, #2b7fff 0%, #155dfc 100%)"

export const PROJECT_ICON_SHADOW =
  "0px 10px 7.5px rgba(0, 0, 0, 0.1), 0px 4px 3px rgba(0, 0, 0, 0.1)"

/** Figma node 1423:3533 — ancho Fill del formulario/lista de clientes (~1022px). */
export const CLIENTES_LAYOUT = {
  contentMaxWidth: "1022px",
} as const

/** Figma node 1226:9053 — ancho del contenido de Equipo (~1011px). */
export const EQUIPO_LAYOUT = {
  contentMaxWidth: "1011px",
  permissionsTableWidth: "979px",
  permissionsActionColumnWidth: "160px",
  pageBottomPadding: "40px",
} as const

/** Figma node 2130:4624 — ancho del contenido de Portal Clientes (~1010px). */
export const PORTAL_CLIENTES_LAYOUT = {
  contentMaxWidth: "1010px",
} as const

/** Figma node 1859:5368 — ancho del contenido de Mi Unidad (~1010px). */
export const MI_UNIDAD_LAYOUT = {
  contentMaxWidth: "1010px",
  contentPaddingTop: "80px",
} as const

/** Figma node 1860:6300 — widget de clima en Mi Unidad */
export const MI_UNIDAD_WEATHER_WIDGET = {
  container:
    "flex shrink-0 items-center gap-[24px] rounded-[13px] border border-[#e8ecf0] bg-white px-[17px] py-[13px] shadow-[0_1px_1.5px_rgba(0,0,0,0.07)]",
  temperature: "text-[24px] font-medium leading-[1.05] text-[#111113]",
  unit: "text-[12px] font-normal leading-[18px] text-[#777b84]",
  city: "text-[12px] font-medium leading-[1.4] text-[#43484e]",
  description:
    "text-[12px] font-normal leading-[1.4] tracking-[-0.36px] text-[#5a6169]",
} as const

/** Figma node 1228:12933 — sidebar nav link selected (black pill 229x40, r12) */
export const SIDEBAR_NAV_ACTIVE_LINK_STYLE = {
  height: "40px",
  width: "100%",
  boxSizing: "border-box" as const,
  display: "flex",
  alignItems: "center",
  gap: "12px",
  paddingLeft: "12px",
  paddingRight: "12px",
  borderRadius: "12px",
  border: "1px solid transparent",
  backgroundColor: "#18191b",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 500,
  lineHeight: "20px",
  textDecoration: "none",
}

export const SIDEBAR_NAV_INACTIVE_LINK_STYLE = {
  height: "40px",
  width: "100%",
  boxSizing: "border-box" as const,
  display: "flex",
  alignItems: "center",
  gap: "12px",
  paddingLeft: "12px",
  paddingRight: "12px",
  borderRadius: "12px",
  border: "1px solid transparent",
  backgroundColor: "transparent",
  color: "#18191b",
  fontSize: "14px",
  fontWeight: 500,
  lineHeight: "20px",
  textDecoration: "none",
}

/** Figma node 3:173 / 538:5570 — project topbar */
export const TOPBAR_HEADER_STYLE = {
  height: "65px",
  boxSizing: "border-box" as const,
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "12px",
  paddingLeft: "24px",
  paddingRight: "24px",
  backgroundColor: "#ffffff",
  borderBottom: "1px solid #e2e8f0",
}

export const TOPBAR_BELL_BUTTON_STYLE = {
  position: "relative" as const,
  width: "36px",
  height: "36px",
  boxSizing: "border-box" as const,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "10px",
  border: "none",
  backgroundColor: "transparent",
  color: "#64748b",
  flexShrink: 0,
  cursor: "pointer",
}

export const TOPBAR_NOTIFICATION_DOT_STYLE = {
  position: "absolute" as const,
  top: "4px",
  right: "4px",
  width: "8px",
  height: "8px",
  borderRadius: "9999px",
  backgroundColor: "#155dfc",
}

export const TOPBAR_USER_BUTTON_STYLE = {
  height: "40px",
  boxSizing: "border-box" as const,
  display: "flex",
  alignItems: "center",
  gap: "8px",
  paddingLeft: "12px",
  paddingRight: "12px",
  borderRadius: "10px",
  border: "none",
  backgroundColor: "transparent",
  color: "#1d293d",
  fontSize: "14px",
  fontWeight: 500,
  lineHeight: "20px",
  letterSpacing: "-0.1504px",
  flexShrink: 0,
  cursor: "pointer",
}

export const TOPBAR_USER_AVATAR_STYLE = {
  width: "28px",
  height: "28px",
  boxSizing: "border-box" as const,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "9999px",
  backgroundColor: "#dbeafe",
  color: "#155dfc",
  fontSize: "11px",
  fontWeight: 600,
  lineHeight: "16px",
  flexShrink: 0,
}

/** Figma node 1284:1709 — equipo member row in edit mode */
export const EQUIPO_EDIT_ROW = {
  background: "#fff6f1",
  border: "#edeef0",
  avatarBg: "#ff7433",
  avatarText: "#ffffff",
  nameColor: "#1d293d",
  emailColor: "#5a6169",
  selectHeight: "32px",
  selectRadius: "10px",
  selectBorder: "#edeef0",
  selectBg: "#ffffff",
  selectText: "#0a0a0a",
  selectFontSize: "12px",
  selectLineHeight: "16px",
  listoBg: "#dcf5ee",
  listoText: "#56ba9f",
  listoFontSize: "12px",
  listoFontWeight: 600,
  listoPaddingX: "16px",
  listoPaddingY: "6px",
  listoRadius: "9999px",
  actionIconColor: "#777b84",
} as const

/** Figma node 1846:2174 — modal con header, contenido y acciones */
export const FORM_MODAL_DIALOG = {
  content:
    "flex w-full max-w-[480px] flex-col gap-0 rounded-[16px] border border-[#e2e8f0] bg-white p-0 shadow-[0_0_5px_rgba(243,103,31,0.08)]",
  overlay: "bg-[rgba(17,17,19,0.6)] backdrop-blur-[5px]",
  body: "flex flex-col gap-6 px-[33px] py-[41px]",
  header: "flex w-full flex-col items-start",
  title:
    "text-left font-recoleta text-[24px] font-normal leading-[1.05] text-[#18191b]",
  description:
    "pt-2 text-left text-[16px] font-normal leading-[1.4] text-[#18191b]",
  actions: "flex w-full gap-2",
  cancelBtn:
    "inline-flex h-auto min-h-[44px] flex-1 items-center justify-center rounded-[10px] border border-[#696e77] bg-white px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#363a3f] shadow-none transition-colors hover:border-[#696e77] hover:bg-[#f4f5f6] hover:text-[#272a2d] focus-visible:border-[#696e77] focus-visible:text-[#272a2d] focus-visible:ring-0 disabled:pointer-events-none disabled:opacity-50",
  confirmBtn:
    "h-auto min-h-[44px] flex-1 rounded-[10px] px-4 py-3 text-[14px] font-normal leading-[1.4] text-white shadow-[0_0_10px_rgba(243,103,31,0.3)]",
} as const

/** Figma node 1846:2151 — modal de confirmación con ícono */
export const CONFIRM_ACTION_DIALOG = {
  content:
    "flex w-full max-w-[448px] flex-col gap-0 rounded-[16px] border border-[#e2e8f0] bg-white p-0 shadow-[0_0_5px_rgba(243,103,31,0.08)]",
  body: "flex flex-col gap-8 px-[33px] py-[41px]",
  overlay: "bg-[rgba(17,17,19,0.6)] backdrop-blur-[5px]",
  iconWrap:
    "flex size-20 items-center justify-center rounded-full bg-[#ffeae0]",
  icon: "size-10 text-[#ff7433]",
  title:
    "text-center font-recoleta text-[24px] font-normal leading-[1.05] text-[#18191b]",
  description:
    "mx-auto max-w-[382px] pt-2 text-center text-[16px] font-normal leading-[1.4] text-[#18191b]",
  actions: "flex w-full gap-2",
  cancelBtn:
    "inline-flex h-auto min-h-[44px] flex-1 items-center justify-center rounded-[10px] border border-[#696e77] bg-white px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#363a3f] shadow-none transition-colors hover:border-[#696e77] hover:bg-[#f4f5f6] hover:text-[#272a2d] focus-visible:border-[#696e77] focus-visible:text-[#272a2d] focus-visible:ring-0 disabled:pointer-events-none disabled:opacity-50",
  confirmBtn:
    "h-auto min-h-[44px] flex-1 rounded-[10px] px-4 py-3 text-[14px] font-normal leading-[1.4] text-white shadow-[0_0_10px_rgba(243,103,31,0.3)]",
} as const
