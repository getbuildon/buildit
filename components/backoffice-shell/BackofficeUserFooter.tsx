"use client"

import { UserAvatar } from "@/components/user/UserAvatar"
import { BACKOFFICE_SHELL } from "@/lib/backoffice/designTokens"
import type { SidebarUserProfile } from "@/lib/profile/sidebarUserProfile"
import { cn } from "@/lib/utils"

type BackofficeUserFooterProps = {
  userProfile: SidebarUserProfile
  className?: string
}

export function BackofficeUserFooter({
  userProfile,
  className,
}: BackofficeUserFooterProps) {
  return (
    <div
      className={cn("border-t px-2.5 pb-3.5 pt-3", className)}
      style={{ borderColor: BACKOFFICE_SHELL.sidebarBorder }}
    >
      <div className="flex items-center gap-2.25 px-2.5 py-2">
        <UserAvatar
          firstName={userProfile.firstName}
          lastName={userProfile.lastName}
          email={userProfile.email}
          avatarUrl={userProfile.avatarUrl}
          size={28}
          className="border border-[rgba(255,116,51,0.4)]"
          bgClassName="bg-[rgba(255,116,51,0.2)]"
          textClassName="text-[10px] font-semibold leading-[15px] text-[#ff7433]"
        />
        <div className="min-w-0">
          <p className="truncate text-xs font-medium leading-[1.4] text-white">
            {userProfile.fullName}
          </p>
          <p className="truncate text-[10px] leading-[1.4] tracking-[-0.5px] text-[#afb3ba]">
            {userProfile.email}
          </p>
        </div>
      </div>
    </div>
  )
}
