"use client"

import { useEffect, useRef, useState, type MouseEvent } from "react"
import { Building2, CalendarDays } from "lucide-react"
import { getUnitDisplayCode } from "@/lib/projects/floorLabels"
import type { MiUnidadAssignedUnit } from "@/lib/projects/miUnidadTypes"
import { formatSquareMeters } from "@/lib/projects/structureSurfaceLimits"
import { normalizeUnitType } from "@/lib/projects/unitTypes"
import { cn } from "@/lib/utils"
import { MiUnidadUnitDialog } from "./MiUnidadUnitDialog"

type MiUnidadUnitSelectorProps = {
  units: MiUnidadAssignedUnit[]
  projectName: string
  projectEndDateLabel: string | null
}

const UNIT_CARD_SHADOW = "0 0 5px rgba(243, 103, 31, 0.08)"
const HOVER_SCROLL_EASE = 0.18
const HOVER_SCROLL_EDGE_RATIO = 0.14
const FADE_HIDE_PX = 16

function buildUnitsHeading(count: number, projectName: string): string {
  const name = projectName.trim()
  if (count <= 1) {
    return name ? `Mi unidad en ${name}` : "Mi unidad"
  }
  return name ? `Mis unidades en ${name}` : "Mis unidades"
}

function buildUnitMeta(unit: MiUnidadAssignedUnit): string {
  const parts: string[] = []
  const squareMeters =
    unit.squareMeters != null && Number.isFinite(unit.squareMeters) && unit.squareMeters > 0
      ? unit.squareMeters
      : null

  if (unit.roomCount != null && unit.roomCount > 0) {
    parts.push(unit.roomCount === 1 ? "1 ambiente" : `${unit.roomCount} ambientes`)
  }

  if (squareMeters != null) {
    parts.push(formatSquareMeters(squareMeters))
  }

  if (unit.floorLabel) {
    parts.push(`Piso ${unit.floorLabel}`)
  }

  return parts.join(" · ")
}

function UnitRenderPreview({
  unit,
  className,
}: {
  unit: MiUnidadAssignedUnit
  className?: string
}) {
  if (unit.renderUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={unit.renderUrl}
        alt={`Render de unidad ${unit.code}`}
        className={cn("size-full object-cover", className)}
      />
    )
  }

  return (
    <div className="flex size-full items-center justify-center bg-[#f1f5f9]">
      <Building2 className="size-6 text-[#cad5e2]" strokeWidth={1.5} aria-hidden />
    </div>
  )
}

function UnitTypeBadge({
  unitType,
  compact,
}: {
  unitType: string | null
  compact?: boolean
}) {
  if (!unitType) return null

  return (
    <span
      className={cn(
        "rounded-full border border-[#ff7433] bg-[#ffeae0] px-2 py-[3px] leading-[1.4] text-[#f3671f]",
        compact ? "text-[10px] tracking-[-0.5px]" : "text-[12px] tracking-[-0.36px]",
      )}
    >
      {unitType}
    </span>
  )
}

function UnitCardBody({
  unit,
  compact,
}: {
  unit: MiUnidadAssignedUnit
  compact?: boolean
}) {
  const unitType = normalizeUnitType(unit.unitType) ?? unit.unitType
  const meta = buildUnitMeta(unit)

  return (
    <div className="flex min-w-0 flex-col items-start gap-2">
      <div className="flex items-center gap-2">
        <p className="whitespace-nowrap text-[16px] font-medium leading-[1.4] text-[#1d293d]">
          Unidad {getUnitDisplayCode(unit)}
        </p>
        <UnitTypeBadge unitType={unitType} compact={compact} />
      </div>
      {meta ? (
        <p className="whitespace-nowrap text-[14px] leading-[1.4] text-[#696e77]">{meta}</p>
      ) : null}
    </div>
  )
}

function useHoverRevealScroll(enabled: boolean, contentKey: number) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const targetScrollRef = useRef(0)
  const frameRef = useRef(0)
  const [showLeftFade, setShowLeftFade] = useState(false)
  const [showRightFade, setShowRightFade] = useState(false)

  const updateFades = () => {
    const node = scrollerRef.current
    if (!node) return

    const maxScroll = Math.max(0, node.scrollWidth - node.clientWidth)
    const canScroll = maxScroll > FADE_HIDE_PX
    setShowLeftFade(canScroll && node.scrollLeft > FADE_HIDE_PX)
    setShowRightFade(canScroll && node.scrollLeft < maxScroll - FADE_HIDE_PX)
  }

  useEffect(() => {
    if (!enabled) {
      setShowLeftFade(false)
      setShowRightFade(false)
      return
    }

    const node = scrollerRef.current
    if (!node) return

    updateFades()

    const observer = new ResizeObserver(updateFades)
    observer.observe(node)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frameRef.current)
    }
  }, [contentKey, enabled])

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const node = scrollerRef.current
    if (!node || !enabled) return

    const maxScroll = node.scrollWidth - node.clientWidth
    if (maxScroll <= 0) return

    const rect = node.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    const innerRange = 1 - HOVER_SCROLL_EDGE_RATIO * 2

    if (ratio <= HOVER_SCROLL_EDGE_RATIO) {
      targetScrollRef.current = 0
    } else if (ratio >= 1 - HOVER_SCROLL_EDGE_RATIO) {
      targetScrollRef.current = maxScroll
    } else if (innerRange > 0) {
      const innerRatio = (ratio - HOVER_SCROLL_EDGE_RATIO) / innerRange
      targetScrollRef.current = innerRatio * maxScroll
    }

    if (frameRef.current) return

    const tick = () => {
      const current = node.scrollLeft
      const next = current + (targetScrollRef.current - current) * HOVER_SCROLL_EASE
      node.scrollLeft = next
      updateFades()

      if (Math.abs(targetScrollRef.current - next) > 0.4) {
        frameRef.current = requestAnimationFrame(tick)
        return
      }

      node.scrollLeft = targetScrollRef.current
      frameRef.current = 0
      updateFades()
    }

    frameRef.current = requestAnimationFrame(tick)
  }

  return {
    scrollerRef,
    showLeftFade,
    showRightFade,
    handleMouseMove,
    updateFades,
  }
}

export function MiUnidadUnitSelector({
  units,
  projectName,
  projectEndDateLabel,
}: MiUnidadUnitSelectorProps) {
  const isMultiple = units.length > 1
  const [openUnitId, setOpenUnitId] = useState<string | null>(null)
  const openUnit = units.find((unit) => unit.id === openUnitId) ?? null
  const {
    scrollerRef,
    showLeftFade,
    showRightFade,
    handleMouseMove,
    updateFades,
  } = useHoverRevealScroll(isMultiple, units.length)

  if (units.length === 0) {
    return (
      <div className="rounded-[14px] border border-dashed border-[#edeef0] bg-white px-6 py-8 text-center text-[14px] text-[#696e77] shadow-[0_0_5px_rgba(243,103,31,0.08)]">
        Todavía no tenés una unidad asignada en este proyecto.
      </div>
    )
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-recoleta text-[24px] font-normal leading-[1.05] text-[#272a2d]">
        {buildUnitsHeading(units.length, projectName)}
      </h2>

      {isMultiple ? (
        <div className="relative">
          <div
            ref={scrollerRef}
            onMouseMove={handleMouseMove}
            onScroll={updateFades}
            className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex w-max gap-2 p-2">
              {units.map((unit) => (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => setOpenUnitId(unit.id)}
                  className="flex h-[82px] shrink-0 items-center overflow-hidden rounded-[14px] border border-[#edeef0] bg-white text-left transition-colors hover:border-[#d5d7db]"
                  style={{ boxShadow: UNIT_CARD_SHADOW }}
                >
                  <div className="h-full w-20 shrink-0 self-stretch overflow-hidden bg-[#f1f5f9]">
                    <UnitRenderPreview unit={unit} />
                  </div>
                  <div className="flex h-full items-center px-[18px]">
                    <UnitCardBody unit={unit} compact />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {showLeftFade ? (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-2 left-0 w-5 bg-gradient-to-r from-[#fefcfb] to-transparent"
            />
          ) : null}
          {showRightFade ? (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-2 right-0 w-5 bg-gradient-to-l from-[#fefcfb] to-transparent"
            />
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpenUnitId(units[0].id)}
          className="flex h-[82px] w-full items-center overflow-hidden rounded-[14px] border border-[#edeef0] bg-white text-left transition-colors hover:border-[#d5d7db]"
          style={{ boxShadow: UNIT_CARD_SHADOW }}
        >
          <div className="h-full w-[110px] shrink-0 self-stretch overflow-hidden bg-[#f1f5f9]">
            <UnitRenderPreview unit={units[0]} />
          </div>
          <div className="flex h-full min-w-0 flex-1 items-center justify-between px-[18px]">
            <UnitCardBody unit={units[0]} />
            {projectEndDateLabel ? (
              <div className="flex shrink-0 items-center gap-2 rounded-[9px] border border-[#edeef0] bg-[#fefcfb] px-[13px] py-[9px]">
                <CalendarDays className="size-[13px] shrink-0 text-[#777b84]" aria-hidden />
                <div>
                  <p className="text-[10px] leading-[1.4] tracking-[-0.5px] text-[#777b84]">
                    Entrega estimada
                  </p>
                  <p className="pt-0.5 text-[14px] font-medium leading-[1.4] text-[#1d293d]">
                    {projectEndDateLabel}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </button>
      )}

      <MiUnidadUnitDialog
        unit={openUnit}
        open={openUnit != null}
        onOpenChange={(open) => {
          if (!open) setOpenUnitId(null)
        }}
      />
    </section>
  )
}
