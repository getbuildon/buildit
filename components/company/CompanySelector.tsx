"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Building2, Check, ChevronDown, CreditCard, Plus, Settings, Users } from "lucide-react"
import { getUserCompanies, type CompanyData } from "@/lib/company/getCompanies"

type CompanySelectorProps = {
  currentCompanyId?: string
}

export function CompanySelector({ currentCompanyId }: CompanySelectorProps) {
  const [companies, setCompanies] = useState<CompanyData[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = async () => {
      const data = await getUserCompanies()
      setCompanies(data)
      setLoading(false)
    }
    load()
  }, [])

  // Cerrar al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const currentCompany = currentCompanyId
    ? companies.find((c) => c.id === currentCompanyId)
    : companies[0]

  if (loading || !currentCompany) {
    return (
      <div
        style={{
          height: "36px",
          width: "140px",
          borderRadius: "8px",
          backgroundColor: "rgba(255,255,255,0.08)",
        }}
      />
    )
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 12px",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.2)",
          backgroundColor: isOpen ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: 500,
          color: "#ffffff",
          transition: "background-color 0.15s",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          if (!isOpen) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.12)"
        }}
        onMouseLeave={(e) => {
          if (!isOpen) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.08)"
        }}
      >
        <Building2 style={{ width: "15px", height: "15px", opacity: 0.8, flexShrink: 0 }} />
        <span style={{ maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis" }}>
          {currentCompany.name}
        </span>
        <ChevronDown
          style={{
            width: "14px",
            height: "14px",
            opacity: 0.7,
            flexShrink: 0,
            transition: "transform 0.15s",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #edeef0",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)",
            minWidth: "220px",
            zIndex: 1000,
            overflow: "hidden",
          }}
        >
          {/* Sección: empresas */}
          {companies.length > 0 && (
            <div style={{ padding: "6px" }}>
              <p style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                padding: "6px 8px 4px",
              }}>
                Empresas
              </p>
              {companies.map((company) => {
                const isActive = company.id === currentCompanyId
                return (
                  <button
                    key={company.id}
                    onClick={() => setIsOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      textAlign: "left",
                      fontSize: "13px",
                      fontWeight: isActive ? 500 : 400,
                      color: isActive ? "#ff7433" : "#1d293d",
                      backgroundColor: isActive ? "#fff5f1" : "transparent",
                      border: "none",
                      cursor: "pointer",
                      transition: "background-color 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "#f8f9fa"
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"
                    }}
                  >
                    <Building2 style={{ width: "15px", height: "15px", flexShrink: 0, color: isActive ? "#ff7433" : "#9ca3af" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {company.name}
                      </div>
                      <div style={{ fontSize: "11px", color: "#9ca3af", textTransform: "capitalize" }}>
                        {company.role}
                      </div>
                    </div>
                    {isActive && <Check style={{ width: "14px", height: "14px", flexShrink: 0, color: "#ff7433" }} />}
                  </button>
                )
              })}
            </div>
          )}

          {/* Divisor */}
          <div style={{ height: "1px", backgroundColor: "#f1f3f5", margin: "0 6px" }} />

          {/* Sección: gestión de empresa */}
          {currentCompanyId && (
            <div style={{ padding: "6px" }}>
              <p style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                padding: "6px 8px 4px",
              }}>
                Empresa
              </p>
              {[
                { href: `/company/${currentCompanyId}/settings`, icon: Settings, label: "Configuración" },
                { href: `/company/${currentCompanyId}/members`, icon: Users, label: "Miembros" },
                { href: `/company/${currentCompanyId}/billing`, icon: CreditCard, label: "Facturación" },
              ].map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 400,
                    color: "#1d293d",
                    textDecoration: "none",
                    transition: "background-color 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "#f8f9fa"
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"
                  }}
                >
                  <Icon style={{ width: "15px", height: "15px", color: "#9ca3af", flexShrink: 0 }} />
                  {label}
                </Link>
              ))}
            </div>
          )}

          {/* Divisor */}
          <div style={{ height: "1px", backgroundColor: "#f1f3f5", margin: "0 6px" }} />

          {/* Nueva empresa */}
          <div style={{ padding: "6px" }}>
            <Link
              href="/company/new"
              onClick={() => setIsOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 10px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 500,
                color: "#ff7433",
                textDecoration: "none",
                transition: "background-color 0.1s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "#fff5f1"
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"
              }}
            >
              <Plus style={{ width: "15px", height: "15px", flexShrink: 0 }} />
              Nueva empresa
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
