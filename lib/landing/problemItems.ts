export type ProblemItem = {
  id: string
  iconSrc: string
  title: string
  description: string
}

export const PROBLEM_ITEMS: ProblemItem[] = [
  {
    id: "dispersed",
    iconSrc: "/landing/problem/icon-dispersed.svg",
    title: "Información dispersa",
    description:
      "WhatsApp, planillas, fotos y audios repartidos por todos lados.",
  },
  {
    id: "validation",
    iconSrc: "/landing/problem/icon-validation.svg",
    title: "Avances difíciles de validar",
    description:
      "No queda claro qué está terminado, qué falta o quién lo aprobó.",
  },
  {
    id: "clients",
    iconSrc: "/landing/problem/icon-clients.svg",
    title: "Clientes desinformados",
    description:
      "Los compradores preguntan constantemente por estado y fechas.",
  },
  {
    id: "traceability",
    iconSrc: "/landing/problem/icon-traceability.svg",
    title: "Poca trazabilidad",
    description:
      "Es difícil reconstruir qué pasó, cuándo y quién lo hizo.",
  },
]
