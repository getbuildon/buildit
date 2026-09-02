import { MembersView } from "./MembersView"

type PageProps = {
  params: Promise<{ companyId: string }>
}

export default async function MembersPage({ params }: PageProps) {
  const { companyId } = await params
  return <MembersView companyId={companyId} />
}
