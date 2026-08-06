export type SolutionSlide = {
  number: string
  title: string
  description: string
  bgSrc: string
  screenSrc: string
  screenWidth: number
  screenHeight: number
  desktopBgSrc: string
  desktopScreenSrc: string
  desktopScreenWidth: number
  desktopScreenHeight: number
  /** Figma: card 01 uses py-64; cards 02–04 use centered layout */
  desktopScreenLayout: "padded" | "centered"
}

export const SOLUTION_SLIDES: SolutionSlide[] = [
  {
    number: "01",
    title: "Carga de avances",
    description:
      "Operarios, contratistas o supervisores registran avances fácilmente desde el celular u ordenador.",
    bgSrc: "/landing/solutions/card-01-bg.png",
    screenSrc: "/landing/solutions/card-01-screen.png",
    screenWidth: 311,
    screenHeight: 261,
    desktopBgSrc: "/landing/solutions/desktop/card-01-bg.png",
    desktopScreenSrc: "/landing/solutions/desktop/card-01-screen.png",
    desktopScreenWidth: 749,
    desktopScreenHeight: 630,
    desktopScreenLayout: "padded",
  },
  {
    number: "02",
    title: "Validación",
    description:
      "Los responsables certifican tareas y controlan la calidad antes de dar por cerrada cada etapa.",
    bgSrc: "/landing/solutions/card-02-bg.png",
    screenSrc: "/landing/solutions/card-02-screen.png",
    screenWidth: 311,
    screenHeight: 261,
    desktopBgSrc: "/landing/solutions/desktop/card-02-bg.png",
    desktopScreenSrc: "/landing/solutions/desktop/card-02-screen.png",
    desktopScreenWidth: 497,
    desktopScreenHeight: 440,
    desktopScreenLayout: "centered",
  },
  {
    number: "03",
    title: "Visualización rápida",
    description:
      "La dirección obtiene visibilidad clara del estado real del proyecto, sin perseguir reportes.",
    bgSrc: "/landing/solutions/card-03-bg.png",
    screenSrc: "/landing/solutions/card-03-screen.png",
    screenWidth: 311,
    screenHeight: 261,
    desktopBgSrc: "/landing/solutions/desktop/card-03-bg.png",
    desktopScreenSrc: "/landing/solutions/desktop/card-03-screen.png",
    desktopScreenWidth: 810,
    desktopScreenHeight: 786,
    desktopScreenLayout: "centered",
  },
  {
    number: "04",
    title: "Portal para clientes",
    description:
      "Los compradores siguen el avance de su unidad en tiempo real, con la información justa.",
    bgSrc: "/landing/solutions/card-04-bg.png",
    screenSrc: "/landing/solutions/card-04-screen.png",
    screenWidth: 311,
    screenHeight: 261,
    desktopBgSrc: "/landing/solutions/desktop/card-04-bg.png",
    desktopScreenSrc: "/landing/solutions/desktop/card-04-screen.png",
    desktopScreenWidth: 617,
    desktopScreenHeight: 603,
    desktopScreenLayout: "centered",
  },
]
