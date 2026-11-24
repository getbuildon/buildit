import { useMemo, useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Building2, Copy, Ellipsis, Pencil, Plus, Trash2, UserPlus } from "lucide-react"
import { DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { formatArea, formatDate, formatPercent } from "../../foundations/format/format"
import { Badge } from "../../atoms/badge/Badge"
import { Button } from "../../atoms/button/Button"
import { IconButton } from "../../atoms/button/IconButton"
import { Link } from "../../atoms/link/Link"
import { Progress } from "../../atoms/progress/Progress"
import { EmptyState } from "../../molecules/empty-state/EmptyState"
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "../../molecules/menu/Menu"
import { Segmented } from "../../molecules/segmented/Segmented"
import { ListToolbar } from "../list-toolbar/ListToolbar"
import { units, type UnitRow } from "../fixtures"
import { DataTable, type DataTableColumn } from "./DataTable"

const statusBadge = {
  "a-tiempo": { label: "A tiempo", tone: "ok" },
  atrasada: { label: "Atrasada", tone: "caution" },
  terminada: { label: "Terminada", tone: "neutral" },
} as const

const columns: DataTableColumn<UnitRow>[] = [
  {
    key: "name",
    header: "Unidad",
    sortValue: (row) => row.name,
    cell: (row) => (
      <Link href={`#unidad-${row.id}`} tone="ink" className="font-medium no-underline hover:underline">
        {row.name}
      </Link>
    ),
    width: "6rem",
  },
  { key: "type", header: "Tipología", sortValue: (row) => row.type, cell: (row) => row.type, hideBelow: "md" },
  { key: "area", header: "Superficie", align: "end", sortValue: (row) => row.area, cell: (row) => formatArea(row.area), hideBelow: "sm" },
  {
    key: "progress",
    header: "Avance",
    sortValue: (row) => row.progress,
    width: "12rem",
    cell: (row) => (
      <div className="flex items-center gap-compact">
        <Progress value={row.progress} label={`Avance de la unidad ${row.name}`} size="thin" className="w-20" />
        <span className="text-meta tabular-nums">{formatPercent(row.progress)}</span>
      </div>
    ),
  },
  {
    key: "status",
    header: "Estado",
    sortValue: (row) => row.status,
    cell: (row) => (
      <Badge tone={statusBadge[row.status].tone} size="compact">
        {statusBadge[row.status].label}
      </Badge>
    ),
  },
  {
    key: "client",
    header: "Cliente",
    sortValue: (row) => row.client,
    hideBelow: "lg",
    cell: (row) => row.client ?? <span className="text-ink-muted">Sin asignar</span>,
  },
  { key: "updated", header: "Actualizada", sortValue: (row) => row.updatedAt, hideBelow: "lg", cell: (row) => formatDate(row.updatedAt, "table") },
]

function RowMenu({ row }: { row: UnitRow }) {
  return (
    <Menu>
      <MenuTrigger asChild>
        <IconButton icon={Ellipsis} label={`Opciones de la unidad ${row.name}`} size="compact" tooltip={false} />
      </MenuTrigger>
      <MenuContent>
        <MenuItem icon={Pencil}>Editar</MenuItem>
        <MenuItem icon={Copy}>Duplicar</MenuItem>
        <MenuItem icon={UserPlus}>Asignar cliente</MenuItem>
        <MenuSeparator />
        <MenuItem icon={Trash2} tone="danger">
          Borrar
        </MenuItem>
      </MenuContent>
    </Menu>
  )
}

function UnitsScreen({ loading = false, emptyData = false }: { loading?: boolean; emptyData?: boolean }) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("todas")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const rows = useMemo(
    () =>
      (emptyData ? [] : units).filter(
        (row) =>
          (status === "todas" || row.status === status) &&
          (query === "" || `${row.name} ${row.client ?? ""}`.toLowerCase().includes(query.toLowerCase())),
      ),
    [emptyData, query, status],
  )
  return (
    <div className="flex flex-col gap-group">
      <ListToolbar
        search={{ value: query, onChange: setQuery, placeholder: "Buscar unidad o cliente", label: "Buscar unidades" }}
        filters={
          <Segmented
            label="Estado de las unidades"
            size="compact"
            value={status}
            onValueChange={setStatus}
            options={[
              { value: "todas", label: "Todas" },
              { value: "a-tiempo", label: "A tiempo" },
              { value: "atrasada", label: "Atrasadas" },
            ]}
          />
        }
        count={`${rows.length} ${rows.length === 1 ? "unidad" : "unidades"}`}
        actions={
          <Button size="compact">
            <Plus className="size-icon-sm" aria-hidden /> Nueva unidad
          </Button>
        }
        selection={{
          count: selected.size,
          onClear: () => setSelected(new Set()),
          actions: (
            <>
              <Button size="compact" variant="outline">
                Asignar cliente
              </Button>
              <Button size="compact" variant="danger-quiet">
                Borrar
              </Button>
            </>
          ),
        }}
      />
      <DataTable
        caption="Unidades de la obra Torre Alamo"
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        defaultSort={{ key: "name", direction: "asc" }}
        selectedIds={selected}
        onSelectionChange={setSelected}
        rowActions={(row) => <RowMenu row={row} />}
        loading={loading}
        empty={
          emptyData ? (
            <EmptyState
              icon={Building2}
              title="Todavía no hay unidades"
              description="Cargá las unidades de la obra para seguir el avance de cada una."
              action={<Button>Cargar unidades</Button>}
            />
          ) : (
            <EmptyState
              size="compact"
              title="Sin resultados"
              description={`No hay unidades que coincidan con «${query}».`}
              action={
                <Button variant="outline" size="compact" onClick={() => setQuery("")}>
                  Limpiar búsqueda
                </Button>
              }
            />
          )
        }
      />
    </div>
  )
}

const rules = [
  { title: "Una tabla de verdad", body: "<table> con encabezados: el lector de pantalla dice «Avance, 45%» al recorrer. Hoy la app tiene una sola; el resto son divs." },
  { title: "Ordenar como se piensa", body: "1A, 2A, 10A en orden natural y con tildes en español. La columna ordenada se anuncia." },
  { title: "Lo importante, siempre", body: "En el celular se esconden las columnas secundarias (hideBelow); la unidad, el avance y el estado quedan." },
  { title: "El nombre es el link", body: "La fila no es clickeable entera: el link es el nombre de la unidad y las acciones van en su menú." },
  { title: "Selección con barra propia", body: "Al elegir filas, la barra de arriba muestra las acciones para esas filas." },
] as const

function DataTableDoc() {
  return (
    <FoundationDoc kicker="Organismos" title="DataTable" lede="Unidades de una obra: buscar, filtrar, ordenar, elegir y actuar. Probá elegir filas y ordenar por Avance.">
      <UnitsScreen />
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Organismos/DataTable" } satisfies Meta

export default meta

export const Unidades: StoryObj = { render: () => <DataTableDoc /> }
export const Cargando: StoryObj = {
  render: () => (
    <FoundationDoc kicker="Organismos" title="DataTable · Cargando" lede="Mientras llegan los datos: filas en forma de skeleton y aria-busy.">
      <UnitsScreen loading />
    </FoundationDoc>
  ),
}
export const Vacia: StoryObj = {
  name: "Vacía",
  render: () => (
    <FoundationDoc kicker="Organismos" title="DataTable · Vacía" lede="Sin filas todavía: dice qué falta y cómo resolverlo.">
      <UnitsScreen emptyData />
    </FoundationDoc>
  ),
}
