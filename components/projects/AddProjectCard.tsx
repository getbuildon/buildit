import Link from "next/link"
import { Plus } from "lucide-react"
import {
  HOME_COLORS,
  HOME_TYPE,
  PROJECT_CARD,
} from "@/lib/home/designTokens"

export function AddProjectCard() {
  return (
    <Link
      href="/projects/new"
      className="flex shrink-0 flex-col items-center justify-center rounded-[16px] border-2 border-dashed border-white/20 bg-white/5 px-6 text-center transition-colors hover:border-white/35 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
      style={{ width: PROJECT_CARD.width, height: PROJECT_CARD.height }}
    >
      <div className="flex size-12 items-center justify-center rounded-[14px] bg-white/10 px-3">
        <Plus className="size-6 text-white" aria-hidden />
      </div>
      <p className={`${HOME_TYPE.addTitle} mt-4 text-white`}>Agregar nueva obra</p>
      <p
        className={`${HOME_TYPE.addSubtitle} mt-1`}
        style={{ color: HOME_COLORS.addCardSubtext }}
      >
        Crear proyecto desde cero
      </p>
    </Link>
  )
}
