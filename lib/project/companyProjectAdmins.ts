import type { SupabaseClient } from "@supabase/supabase-js"

export async function loadCompanyProjectAdminIds(
  admin: SupabaseClient,
  companyId: string,
): Promise<Set<string>> {
  const { data } = await admin
    .from("company_members")
    .select("user_id")
    .eq("company_id", companyId)
    .eq("status", "active")
    .in("role", ["owner", "admin"])

  return new Set((data ?? []).map((row) => row.user_id as string))
}
