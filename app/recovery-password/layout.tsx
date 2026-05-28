import { Suspense } from "react"
import { Spinner } from "@/components/ui/spinner"

function RecoveryFallback() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background text-foreground"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Spinner className="size-8 text-muted-foreground" />
    </div>
  )
}

export default function RecoveryPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Suspense fallback={<RecoveryFallback />}>{children}</Suspense>
}
