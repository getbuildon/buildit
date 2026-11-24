import type { ReactNode } from "react"
import { Bar, BarChart as RBarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { cn } from "../../lib/cn"
import { formatCompact, formatNumber } from "../../foundations/format/format"
import { axisTick, chartColor, cursorFill, gridStroke, seriesOrder, useChartAnimation, type ChartTone } from "./chartTheme"
import { ChartTooltip } from "./ChartTooltip"

/* ------------------------------------------------------------------ Tabla para lectores */

/**
 * Cada gráfico lleva su tabla de datos para el lector de pantalla (no se ve). El dibujo
 * queda oculto para el lector y fuera del Tab (accessibilityLayer={false}): lo que
 * importa son los números, y la tabla los da completos.
 */
function DataTableForScreenReaders({ caption, headers, rows }: { caption: string; headers: string[]; rows: (string | number)[][] }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header} scope="col">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            {row.map((cell, cellIndex) => (cellIndex === 0 ? <th key={cellIndex} scope="row">{cell}</th> : <td key={cellIndex}>{cell}</td>))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ------------------------------------------------------------------ Barras */

export type BarDatum = { label: string; value: number; tone?: ChartTone }

export type BarChartProps = {
  data: readonly BarDatum[]
  /** Qué muestra: «Obras por estado». Lo lee el lector de pantalla. */
  label: string
  /** Cómo se escribe cada valor: formatNumber, formatMoney, formatPercent. */
  format?: (value: number) => string
  /** Cómo se escriben los valores del eje, abreviados para que entren: formatCompact, formatMoneyCompact. */
  axisFormat?: (value: number) => string
  /** Título de la columna de categorías en la tabla para el lector de pantalla: «Mes», «Plan». */
  categoryLabel?: string
  /** Tono de todas las barras (si una barra no trae el suyo). */
  tone?: ChartTone
  height?: number
  className?: string
}

/** Barras verticales: comparar cantidades entre categorías. */
export function BarChart({
  data,
  label,
  format = (value) => formatNumber(value),
  axisFormat = (value) => formatCompact(value),
  categoryLabel = "Categoría",
  tone = "naranja",
  height = 240,
  className,
}: BarChartProps) {
  const animate = useChartAnimation()
  return (
    <figure className={cn("m-0", className)}>
      <div aria-hidden style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RBarChart data={[...data]} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} accessibilityLayer={false}>
            <CartesianGrid vertical={false} stroke={gridStroke} />
            <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: gridStroke }} interval="preserveStartEnd" />
            <YAxis tick={axisTick} tickLine={false} axisLine={false} tickFormatter={(value: number) => axisFormat(value)} width={76} />
            <Tooltip cursor={{ fill: cursorFill }} content={<ChartTooltip format={format} />} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48} isAnimationActive={animate}>
              {data.map((item) => (
                <Cell key={item.label} fill={chartColor(item.tone ?? tone)} />
              ))}
            </Bar>
          </RBarChart>
        </ResponsiveContainer>
      </div>
      <DataTableForScreenReaders caption={label} headers={[categoryLabel, "Valor"]} rows={data.map((item) => [item.label, format(item.value)])} />
    </figure>
  )
}

/* ------------------------------------------------------------------ Dona */

export type DonutDatum = { label: string; value: number; tone: ChartTone }

export type DonutChartProps = {
  data: readonly DonutDatum[]
  label: string
  format?: (value: number) => string
  /** Texto en el centro: el total. */
  centerLabel?: ReactNode
  className?: string
}

/**
 * Dona: cómo se reparte un total (suscripciones por estado). Con leyenda escrita al
 * lado (valor y porcentaje): el color solo no alcanza para leerla.
 */
export function DonutChart({ data, label, format = (value) => formatNumber(value), centerLabel, className }: DonutChartProps) {
  const animate = useChartAnimation()
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const visible = data.filter((item) => item.value > 0)
  return (
    <figure className={cn("m-0 flex flex-col items-center gap-group sm:flex-row", className)}>
      <div className="relative size-52 shrink-0" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart accessibilityLayer={false}>
            <Pie data={visible} dataKey="value" nameKey="label" innerRadius="66%" outerRadius="100%" paddingAngle={2} stroke="none" rootTabIndex={-1} isAnimationActive={animate}>
              {visible.map((item) => (
                <Cell key={item.label} fill={chartColor(item.tone)} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip format={format} />} />
          </PieChart>
        </ResponsiveContainer>
        {centerLabel !== undefined ? (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-metric">{centerLabel}</p>
            <p className="text-meta text-ink-muted">total</p>
          </div>
        ) : null}
      </div>
      <figcaption className="flex w-full min-w-0 flex-col gap-compact">
        <p className="sr-only">
          {label}. Total: {format(total)}.
        </p>
        <ul className="flex flex-col gap-related">
          {data.map((item) => (
            <li key={item.label} className="flex items-center justify-between gap-snug rounded-control bg-canvas-sunken px-snug py-compact">
              <span className="flex min-w-0 items-center gap-compact">
                <span className="size-2.5 shrink-0 rounded-pill" style={{ background: chartColor(item.tone) }} aria-hidden />
                <span className="truncate text-body">{item.label}</span>
              </span>
              <span className="flex shrink-0 items-baseline gap-compact tabular-nums">
                <span className="text-label">{format(item.value)}</span>
                <span className="text-meta text-ink-muted">{total > 0 ? Math.round((item.value / total) * 100) : 0}%</span>
              </span>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  )
}

/* ------------------------------------------------------------------ Curva de avance */

export type ProgressPoint = { label: string; planned?: number; actual?: number }

export type ProgressCurveProps = {
  data: readonly ProgressPoint[]
  label: string
  height?: number
  className?: string
}

/**
 * Curva de avance («curva S»): lo planificado contra lo real, mes a mes, en %.
 * Planificado en línea punteada gris; real en naranja. Si la real queda abajo, hay atraso.
 */
export function ProgressCurve({ data, label, height = 260, className }: ProgressCurveProps) {
  const animate = useChartAnimation()
  const format = (value: number) => `${formatNumber(value, 1)}%`
  return (
    <figure className={cn("m-0", className)}>
      <div aria-hidden style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={[...data]} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} accessibilityLayer={false}>
            <CartesianGrid vertical={false} stroke={gridStroke} />
            <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: gridStroke }} />
            <YAxis tick={axisTick} tickLine={false} axisLine={false} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(value: number) => `${value}%`} width={48} />
            <Tooltip content={<ChartTooltip format={format} />} />
            <Legend
              verticalAlign="top"
              align="right"
              height={32}
              iconType="plainline"
              formatter={(value: string) => <span className="text-meta text-ink-muted">{value}</span>}
            />
            <Line
              name="Planificado"
              type="monotone"
              dataKey="planned"
              stroke={chartColor("neutral")}
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              isAnimationActive={animate}
            />
            <Line
              name="Real"
              type="monotone"
              dataKey="actual"
              stroke={chartColor(seriesOrder[0])}
              strokeWidth={2.5}
              dot={{ r: 3, fill: chartColor(seriesOrder[0]), strokeWidth: 0 }}
              connectNulls={false}
              isAnimationActive={animate}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <DataTableForScreenReaders
        caption={label}
        headers={["Mes", "Planificado", "Real"]}
        rows={data.map((point) => [point.label, point.planned !== undefined ? format(point.planned) : "—", point.actual !== undefined ? format(point.actual) : "—"])}
      />
    </figure>
  )
}
