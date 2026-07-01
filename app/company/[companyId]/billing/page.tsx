"use client"

import { CreditCard } from "lucide-react"

export default function CompanyBillingPage() {
  return (
    <div
      style={{
        maxWidth: "747px",
        width: "100%",
        margin: "0 auto",
      }}
    >
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <CreditCard className="w-6 h-6 text-orange-500" />
          <h1 className="font-recoleta text-2xl font-normal text-gray-900">Facturación</h1>
        </div>
        <p className="text-sm text-gray-600 mt-1">Gestiona tu suscripción y pagos</p>
      </div>

      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #edeef0",
          padding: "32px",
          textAlign: "center",
        }}
      >
        <CreditCard style={{ width: "48px", height: "48px", margin: "0 auto 16px", color: "#ff7433", opacity: 0.5 }} />
        <h2 style={{ fontSize: "16px", fontWeight: 500, color: "#1d293d", margin: "0 0 8px 0" }}>
          Próximamente
        </h2>
        <p style={{ fontSize: "14px", color: "#777b84", margin: 0 }}>
          La gestión de facturación y suscripciones estará disponible pronto.
        </p>
      </div>
    </div>
  )
}
