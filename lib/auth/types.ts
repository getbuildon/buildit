export type AppUser = {
  id: string
  email: string
}

export type AuthResult = {
  error?: string
  needsEmailConfirmation?: boolean
}
