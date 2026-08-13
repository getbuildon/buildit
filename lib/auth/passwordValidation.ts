export const PASSWORD_MIN_LENGTH = 8

export const PASSWORD_REQUIREMENTS_HINT =
  "Mínimo 8 caracteres, con mayúsculas, minúsculas, un número y un carácter especial."

export function getPasswordStrengthError(password: string): string | null {
  if (!password.trim()) {
    return "La contraseña es requerida"
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return "La contraseña debe tener al menos 8 caracteres."
  }

  if (!/[a-z]/.test(password)) {
    return "Incluí al menos una letra minúscula (a-z)."
  }

  if (!/[A-Z]/.test(password)) {
    return "Incluí al menos una letra mayúscula (A-Z)."
  }

  if (!/[0-9]/.test(password)) {
    return "Incluí al menos un número (0-9)."
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    return "Incluí al menos un carácter especial (por ejemplo: ! @ # $ %)."
  }

  return null
}

export function validateNewPasswordFields(
  password: string,
  confirmPassword: string,
): {
  errors: { password: string; confirmPassword: string }
  ok: boolean
} {
  const errors = { password: "", confirmPassword: "" }
  let ok = true

  const strengthError = getPasswordStrengthError(password)
  if (strengthError) {
    errors.password = strengthError
    ok = false
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Confirmá tu contraseña"
    ok = false
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Las contraseñas no coinciden"
    ok = false
  }

  return { errors, ok }
}

export function mapPasswordPolicyError(message: string): string | null {
  const msg = message.toLowerCase()

  const isPasswordRelated =
    msg.includes("password") ||
    msg.includes("contraseña") ||
    msg.includes("should contain at least one character")

  if (!isPasswordRelated) return null

  if (
    msg.includes("same as") ||
    msg.includes("different from the old") ||
    msg.includes("should be different")
  ) {
    return "La nueva contraseña debe ser distinta a la anterior."
  }

  if (msg.includes("known") || msg.includes("pwned") || msg.includes("breach")) {
    return "Esa contraseña es muy común o insegura. Elegí otra distinta."
  }

  if (
    msg.includes("password should contain") ||
    msg.includes("weak password") ||
    msg.includes("does not meet") ||
    msg.includes("requirements")
  ) {
    return "La contraseña debe tener al menos 8 caracteres e incluir una letra minúscula, una mayúscula, un número y un carácter especial (por ejemplo: ! @ #)."
  }

  if (msg.includes("too short") || msg.includes("at least 8")) {
    return "La contraseña debe tener al menos 8 caracteres."
  }

  return "No pudimos usar esa contraseña. Revisá que cumpla con los requisitos e intentá de nuevo."
}
