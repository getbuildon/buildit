import { createClient } from "@/utils/supabase/server"

/**
 * La persona de la sesión, para las server actions. getClaims valida la firma del token
 * con la clave pública (sin viajar al servicio de cuentas, que agregaba una ida y vuelta
 * en cada acción). Si la sesión venció, la renueva como antes.
 */
export async function getServerSessionUser() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  const claims = data?.claims
  const email = typeof claims?.email === "string" ? claims.email : null
  if (error || !claims?.sub || !email) return null
  return { id: claims.sub, email }
}
