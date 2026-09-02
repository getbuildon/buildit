export const MAX_TOTAL_SURFACE_DIGITS = 8
export const MAX_TOTAL_SURFACE_DECIMALS = 2

type ParsedSurfaceInput = {
  integerDigits: string
  decimalDigits: string
  hasDecimalSeparator: boolean
}

function formatThousands(digits: string): string {
  if (!digits) return ""
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

function parseSurfaceInput(raw: string): ParsedSurfaceInput {
  const cleaned = raw.replace(/[^\d.,]/g, "")
  if (!cleaned) {
    return { integerDigits: "", decimalDigits: "", hasDecimalSeparator: false }
  }

  const lastComma = cleaned.lastIndexOf(",")
  if (lastComma !== -1) {
    return {
      integerDigits: cleaned.slice(0, lastComma).replace(/\D/g, "").slice(0, MAX_TOTAL_SURFACE_DIGITS),
      decimalDigits: cleaned
        .slice(lastComma + 1)
        .replace(/\D/g, "")
        .slice(0, MAX_TOTAL_SURFACE_DECIMALS),
      hasDecimalSeparator: true,
    }
  }

  if (cleaned.endsWith(".")) {
    return {
      integerDigits: cleaned.slice(0, -1).replace(/\D/g, "").slice(0, MAX_TOTAL_SURFACE_DIGITS),
      decimalDigits: "",
      hasDecimalSeparator: true,
    }
  }

  const lastDot = cleaned.lastIndexOf(".")
  if (lastDot !== -1) {
    const after = cleaned.slice(lastDot + 1)
    const isThousands = /^\d{1,3}(\.\d{3})+$/.test(cleaned)
    if (!isThousands && /^\d{1,2}$/.test(after)) {
      return {
        integerDigits: cleaned.slice(0, lastDot).replace(/\D/g, "").slice(0, MAX_TOTAL_SURFACE_DIGITS),
        decimalDigits: after.slice(0, MAX_TOTAL_SURFACE_DECIMALS),
        hasDecimalSeparator: true,
      }
    }
  }

  return {
    integerDigits: cleaned.replace(/\D/g, "").slice(0, MAX_TOTAL_SURFACE_DIGITS),
    decimalDigits: "",
    hasDecimalSeparator: false,
  }
}

function formatSurfaceInput(parsed: ParsedSurfaceInput): string {
  const integerDigits = parsed.integerDigits.slice(0, MAX_TOTAL_SURFACE_DIGITS)
  const decimalDigits = parsed.decimalDigits.slice(0, MAX_TOTAL_SURFACE_DECIMALS)
  const integer = formatThousands(
    integerDigits || (parsed.hasDecimalSeparator ? "0" : ""),
  )

  if (!parsed.hasDecimalSeparator) return integer
  return `${integer},${decimalDigits}`
}

/** Extrae solo la parte entera. Preferí `parseSurfaceNumber` para valores con decimales. */
export function extractTotalSurfaceDigits(value: string): string {
  return parseSurfaceInput(value).integerDigits
}

export function formatTotalSurfaceDigits(digits: string): string {
  return formatThousands(digits.replace(/\D/g, "").slice(0, MAX_TOTAL_SURFACE_DIGITS))
}

export function normalizeTotalSurfaceInput(raw: string): string {
  return formatSurfaceInput(parseSurfaceInput(raw))
}

export function finalizeTotalSurfaceInput(raw: string): string {
  const parsed = parseSurfaceInput(raw)
  if (!parsed.integerDigits && !parsed.decimalDigits) return ""

  return formatSurfaceInput({
    ...parsed,
    hasDecimalSeparator: parsed.decimalDigits.length > 0,
  })
}

export function parseSurfaceNumber(value: string): number | null {
  const parsed = parseSurfaceInput(value)
  if (!parsed.integerDigits && !parsed.decimalDigits) return null

  const numeric = Number(`${parsed.integerDigits || "0"}.${parsed.decimalDigits || "0"}`)
  if (!Number.isFinite(numeric)) return null

  return Math.round(numeric * 100) / 100
}

export function hasTotalSurfaceValue(value: string): boolean {
  const parsed = parseSurfaceNumber(value)
  return parsed != null && parsed > 0
}

export function formatTotalSurfaceFromNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return ""

  const rounded = Math.round(Math.abs(value) * 100) / 100
  const [intPart, decPart = "00"] = rounded.toFixed(2).split(".")
  const formattedInt = formatThousands(intPart.slice(0, MAX_TOTAL_SURFACE_DIGITS))

  if (decPart === "00") return formattedInt
  if (decPart.endsWith("0")) return `${formattedInt},${decPart[0]}`
  return `${formattedInt},${decPart}`
}
