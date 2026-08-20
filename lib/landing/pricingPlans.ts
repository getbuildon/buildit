export type BillingPeriod = "annual" | "monthly"

export type PlanCtaVariant = "outline" | "primary" | "dark"

export type SurfaceTier = {
  id: string
  label: string
  monthlyPrice: number
  annualMonthlyPrice: number
}

export type PricingPlan = {
  id: string
  name: string
  subtitle: string
  surfaceTiers?: SurfaceTier[]
  defaultSurfaceTierId?: string
  /** Precio mensual cuando se factura anual (planes sin tiers) */
  annualMonthlyPrice?: number | null
  /** Precio mensual facturado mes a mes (planes sin tiers) */
  monthlyPrice?: number | null
  priceLabel?: string
  surface?: string
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
    defaultSurfaceTierId: "60",
    surfaceTiers: [
      {
        id: "60",
        label: "Superficie hasta 60 m²",
        monthlyPrice: 400,
        annualMonthlyPrice: 320,
      },
      {
        id: "120",
        label: "Superficie hasta 120 m²",
        monthlyPrice: 600,
        annualMonthlyPrice: 480,
      },
      {
        id: "300",
        label: "Superficie hasta 300 m²",
        monthlyPrice: 800,
        annualMonthlyPrice: 640,
      },
    ],
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
    defaultSurfaceTierId: "1000",
    surfaceTiers: [
      {
        id: "1000",
        label: "Superficie hasta 1.000 m²",
        monthlyPrice: 1000,
        annualMonthlyPrice: 800,
      },
      {
        id: "2500",
        label: "Superficie hasta 2.500 m²",
        monthlyPrice: 1300,
        annualMonthlyPrice: 1040,
      },
      {
        id: "5000",
        label: "Superficie hasta 5.000 m²",
        monthlyPrice: 1600,
        annualMonthlyPrice: 1280,
      },
    ],
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

export function formatPlanPrice(amount: number): string {
  return `$${amount.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`
}

export function getPlanPricePeriodLabel(billing: BillingPeriod): string {
  return billing === "annual" ? "usd/año" : "usd/mes"
}

export function getTierDisplayPrice(
  tier: SurfaceTier,
  billing: BillingPeriod,
): string {
  if (billing === "annual") {
    return formatPlanPrice(tier.annualMonthlyPrice * 12)
  }

  return formatPlanPrice(tier.monthlyPrice)
}

export function getPlanDisplayPrice(
  plan: PricingPlan,
  billing: BillingPeriod,
  surfaceTierId?: string,
): string | null {
  if (plan.priceLabel) return plan.priceLabel

  if (plan.surfaceTiers?.length) {
    const tier =
      plan.surfaceTiers.find((item) => item.id === surfaceTierId) ??
      plan.surfaceTiers.find((item) => item.id === plan.defaultSurfaceTierId) ??
      plan.surfaceTiers[0]

    return getTierDisplayPrice(tier, billing)
  }

  const price =
    billing === "annual" ? plan.annualMonthlyPrice : plan.monthlyPrice

  if (price == null) return null

  const amount = billing === "annual" ? price * 12 : price
  return formatPlanPrice(amount)
}

export function getDefaultSurfaceTierId(plan: PricingPlan): string | undefined {
  if (!plan.surfaceTiers?.length) return undefined
  return plan.defaultSurfaceTierId ?? plan.surfaceTiers[0].id
}

export type PlanPriceBreakdown = {
  isQuote: boolean
  monthlyPrice: number | null
  annualMonthlyPrice: number | null
}

export function getPlanPriceBreakdown(
  plan: PricingPlan,
  surfaceTierId?: string,
): PlanPriceBreakdown {
  if (plan.priceLabel) {
    return { isQuote: true, monthlyPrice: null, annualMonthlyPrice: null }
  }

  if (plan.surfaceTiers?.length) {
    const tier =
      plan.surfaceTiers.find((item) => item.id === surfaceTierId) ??
      plan.surfaceTiers.find((item) => item.id === plan.defaultSurfaceTierId) ??
      plan.surfaceTiers[0]

    return {
      isQuote: false,
      monthlyPrice: tier.monthlyPrice,
      annualMonthlyPrice: tier.annualMonthlyPrice,
    }
  }

  return {
    isQuote: false,
    monthlyPrice: plan.monthlyPrice ?? null,
    annualMonthlyPrice: plan.annualMonthlyPrice ?? null,
  }
}

export function getPlanSurfaceLabel(
  plan: PricingPlan,
  surfaceTierId?: string,
): string {
  const tier =
    plan.surfaceTiers?.find((item) => item.id === surfaceTierId) ??
    plan.surfaceTiers?.find((item) => item.id === plan.defaultSurfaceTierId) ??
    plan.surfaceTiers?.[0]

  if (tier) return tier.label
  return plan.surface ?? plan.subtitle
}
