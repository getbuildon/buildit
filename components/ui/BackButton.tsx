"use client"

import Link from "next/link"

type BackButtonProps = {
  href: string
  label?: string
}

export function BackButton({ href, label = "Volver" }: BackButtonProps) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "14px",
        fontWeight: 500,
        color: "#43484E",
        textDecoration: "none",
        width: "fit-content",
        lineHeight: 1,
        transition: "opacity 0.15s",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.7" }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1" }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        style={{ flexShrink: 0, display: "block" }}
      >
        <path d="M7.99992 12.6673L3.33325 8.00065L7.99992 3.33398" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12.6666 8H3.33325" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {label}
    </Link>
  )
}
