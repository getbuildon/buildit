import type { ReactNode } from "react"
import { HOME_GRADIENT, HOME_LAYOUT } from "@/lib/home/designTokens"
import { cn } from "@/lib/utils"

type HomePageLayoutProps = {
  topBar?: ReactNode
  children: ReactNode
  ariaBusy?: boolean
  ariaLabel?: string
  className?: string
}

export function HomePageLayout({
  topBar,
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
      {topBar ? (
        <div className={HOME_LAYOUT.topBarWrap}>
          <div className={HOME_LAYOUT.topBar}>{topBar}</div>
        </div>
      ) : null}
      <div className={HOME_LAYOUT.content}>{children}</div>
    </div>
  )
}
