import type { ReactNode } from "react"
import { HOME_GRADIENT, HOME_LAYOUT } from "@/lib/home/designTokens"
import { cn } from "@/lib/utils"

type HomePageLayoutProps = {
  header?: ReactNode
  footer?: ReactNode
  children: ReactNode
  ariaBusy?: boolean
  ariaLabel?: string
  className?: string
}

export function HomePageLayout({
  header,
  footer,
  children,
  ariaBusy,
  ariaLabel,
  className,
}: HomePageLayoutProps) {
  return (
    <div
      aria-busy={ariaBusy}
      aria-label={ariaLabel}
      className={cn(HOME_LAYOUT.shell, className)}
      style={{ backgroundImage: HOME_GRADIENT }}
    >
      {header ? (
        <header className={HOME_LAYOUT.pageHeader}>
          <div className={HOME_LAYOUT.pageHeaderInner}>{header}</div>
        </header>
      ) : null}
      <main className={HOME_LAYOUT.content}>{children}</main>
      {footer}
    </div>
  )
}
