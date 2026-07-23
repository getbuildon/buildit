export const CREATE_PROJECT_COLORS = {
  pageBg: "#fefcfb",
  title: "#18191b",
  subtitle: "#18191b",
  backLink: "#18191b",
  label: "#272a2d",
  inputBorder: "#afb3ba",
  placeholder: "#777b84",
  inputText: "#18191b",
  cardBg: "#ffffff",
  cardBorder: "#edeef0",
  sectionTitle: "#18191b",
  primary: "#ff7433",
  stepActiveLabel: "#18191b",
  stepInactiveLabel: "#777b84",
  stepInactiveBg: "#edeef0",
  stepConnector: "#edeef0",
  uploadBorder: "#cad5e2",
  uploadHint: "#777b84",
  btnSecondaryText: "#363a3f",
  btnSecondaryBorder: "#696e77",
} as const

export const CREATE_PROJECT_TYPE = {
  pageTitle: "text-[24px] font-normal leading-[1.05]",
  pageSubtitle: "text-[16px] font-normal leading-6",
  backLink: "text-[16px] font-normal leading-6",
  sectionTitle: "text-[20px] font-normal leading-[28px]",
  fieldLabel: "text-[14px] font-normal leading-5",
  fieldInput: "text-[16px] font-normal",
  stepLabel: "text-[12px] font-normal leading-4",
  uploadPrimary: "text-[14px] font-normal leading-5",
  uploadSecondary: "text-[12px] font-normal leading-4",
  navButton: "text-[14px] font-normal leading-5",
} as const

export const CREATE_PROJECT_LAYOUT = {
  contentMaxWidth: "896px",
  cardRadius: "16px",
  inputRadius: "10px",
  inputHeight: "46px",
} as const

/** Figma node 1879:2153 — Paso 0 etapa de obra */
export const CREATE_PROJECT_STAGE = {
  page: "flex min-h-screen w-full items-center justify-center bg-[#fefcfb] px-6 py-16",
  content: "flex w-full max-w-[896px] flex-col items-center gap-14",
  copy: "flex flex-col items-center gap-6 text-center",
  title: "font-recoleta text-[40px] font-normal leading-[1.05] text-[#272a2d] sm:text-[64px]",
  subtitle: "text-[16px] font-normal leading-[1.4] text-[#111113] sm:text-[20px]",
  cards: "flex w-full flex-col items-center justify-center gap-6 lg:flex-row",
  cardBase:
    "relative flex h-[200px] w-full max-w-[380px] cursor-pointer flex-col gap-6 rounded-[12px] border bg-white p-6 text-left transition-shadow",
  cardSelected:
    "border-[#ff7433] shadow-[0_0_10px_rgba(243,103,31,0.3)]",
  cardUnselected: "border-[#edeef0] hover:border-[#afb3ba]",
  cardTitle: "font-recoleta text-[24px] font-normal leading-[1.05] text-[#1d293d]",
  cardDescription: "text-[16px] font-normal leading-[1.4] text-[#272a2d]",
  radioSelected:
    "absolute top-[15px] right-[15px] flex size-5 items-center justify-center rounded-[10px] bg-[#ff7433]",
  radioUnselected:
    "absolute top-[15px] right-[15px] size-5 rounded-[10px] border border-[#afb3ba]",
  continueBtn:
    "inline-flex items-center gap-2 rounded-[10px] bg-[#ff7433] px-4 py-3 text-[14px] font-normal leading-[1.4] text-white shadow-[0_0_10px_rgba(243,103,31,0.3)] transition-colors hover:bg-[#ff7433]/90",
} as const
