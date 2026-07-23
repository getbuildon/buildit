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
