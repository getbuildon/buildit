export const BACKOFFICE_USERS_STATUS_FILTER_OPTIONS = [
  { id: "active", label: "Activo" },
  { id: "inactive", label: "Inactivo" },
] as const

export function getBackofficeUsersStatusFilterLabel(status: string): string {
  return (
    BACKOFFICE_USERS_STATUS_FILTER_OPTIONS.find((option) => option.id === status)
      ?.label ?? status
  )
}
