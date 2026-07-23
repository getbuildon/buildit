export function getUserInitials(
  firstName: string,
  lastName: string,
  email?: string | null,
): string {
  const first = firstName.trim().charAt(0)
  const last = lastName.trim().charAt(0)
  if (first || last) return `${first}${last}`.toUpperCase()

  const local = email?.split("@")[0]?.trim()
  return local ? local.slice(0, 2).toUpperCase() : "??"
}
