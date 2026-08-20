import {
  ACCESO_CLIENTES_PATH,
  ACCESO_EQUIPO_PATH,
} from "@/lib/auth/loginAudience"

export const LANDING_LOGIN_MENU_ITEMS = [
  {
    href: ACCESO_EQUIPO_PATH,
    title: "Equipo de obra",
    description: "Gestionar proyectos y avances.",
  },
  {
    href: ACCESO_CLIENTES_PATH,
    title: "Clientes",
    description: "Consultar el avance de tus unidades.",
  },
] as const
