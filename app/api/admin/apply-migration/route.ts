import { createClient } from "@/utils/supabase/server"

export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    // Verificar que las funciones existen llamándolas con valores de prueba
    const { data: testCompanyId, error: createError } = await supabase.rpc(
      "create_company_for_user",
      {
        p_name: "Migration Test Company",
        p_legal_name: null,
        p_country: null,
      }
    )

    if (createError && createError.message.includes("does not exist")) {
      return Response.json(
        {
          error: "Las funciones RPC necesarias no existen. Por favor, aplica la migración 20260701000002 en el dashboard de Supabase.",
          details: createError.message,
        },
        { status: 400 }
      )
    }

    if (!createError && testCompanyId) {
      // Eliminar la compañía de prueba
      await supabase.from("companies").delete().eq("id", testCompanyId)

      return Response.json({
        success: true,
        message:
          "Las funciones RPC ya existen. El sistema está listo para crear empresas.",
      })
    }

    return Response.json({
      error: createError?.message || "Error desconocido",
    })
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
