"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { User, LogOut } from "lucide-react"
import { useAuth } from "@/context/AuthContextSupabase"
import { userProfileFromEmail } from "@/lib/projects/mockProjects"

// Figma node 1157:3306 — Profile Menu
// Container: bg=#ffffff radius=14 border=#e2e8f0 w=1 shadows: (blur=6 spread=-4 a=0.1) + (blur=15 spread=-3 a=0.1)
// Size: 192x176, padding T=5 H=1 B=1
// Header section: padding H=16 T=8 B=1, border-bottom=#f1f5f9
//   Name: 14px w=500 color=#314158
//   Email: 12px w=400 color=#90a1b9
//   Role badge: bg=#f1f5f9 radius=full padding H=8 V=2 | text 12px w=400 color=#45556c
// Menu items: padding H=16
//   "Mi Perfil": icon 16x16 stroke=#314158 | text 14px w=500 color=#314158
//   "Cerrar sesión": icon 16x16 stroke=#e7000b | text 14px w=500 color=#e7000b

type UserMenuDropdownProps = {
  onClose: () => void
  projectId: string
}

export function UserMenuDropdown({ onClose, projectId }: UserMenuDropdownProps) {
  const router = useRouter()
  const { user, logOut } = useAuth()
  const profile = userProfileFromEmail(user?.email)
  const ref = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // delay so the toggle click doesn't immediately close
    const id = setTimeout(() => document.addEventListener("mousedown", handleClick), 0)
    return () => {
      clearTimeout(id)
      document.removeEventListener("mousedown", handleClick)
    }
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [onClose])

  const handleLogout = async () => {
    onClose()
    await logOut()
    router.replace("/login")
    router.refresh()
  }

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Menú de usuario"
      style={{
        position: "absolute",
        bottom: "calc(100% + 8px)",
        left: "0",
        right: "0",
        width: "192px",
        backgroundColor: "#ffffff",
        borderRadius: "14px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 6px 6px -4px rgba(0,0,0,0.10), 0 15px 15px -3px rgba(0,0,0,0.10)",
        padding: "5px 1px 1px",
        zIndex: 50,
      }}
    >
      {/* Header: name + email + role badge */}
      <div
        style={{
          padding: "8px 16px",
          borderBottom: "1px solid #f1f5f9",
          marginBottom: "0",
        }}
      >
        <p style={{ fontSize: "14px", fontWeight: 500, lineHeight: "19.6px", color: "#314158" }}>
          {profile.fullName}
        </p>
        <p style={{ fontSize: "12px", fontWeight: 400, lineHeight: "16.8px", color: "#90a1b9", marginTop: "2px" }}>
          {user?.email ?? "admin@alamogrupo.com"}
        </p>
        <div style={{ marginTop: "10px", marginBottom: "4px" }}>
          <span
            style={{
              display: "inline-block",
              backgroundColor: "#f1f5f9",
              borderRadius: "9999px",
              padding: "2px 8px",
              fontSize: "12px",
              fontWeight: 400,
              color: "#45556c",
              lineHeight: "16.8px",
            }}
          >
            {profile.role}
          </span>
        </div>
      </div>

      {/* Menu items */}
      <div style={{ padding: "4px 0" }}>
        {/* Mi Perfil */}
        <button
          type="button"
          role="menuitem"
          onClick={() => { onClose(); router.push(`/${projectId}/perfil`) }}
          className={[
            "flex w-full items-center gap-3 rounded-lg",
            "text-[#314158] transition-all duration-150",
            "hover:bg-[#f1f5f9] hover:text-[#1d293d]",
            "active:scale-[0.98] active:bg-[#e8edf3]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#314158]/20",
          ].join(" ")}
          style={{
            padding: "9px 12px",
            margin: "0 4px",
            width: "calc(100% - 8px)",
            fontSize: "14px",
            fontWeight: 500,
            lineHeight: "19.6px",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <User
            aria-hidden
            style={{ width: "16px", height: "16px", flexShrink: 0, color: "currentColor", strokeWidth: 1.33 }}
          />
          Mi Perfil
        </button>

        {/* Cerrar sesión */}
        <button
          type="button"
          role="menuitem"
          onClick={handleLogout}
          className={[
            "flex w-full items-center gap-3 rounded-lg",
            "text-[#e7000b] transition-all duration-150",
            "hover:bg-[#fff1f1]",
            "active:scale-[0.98] active:bg-[#ffe4e4]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e7000b]/20",
          ].join(" ")}
          style={{
            padding: "9px 12px",
            margin: "0 4px",
            width: "calc(100% - 8px)",
            fontSize: "14px",
            fontWeight: 500,
            lineHeight: "19.6px",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <LogOut
            aria-hidden
            style={{ width: "16px", height: "16px", flexShrink: 0, color: "currentColor", strokeWidth: 1.33 }}
          />
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
