import { BRAND_NAME } from "@/lib/brand"

export function SupabaseConfigMissing() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f172b] px-6 text-white">
      <div className="w-full max-w-md rounded-[16px] border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#93c5fd]">
          {BRAND_NAME}
        </p>
        <h1 className="mt-4 text-xl font-semibold">Supabase no configurado</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#cbd5e1]">
          Definí{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-[#e2e8f0]">
            NEXT_PUBLIC_SUPABASE_URL
          </code>{" "}
          y{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-[#e2e8f0]">
            NEXT_PUBLIC_SUPABASE_ANON_KEY
          </code>{" "}
          en tu entorno (local: <code className="text-[#e2e8f0]">.env.local</code>, producción:
          Vercel) y volvé a desplegar.
        </p>
      </div>
    </div>
  )
}
