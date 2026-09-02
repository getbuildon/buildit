"use client"

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

export const AVATAR_PREVIEW_SIZE = 132
const PREVIEW_GAP = 18
const EXIT_MS = 200

type AvatarCursorPreviewProps = {
  children: ReactNode
  preview: ReactNode
  className?: string
}

export function AvatarCursorPreview({
  children,
  preview,
  className,
}: AvatarCursorPreviewProps) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0, placeLeft: false })
  const hideTimerRef = useRef<number>(0)

  function updatePosition(clientX: number, clientY: number) {
    const placeLeft = clientX + PREVIEW_GAP + AVATAR_PREVIEW_SIZE > window.innerWidth - 12
    setCoords({ x: clientX, y: clientY, placeLeft })
  }

  function handleMouseEnter(event: MouseEvent<HTMLSpanElement>) {
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
    updatePosition(event.clientX, event.clientY)
    setMounted(true)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true))
    })
  }

  function handleMouseLeave() {
    setVisible(false)
    hideTimerRef.current = window.setTimeout(() => setMounted(false), EXIT_MS)
  }

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
    }
  }, [])

  const left = coords.placeLeft
    ? coords.x - PREVIEW_GAP - AVATAR_PREVIEW_SIZE
    : coords.x + PREVIEW_GAP
  const top = Math.min(
    Math.max(coords.y - AVATAR_PREVIEW_SIZE / 2, 12),
    typeof window === "undefined" ? 12 : window.innerHeight - AVATAR_PREVIEW_SIZE - 12,
  )

  return (
    <>
      <span
        className={cn(
          "inline-flex max-md:pointer-events-none [@media(hover:none)]:pointer-events-none",
          className,
        )}
        onMouseEnter={handleMouseEnter}
        onMouseMove={(event) => updatePosition(event.clientX, event.clientY)}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </span>
      {mounted && typeof document !== "undefined"
        ? createPortal(
            <div
              role="presentation"
              aria-hidden
              className="pointer-events-none hidden md:block"
              style={{
                position: "fixed",
                top,
                left,
                zIndex: 9999,
                width: AVATAR_PREVIEW_SIZE,
                height: AVATAR_PREVIEW_SIZE,
                opacity: visible ? 1 : 0,
                transform: visible
                  ? "scale(1) translate3d(0, 0, 0)"
                  : `scale(0.78) translate3d(${coords.placeLeft ? 10 : -10}px, 8px, 0)`,
                transformOrigin: coords.placeLeft ? "center right" : "center left",
                transition:
                  "opacity 180ms cubic-bezier(0.16, 1, 0.3, 1), transform 220ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              {preview}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
