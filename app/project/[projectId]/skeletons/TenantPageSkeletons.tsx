import { ChevronDown } from "lucide-react"
import { ConfiguracionSectionsSkeleton } from "../configuracion/ConfiguracionSectionsSkeleton"
import {
  CLIENTES_LAYOUT,
  EQUIPO_LAYOUT,
  MI_UNIDAD_LAYOUT,
  MI_UNIDAD_WEATHER_WIDGET,
  PORTAL_CLIENTES_LAYOUT,
} from "@/lib/project/designTokens"
import { CREATE_PROJECT_LAYOUT } from "@/lib/projects/createProjectTokens"
import { Skeleton } from "@/components/ui/skeleton"
import {
  GhostBar,
  GhostCard,
  GhostPage,
  PAGE_CARD_SHADOW,
  PAGE_CARD_SHADOW_SOFT,
} from "./shared"

function PageTitleBlock({
  titleClassName,
  subtitleClassName,
}: {
  titleClassName: string
  subtitleClassName: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <GhostBar className={titleClassName} />
      <GhostBar className={subtitleClassName} />
    </div>
  )
}

function BrandButtonGhost({ className }: { className?: string }) {
  return (
    <Skeleton
      className={`h-[44px] w-full rounded-[10px] sm:w-[180px] ${className ?? ""}`}
    />
  )
}

function FilterFieldGhost() {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <GhostBar className="h-4 w-12 rounded-[6px]" />
      <Skeleton className="h-10 w-full rounded-[10px]" />
    </div>
  )
}

function TaskRowGhost() {
  return (
    <div className="flex w-full flex-col gap-3 rounded-[12px] border border-[#edeef0] p-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <GhostBar className="h-4 w-14 rounded-[6px]" />
          <GhostBar className="h-4 w-[180px] max-w-full rounded-[6px]" />
          <GhostBar className="h-4 w-16 rounded-[6px]" />
        </div>
        <GhostBar className="h-3.5 w-[220px] max-w-full rounded-[6px]" />
      </div>
      <Skeleton className="h-7 w-[92px] self-start rounded-lg sm:shrink-0" />
    </div>
  )
}

function PeopleRowGhost({ variant }: { variant: "equipo" | "clientes" }) {
  return (
    <div className="flex items-center gap-3 border-b border-[#edeef0] p-4 last:border-b-0">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <GhostBar className="h-4 w-[140px] max-w-full rounded-[6px]" />
        <GhostBar
          className={
            variant === "equipo"
              ? "h-3.5 w-[200px] max-w-full rounded-[6px]"
              : "h-3.5 w-[240px] max-w-full rounded-[6px]"
          }
        />
      </div>
      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        <Skeleton className="size-8 rounded-[8px]" />
        <Skeleton className="size-8 rounded-[8px]" />
      </div>
    </div>
  )
}

export function DashboardPageSkeleton() {
  return (
    <GhostPage
      label="Cargando dashboard…"
      className="gap-6 py-4 sm:gap-8 sm:py-6"
    >
      <div className="flex flex-col gap-4 sm:gap-6">
        <PageTitleBlock
          titleClassName="h-8 w-[min(100%,280px)] rounded-[10px] sm:h-9 lg:h-10"
          subtitleClassName="h-4 w-[min(100%,320px)] rounded-[8px]"
        />

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {(
            [
              "bg-[#eff6ff]",
              "bg-[#e6f7ed]",
              "bg-[#fefbe9]",
              "bg-[#feebec]",
            ] as const
          ).map((iconBg) => (
            <GhostCard
              key={iconBg}
              className="flex min-w-0 flex-col gap-4 px-3 py-3 sm:gap-6 sm:px-4 sm:py-[17px]"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`size-[31px] shrink-0 rounded-[10px] ${iconBg}`}
                />
                <GhostBar className="h-7 w-14 rounded-[8px]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <GhostBar className="h-3.5 w-[72%] rounded-[6px]" />
                <GhostBar className="h-3.5 w-[58%] rounded-[6px]" />
              </div>
            </GhostCard>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((index) => (
          <GhostCard key={index} className="overflow-hidden">
            <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-6 sm:py-[11.5px]">
              <GhostBar className="h-4 w-[88px] rounded-[6px]" />
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Skeleton className="h-2 min-w-0 flex-1 rounded-full" />
                <GhostBar className="h-3.5 w-8 shrink-0 rounded-[6px]" />
              </div>
              <GhostBar className="h-3.5 w-[92px] rounded-[6px]" />
            </div>
            {index < 2 ? (
              <div className="border-t border-[#edeef0] px-4 py-3">
                <div className="flex gap-3 overflow-hidden">
                  {Array.from({ length: index === 0 ? 3 : 4 }, (_, unitIndex) => (
                    <div
                      key={unitIndex}
                      className="flex w-[200px] shrink-0 flex-col gap-2 rounded-[8px] border border-[#edeef0] bg-[#fbfdff] px-[9px] py-[13px]"
                    >
                      <div className="flex items-center justify-between">
                        <GhostBar className="h-3 w-10 rounded-[4px]" />
                        <GhostBar className="h-3 w-8 rounded-[4px]" />
                      </div>
                      <Skeleton className="h-1.5 w-full rounded-full" />
                      <GhostBar className="h-3.5 w-[70%] rounded-[4px]" />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </GhostCard>
        ))}
      </div>
    </GhostPage>
  )
}

export function TrabajoDiarioPageSkeleton() {
  return (
    <GhostPage
      label="Cargando trabajo diario…"
      className="gap-4 py-4 sm:gap-6 sm:py-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <GhostBar className="h-8 w-[200px] rounded-[10px]" />
          <GhostBar className="h-4 w-[160px] rounded-[6px]" />
        </div>
        <BrandButtonGhost />
      </div>

      <GhostCard className="p-4 sm:p-[25px]">
        <GhostBar className="mb-4 h-6 w-[180px] rounded-[8px] sm:mb-6" />
        <div className="mb-4 grid grid-cols-1 gap-4 sm:mb-6 sm:grid-cols-2 md:grid-cols-4">
          <FilterFieldGhost />
          <FilterFieldGhost />
          <FilterFieldGhost />
          <FilterFieldGhost />
        </div>
        <div className="flex flex-col gap-2">
          <TaskRowGhost />
          <TaskRowGhost />
          <TaskRowGhost />
          <TaskRowGhost />
        </div>
      </GhostCard>
    </GhostPage>
  )
}

export function CertificacionesPageSkeleton() {
  return (
    <GhostPage
      label="Cargando certificaciones…"
      className="gap-4 py-4 sm:gap-6 sm:py-6"
    >
      <PageTitleBlock
        titleClassName="h-8 w-[min(100%,280px)] rounded-[10px] sm:h-9"
        subtitleClassName="h-4 w-[min(100%,260px)] rounded-[8px]"
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        {(
          [
            { icon: "bg-[#e6f4fe]", labelWidth: "w-[92px]" },
            { icon: "bg-[#feebec]", labelWidth: "w-[140px]" },
          ] as const
        ).map((stat) => (
          <GhostCard
            key={stat.icon}
            className="flex flex-1 flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:py-[17px]"
          >
            <div className="flex items-center gap-3">
              <div className={`size-[31px] shrink-0 rounded-[10px] ${stat.icon}`} />
              <GhostBar className="h-7 w-8 rounded-[8px]" />
            </div>
            <GhostBar className={`h-4 ${stat.labelWidth} rounded-[6px]`} />
          </GhostCard>
        ))}
      </div>

      <GhostCard
        className="flex flex-col gap-4 px-4 py-4 sm:gap-6 sm:px-[25px] sm:py-[25px]"
        shadow={PAGE_CARD_SHADOW_SOFT}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 md:gap-2">
          <FilterFieldGhost />
          <FilterFieldGhost />
          <FilterFieldGhost />
          <div className="flex min-w-0 flex-col gap-1.5">
            <GhostBar className="h-4 w-12 rounded-[6px]" />
            <Skeleton className="h-10 w-full rounded-[10px]" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 rounded-[4px]" />
          <GhostBar className="h-4 w-[140px] rounded-[6px]" />
        </div>
        <div className="flex flex-col gap-2">
          <TaskRowGhost />
          <TaskRowGhost />
          <TaskRowGhost />
        </div>
      </GhostCard>
    </GhostPage>
  )
}

function PeopleListPageSkeleton({
  label,
  titleWidth,
  buttonWidth,
  showSearch,
  maxWidth,
  paddingBottom,
}: {
  label: string
  titleWidth: string
  buttonWidth: string
  showSearch: boolean
  maxWidth: string
  paddingBottom?: string
}) {
  return (
    <GhostPage
      label={label}
      className="mx-auto w-full gap-4 py-4 sm:gap-6 sm:py-6"
    >
      <div
        className="flex w-full flex-col gap-4 sm:gap-6"
        style={{
          maxWidth,
          width: "100%",
          margin: "0 auto",
          paddingBottom,
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <GhostBar className={`h-8 ${titleWidth} rounded-[10px]`} />
            <GhostBar className="h-4 w-[180px] max-w-full rounded-[6px]" />
          </div>
          <Skeleton
            className={`h-[44px] w-full rounded-[10px] ${buttonWidth}`}
          />
        </div>

        {showSearch ? (
          <Skeleton className="h-[42px] w-full rounded-[12px]" />
        ) : null}

        <GhostCard className="overflow-hidden rounded-[16px]" shadow={PAGE_CARD_SHADOW_SOFT}>
          <PeopleRowGhost variant={showSearch ? "equipo" : "clientes"} />
          <PeopleRowGhost variant={showSearch ? "equipo" : "clientes"} />
          <PeopleRowGhost variant={showSearch ? "equipo" : "clientes"} />
          <PeopleRowGhost variant={showSearch ? "equipo" : "clientes"} />
        </GhostCard>

        <GhostBar className="h-3.5 w-[180px] rounded-[6px]" />
      </div>
    </GhostPage>
  )
}

export function EquipoPageSkeleton() {
  return (
    <PeopleListPageSkeleton
      label="Cargando equipo…"
      titleWidth="w-[220px]"
      buttonWidth="sm:w-[180px]"
      showSearch
      maxWidth={EQUIPO_LAYOUT.contentMaxWidth}
      paddingBottom={EQUIPO_LAYOUT.pageBottomPadding}
    />
  )
}

export function ClientesPageSkeleton() {
  return (
    <PeopleListPageSkeleton
      label="Cargando clientes…"
      titleWidth="w-[140px]"
      buttonWidth="sm:w-[170px]"
      showSearch={false}
      maxWidth={CLIENTES_LAYOUT.contentMaxWidth}
    />
  )
}

export function ConfiguracionPageSkeleton() {
  return (
    <GhostPage
      label="Cargando configuración…"
      className="mx-auto w-full gap-4 sm:gap-5"
    >
      <div
        className="mx-auto flex w-full flex-col gap-4 sm:gap-5"
        style={{ maxWidth: CREATE_PROJECT_LAYOUT.contentMaxWidth }}
      >
        <PageTitleBlock
          titleClassName="h-8 w-[min(100%,280px)] rounded-[10px]"
          subtitleClassName="h-4 w-[min(100%,360px)] rounded-[8px]"
        />

        <GhostCard
          className="flex flex-col gap-4 rounded-[16px] p-4 sm:gap-5 sm:p-6"
          shadow={PAGE_CARD_SHADOW_SOFT}
        >
          <GhostBar className="h-5 w-[180px] rounded-[8px]" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-4">
            <Skeleton className="size-16 shrink-0 rounded-[10px] sm:size-20" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <GhostBar className="h-4 w-[160px] rounded-[6px]" />
              <Skeleton className="h-[42px] w-full rounded-[10px]" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex flex-col gap-1.5">
                <GhostBar className="h-4 w-[88px] rounded-[6px]" />
                <Skeleton className="h-[42px] w-full rounded-[10px]" />
              </div>
            ))}
          </div>
        </GhostCard>

        <ConfiguracionSectionsSkeleton />
      </div>
    </GhostPage>
  )
}

export function PortalClientesPageSkeleton() {
  return (
    <GhostPage label="Cargando portal de clientes…" className="mx-auto w-full">
      <div
        className="mx-auto flex w-full flex-col gap-5 pt-6"
        style={{ maxWidth: PORTAL_CLIENTES_LAYOUT.contentMaxWidth }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <GhostBar className="h-8 w-[220px] rounded-[10px]" />
            <GhostBar className="h-4 w-[min(100%,420px)] rounded-[8px]" />
          </div>
          <Skeleton className="h-10 w-[140px] shrink-0 rounded-[10px]" />
        </div>

        <GhostCard className="flex flex-col gap-4 rounded-[16px] p-4 sm:p-[25px]">
          <div className="flex flex-col gap-2">
            <GhostBar className="h-6 w-[180px] rounded-[8px]" />
            <GhostBar className="h-4 w-[min(100%,320px)] rounded-[6px]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <GhostBar className="h-4 w-16 rounded-[6px]" />
            <Skeleton className="h-[42px] w-full rounded-[10px]" />
          </div>
        </GhostCard>

        <GhostCard className="flex flex-col gap-6 rounded-[16px] p-4 sm:p-[25px]">
          <GhostBar className="h-6 w-[240px] rounded-[8px]" />
          <div className="flex flex-col gap-3 rounded-[12px] border border-[#edeef0] p-4 sm:flex-row">
            <Skeleton className="h-[120px] w-full rounded-[10px] sm:h-[96px] sm:w-[160px] sm:shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <Skeleton className="h-[42px] w-full rounded-[10px]" />
              <Skeleton className="h-[72px] w-full rounded-[10px]" />
            </div>
          </div>
        </GhostCard>

        <GhostCard className="flex flex-col gap-6 rounded-[16px] p-4 sm:p-[25px]">
          <GhostBar className="h-6 w-[200px] rounded-[8px]" />
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <GhostBar className="h-5 w-[180px] rounded-[8px]" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <GhostBar className="h-5 w-[140px] rounded-[8px]" />
            </div>
          </div>
        </GhostCard>
      </div>
    </GhostPage>
  )
}

export function MiUnidadPageSkeleton() {
  return (
    <GhostPage
      label="Cargando tu unidad…"
      className="mx-auto w-full gap-8 pb-10 pt-[80px] -mt-4 lg:-mt-6"
    >
      <div
        className="mx-auto flex w-full flex-col gap-8"
        style={{ maxWidth: MI_UNIDAD_LAYOUT.contentMaxWidth }}
      >
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <GhostBar className="h-9 w-[min(100%,280px)] rounded-[10px]" />
            <GhostBar className="h-5 w-[min(100%,260px)] rounded-[8px]" />
          </div>
          <div className={MI_UNIDAD_WEATHER_WIDGET.container}>
            <div className="flex flex-col gap-1.5">
              <GhostBar className="h-7 w-16 rounded-[8px]" />
              <GhostBar className="h-3.5 w-20 rounded-[6px]" />
            </div>
            <Skeleton className="size-10 shrink-0 rounded-[10px]" />
          </div>
        </header>

        <section className="flex flex-col gap-3">
          <GhostBar className="h-7 w-[240px] rounded-[8px]" />
          <GhostCard className="flex h-[82px] items-center overflow-hidden">
            <Skeleton className="h-full w-[110px] shrink-0 rounded-none" />
            <div className="flex min-w-0 flex-1 flex-col gap-2 px-[18px]">
              <GhostBar className="h-5 w-[120px] rounded-[6px]" />
              <GhostBar className="h-3.5 w-[180px] max-w-full rounded-[6px]" />
            </div>
          </GhostCard>
        </section>

        <section className="flex flex-col gap-3">
          <GhostBar className="h-7 w-[200px] rounded-[8px]" />
          <Skeleton className="h-[280px] w-full rounded-[16px] sm:h-[380px]" />
        </section>

        <GhostCard className="rounded-[16px] p-[25px]">
          <GhostBar className="h-7 w-[220px] rounded-[8px]" />
          <div className="flex flex-col gap-4 pt-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <GhostBar className="h-4 w-[min(100%,220px)] rounded-[6px]" />
              </div>
            ))}
          </div>
        </GhostCard>
      </div>
    </GhostPage>
  )
}

export function UnitDetailPageSkeleton() {
  return (
    <GhostPage label="Cargando unidad…" className="gap-[19px] py-6">
      <GhostBar className="h-5 w-[140px] rounded-[8px]" />

      <div className="flex flex-col gap-4 lg:flex-row">
        <GhostCard
          className="flex min-w-0 flex-1 flex-col gap-3.5 rounded-[16px] p-6"
        >
          <GhostBar className="h-4 w-[100px] rounded-[6px]" />
          <div className="flex flex-wrap items-center gap-3">
            <GhostBar className="h-8 w-[88px] rounded-[8px]" />
            <Skeleton className="h-7 w-[88px] rounded-full" />
          </div>
          <div className="flex gap-10">
            <div className="flex flex-col items-center gap-1.5">
              <GhostBar className="h-7 w-12 rounded-[8px]" />
              <GhostBar className="h-3.5 w-[88px] rounded-[6px]" />
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <GhostBar className="h-7 w-12 rounded-[8px]" />
              <GhostBar className="h-3.5 w-[110px] rounded-[6px]" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <GhostBar className="h-4 w-[120px] rounded-[6px]" />
            <Skeleton className="h-2.5 w-full rounded-full" />
          </div>
        </GhostCard>

        <GhostCard className="flex size-[180px] shrink-0 items-center justify-center rounded-[16px] px-5 py-8">
          <Skeleton className="size-[128px] rounded-[8px]" />
        </GhostCard>
      </div>

      <GhostCard className="rounded-[16px] p-6">
        <GhostBar className="h-5 w-[220px] rounded-[8px]" />
        <div className="mt-5 flex flex-wrap gap-4 border-b border-[#edeef0] pb-3.5">
          <GhostBar className="h-5 w-16 rounded-[6px]" />
          <GhostBar className="h-5 w-24 rounded-[6px]" />
          <GhostBar className="h-5 w-20 rounded-[6px]" />
          <GhostBar className="h-5 w-[88px] rounded-[6px]" />
        </div>
        <div className="mt-5 flex flex-col gap-2.5">
          <GhostCard className="flex items-center justify-between rounded-[12px] px-4 py-3" shadow="none">
            <GhostBar className="h-4 w-[180px] rounded-[6px]" />
            <ChevronDown className="size-4 text-[#edeef0]" aria-hidden />
          </GhostCard>
          <GhostCard className="flex items-center justify-between rounded-[12px] px-4 py-3" shadow="none">
            <GhostBar className="h-4 w-[160px] rounded-[6px]" />
            <ChevronDown className="size-4 text-[#edeef0]" aria-hidden />
          </GhostCard>
        </div>
      </GhostCard>
    </GhostPage>
  )
}

export function PerfilTenantSkeleton({
  showBackButton = false,
}: {
  showBackButton?: boolean
}) {
  return (
    <GhostPage
      label="Cargando perfil…"
      className="mx-auto w-full max-w-[720px]"
    >
      {showBackButton ? <GhostBar className="mb-6 h-6 w-24 rounded-[8px]" /> : null}

      <div className="mb-[22px] flex flex-col gap-2">
        <GhostBar className="h-7 w-32 rounded-[10px]" />
        <GhostBar className="h-4 w-[min(100%,320px)] rounded-[8px]" />
      </div>

      <div className="flex flex-col gap-[22px]">
        {Array.from({ length: 3 }, (_, index) => (
          <GhostCard
            key={index}
            className="rounded-[16px] p-[21px]"
          >
            <GhostBar className="mb-4 h-6 w-48 rounded-[8px]" />
            <div className="flex flex-col gap-4">
              <Skeleton className="h-[42px] w-full rounded-[10px]" />
              <Skeleton className="h-[42px] w-full rounded-[10px]" />
              {index === 0 ? (
                <div className="flex items-center gap-4">
                  <Skeleton className="size-16 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-[42px] w-full rounded-[10px]" />
                    <Skeleton className="h-[42px] w-full rounded-[10px]" />
                  </div>
                </div>
              ) : null}
              <Skeleton className="h-11 w-36 rounded-[10px]" />
            </div>
          </GhostCard>
        ))}
      </div>
    </GhostPage>
  )
}
