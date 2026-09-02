"use client"

import Image from "next/image"
import { getUserInitials } from "@/lib/profile/userInitials"
import { cn } from "@/lib/utils"
import {
  AvatarCursorPreview,
  AVATAR_PREVIEW_SIZE,
} from "@/components/user/AvatarCursorPreview"

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
  previewOnHover?: boolean
}

function resolveSize(size: UserAvatarSize): number {
  return typeof size === "number" ? size : SIZE_PRESETS[size]
}

function AvatarCircle({
  firstName,
  lastName,
  avatarUrl,
  email,
  px,
  className,
  bgClassName,
  textClassName,
}: {
  firstName: string
  lastName: string
  avatarUrl?: string | null
  email?: string | null
  px: number
  className?: string
  bgClassName?: string
  textClassName?: string
}) {
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

export function UserAvatar({
  firstName,
  lastName,
  avatarUrl,
  email,
  size = "md",
  className,
  bgClassName = "bg-[#ff7433]",
  textClassName = "text-[12px] font-semibold text-white",
  previewOnHover = false,
}: UserAvatarProps) {
  const px = resolveSize(size)
  const showPreview = previewOnHover && Boolean(avatarUrl)
  const avatarProps = {
    firstName,
    lastName,
    avatarUrl,
    email,
    bgClassName,
  }

  const trigger = (
    <AvatarCircle
      {...avatarProps}
      px={px}
      className={showPreview ? "cursor-zoom-in" : className}
      textClassName={textClassName}
    />
  )

  if (!showPreview) return trigger

  return (
    <AvatarCursorPreview
      className={className}
      preview={
        <AvatarCircle
          {...avatarProps}
          px={AVATAR_PREVIEW_SIZE}
          className="shadow-[0_18px_48px_rgba(17,17,19,0.22)] ring-2 ring-white"
          textClassName={cn(textClassName, "text-[36px]")}
        />
      }
    >
      {trigger}
    </AvatarCursorPreview>
  )
}
