import type { SupabaseClient } from "@supabase/supabase-js"

export const DEFAULT_PORTAL_MILESTONES = [
  {
    name: "Inicio de obra",
    description:
      "Trabajos preliminares; replanteo, movimiento de suelo, instalaciones esenciales.",
  },
  {
    name: "Estructura resistente",
    description: "Se ejecutan fundaciones, estructuras verticales y horizontales.",
  },
  {
    name: "Instalaciones",
    description:
      "Se instalan las redes sanitarias, eléctricas, corrientes débiles y demás servicios.",
  },
  {
    name: "Terminaciones",
    description:
      "Se completan revestimientos, carpinterías, pisos, pintura y detalles finales.",
  },
  {
    name: "Puesta a punto",
    description:
      "Se realizan controles, pruebas y ajustes para asegurar el correcto funcionamiento.",
  },
  {
    name: "Entrega de la unidad",
    description: "Finalización de la obra y preparación para la entrega al propietario.",
  },
] as const

export async function seedDefaultPortalMilestonesIfEmpty(
  supabase: SupabaseClient,
  projectId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { count, error: countError } = await supabase
    .from("project_portal_milestones")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)

  if (countError) {
    return { ok: false, error: countError.message }
  }

  if ((count ?? 0) > 0) {
    return { ok: true }
  }

  const { error } = await supabase.from("project_portal_milestones").insert(
    DEFAULT_PORTAL_MILESTONES.map((item, index) => ({
      project_id: projectId,
      name: item.name,
      description: item.description,
      status: "not_started",
      sort_order: index,
    })),
  )

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true }
}
