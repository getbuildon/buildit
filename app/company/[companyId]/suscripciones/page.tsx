import { notFound } from "next/navigation"
import { getCompanySubscriptionsData } from "./actions"
import { SuscripcionesView } from "./SuscripcionesView"

type PageProps = {
  params: Promise<{ companyId: string }>
}

export default async function SuscripcionesPage({ params }: PageProps) {
  const { companyId } = await params
  const data = await getCompanySubscriptionsData(companyId)

  if (!data) {
    notFound()
  }

  return <SuscripcionesView subscriptions={data.subscriptions} />
}
