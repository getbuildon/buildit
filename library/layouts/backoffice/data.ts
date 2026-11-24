/* Datos de ejemplo del backoffice (no se exporta en la librería). */

export type SubStatus = "active" | "inactive" | "expired" | "disabled";
export type PlanGroup = "compacto" | "gran-escala" | "multiobra" | "custom";

export const subStatusLabel: Record<SubStatus, string> = {
  active: "Activo",
  inactive: "Inactivo",
  expired: "Vencido",
  disabled: "Cancelado",
};
export const subStatusTone = {
  active: "ok",
  inactive: "neutral",
  expired: "caution",
  disabled: "danger",
} as const;

export const planGroups: {
  id: Exclude<PlanGroup, "custom">;
  label: string;
  tiers: {
    slug: string;
    label: string;
    monthly: number | null;
    annual: number | null;
  }[];
}[] = [
  {
    id: "compacto",
    label: "Compacto",
    tiers: [
      { slug: "compacto-60", label: "60 m²", monthly: 400, annual: 320 },
      { slug: "compacto-120", label: "120 m²", monthly: 600, annual: 480 },
      { slug: "compacto-300", label: "300 m²", monthly: 800, annual: 640 },
    ],
  },
  {
    id: "gran-escala",
    label: "Gran Escala",
    tiers: [
      { slug: "gran-1000", label: "1.000 m²", monthly: 1000, annual: 800 },
      { slug: "gran-2500", label: "2.500 m²", monthly: 1300, annual: 1040 },
      { slug: "gran-5000", label: "5.000 m²", monthly: 1600, annual: 1280 },
    ],
  },
  {
    id: "multiobra",
    label: "Multiobra",
    tiers: [
      { slug: "multiobra", label: "+5.000 m²", monthly: null, annual: null },
    ],
  },
];

export type Company = {
  id: string;
  name: string;
  legalName: string;
  country: string;
  taxId: string;
  owner?: { name: string; email: string };
  members: number;
  createdAt: string;
};
export const companies: Company[] = [
  {
    id: "c1",
    name: "Grupo Alamo",
    legalName: "Grupo Alamo S.A.",
    country: "Argentina",
    taxId: "30-71234567-9",
    owner: { name: "Lucía Fernández", email: "lucia@grupoalamo.com.ar" },
    members: 6,
    createdAt: "3 mar 2026",
  },
  {
    id: "c2",
    name: "Elemental Haus",
    legalName: "Elemental Haus S.R.L.",
    country: "Argentina",
    taxId: "30-70987654-1",
    owner: { name: "Tomás Rey", email: "tomas@elementalhaus.com" },
    members: 3,
    createdAt: "21 jun 2026",
  },
  {
    id: "c3",
    name: "Constructora Andina",
    legalName: "Andina Construcciones S.A.",
    country: "Chile",
    taxId: "76.543.210-K",
    owner: { name: "Paula Vidal", email: "pvidal@andina.cl" },
    members: 9,
    createdAt: "8 ago 2026",
  },
  {
    id: "c4",
    name: "Estudio Norte",
    legalName: "",
    country: "Argentina",
    taxId: "",
    members: 1,
    createdAt: "14 nov 2026",
  },
];

export type Project = {
  id: string;
  name: string;
  company: string;
  location: string;
  surface: number;
  status: SubStatus;
  plan?: string;
  interval?: "Mensual" | "Anual";
  amount?: number;
  receivable: number;
  debt: number;
  members: number;
  createdAt: string;
};
export const projects: Project[] = [
  {
    id: "p1",
    name: "Torre Alamo",
    company: "Grupo Alamo",
    location: "Av. Siempreviva 742, Córdoba",
    surface: 2500,
    status: "active",
    plan: "Gran Escala · 2.500 m²",
    interval: "Mensual",
    amount: 1300,
    receivable: 0,
    debt: 0,
    members: 6,
    createdAt: "3 mar 2026",
  },
  {
    id: "p2",
    name: "Barrio Los Álamos",
    company: "Grupo Alamo",
    location: "Ruta 20 km 12, Villa Carlos Paz",
    surface: 1000,
    status: "active",
    plan: "Gran Escala · 1.000 m²",
    interval: "Anual",
    amount: 800,
    receivable: 800,
    debt: 0,
    members: 4,
    createdAt: "12 abr 2026",
  },
  {
    id: "p3",
    name: "Casa Herrera",
    company: "Elemental Haus",
    location: "Nueva Córdoba",
    surface: 120,
    status: "expired",
    plan: "Compacto · 120 m²",
    interval: "Mensual",
    amount: 600,
    receivable: 600,
    debt: 1200,
    members: 2,
    createdAt: "21 jun 2026",
  },
  {
    id: "p4",
    name: "Edificio Mirador",
    company: "Constructora Andina",
    location: "Av. Apoquindo 3000, Santiago",
    surface: 5000,
    status: "active",
    plan: "Gran Escala · 5.000 m²",
    interval: "Mensual",
    amount: 1600,
    receivable: 1600,
    debt: 0,
    members: 9,
    createdAt: "8 ago 2026",
  },
  {
    id: "p5",
    name: "Parque Industrial Sur",
    company: "Constructora Andina",
    location: "Rancagua",
    surface: 8000,
    status: "disabled",
    plan: "Multiobra · +5.000 m²",
    interval: "Anual",
    amount: 2400,
    receivable: 0,
    debt: 1900,
    members: 3,
    createdAt: "2 sep 2026",
  },
  {
    id: "p6",
    name: "Oficinas Norte",
    company: "Estudio Norte",
    location: "Av. Rafael Núñez 4200",
    surface: 300,
    status: "inactive",
    members: 1,
    receivable: 0,
    debt: 0,
    createdAt: "14 nov 2026",
  },
];

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  companies: string[];
  projects: number;
  active: boolean;
  createdAt: string;
};
export const users: AdminUser[] = [
  {
    id: "u1",
    name: "Lucía Fernández",
    email: "lucia@grupoalamo.com.ar",
    phone: "+54 9 351 612 4410",
    companies: ["Grupo Alamo"],
    projects: 2,
    active: true,
    createdAt: "3 mar 2026",
  },
  {
    id: "u2",
    name: "Martín Gómez",
    email: "martin.gomez@gmail.com",
    phone: "+54 9 351 555 0182",
    companies: ["Grupo Alamo", "Elemental Haus"],
    projects: 3,
    active: true,
    createdAt: "5 mar 2026",
  },
  {
    id: "u3",
    name: "Tomás Rey",
    email: "tomas@elementalhaus.com",
    companies: ["Elemental Haus"],
    projects: 1,
    active: true,
    createdAt: "21 jun 2026",
  },
  {
    id: "u4",
    name: "Paula Vidal",
    email: "pvidal@andina.cl",
    phone: "+56 9 8765 4321",
    companies: ["Constructora Andina"],
    projects: 2,
    active: true,
    createdAt: "8 ago 2026",
  },
  {
    id: "u5",
    name: "jorge.ibanez",
    email: "jorge.ibanez@gmail.com",
    companies: [],
    projects: 0,
    active: false,
    createdAt: "17 nov 2026",
  },
];

export type ClientRow = {
  id: string;
  owner?: { name: string; email: string };
  company: string;
  projects: number;
  plans: string[];
  status: Partial<Record<SubStatus, number>>;
  monthly: number;
  debt: number;
};
export const clients: ClientRow[] = [
  {
    id: "c1",
    owner: companies[0].owner,
    company: "Grupo Alamo",
    projects: 2,
    plans: ["Gran Escala · 2.500 m² · 1", "Gran Escala · 1.000 m² · 1"],
    status: { active: 2 },
    monthly: 2100,
    debt: 0,
  },
  {
    id: "c2",
    owner: companies[1].owner,
    company: "Elemental Haus",
    projects: 1,
    plans: ["Compacto · 120 m² · 1"],
    status: { expired: 1 },
    monthly: 600,
    debt: 1200,
  },
  {
    id: "c3",
    owner: companies[2].owner,
    company: "Constructora Andina",
    projects: 2,
    plans: ["Gran Escala · 5.000 m² · 1", "Multiobra · +5.000 m² · 1"],
    status: { active: 1, disabled: 1 },
    monthly: 1600,
    debt: 1900,
  },
  {
    id: "c4",
    company: "Estudio Norte",
    projects: 1,
    plans: [],
    status: { inactive: 1 },
    monthly: 0,
    debt: 0,
  },
];

export type Movement = {
  id: string;
  date: string;
  type: string;
  detail: string;
  discount: number;
  interest: number;
  amount: number;
};
export const movements: Movement[] = [
  {
    id: "m1",
    date: "1 nov 2026",
    type: "Renovación",
    detail: "Compacto · 120 m² · noviembre",
    discount: 0,
    interest: 0,
    amount: 600,
  },
  {
    id: "m2",
    date: "1 oct 2026",
    type: "Renovación",
    detail: "Compacto · 120 m² · octubre",
    discount: 0,
    interest: 0,
    amount: 600,
  },
  {
    id: "m3",
    date: "12 sep 2026",
    type: "Pago · Transferencia",
    detail: "Ref. 0044-8812",
    discount: 0,
    interest: 0,
    amount: -600,
  },
  {
    id: "m4",
    date: "1 sep 2026",
    type: "Renovación",
    detail: "Compacto · 120 m² · septiembre",
    discount: 0,
    interest: 0,
    amount: 600,
  },
];

export const dashboard = {
  charges: 48600,
  collected: 41200,
  receivable: 7400,
  debt: 3100,
  debtors: 2,
  activity: { users: 23, companies: 4, projects: 6, subscriptions: 5 },
  status: { active: 18, inactive: 3, expired: 2, disabled: 1 } as Record<
    SubStatus,
    number
  >,
  groups: [
    { label: "Compacto", value: 9 },
    { label: "Gran Escala", value: 8 },
    { label: "Multiobra", value: 1 },
  ],
  tiers: [
    { group: "Compacto", tier: "60 m²", value: 3 },
    { group: "Compacto", tier: "120 m²", value: 4 },
    { group: "Compacto", tier: "300 m²", value: 2 },
    { group: "Gran Escala", tier: "1.000 m²", value: 3 },
    { group: "Gran Escala", tier: "2.500 m²", value: 4 },
    { group: "Gran Escala", tier: "5.000 m²", value: 1 },
    { group: "Multiobra", tier: "+5.000 m²", value: 1 },
  ],
  previous: {
    charges: 44100,
    collected: 40800,
    receivable: 3300,
    debt: 1800,
    users: 17,
    companies: 2,
    projects: 4,
    subscriptions: 3,
  },
};

/** USD sin decimales, como hoy pero sin repetir el signo: «US$ 1.300». */
export const usd = (value: number) =>
  `US$ ${Math.round(Math.abs(value)).toLocaleString("es-AR")}`;
