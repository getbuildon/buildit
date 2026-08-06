export type SolutionSlide = {
  number: string
  title: string
  description: string
  bgSrc: string
  screenSrc: string
  screenWidth: number
  screenHeight: number
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
  },
]
