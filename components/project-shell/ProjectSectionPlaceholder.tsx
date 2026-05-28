import { SHELL_COLORS } from "@/lib/project/designTokens"

type ProjectSectionPlaceholderProps = {
  title: string
  description: string
}

export function ProjectSectionPlaceholder({
  title,
  description,
}: ProjectSectionPlaceholderProps) {
  return (
    <div
      className="rounded-[16px] border p-8 shadow-[0px_1px_2px_rgba(15,23,43,0.06)]"
      style={{
        backgroundColor: SHELL_COLORS.cardBg,
        borderColor: SHELL_COLORS.cardBorder,
      }}
    >
      <h2 className="text-lg font-semibold tracking-[-0.15px]" style={{ color: SHELL_COLORS.pageTitle }}>
        {title}
      </h2>
      <p className="mt-2 text-sm leading-5 tracking-[-0.15px]" style={{ color: SHELL_COLORS.pageSubtitle }}>
        {description}
      </p>
    </div>
  )
}
