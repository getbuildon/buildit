/** Tooltip de los gráficos, con los estilos de la librería (Recharts lo llama con estos props). */
export function ChartTooltip({
  active,
  label,
  payload,
  format,
}: {
  active?: boolean
  label?: string | number
  payload?: { name?: string | number; value?: number | string; color?: string }[]
  format: (value: number) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="flex flex-col gap-related rounded-control border border-line bg-canvas-overlay px-snug py-compact text-ink shadow-overlay">
      {label !== undefined ? <p className="text-meta text-ink-muted">{label}</p> : null}
      {payload.map((item, index) => (
        <p key={index} className="flex items-center gap-compact text-label tabular-nums">
          {payload.length > 1 ? <span className="size-2 rounded-pill" style={{ background: item.color }} aria-hidden /> : null}
          {payload.length > 1 ? <span className="font-regular text-ink-muted">{item.name}</span> : null}
          {typeof item.value === "number" ? format(item.value) : item.value}
        </p>
      ))}
    </div>
  )
}
