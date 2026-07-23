import { InformacionView } from "./InformacionView"

type PageProps = {
  params: Promise<{ companyId: string }>
}

export default async function InformacionPage({ params }: PageProps) {
  const { companyId } = await params
  return <InformacionView companyId={companyId} />
}
