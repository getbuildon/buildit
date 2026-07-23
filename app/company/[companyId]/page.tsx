import { redirect } from "next/navigation"

type PageProps = {
  params: Promise<{ companyId: string }>
}

export default async function CompanyIndexPage({ params }: PageProps) {
  const { companyId } = await params
  redirect(`/company/${companyId}/suscripciones`)
}
