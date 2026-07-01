import { notFound } from "next/navigation"
import type { ReactNode } from "react"
import { getCompanyById } from "@/lib/company/getCompanies"

type CompanyLayoutProps = {
  children: ReactNode
  params: Promise<Record<string, string>>
}

export default async function CompanyLayout({ children, params }: CompanyLayoutProps) {
  const { companyId } = await params as { companyId: string }
  const company = await getCompanyById(companyId)

  if (!company) {
    notFound()
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#f8f9fa" }}>
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1">
          <div
            className="mx-auto w-full"
            style={{
              maxWidth: "100%",
              padding: "24px",
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
