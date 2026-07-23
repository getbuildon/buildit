import Image from "next/image"
import { getUserInitials } from "@/lib/profile/userInitials"
import { cn } from "@/lib/utils"

const SIZE_PRESETS = {
  sm: 32,
  md: 40,
  sidebar: 31,
  lg: 64,
} as const

type UserAvatarSize = keyof typeof SIZE_PRESETS | number

type UserAvatarProps = {
  firstName: string
  lastName: string
  avatarUrl?: string | null
  email?: string | null
  size?: UserAvatarSize
  className?: string
  bgClassName?: string
  textClassName?: string
}

function resolveSize(size: UserAvatarSize): number {
  return typeof size === "number" ? size : SIZE_PRESETS[size]
}

export function UserAvatar({
  firstName,
  lastName,
  avatarUrl,
  email,
  size = "md",
  className,
  bgClassName = "bg-[#ff7433]",
  textClassName = "text-[12px] font-semibold text-white",
}: UserAvatarProps) {
  const px = resolveSize(size)
  const initials = getUserInitials(firstName, lastName, email)

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        bgClassName,
        textClassName,
        className,
      )}
      style={{ width: px, height: px }}
      aria-hidden={Boolean(avatarUrl)}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt=""
          fill
          className="object-cover"
          sizes={`${px}px`}
          unoptimized
        />
      ) : (
        initials
      )}
    </div>
  )
}
