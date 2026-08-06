import type { ReactElement, ReactNode } from "react"

import { cn } from "@/lib/utils"

export type ProjectNavIconId =
  | "dashboard"
  | "trabajo-diario"
  | "certificaciones"
  | "equipo"
  | "clientes"
  | "configuracion"

type ProjectNavIconProps = {
  id: ProjectNavIconId
  className?: string
}

const STROKE = {
  md: 1.32181,
  sm: 1.33333,
} as const

function NavIconSvg({
  viewBox,
  className,
  children,
}: {
  viewBox: string
  className?: string
  children: ReactNode
}) {
  return (
    <svg
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("size-4 shrink-0", className)}
    >
      {children}
    </svg>
  )
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <NavIconSvg viewBox="0 0 15.8617 15.8617" className={className}>
      <path
        d="M5.94817 1.98271H2.64364C2.27863 1.98271 1.98274 2.27861 1.98274 2.64362V7.26996C1.98274 7.63497 2.27863 7.93086 2.64364 7.93086H5.94817C6.31318 7.93086 6.60908 7.63497 6.60908 7.26996V2.64362C6.60908 2.27861 6.31318 1.98271 5.94817 1.98271Z"
        stroke="currentColor"
        strokeWidth={STROKE.md}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.2175 1.98271H9.91302C9.54801 1.98271 9.25211 2.27861 9.25211 2.64362V4.62633C9.25211 4.99134 9.54801 5.28724 9.91302 5.28724H13.2175C13.5826 5.28724 13.8785 4.99134 13.8785 4.62633V2.64362C13.8785 2.27861 13.5826 1.98271 13.2175 1.98271Z"
        stroke="currentColor"
        strokeWidth={STROKE.md}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.2175 7.9309H9.91302C9.54801 7.9309 9.25211 8.2268 9.25211 8.5918V13.2181C9.25211 13.5832 9.54801 13.8791 9.91302 13.8791H13.2175C13.5826 13.8791 13.8785 13.5832 13.8785 13.2181V8.5918C13.8785 8.2268 13.5826 7.9309 13.2175 7.9309Z"
        stroke="currentColor"
        strokeWidth={STROKE.md}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.94817 10.5745H2.64364C2.27863 10.5745 1.98274 10.8704 1.98274 11.2354V13.2182C1.98274 13.5832 2.27863 13.8791 2.64364 13.8791H5.94817C6.31318 13.8791 6.60908 13.5832 6.60908 13.2182V11.2354C6.60908 10.8704 6.31318 10.5745 5.94817 10.5745Z"
        stroke="currentColor"
        strokeWidth={STROKE.md}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </NavIconSvg>
  )
}

function TrabajoDiarioIcon({ className }: { className?: string }) {
  return (
    <NavIconSvg viewBox="0 0 16 16" className={className}>
      <path
        d="M10 1.33333H6C5.63181 1.33333 5.33333 1.63181 5.33333 2V3.33333C5.33333 3.70152 5.63181 4 6 4H10C10.3682 4 10.6667 3.70152 10.6667 3.33333V2C10.6667 1.63181 10.3682 1.33333 10 1.33333Z"
        stroke="currentColor"
        strokeWidth={STROKE.sm}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.6667 2.66667H12C12.3536 2.66667 12.6928 2.80714 12.9428 3.05719C13.1929 3.30724 13.3333 3.64638 13.3333 4V13.3333C13.3333 13.687 13.1929 14.0261 12.9428 14.2761C12.6928 14.5262 12.3536 14.6667 12 14.6667H4C3.64638 14.6667 3.30724 14.5262 3.05719 14.2761C2.80714 14.0261 2.66667 13.687 2.66667 13.3333V4C2.66667 3.64638 2.80714 3.30724 3.05719 3.05719C3.30724 2.80714 3.64638 2.66667 4 2.66667H5.33333"
        stroke="currentColor"
        strokeWidth={STROKE.sm}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 7.33333H10.6667"
        stroke="currentColor"
        strokeWidth={STROKE.sm}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 10.6667H10.6667"
        stroke="currentColor"
        strokeWidth={STROKE.sm}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.33333 7.33333H5.34"
        stroke="currentColor"
        strokeWidth={STROKE.sm}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.33333 10.6667H5.34"
        stroke="currentColor"
        strokeWidth={STROKE.sm}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </NavIconSvg>
  )
}

function CertificacionesIcon({ className }: { className?: string }) {
  return (
    <NavIconSvg viewBox="0 0 15.8617 15.8617" className={className}>
      <path
        d="M13.2181 8.59176C13.2181 11.8963 10.905 13.5486 8.1556 14.5069C8.01163 14.5557 7.85525 14.5533 7.7128 14.5003C4.95682 13.5486 2.64365 11.8963 2.64365 8.59176V3.96542C2.64365 3.79013 2.71328 3.62203 2.83722 3.49809C2.96117 3.37414 3.12927 3.30451 3.30455 3.30451C4.62636 3.30451 6.27863 2.51142 7.42861 1.50685C7.56862 1.38722 7.74674 1.3215 7.93089 1.3215C8.11505 1.3215 8.29317 1.38722 8.43318 1.50685C9.58977 2.51803 11.2354 3.30451 12.5572 3.30451C12.7325 3.30451 12.9006 3.37414 13.0246 3.49809C13.1485 3.62203 13.2181 3.79013 13.2181 3.96542V8.59176Z"
        stroke="currentColor"
        strokeWidth={STROKE.md}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </NavIconSvg>
  )
}

function EquipoIcon({ className }: { className?: string }) {
  return (
    <NavIconSvg viewBox="0 0 15.8617 15.8617" className={className}>
      <path
        d="M10.5739 13.8791V12.5573C10.5739 11.8562 10.2954 11.1838 9.79958 10.688C9.30381 10.1922 8.63139 9.9137 7.93026 9.9137H3.96482C3.26369 9.9137 2.59127 10.1922 2.0955 10.688C1.59972 11.1838 1.3212 11.8562 1.3212 12.5573V13.8791"
        stroke="currentColor"
        strokeWidth={STROKE.md}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.94755 7.27003C7.40758 7.27003 8.59117 6.08644 8.59117 4.6264C8.59117 3.16637 7.40758 1.98278 5.94755 1.98278C4.48752 1.98278 3.30392 3.16637 3.30392 4.6264C3.30392 6.08644 4.48752 7.27003 5.94755 7.27003Z"
        stroke="currentColor"
        strokeWidth={STROKE.md}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.54 13.8792V12.5574C14.5396 11.9717 14.3446 11.4027 13.9858 10.9397C13.6269 10.4768 13.1244 10.1461 12.5573 9.9997"
        stroke="currentColor"
        strokeWidth={STROKE.md}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.5746 2.06879C11.1432 2.21438 11.6472 2.5451 12.0072 3.0088C12.3671 3.4725 12.5625 4.0428 12.5625 4.6298C12.5625 5.21679 12.3671 5.7871 12.0072 6.25079C11.6472 6.71449 11.1432 7.04521 10.5746 7.19081"
        stroke="currentColor"
        strokeWidth={STROKE.md}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </NavIconSvg>
  )
}

function ClientesIcon({ className }: { className?: string }) {
  return (
    <NavIconSvg viewBox="0 0 15.8617 15.8617" className={className}>
      <path
        d="M7.93026 14.5399C11.5803 14.5399 14.5393 11.5809 14.5393 7.93082C14.5393 4.28074 11.5803 1.32176 7.93026 1.32176C4.28017 1.32176 1.3212 4.28074 1.3212 7.93082C1.3212 11.5809 4.28017 14.5399 7.93026 14.5399Z"
        stroke="currentColor"
        strokeWidth={STROKE.md}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.93091 8.59174C9.02594 8.59174 9.91363 7.70405 9.91363 6.60903C9.91363 5.514 9.02594 4.62631 7.93091 4.62631C6.83589 4.62631 5.94819 5.514 5.94819 6.60903C5.94819 7.70405 6.83589 8.59174 7.93091 8.59174Z"
        stroke="currentColor"
        strokeWidth={STROKE.md}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.62638 13.6555V12.5571C4.62638 12.2065 4.76564 11.8703 5.01353 11.6224C5.26141 11.3745 5.59762 11.2352 5.94819 11.2352H9.91362C10.2642 11.2352 10.6004 11.3745 10.8483 11.6224C11.0962 11.8703 11.2354 12.2065 11.2354 12.5571V13.6555"
        stroke="currentColor"
        strokeWidth={STROKE.md}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </NavIconSvg>
  )
}

function ConfiguracionIcon({ className }: { className?: string }) {
  return (
    <NavIconSvg viewBox="0 0 15.8617 15.8617" className={className}>
      <path
        d="M8.07592 1.32166H7.78512C7.43455 1.32166 7.09834 1.46092 6.85045 1.70881C6.60257 1.9567 6.4633 2.29291 6.4633 2.64348V2.76244C6.46307 2.99423 6.40188 3.22189 6.28588 3.42258C6.16988 3.62326 6.00314 3.78991 5.8024 3.90581L5.51821 4.07103C5.31727 4.18705 5.08933 4.24812 4.8573 4.24812C4.62528 4.24812 4.39734 4.18705 4.1964 4.07103L4.09726 4.01816C3.79395 3.84319 3.4336 3.79573 3.09533 3.88618C2.75705 3.97664 2.46849 4.19762 2.29299 4.50062L2.14759 4.75177C1.97262 5.05508 1.92516 5.41542 2.01561 5.7537C2.10607 6.09197 2.32705 6.38053 2.63005 6.55604L2.72919 6.62213C2.92896 6.73747 3.09508 6.90307 3.21102 7.1025C3.32696 7.30192 3.3887 7.52821 3.39009 7.75889V8.09595C3.39102 8.32887 3.33038 8.55789 3.21432 8.75984C3.09826 8.96178 2.9309 9.12947 2.72919 9.24593L2.63005 9.30541C2.32705 9.48091 2.10607 9.76947 2.01561 10.1077C1.92516 10.446 1.97262 10.8064 2.14759 11.1097L2.29299 11.3608C2.46849 11.6638 2.75705 11.8848 3.09533 11.9753C3.4336 12.0657 3.79395 12.0183 4.09726 11.8433L4.1964 11.7904C4.39734 11.6744 4.62528 11.6133 4.8573 11.6133C5.08933 11.6133 5.31727 11.6744 5.51821 11.7904L5.8024 11.9556C6.00314 12.0715 6.16988 12.2382 6.28588 12.4389C6.40188 12.6396 6.46307 12.8672 6.4633 13.099V13.218C6.4633 13.5685 6.60257 13.9047 6.85045 14.1526C7.09834 14.4005 7.43455 14.5398 7.78512 14.5398H8.07592C8.42648 14.5398 8.76269 14.4005 9.01058 14.1526C9.25847 13.9047 9.39773 13.5685 9.39773 13.218V13.099C9.39797 12.8672 9.45915 12.6396 9.57516 12.4389C9.69116 12.2382 9.85789 12.0715 10.0586 11.9556L10.3428 11.7904C10.5438 11.6744 10.7717 11.6133 11.0037 11.6133C11.2358 11.6133 11.4637 11.6744 11.6646 11.7904L11.7638 11.8433C12.0671 12.0183 12.4274 12.0657 12.7657 11.9753C13.104 11.8848 13.3925 11.6638 13.568 11.3608L13.7134 11.1031C13.8884 10.7998 13.9359 10.4394 13.8454 10.1011C13.755 9.76287 13.534 9.4743 13.231 9.2988L13.1318 9.24593C12.9301 9.12947 12.7628 8.96178 12.6467 8.75984C12.5307 8.55789 12.47 8.32887 12.4709 8.09595V7.7655C12.47 7.53258 12.5307 7.30356 12.6467 7.10161C12.7628 6.89967 12.9301 6.73198 13.1318 6.61552L13.231 6.55604C13.534 6.38053 13.755 6.09197 13.8454 5.7537C13.9359 5.41542 13.8884 5.05508 13.7134 4.75177L13.568 4.50062C13.3925 4.19762 13.104 3.97664 12.7657 3.88618C12.4274 3.79573 12.0671 3.84319 11.7638 4.01816L11.6646 4.07103C11.4637 4.18705 11.2358 4.24812 11.0037 4.24812C10.7717 4.24812 10.5438 4.18705 10.3428 4.07103L10.0586 3.90581C9.85789 3.78991 9.69116 3.62326 9.57516 3.42258C9.45915 3.22189 9.39797 2.99423 9.39773 2.76244V2.64348C9.39773 2.29291 9.25847 1.9567 9.01058 1.70881C8.76269 1.46092 8.42648 1.32166 8.07592 1.32166Z"
        stroke="currentColor"
        strokeWidth={STROKE.md}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.93091 9.91362C9.02594 9.91362 9.91363 9.02593 9.91363 7.93091C9.91363 6.83588 9.02594 5.94819 7.93091 5.94819C6.83589 5.94819 5.94819 6.83588 5.94819 7.93091C5.94819 9.02593 6.83589 9.91362 7.93091 9.91362Z"
        stroke="currentColor"
        strokeWidth={STROKE.md}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </NavIconSvg>
  )
}

const ICONS: Record<
  ProjectNavIconId,
  ({ className }: { className?: string }) => ReactElement
> = {
  dashboard: DashboardIcon,
  "trabajo-diario": TrabajoDiarioIcon,
  certificaciones: CertificacionesIcon,
  equipo: EquipoIcon,
  clientes: ClientesIcon,
  configuracion: ConfiguracionIcon,
}

export function ProjectNavIcon({ id, className }: ProjectNavIconProps) {
  const Icon = ICONS[id]
  return <Icon className={className} />
}
