/** Header y footer fijos; el body scrollea dentro de max-h del dialog. */
export const BACKOFFICE_DIALOG = {
  content: "max-h-[calc(100dvh-3rem)] gap-0 overflow-hidden p-0",
  shell: "flex min-h-0 flex-1 flex-col overflow-hidden",
  header: "shrink-0 border-b border-[#f4f5f6] px-6 py-5",
  body: "min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-6 py-5",
  footer: "shrink-0 border-t border-[#f4f5f6] px-6 py-4",
} as const

export const BACKOFFICE_SHELL = {
  sidebarWidth: "220px",
  sidebarBg: "#111113",
  sidebarBorder: "rgba(255, 255, 255, 0.07)",
  brandSubtitle: "#777b84",
  navActiveBg: "#ff7433",
  navInactiveText: "#afb3ba",
  navInactiveHoverBg: "rgba(255, 255, 255, 0.06)",
  userEmail: "#afb3ba",
  mainBg: "#fefcfb",
} as const
