export type BackofficePlanFilterTier = {
  slug: string
  label: string
}

export type BackofficePlanFilterGroup = {
  id: string
  label: string
  tiers: BackofficePlanFilterTier[]
}

export const BACKOFFICE_PLAN_FILTER_GROUPS: BackofficePlanFilterGroup[] = [
  {
    id: "compacto",
    label: "Compacto",
    tiers: [
      { slug: "compacto-60", label: "60 m²" },
      { slug: "compacto-120", label: "120 m²" },
      { slug: "compacto-300", label: "300 m²" },
    ],
  },
  {
    id: "gran-escala",
    label: "Gran Escala",
    tiers: [
      { slug: "gran-escala-1000", label: "1.000 m²" },
      { slug: "gran-escala-2500", label: "2.500 m²" },
      { slug: "gran-escala-5000", label: "5.000 m²" },
    ],
  },
  {
    id: "multiobra",
    label: "Multiobra",
    tiers: [{ slug: "multiobra", label: "+5.000 m²" }],
  },
]

export const BACKOFFICE_PLAN_FILTER_SLUGS = new Set(
  BACKOFFICE_PLAN_FILTER_GROUPS.flatMap((group) =>
    group.tiers.map((tier) => tier.slug),
  ),
)

export const BACKOFFICE_PROJECT_STATUS_FILTER_OPTIONS = [
  { id: "active", label: "Activo" },
  { id: "inactive", label: "Inactivo" },
  { id: "expired", label: "Vencido" },
  { id: "disabled", label: "Cancelado" },
] as const

export function getBackofficePlanFilterLabel(slug: string): string {
  for (const group of BACKOFFICE_PLAN_FILTER_GROUPS) {
    const tier = group.tiers.find((item) => item.slug === slug)
    if (tier) {
      return `${group.label} · ${tier.label}`
    }
  }

  return slug
}

export function getBackofficeStatusFilterLabel(status: string): string {
  return (
    BACKOFFICE_PROJECT_STATUS_FILTER_OPTIONS.find((option) => option.id === status)
      ?.label ?? status
  )
}
