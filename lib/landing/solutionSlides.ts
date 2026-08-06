export type SolutionSlide = {
  number: string
  title: string
  description: string
  bgSrc: string
  screenSrc: string
  screenWidth: number
  screenHeight: number
  desktopScreenSrc: string
  desktopScreenWidth: number
  desktopScreenHeight: number
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
    desktopScreenSrc: "/landing/solutions/desktop/card-01-screen.png",
    desktopScreenWidth: 749,
    desktopScreenHeight: 630,
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
    desktopScreenSrc: "/landing/solutions/desktop/card-02-screen.png",
    desktopScreenWidth: 497,
    desktopScreenHeight: 440,
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
    desktopScreenSrc: "/landing/solutions/desktop/card-03-screen.png",
    desktopScreenWidth: 810,
    desktopScreenHeight: 786,
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
    desktopScreenSrc: "/landing/solutions/desktop/card-04-screen.png",
    desktopScreenWidth: 617,
    desktopScreenHeight: 603,
  },
]
