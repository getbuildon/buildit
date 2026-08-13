export type ProjectWeatherSnapshot = {
  temperatureC: number
  city: string
  description: string
}

type GeocodingResponse = {
  results?: Array<{
    name: string
    country?: string
    latitude: number
    longitude: number
  }>
}

type ForecastResponse = {
  current?: {
    temperature_2m?: number
    weather_code?: number
  }
}

const WEATHER_CODE_LABELS: Record<number, string> = {
  0: "Despejado",
  1: "Mayormente despejado",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Neblina",
  48: "Neblina con escarcha",
  51: "Llovizna ligera",
  53: "Llovizna moderada",
  55: "Llovizna intensa",
  61: "Lluvia ligera",
  63: "Lluvia moderada",
  65: "Lluvia intensa",
  71: "Nieve ligera",
  73: "Nieve moderada",
  75: "Nieve intensa",
  80: "Chaparrones ligeros",
  81: "Chaparrones moderados",
  82: "Chaparrones intensos",
  95: "Tormenta",
  96: "Tormenta con granizo",
  99: "Tormenta fuerte con granizo",
}

const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  argentina: "AR",
  uruguay: "UY",
  chile: "CL",
  paraguay: "PY",
  bolivia: "BO",
  brasil: "BR",
  brazil: "BR",
  peru: "PE",
  perú: "PE",
  colombia: "CO",
  mexico: "MX",
  méxico: "MX",
  españa: "ES",
  spain: "ES",
}

function describeWeatherCode(code: number | undefined): string {
  if (code == null) return "Sin datos"
  return WEATHER_CODE_LABELS[code] ?? "Condición variable"
}

function normalizeCountryCode(country: string | null | undefined): string | undefined {
  const trimmed = country?.trim()
  if (!trimmed) return undefined

  if (/^[A-Za-z]{2}$/.test(trimmed)) {
    return trimmed.toUpperCase()
  }

  return COUNTRY_NAME_TO_CODE[trimmed.toLowerCase()]
}

function buildGeocodingCandidates(
  location: string,
  country: string | null | undefined,
): string[] {
  const candidates: string[] = []
  const trimmedLocation = location.trim()
  const trimmedCountry = country?.trim()

  if (trimmedLocation) {
    const parts = trimmedLocation
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)

    if (parts.length >= 2) {
      candidates.push(parts[parts.length - 2])
    }

    if (parts.length >= 1) {
      const lastPart = parts[parts.length - 1]
      if (lastPart.length <= 40) {
        candidates.push(lastPart)
      }
    }

    if (parts.length === 1) {
      candidates.push(parts[0])
    }

    candidates.push(trimmedLocation)
  }

  if (trimmedCountry) {
    candidates.push(trimmedCountry)
  }

  if (candidates.length === 0) {
    candidates.push("Buenos Aires")
  }

  return [...new Set(candidates.filter(Boolean))]
}

function formatCityLabel(name: string): string {
  return name.replace(/^Ciudad de\s+/i, "")
}

async function geocodePlace(
  query: string,
  countryCode?: string,
): Promise<GeocodingResponse["results"][number] | null> {
  const geocodingUrl = new URL("https://geocoding-api.open-meteo.com/v1/search")
  geocodingUrl.searchParams.set("name", query)
  geocodingUrl.searchParams.set("count", "1")
  geocodingUrl.searchParams.set("language", "es")
  geocodingUrl.searchParams.set("format", "json")

  if (countryCode) {
    geocodingUrl.searchParams.set("country_code", countryCode)
  }

  const geocodingResponse = await fetch(geocodingUrl, {
    next: { revalidate: 60 * 60 * 12 },
  })

  if (!geocodingResponse.ok) return null

  const geocoding = (await geocodingResponse.json()) as GeocodingResponse
  return geocoding.results?.[0] ?? null
}

async function fetchForecast(
  latitude: number,
  longitude: number,
): Promise<ForecastResponse["current"] | null> {
  const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast")
  forecastUrl.searchParams.set("latitude", String(latitude))
  forecastUrl.searchParams.set("longitude", String(longitude))
  forecastUrl.searchParams.set("current", "temperature_2m,weather_code")
  forecastUrl.searchParams.set("timezone", "auto")

  const forecastResponse = await fetch(forecastUrl, {
    next: { revalidate: 60 * 30 },
  })

  if (!forecastResponse.ok) return null

  const forecast = (await forecastResponse.json()) as ForecastResponse
  return forecast.current ?? null
}

export async function fetchProjectWeather(input: {
  location: string
  country?: string | null
}): Promise<ProjectWeatherSnapshot | null> {
  const countryCode = normalizeCountryCode(input.country)
  const candidates = buildGeocodingCandidates(input.location, input.country)

  try {
    for (const query of candidates) {
      const place = await geocodePlace(query, countryCode)
      if (!place) continue

      const current = await fetchForecast(place.latitude, place.longitude)
      const temperature = current?.temperature_2m
      if (temperature == null) continue

      return {
        temperatureC: Math.round(temperature),
        city: formatCityLabel(place.name),
        description: describeWeatherCode(current?.weather_code),
      }
    }

    return null
  } catch {
    return null
  }
}
