import { PerfilView } from "@/components/profile/PerfilView"

type PageProps = {
  params: Promise<{ projectId: string }>
}

export default async function PerfilPage({ params }: PageProps) {
  const { projectId } = await params
  return <PerfilView projectId={projectId} />
}
