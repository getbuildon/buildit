export type FaqItem = {
  id: string
  question: string
  answer: string
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "implementacion",
    question: "¿Cuánto tarda la implementación de BuildOn?",
    answer:
      "La mayoría de los equipos cargan su primera obra el mismo día. Te acompañamos en la configuración inicial y en la capacitación del equipo durante la primera semana.",
  },
  {
    id: "conocimientos-tecnicos",
    question: "¿El equipo de obra necesita conocimientos técnicos?",
    answer:
      "No. BuildOn está pensado para usarse desde el celular en obra. Los operadores cargan avances con fotos en pocos pasos, y el equipo recibe capacitación inicial para arrancar sin fricción.",
  },
  {
    id: "portal-clientes",
    question: "¿Los clientes finales pueden ver el avance de su unidad?",
    answer:
      "Sí. Cada cliente puede acceder a un portal con el avance de su unidad en tiempo real, con la información justa para mantenerlo informado sin saturarlo.",
  },
  {
    id: "multiobra",
    question: "¿Puedo gestionar varias obras al mismo tiempo?",
    answer:
      "Sí. Con el plan Multiobra podés administrar múltiples proyectos desde una sola cuenta, con equipos, permisos y visibilidad independiente para cada obra.",
  },
  {
    id: "pagos-facturacion",
    question: "¿Cómo se manejan los pagos y la facturación?",
    answer:
      "Los planes se facturan de forma mensual o anual según elijas al contratar. Te enviamos la factura correspondiente y podés consultar el detalle de tu suscripción desde la plataforma.",
  },
]
