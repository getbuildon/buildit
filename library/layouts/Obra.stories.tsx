import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AlertTriangle,
  Briefcase,
  Car,
  CheckCircle2,
  ClipboardCheck,
  DoorOpen,
  Home,
  LayoutGrid,
  Plus,
  Sun,
  TrendingUp,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { Button } from "../atoms/button/Button";
import { Icon } from "../atoms/icon/Icon";
import { Link } from "../atoms/link/Link";
import { Skeleton } from "../atoms/skeleton/Skeleton";
import { formatPercent } from "../foundations/format/format";
import { Card, CardBody, CardFooter, CardHeader } from "../molecules/card/Card";
import { EmptyState } from "../molecules/empty-state/EmptyState";
import { Segmented } from "../molecules/segmented/Segmented";
import {
  FloorItem,
  FloorList,
  FloorListSkeleton,
  UnitTile,
} from "../organisms/floor-progress/FloorProgress";
import { ProgressCurve } from "../organisms/chart/Charts";
import {
  FloorPlan,
  FloorPlanCell,
  type FloorUnitStatus,
} from "../organisms/floor-plan/FloorPlan";
import { MetricCard, MetricStrip } from "../organisms/metric/Metric";
import { PageHeader } from "../organisms/page-header/PageHeader";
import { WorkspaceLayout } from "./workspace/WorkspaceLayout";
import {
  MobileHeaderToday,
  SidebarProposal,
  SidebarToday,
  TopbarProposal,
  project,
} from "./obra/ObraShell";

/* La primera pantalla de una obra (app/project/[projectId], el «Dashboard»), armada con
   la librería en dos versiones:
   - como hoy: mismo diseño y contenido, con los arreglos de buenas prácticas;
   - propuesta: cómo podría quedar. */

/* ------------------------------------------------------------------ Datos */

type Unit = {
  id: string;
  code: string;
  type: string;
  icon: LucideIcon;
  progress: number;
  blocked?: boolean;
  issue?: string;
};
type FloorData = { id: string; name: string; units: Unit[] };

const dpto = (rooms: number) => `Dpto. ${rooms} Amb.`;

const floors: FloorData[] = [
  {
    id: "pb",
    name: "Planta Baja",
    units: [
      {
        id: "pb-lobby",
        code: "PB-01",
        type: "Lobby",
        icon: DoorOpen,
        progress: 100,
      },
      {
        id: "pb-sum",
        code: "PB-02",
        type: "SUM",
        icon: LayoutGrid,
        progress: 82,
      },
      {
        id: "pb-cochera",
        code: "PB-03",
        type: "Estacionamiento",
        icon: Car,
        progress: 64,
      },
      {
        id: "pb-oficina",
        code: "PB-04",
        type: "Oficina 40 m²",
        icon: Briefcase,
        progress: 47,
      },
    ],
  },
  {
    id: "p1",
    name: "Piso 1",
    units: [
      {
        id: "1a",
        code: "1A",
        type: dpto(3),
        icon: Home,
        progress: 74,
        blocked: true,
        issue: "Instalación eléctrica",
      },
      { id: "1b", code: "1B", type: dpto(2), icon: Home, progress: 66 },
      { id: "1c", code: "1C", type: dpto(2), icon: Home, progress: 58 },
      { id: "1d", code: "1D", type: dpto(1), icon: Home, progress: 51 },
    ],
  },
  {
    id: "p2",
    name: "Piso 2",
    units: [
      { id: "2a", code: "2A", type: dpto(3), icon: Home, progress: 55 },
      { id: "2b", code: "2B", type: dpto(2), icon: Home, progress: 48 },
      { id: "2c", code: "2C", type: dpto(2), icon: Home, progress: 41 },
      { id: "2d", code: "2D", type: dpto(1), icon: Home, progress: 36 },
    ],
  },
  {
    id: "p3",
    name: "Piso 3",
    units: [
      {
        id: "3a",
        code: "3A",
        type: dpto(3),
        icon: Home,
        progress: 34,
        blocked: true,
        issue: "Instalación sanitaria",
      },
      {
        id: "3b",
        code: "3B",
        type: dpto(2),
        icon: Home,
        progress: 29,
        blocked: true,
        issue: "Albañilería",
      },
      { id: "3c", code: "3C", type: dpto(2), icon: Home, progress: 22 },
      { id: "3d", code: "3D", type: dpto(1), icon: Home, progress: 18 },
    ],
  },
  {
    id: "p4",
    name: "Piso 4",
    units: [
      { id: "4a", code: "4A", type: dpto(3), icon: Home, progress: 14 },
      { id: "4b", code: "4B", type: dpto(2), icon: Home, progress: 9 },
      { id: "4c", code: "4C", type: dpto(2), icon: Home, progress: 6 },
    ],
  },
  {
    id: "terraza",
    name: "Terraza",
    units: [
      {
        id: "t-pileta",
        code: "T-01",
        type: "Piscina",
        icon: Waves,
        progress: 3,
      },
      {
        id: "t-solarium",
        code: "T-02",
        type: "Terraza",
        icon: Sun,
        progress: 0,
      },
    ],
  },
];

const average = (values: number[]) =>
  values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
const floorProgress = (floor: FloorData) =>
  average(floor.units.map((unit) => unit.progress));
const allUnits = floors.flatMap((floor) =>
  floor.units.map((unit) => ({ ...unit, floor: floor.name })),
);
const stats = {
  floors: floors.length,
  units: allUnits.length,
  progress:
    Math.round(average(allUnits.map((unit) => unit.progress)) * 100) / 100,
  completed: allUnits.filter((unit) => unit.progress === 100).length,
  certified: 312,
  certifiedThisWeek: 18,
  blocked: 5,
};
const blockedUnits = allUnits.filter((unit) => unit.blocked);

/* Curva de avance: necesita un plan de obra cargado (hoy la app no lo tiene). */
const curve = [
  { label: "Jun", planned: 5, actual: 4 },
  { label: "Jul", planned: 12, actual: 10 },
  { label: "Ago", planned: 21, actual: 17 },
  { label: "Sep", planned: 32, actual: 26 },
  { label: "Oct", planned: 42, actual: 34 },
  { label: "Nov", planned: 51, actual: 40.81 },
  { label: "Dic", planned: 60 },
  { label: "Ene", planned: 70 },
  { label: "Feb", planned: 80 },
  { label: "Mar", planned: 90 },
  { label: "Abr", planned: 100 },
];

function unitStatus(unit: Unit): FloorUnitStatus {
  if (unit.progress === 100) return "terminada";
  if (unit.blocked) return "bloqueada";
  if (unit.progress === 0) return "sin-empezar";
  return "en-curso";
}

/* ================================================================== Como hoy */

function FloorsToday() {
  return (
    <section aria-labelledby="pisos" className="flex flex-col">
      <h2 id="pisos" className="sr-only">
        Avance por piso
      </h2>
      <FloorList
        type="multiple"
        defaultValue={floors.slice(0, 2).map((floor) => floor.id)}
      >
        {floors.map((floor) => (
          <FloorItem
            key={floor.id}
            value={floor.id}
            name={floor.name}
            progress={floorProgress(floor)}
            unitCount={floor.units.length}
            blockedCount={floor.units.filter((unit) => unit.blocked).length}
          >
            {floor.units.map((unit) => (
              <UnitTile
                key={unit.id}
                code={unit.code}
                type={unit.type}
                icon={unit.icon}
                progress={unit.progress}
                blocked={unit.blocked}
                link={<a href={`#unidad-${unit.id}`} />}
              />
            ))}
          </FloorItem>
        ))}
      </FloorList>
    </section>
  );
}

type TodayState = "datos" | "cargando" | "error";

function ResumenHoy({ state = "datos" }: { state?: TodayState }) {
  return (
    <WorkspaceLayout
      sidebar={<SidebarToday active="dashboard" />}
      topbar={<MobileHeaderToday active="dashboard" />}
    >
      {state === "cargando" ? (
        <div
          role="status"
          aria-busy
          className="flex flex-col gap-block py-compact sm:gap-6 sm:py-block"
        >
          <span className="sr-only">Cargando el resumen de la obra…</span>
          <div className="flex flex-col gap-group sm:gap-block">
            <div className="flex flex-col gap-compact">
              <Skeleton className="h-8 w-[min(100%,280px)] sm:h-9 lg:h-10" />
              <Skeleton className="h-4 w-[min(100%,320px)]" />
            </div>
            <div className="grid grid-cols-2 gap-snug md:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-group rounded-surface border border-line bg-canvas-raised p-snug shadow-hint sm:gap-block sm:px-group sm:py-4.25"
                >
                  <div className="flex items-center gap-snug">
                    <Skeleton className="size-7.75 rounded-control" />
                    <Skeleton className="h-7 w-14" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-3.5 w-[72%]" />
                    <Skeleton className="h-3.5 w-[58%]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <FloorListSkeleton />
        </div>
      ) : state === "error" ? (
        <EmptyState
          icon={AlertTriangle}
          title="No pudimos cargar el resumen"
          description="Puede ser un problema de conexión. Probá de nuevo en un momento."
          action={<Button variant="outline">Reintentar</Button>}
          className="min-h-[40vh] justify-center"
        />
      ) : (
        <div className="flex flex-col gap-block py-compact sm:gap-6 sm:py-block">
          <div className="flex flex-col gap-group sm:gap-block">
            <div className="flex flex-col gap-compact">
              <h1 className="text-headline text-ink">{project.name}</h1>
              <p className="text-meta text-ink-muted sm:text-body">
                {stats.floors} Niveles · {stats.units} Unidades · Progreso
                General: {formatPercent(stats.progress)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-snug md:grid-cols-4">
              <MetricCard
                variant="tile"
                tone="info"
                icon={TrendingUp}
                value={formatPercent(stats.progress)}
                label="Progreso General"
                hint="promedio de todas las unidades"
              />
              <MetricCard
                variant="tile"
                tone="ok"
                icon={CheckCircle2}
                value={`${stats.completed}/${stats.units}`}
                label="Completo"
                hint="unidades terminadas"
              />
              <MetricCard
                variant="tile"
                tone="caution"
                icon={ClipboardCheck}
                value={String(stats.certified)}
                label="Tareas certificadas"
                hint={`${stats.certifiedThisWeek} esta semana`}
              />
              <MetricCard
                variant="tile"
                tone="danger"
                icon={AlertTriangle}
                value={String(stats.blocked)}
                label="Problemas"
                hint="tareas bloqueadas"
              />
            </div>
          </div>
          <FloorsToday />
        </div>
      )}
    </WorkspaceLayout>
  );
}

/* ================================================================== Propuesta */

function AttentionCard() {
  return (
    <Card id="atencion" className="h-full">
      <CardHeader
        as="h2"
        title="Necesita atención"
        description={`${blockedUnits.length} unidades con tareas bloqueadas`}
      />
      <CardBody className="pt-0">
        <ul className="flex flex-col divide-y divide-line">
          {blockedUnits.map((unit) => (
            <li
              key={unit.id}
              className="flex items-start gap-snug py-snug first:pt-0 last:pb-0"
            >
              <span className="mt-related text-fn-danger">
                <Icon icon={AlertTriangle} size="xs" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link
                  href={`#unidad-${unit.id}`}
                  tone="ink"
                  className="text-label no-underline hover:underline"
                >
                  {unit.floor} · {unit.code}
                </Link>
                <p className="text-meta text-ink-muted">
                  {unit.issue} bloqueada
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardBody>
      <CardFooter className="mt-auto">
        <Link href="#trabajo-diario" tone="ink" className="text-label">
          Ver en Trabajo diario
        </Link>
      </CardFooter>
    </Card>
  );
}

function FloorsProposal() {
  const [view, setView] = useState("lista");
  const [filter, setFilter] = useState("todos");
  const visible =
    filter === "todos"
      ? floors
      : floors.filter((floor) => floor.units.some((unit) => unit.blocked));
  const [open, setOpen] = useState<string[]>(
    floors.slice(0, 2).map((floor) => floor.id),
  );
  const allOpen = visible.every((floor) => open.includes(floor.id));
  return (
    <section
      aria-labelledby="pisos-propuesta"
      className="flex flex-col gap-group"
    >
      <div className="flex flex-wrap items-center justify-between gap-snug">
        <h2 id="pisos-propuesta" className="text-heading">
          Avance por piso
        </h2>
        <div className="flex flex-wrap items-center gap-compact">
          <Segmented
            size="compact"
            label="Cómo ver los pisos"
            value={view}
            onValueChange={setView}
            options={[
              { value: "lista", label: "Lista" },
              { value: "edificio", label: "Edificio" },
            ]}
          />
          <Segmented
            size="compact"
            label="Qué pisos mostrar"
            value={filter}
            onValueChange={setFilter}
            options={[
              { value: "todos", label: "Todos" },
              { value: "problemas", label: "Con problemas" },
            ]}
          />
          {view === "lista" ? (
            <Button
              variant="ghost"
              size="compact"
              onClick={() =>
                setOpen(allOpen ? [] : visible.map((floor) => floor.id))
              }
            >
              {allOpen ? "Cerrar todos" : "Abrir todos"}
            </Button>
          ) : null}
        </div>
      </div>
      {view === "edificio" ? (
        <FloorPlan
          label="La obra piso por piso"
          floors={[...visible].reverse().map((floor) => ({
            id: floor.id,
            label: floor.name,
            units: floor.units.map((unit) => ({
              id: unit.id,
              name: unit.code,
              progress: unit.progress,
              status: unitStatus(unit),
            })),
          }))}
          renderLink={(unit) => (
            <a href={`#unidad-${unit.id}`}>
              <FloorPlanCell unit={unit} />
            </a>
          )}
        />
      ) : (
        <FloorList type="multiple" value={open} onValueChange={setOpen}>
          {visible.map((floor) => (
            <FloorItem
              key={floor.id}
              value={floor.id}
              name={floor.name}
              progress={floorProgress(floor)}
              layout="grid"
              unitCount={floor.units.length}
              blockedCount={floor.units.filter((unit) => unit.blocked).length}
            >
              {floor.units.map((unit) => (
                <UnitTile
                  key={unit.id}
                  width="fluid"
                  code={unit.code}
                  type={unit.type}
                  icon={unit.icon}
                  progress={unit.progress}
                  progressTone={unit.progress === 100 ? "ok" : "stage-neutral"}
                  blocked={unit.blocked}
                  link={<a href={`#unidad-${unit.id}`} />}
                />
              ))}
            </FloorItem>
          ))}
        </FloorList>
      )}
    </section>
  );
}

function CurveCard() {
  return (
    <Card className="h-full">
      <CardHeader
        as="h2"
        title="Curva de avance"
        description="Lo planificado contra lo real, mes a mes. Hoy va 10 puntos abajo del plan."
      />
      <CardBody>
        <ProgressCurve
          data={curve}
          label="Avance planificado y real por mes"
          height={220}
        />
      </CardBody>
    </Card>
  );
}

function ResumenPropuesta() {
  return (
    <WorkspaceLayout
      sidebar={<SidebarProposal active="resumen" />}
      topbar={<TopbarProposal active="resumen" />}
      header={
        <PageHeader
          title={project.name}
          description={`${project.address} · ${stats.floors} niveles · ${stats.units} unidades`}
          actions={
            <Button>
              <Icon icon={Plus} /> Cargar avance
            </Button>
          }
        />
      }
    >
      <MetricStrip>
        <MetricCard
          label="Avance general"
          icon={TrendingUp}
          value={formatPercent(stats.progress)}
          progress={{ value: stats.progress, tone: "stage" }}
          delta={{
            value: "2,3 p.p.",
            direction: "up",
            good: true,
            label: "esta semana",
          }}
        />
        <MetricCard
          label="Unidades terminadas"
          icon={CheckCircle2}
          value={`${stats.completed} de ${stats.units}`}
          progress={{
            value: (stats.completed / stats.units) * 100,
            tone: "stage",
          }}
        />
        <MetricCard
          label="Tareas certificadas"
          icon={ClipboardCheck}
          value={String(stats.certified)}
          delta={{
            value: String(stats.certifiedThisWeek),
            direction: "up",
            good: true,
            label: "esta semana",
          }}
        />
        <MetricCard
          label="Tareas bloqueadas"
          icon={AlertTriangle}
          value={String(stats.blocked)}
          hint={
            <Link href="#atencion" tone="ink">
              Ver cuáles
            </Link>
          }
        />
      </MetricStrip>
      <div className="grid gap-block lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <CurveCard />
        </div>
        <AttentionCard />
      </div>
      <FloorsProposal />
    </WorkspaceLayout>
  );
}

/* ------------------------------------------------------------------ Historias */

const meta = {
  title: "Pantallas/Obra/Resumen",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;

export const ComoHoy: StoryObj = {
  name: "Como hoy",
  render: () => <ResumenHoy />,
};
export const ComoHoyCargando: StoryObj = {
  name: "Como hoy · cargando",
  render: () => <ResumenHoy state="cargando" />,
};
export const ComoHoyError: StoryObj = {
  name: "Como hoy · error",
  render: () => <ResumenHoy state="error" />,
};
export const Propuesta: StoryObj = {
  name: "Propuesta",
  render: () => <ResumenPropuesta />,
};
