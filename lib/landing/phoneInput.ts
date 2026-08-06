import {
  CONTRACT_COUNTRIES,
  getContractCountry,
  type ContractCountryCode,
} from "@/lib/landing/contractLocations"

export type PhoneDialCode = ContractCountryCode

export type PhoneDialOption = {
  value: PhoneDialCode
  flag: string
  label: string
  placeholder: string
}

export const PHONE_DIAL_OPTIONS: PhoneDialOption[] = CONTRACT_COUNTRIES.map(
  (country) => ({
    value: country.value,
    flag: country.flag,
    label: country.label,
    placeholder: country.phonePlaceholder,
  }),
)

/** Caracteres permitidos en teléfonos: dígitos, +, guiones, espacios, paréntesis y punto. */
const PHONE_INPUT_PATTERN = /[^\d+\-()\s.]/g

export function sanitizePhoneInput(value: string): string {
  return value.replace(PHONE_INPUT_PATTERN, "")
}

export function getPhoneDialOption(code: PhoneDialCode): PhoneDialOption {
  const country = getContractCountry(code)
  return {
    value: country.value,
    flag: country.flag,
    label: country.label,
    placeholder: country.phonePlaceholder,
  }
}
