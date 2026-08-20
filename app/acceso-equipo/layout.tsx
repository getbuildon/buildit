import { Suspense } from "react"

import { AccessLoginFallback } from "@/components/auth/AccessLoginFallback"

export default function AccesoEquipoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Suspense fallback={<AccessLoginFallback />}>{children}</Suspense>
}
