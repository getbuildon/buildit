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

function describeWeatherCode(code: number | undefined): string {
  if (code == null) return "Sin datos"
  return WEATHER_CODE_LABELS[code] ?? "Condición variable"
}

function buildLocationQuery(location: string, country: string | null): string {
  const trimmedLocation = location.trim()
  if (trimmedLocation) return trimmedLocation

  const trimmedCountry = country?.trim()
  if (trimmedCountry) return trimmedCountry

  return "Buenos Aires"
}

export async function fetchProjectWeather(input: {
  location: string
  country?: string | null
}): Promise<ProjectWeatherSnapshot | null> {
  const query = buildLocationQuery(input.location, input.country ?? null)
  if (!query) return null

  try {
    const geocodingUrl = new URL("https://geocoding-api.open-meteo.com/v1/search")
    geocodingUrl.searchParams.set("name", query)
    geocodingUrl.searchParams.set("count", "1")
    geocodingUrl.searchParams.set("language", "es")
    geocodingUrl.searchParams.set("format", "json")

    const geocodingResponse = await fetch(geocodingUrl, {
      next: { revalidate: 60 * 60 * 12 },
    })

    if (!geocodingResponse.ok) return null

    const geocoding = (await geocodingResponse.json()) as GeocodingResponse
    const place = geocoding.results?.[0]
    if (!place) return null

    const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast")
    forecastUrl.searchParams.set("latitude", String(place.latitude))
    forecastUrl.searchParams.set("longitude", String(place.longitude))
    forecastUrl.searchParams.set("current", "temperature_2m,weather_code")
    forecastUrl.searchParams.set("timezone", "auto")

    const forecastResponse = await fetch(forecastUrl, {
      next: { revalidate: 60 * 30 },
    })

    if (!forecastResponse.ok) return null

    const forecast = (await forecastResponse.json()) as ForecastResponse
    const temperature = forecast.current?.temperature_2m
    if (temperature == null) return null

    return {
      temperatureC: Math.round(temperature),
      city: place.name,
      description: describeWeatherCode(forecast.current?.weather_code),
    }
  } catch {
    return null
  }
}
