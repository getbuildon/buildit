export type BillingPeriod = "annual" | "monthly"

export type PlanCtaVariant = "outline" | "primary" | "dark"

export type PricingPlan = {
  id: string
  name: string
  subtitle: string
  /** Precio mensual cuando se factura anual */
  annualMonthlyPrice: number | null
  /** Precio mensual facturado mes a mes */
  monthlyPrice: number | null
  priceLabel?: string
  surface: string
  showSurfaceChevron: boolean
  featured?: boolean
  badge?: string
  teamFeatures: string[]
  otherFeatures: string[]
  ctaLabel: string
  ctaVariant: PlanCtaVariant
  theme: "light" | "dark"
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "compacto",
    name: "Compacto",
    subtitle: "Ideal para obras pequeñas.",
    annualMonthlyPrice: 320,
    monthlyPrice: 400,
    surface: "Superficie hasta 60 m²",
    showSurfaceChevron: true,
    teamFeatures: [
      "1 administradores",
      "2 supervisores",
      "15 operadores",
    ],
    otherFeatures: [
      "Hasta 20 clientes",
      "Soporte estándar",
      "Dashboard, avances con fotos y trazabilidad",
    ],
    ctaLabel: "Contratar",
    ctaVariant: "outline",
    theme: "light",
  },
  {
    id: "gran-escala",
    name: "Gran Escala",
    subtitle: "Para edificios y complejos.",
    annualMonthlyPrice: 800,
    monthlyPrice: 1000,
    surface: "Superficie hasta 1.000 m²",
    showSurfaceChevron: true,
    featured: true,
    badge: "Más elegido",
    teamFeatures: [
      "3 administradores",
      "5 supervisores",
      "50 operadores",
    ],
    otherFeatures: [
      "Hasta 100 clientes",
      "Soporte prioritario",
      "Dashboard, avances con fotos y trazabilidad",
    ],
    ctaLabel: "Contratar",
    ctaVariant: "primary",
    theme: "dark",
  },
  {
    id: "multiobra",
    name: "Multiobra",
    subtitle: "Operaciones complejas y multiobra.",
    annualMonthlyPrice: null,
    monthlyPrice: null,
    priceLabel: "A cotizar",
    surface: "Superficie +5.000 m²",
    showSurfaceChevron: false,
    teamFeatures: [
      "Administradores ilimitados",
      "Supervisores ilimitados",
      "Operadores ilimitados",
    ],
    otherFeatures: [
      "Clientes ilimitados",
      "Soporte prioritario dedicado",
      "Dashboard, avances con fotos y trazabilidad",
    ],
    ctaLabel: "Solicitar cotización",
    ctaVariant: "dark",
    theme: "light",
  },
]

export type TeamRole = {
  title: string
  description: string
  examples: string
  iconSrc: string
}

export const TEAM_ROLES: TeamRole[] = [
  {
    title: "Administrador",
    description:
      "Configura estructuras, equipos, permisos y mantiene el funcionamiento general de la operación.",
    examples: "Administrador · Gerente · Project Manager · Coordinador",
    iconSrc: "/landing/pricing/role-admin.svg",
  },
  {
    title: "Supervisor",
    description:
      "Supervisa avances, valida tareas y controla la ejecución y la calidad en obra.",
    examples: "Director de Obra · Residente · Jefe de Obra · Líder de Proyecto",
    iconSrc: "/landing/pricing/role-supervisor.svg",
  },
  {
    title: "Operador",
    description:
      "Ejecuta tareas y registra avances de campo dentro del sistema.",
    examples: "Capataz · Contratista · Subcontratista",
    iconSrc: "/landing/pricing/role-operator.svg",
  },
]

export function getPlanDisplayPrice(
  plan: PricingPlan,
  billing: BillingPeriod,
): string | null {
  if (plan.priceLabel) return plan.priceLabel

  const price =
    billing === "annual" ? plan.annualMonthlyPrice : plan.monthlyPrice

  return price != null ? `$${price}` : null
}
