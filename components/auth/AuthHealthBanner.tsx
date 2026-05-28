import { useAuthHealthCheck } from "@/hooks/useAuthHealthCheck"

type AuthHealthBannerProps = {
  className?: string
}

export function AuthHealthBanner({ className }: AuthHealthBannerProps) {
  const { checked, ok, message } = useAuthHealthCheck()

  if (!checked || ok || !message) return null

  return (
    <p
      className={className}
      role="alert"
    >
      {message}
    </p>
  )
}
