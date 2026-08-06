export type ContractCountryCode = "ar" | "uy" | "py" | "cl"

export type ContractCountry = {
  value: ContractCountryCode
  label: string
  flag: string
  phonePlaceholder: string
}

export type ContractProvince = {
  value: string
  label: string
}

export const CONTRACT_COUNTRIES: ContractCountry[] = [
  {
    value: "ar",
    label: "Argentina",
    flag: "🇦🇷",
    phonePlaceholder: "+54 11 2345-6789",
  },
  {
    value: "uy",
    label: "Uruguay",
    flag: "🇺🇾",
    phonePlaceholder: "+598 99 123 456",
  },
  {
    value: "py",
    label: "Paraguay",
    flag: "🇵🇾",
    phonePlaceholder: "+595 981 123456",
  },
  {
    value: "cl",
    label: "Chile",
    flag: "🇨🇱",
    phonePlaceholder: "+56 9 1234 5678",
  },
]

export const CONTRACT_PROVINCES_BY_COUNTRY: Record<
  ContractCountryCode,
  ContractProvince[]
> = {
  ar: [
    { value: "buenos-aires", label: "Buenos Aires" },
    { value: "catamarca", label: "Catamarca" },
    { value: "chaco", label: "Chaco" },
    { value: "chubut", label: "Chubut" },
    {
      value: "ciudad-autonoma-de-buenos-aires",
      label: "Ciudad Autónoma de Buenos Aires",
    },
    { value: "cordoba", label: "Córdoba" },
    { value: "corrientes", label: "Corrientes" },
    { value: "entre-rios", label: "Entre Ríos" },
    { value: "formosa", label: "Formosa" },
    { value: "jujuy", label: "Jujuy" },
    { value: "la-pampa", label: "La Pampa" },
    { value: "la-rioja", label: "La Rioja" },
    { value: "mendoza", label: "Mendoza" },
    { value: "misiones", label: "Misiones" },
    { value: "neuquen", label: "Neuquén" },
    { value: "rio-negro", label: "Río Negro" },
    { value: "salta", label: "Salta" },
    { value: "san-juan", label: "San Juan" },
    { value: "san-luis", label: "San Luis" },
    { value: "santa-cruz", label: "Santa Cruz" },
    { value: "santa-fe", label: "Santa Fe" },
    { value: "santiago-del-estero", label: "Santiago del Estero" },
    {
      value: "tierra-del-fuego",
      label: "Tierra del Fuego, Antártida e Islas del Atlántico Sur",
    },
    { value: "tucuman", label: "Tucumán" },
  ],
  uy: [
    { value: "artigas", label: "Artigas" },
    { value: "canelones", label: "Canelones" },
    { value: "cerro-largo", label: "Cerro Largo" },
    { value: "colonia", label: "Colonia" },
    { value: "durazno", label: "Durazno" },
    { value: "flores", label: "Flores" },
    { value: "florida", label: "Florida" },
    { value: "lavalleja", label: "Lavalleja" },
    { value: "maldonado", label: "Maldonado" },
    { value: "montevideo", label: "Montevideo" },
    { value: "paysandu", label: "Paysandú" },
    { value: "rio-negro", label: "Río Negro" },
    { value: "rivera", label: "Rivera" },
    { value: "rocha", label: "Rocha" },
    { value: "salto", label: "Salto" },
    { value: "san-jose", label: "San José" },
    { value: "soriano", label: "Soriano" },
    { value: "tacuarembo", label: "Tacuarembó" },
    { value: "treinta-y-tres", label: "Treinta y Tres" },
  ],
  py: [
    { value: "alto-paraguay", label: "Alto Paraguay" },
    { value: "alto-parana", label: "Alto Paraná" },
    { value: "amambay", label: "Amambay" },
    { value: "asuncion", label: "Asunción" },
    { value: "boqueron", label: "Boquerón" },
    { value: "caaguazu", label: "Caaguazú" },
    { value: "caazapa", label: "Caazapá" },
    { value: "canindeyu", label: "Canindeyú" },
    { value: "central", label: "Central" },
    { value: "concepcion", label: "Concepción" },
    { value: "cordillera", label: "Cordillera" },
    { value: "guaira", label: "Guairá" },
    { value: "itapua", label: "Itapúa" },
    { value: "misiones", label: "Misiones" },
    { value: "neembucu", label: "Ñeembucú" },
    { value: "paraguari", label: "Paraguarí" },
    { value: "presidente-hayes", label: "Presidente Hayes" },
    { value: "san-pedro", label: "San Pedro" },
  ],
  cl: [
    { value: "arica-y-parinacota", label: "Arica y Parinacota" },
    { value: "tarapaca", label: "Tarapacá" },
    { value: "antofagasta", label: "Antofagasta" },
    { value: "atacama", label: "Atacama" },
    { value: "coquimbo", label: "Coquimbo" },
    { value: "valparaiso", label: "Valparaíso" },
    { value: "metropolitana", label: "Metropolitana de Santiago" },
    { value: "ohiggins", label: "Libertador General Bernardo O'Higgins" },
    { value: "maule", label: "Maule" },
    { value: "nuble", label: "Ñuble" },
    { value: "biobio", label: "Biobío" },
    { value: "la-araucania", label: "La Araucanía" },
    { value: "los-rios", label: "Los Ríos" },
    { value: "los-lagos", label: "Los Lagos" },
    { value: "aysen", label: "Aysén del General Carlos Ibáñez del Campo" },
    {
      value: "magallanes",
      label: "Magallanes y de la Antártica Chilena",
    },
  ],
}

export function getContractCountry(code: ContractCountryCode): ContractCountry {
  return (
    CONTRACT_COUNTRIES.find((country) => country.value === code) ??
    CONTRACT_COUNTRIES[0]
  )
}

export function getContractProvincesForCountry(
  countryCode: ContractCountryCode,
): ContractProvince[] {
  return CONTRACT_PROVINCES_BY_COUNTRY[countryCode] ?? []
}
