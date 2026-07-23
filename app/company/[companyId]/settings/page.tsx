import { redirect } from "next/navigation"

type PageProps = {
  params: Promise<{ companyId: string }>
}

export default async function CompanySettingsRedirectPage({ params }: PageProps) {
  const { companyId } = await params
  redirect(`/company/${companyId}/informacion`)
}
