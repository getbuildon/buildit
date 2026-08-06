export const LANDING_CONTACT_EMAIL = "info@getbuildon.com"

export const LANDING_FOOTER_LINKS = [
  {
    id: "email",
    label: LANDING_CONTACT_EMAIL,
    href: `mailto:${LANDING_CONTACT_EMAIL}`,
    external: false,
  },
  {
    id: "instagram",
    label: "Instagram",
    href: "https://instagram.com/getbuildon",
    external: true,
  },
  {
    id: "linkedin",
    label: "Linkedin",
    href: "https://linkedin.com/company/getbuildon",
    external: true,
  },
] as const
