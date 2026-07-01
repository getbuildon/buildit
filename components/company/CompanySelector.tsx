"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronDown, Plus, Settings } from "lucide-react"
import { getUserCompanies, type CompanyData } from "@/lib/company/getCompanies"

type CompanySelectorProps = {
  currentCompanyId?: string
}

export function CompanySelector({ currentCompanyId }: CompanySelectorProps) {
  const [companies, setCompanies] = useState<CompanyData[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      const data = await getUserCompanies()
      setCompanies(data)
      setLoading(false)
    }
    load()
  }, [])

  const currentCompany = currentCompanyId ? companies.find((c) => c.id === currentCompanyId) : companies[0]

  if (loading || !currentCompany) {
    return <div style={{ height: "44px" }} />
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 12px",
          borderRadius: "10px",
          border: "1px solid #edeef0",
          backgroundColor: "#ffffff",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: 500,
          color: "#1d293d",
        }}
      >
        <span>🏢</span>
        <span>{currentCompany.name}</span>
        <ChevronDown style={{ width: "16px", height: "16px", color: "#777b84" }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: "4px",
            backgroundColor: "#ffffff",
            borderRadius: "10px",
            border: "1px solid #edeef0",
            boxShadow: "0 10px 15px rgba(0,0,0,0.1)",
            minWidth: "220px",
            zIndex: 1000,
          }}
        >
          {companies.map((company) => (
            <button
              key={company.id}
              onClick={() => setIsOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                padding: "12px",
                textAlign: "left",
                fontSize: "14px",
                fontWeight: 400,
                color: company.id === currentCompanyId ? "#ff7433" : "#1d293d",
                backgroundColor: company.id === currentCompanyId ? "#fff5f1" : "transparent",
                border: "none",
                cursor: "pointer",
                borderBottom: company === companies[companies.length - 1] ? "none" : "1px solid #edeef0",
              }}
            >
              <span>🏢</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{company.name}</div>
                <div style={{ fontSize: "12px", color: "#777b84" }}>{company.role}</div>
              </div>
              {company.id === currentCompanyId && (
                <span style={{ fontSize: "16px" }}>✓</span>
              )}
            </button>
          ))}

          <Link
            href="/company/new"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#ff7433",
              textDecoration: "none",
              borderTop: "1px solid #edeef0",
            }}
            onClick={() => setIsOpen(false)}
          >
            <Plus style={{ width: "16px", height: "16px" }} />
            Nueva empresa
          </Link>
        </div>
      )}

      {currentCompanyId && (
        <div style={{ position: "relative", display: "inline-block" }}>
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              marginLeft: "8px",
              padding: "8px 12px",
              borderRadius: "10px",
              backgroundColor: settingsOpen ? "#e0e0e0" : "#f0f0f0",
              color: "#777b84",
              border: "none",
              textDecoration: "none",
              fontSize: "14px",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!settingsOpen) (e.currentTarget as HTMLElement).style.backgroundColor = "#e0e0e0"
            }}
            onMouseLeave={(e) => {
              if (!settingsOpen) (e.currentTarget as HTMLElement).style.backgroundColor = "#f0f0f0"
            }}
          >
            <Settings style={{ width: "16px", height: "16px" }} />
          </button>

          {settingsOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "4px",
                backgroundColor: "#ffffff",
                borderRadius: "10px",
                border: "1px solid #edeef0",
                boxShadow: "0 10px 15px rgba(0,0,0,0.1)",
                minWidth: "180px",
                zIndex: 1001,
              }}
            >
              <Link
                href={`/company/${currentCompanyId}/settings`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px",
                  fontSize: "14px",
                  fontWeight: 400,
                  color: "#1d293d",
                  textDecoration: "none",
                  borderBottom: "1px solid #edeef0",
                }}
                onClick={() => setSettingsOpen(false)}
              >
                <Settings style={{ width: "16px", height: "16px" }} />
                Configuración
              </Link>
              <Link
                href={`/company/${currentCompanyId}/members`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px",
                  fontSize: "14px",
                  fontWeight: 400,
                  color: "#1d293d",
                  textDecoration: "none",
                  borderBottom: "1px solid #edeef0",
                }}
                onClick={() => setSettingsOpen(false)}
              >
                👥 Miembros
              </Link>
              <Link
                href={`/company/${currentCompanyId}/billing`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px",
                  fontSize: "14px",
                  fontWeight: 400,
                  color: "#1d293d",
                  textDecoration: "none",
                }}
                onClick={() => setSettingsOpen(false)}
              >
                💳 Facturación
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
