"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, LogOut, UserCircle } from "lucide-react"
import { UserAvatar } from "@/components/user/UserAvatar"
import { useAppRouteNavigation } from "@/components/navigation/AppRouteLoadingProvider"
import { useAuth } from "@/context/AuthContextSupabase"
import { postLogoutPath } from "@/lib/auth/postLogout"
import { cn } from "@/lib/utils"

type UserMenuProps = {
  displayName: string
  firstName?: string
  lastName?: string
  email?: string | null
  avatarUrl?: string | null
}

export function UserMenu({
  displayName,
  firstName = "",
  lastName = "",
  email,
  avatarUrl,
}: UserMenuProps) {
  const { user, logOut } = useAuth()
  const router = useRouter()
  const { navigate } = useAppRouteNavigation()
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const resolvedEmail = email ?? user?.email ?? null
  const resolvedFirstName = firstName || displayName.split(" ")[0] || ""
  const resolvedLastName = lastName || displayName.split(" ").slice(1).join(" ")

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setIsOpen(false)
    const nextPath = postLogoutPath()
    await logOut()
    router.replace(nextPath)
    router.refresh()
  }

  const perfilHref = "/perfil"

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "flex cursor-pointer items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2.5 text-white/85 transition-colors hover:bg-white/10 hover:text-white",
          isOpen && "bg-white/10 text-white",
        )}
      >
        <UserAvatar
          firstName={resolvedFirstName}
          lastName={resolvedLastName}
          email={resolvedEmail}
          avatarUrl={avatarUrl}
          size={26}
          textClassName="text-[11px] font-semibold text-white"
        />
        <span className="max-w-[120px] truncate text-[13px] font-medium">
          {displayName}
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-white/70 transition-transform",
            isOpen && "rotate-180",
          )}
          aria-hidden
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
            minWidth: "180px",
            zIndex: 1000,
            overflow: "hidden",
          }}
        >
          {/* Header con nombre */}
          <div style={{ padding: "12px 14px 10px", borderBottom: "1px solid #f1f3f5" }}>
            <UserAvatar
              firstName={resolvedFirstName}
              lastName={resolvedLastName}
              email={resolvedEmail}
              avatarUrl={avatarUrl}
              size={36}
              textClassName="text-[14px] font-semibold text-white"
              className="mb-2"
            />
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#1d293d", margin: 0, lineHeight: 1.3 }}>
              {displayName}
            </p>
          </div>

          {/* Opciones */}
          <div style={{ padding: "6px" }}>
            <button
              onClick={() => {
                setIsOpen(false)
                navigate(perfilHref)
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "8px 10px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 400,
                color: "#1d293d",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                transition: "background-color 0.1s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "#f8f9fa"
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"
              }}
            >
              <UserCircle style={{ width: "15px", height: "15px", color: "#9ca3af", flexShrink: 0 }} />
              Editar perfil
            </button>

            <div style={{ height: "1px", backgroundColor: "#f1f3f5", margin: "4px 0" }} />

            <button
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "8px 10px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 400,
                color: "#dc2626",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                transition: "background-color 0.1s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "#fff1f0"
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"
              }}
            >
              <LogOut style={{ width: "15px", height: "15px", flexShrink: 0 }} />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
