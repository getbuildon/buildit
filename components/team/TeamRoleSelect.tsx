"use client"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { USER_TYPE_ROLES } from "@/lib/projects/createProjectDraft"
import {
  encodeTeamRoleSelection,
  getProjectUserTypeDisplayLabel,
  PROJECT_TEAM_SELECTABLE_USER_TYPES,
} from "@/lib/projects/projectUserTypeDisplay"
import { cn } from "@/lib/utils"

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
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        id={id}
        aria-label={placeholder}
        className={cn(
          triggerClassName,
          hasError && "border-[#eb8e90] focus:border-[#eb8e90]",
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper">
        {PROJECT_TEAM_SELECTABLE_USER_TYPES.map((userType) => (
          <SelectGroup key={userType}>
            <SelectLabel className="text-[11px] font-medium uppercase tracking-wide text-[#ff7433]">
              {getProjectUserTypeDisplayLabel(userType)}
            </SelectLabel>
            {USER_TYPE_ROLES[userType].map((role) => (
              <SelectItem
                key={encodeTeamRoleSelection(userType, role)}
                value={encodeTeamRoleSelection(userType, role)}
              >
                {role}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}
