export const HOME_GRADIENT =
  "linear-gradient(135deg, #572d1c 0%, #371f15 100%)"

export const HOME_COLORS = {
  subtitle: "#ffffff",
  footer: "#62748e",
  cardTitle: "#1d293d",
  cardAddress: "#62748e",
  cardMuted: "#777b84",
  cardStat: "#314158",
  cardDivider: "#edeef0",
  progressBadge: "#009966",
  progressBadgeBg: "#ecfdf5",
  progressTrack: "#e2e8f0",
  progressFill: "#ff7433",
  draftBadgeBg: "#e6f4fe",
  draftBadgeText: "#113264",
  addCardSubtext: "#b3b3b3",
} as const

export const HOME_TYPE = {
  greeting: "text-[36px] font-normal leading-[43.2px]",
  question: "text-[20px] font-normal leading-[28px]",
  footer: "text-[14px] font-normal leading-5 tracking-[-0.1504px]",
  projectName:
    "text-[20px] font-medium leading-[1.4] tracking-[0.4px]",
  projectAddress:
    "text-[12px] font-normal leading-[1.4] tracking-[-0.36px]",
  statLabel: "text-[12px] font-medium leading-[1.4]",
  statValue: "text-[14px] font-medium leading-[1.4]",
  progressBadge: "text-[12px] font-medium leading-[1.4]",
  addTitle: "text-[18px] font-normal leading-[25.2px]",
  addSubtitle: "text-[12px] font-medium leading-4",
} as const

/** Layout responsive compartido entre home y skeleton. */
export const HOME_LAYOUT = {
  shell:
    "relative flex min-h-[100dvh] flex-col items-center px-4 pb-10 pt-4 text-white sm:px-6 sm:pt-6 lg:px-10 lg:pb-0 lg:pt-0",
  topBarWrap:
    "flex w-full max-w-[1080px] shrink-0 justify-center lg:absolute lg:right-10 lg:top-6 lg:z-10 lg:w-auto lg:max-w-none lg:justify-end xl:right-16",
  topBar:
    "flex w-full flex-wrap items-center justify-end gap-6",
  topPillButton:
    "inline-flex items-center justify-center rounded-[10px] bg-[#321a10] px-4 py-2 text-center text-[14px] font-medium leading-[1.4] text-white transition-colors hover:bg-[#3d2114] disabled:cursor-not-allowed disabled:opacity-70",
  content:
    "flex w-full max-w-[1080px] flex-1 flex-col items-center justify-center py-8 sm:py-10 lg:min-h-[100dvh] lg:flex-none lg:py-0",
  header:
    "flex w-full max-w-[720px] flex-col items-center gap-2 px-1 text-center sm:gap-3",
  greeting:
    "font-recoleta text-[26px] font-normal leading-[1.15] text-balance sm:text-[32px] sm:leading-[1.2] md:text-[36px] md:leading-[43.2px]",
  question:
    "text-base font-normal leading-[1.4] text-balance sm:text-[18px] md:text-[20px] md:leading-7",
  projectGrid:
    "mt-8 flex w-full flex-wrap justify-center gap-4 sm:mt-10 sm:gap-5 md:mt-12 md:gap-6",
  projectCardSize: "w-full max-w-[240px] min-h-[245px] sm:w-[240px] sm:max-w-none",
} as const

export const PROJECT_CARD = {
  width: "240px",
  minHeight: "245px",
} as const

export const PROJECT_CARD_SHADOW =
  "0px 20px 12.5px rgba(0,0,0,0.1), 0px 8px 5px rgba(0,0,0,0.1)"

export const PROJECT_ICON_SHADOW = "0px 0px 5px rgba(243,103,31,0.08)"

export const PROJECT_ICON_GRADIENT =
  "linear-gradient(135deg, #FF7433 0%, #FF7433 100%)"

export const HOME_WEEKLY_PROGRESS_TOOLTIP =
  "Porcentaje de avance respecto a la semana anterior."

export const PROJECT_PROGRESS_GRADIENT =
  "linear-gradient(to right, #FF7433, #FF7433)"
