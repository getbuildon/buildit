import { cn } from "@/lib/utils"

type CertifierShieldIconProps = {
  className?: string
}

export function CertifierShieldIcon({ className }: CertifierShieldIconProps) {
  return (
    <img
      src="/icons/certifier-shield.png"
      alt=""
      aria-hidden
      className={cn("size-6 shrink-0", className)}
    />
  )
}
