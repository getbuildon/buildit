import { Suspense } from "react"
import { Spinner } from "@/components/ui/spinner"

function LoginFallback() {
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

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoginFallback />}>
      {children}
    </Suspense>
  )
}
