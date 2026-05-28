import type { LucideIcon } from "lucide-react"
import { SHELL_COLORS, SHELL_TYPE } from "@/lib/project/designTokens"
import { cn } from "@/lib/utils"

type ProjectPageHeaderProps = {
  title: string
  subtitle: string
  icon: LucideIcon
}

export function ProjectPageHeader({ title, subtitle, icon: Icon }: ProjectPageHeaderProps) {
  return (
    <header className="mb-6">
      <div className="flex items-center gap-2">
        <Icon className="size-6 shrink-0" style={{ color: "#155dfc" }} aria-hidden />
        <h1 className={cn(SHELL_TYPE.pageTitle)} style={{ color: SHELL_COLORS.pageTitle }}>
          {title}
        </h1>
      </div>
      <p
        className={cn("mt-0.5", SHELL_TYPE.pageSubtitle)}
        style={{ color: SHELL_COLORS.pageSubtitle }}
      >
        {subtitle}
      </p>
    </header>
  )
}
