export const COMPANY_LOGOS_BUCKET = "company-logos"

export const MAX_COMPANY_LOGO_BYTES = 10 * 1024 * 1024

export const MAX_COMPANY_LOGO_SOURCE_BYTES = 10 * 1024 * 1024

export function buildCompanyLogoStoragePath(companyId: string): string {
  return `${companyId}/logo.webp`
}
