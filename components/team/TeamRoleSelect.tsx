"use client"

import { NestedSelect } from "@/components/ui/select"
import { USER_TYPE_ROLES } from "@/lib/projects/createProjectDraft"
import {
  decodeTeamRoleSelection,
  encodeTeamRoleSelection,
  getProjectUserTypeDisplayLabel,
  PROJECT_TEAM_SELECTABLE_USER_TYPES,
} from "@/lib/projects/projectUserTypeDisplay"
import { cn } from "@/lib/utils"

const TEAM_ROLE_GROUPS = PROJECT_TEAM_SELECTABLE_USER_TYPES.map((userType) => ({
  id: userType,
  label: getProjectUserTypeDisplayLabel(userType) ?? userType,
  options: USER_TYPE_ROLES[userType].map((role) => ({
    value: encodeTeamRoleSelection(userType, role),
    label: role,
  })),
}))

type TeamRoleSelectProps = {
  id: string
  value: string
  placeholder?: string
  disabled?: boolean
  hasError?: boolean
  triggerClassName?: string
  onChange: (value: string) => void
}

export function TeamRoleSelect({
  id,
  value,
  placeholder = "Rol",
  disabled,
  hasError,
  triggerClassName,
  onChange,
}: TeamRoleSelectProps) {
  return (
    <NestedSelect
      id={id}
      value={value || undefined}
      groupId={decodeTeamRoleSelection(value)?.userType}
      groups={TEAM_ROLE_GROUPS}
      placeholder={placeholder}
      disabled={disabled}
      aria-label={placeholder}
      triggerClassName={cn(
        triggerClassName,
        hasError && "border-[#eb8e90] focus-visible:border-[#eb8e90]",
      )}
      onValueChange={onChange}
    />
  )
}
