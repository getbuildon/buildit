import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Download, Plus } from "lucide-react";
import { formatPercent } from "../foundations/format/format";
import { Button } from "../atoms/button/Button";
import { Link } from "../atoms/link/Link";
import { Progress } from "../atoms/progress/Progress";
import {
  DataTable,
  type DataTableColumn,
} from "../organisms/data-table/DataTable";
import { units, type UnitRow } from "../organisms/fixtures";
import { ListToolbar } from "../organisms/list-toolbar/ListToolbar";
import { PageHeader } from "../organisms/page-header/PageHeader";
import { ProjectSidebar, ProjectTopbar } from "./demo";
import { WorkspaceLayout } from "./workspace/WorkspaceLayout";

/* ------------------------------------------------------------------ Obra · Unidades */

const unitColumns: DataTableColumn<UnitRow>[] = [
  {
    key: "name",
    header: "Unidad",
    sortValue: (row) => row.name,
    cell: (row) => (
      <Link
        href={`#${row.id}`}
        tone="ink"
        className="font-medium no-underline hover:underline"
      >
        {row.name}
      </Link>
    ),
  },
  {
    key: "type",
    header: "Tipología",
    sortValue: (row) => row.type,
    cell: (row) => row.type,
    hideBelow: "md",
  },
  {
    key: "progress",
    header: "Avance",
    sortValue: (row) => row.progress,
    cell: (row) => (
      <div className="flex items-center gap-compact">
        <Progress
          value={row.progress}
          label={`Avance de ${row.name}`}
          size="thin"
          className="w-20"
        />
        <span className="text-meta tabular-nums">
          {formatPercent(row.progress)}
        </span>
      </div>
    ),
  },
  {
    key: "client",
    header: "Cliente",
    sortValue: (row) => row.client,
    cell: (row) =>
      row.client ?? <span className="text-ink-muted">Sin asignar</span>,
    hideBelow: "lg",
  },
];

function ObraUnidades() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const rows = useMemo(
    () =>
      units.filter((row) =>
        `${row.name} ${row.client ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query],
  );
  return (
    <WorkspaceLayout
      sidebar={<ProjectSidebar active="unidades" />}
      topbar={<ProjectTopbar active="unidades" />}
      header={
        <PageHeader
          title="Unidades"
          description="Las 48 unidades de Torre Alamo, con su avance y su cliente."
          actions={
            <>
              <Button variant="outline">
                <Download className="size-icon-sm" aria-hidden /> Exportar
              </Button>
              <Button>
                <Plus className="size-icon-sm" aria-hidden /> Nueva unidad
              </Button>
            </>
          }
        />
      }
      toolbar={
        <ListToolbar
          search={{
            value: query,
            onChange: setQuery,
            placeholder: "Buscar unidad o cliente",
            label: "Buscar unidades",
          }}
          count={`${rows.length} unidades`}
          selection={{
            count: selected.size,
            onClear: () => setSelected(new Set()),
            actions: (
              <Button size="compact" variant="outline">
                Asignar cliente
              </Button>
            ),
          }}
        />
      }
    >
      <DataTable
        caption="Unidades de Torre Alamo"
        columns={unitColumns}
        rows={rows}
        getRowId={(row) => row.id}
        defaultSort={{ key: "name", direction: "asc" }}
        selectedIds={selected}
        onSelectionChange={setSelected}
      />
    </WorkspaceLayout>
  );
}

const meta = {
  title: "Pantallas/Ejemplos",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;

export const ObraUnidadesStory: StoryObj = {
  name: "Obra · Unidades",
  render: () => <ObraUnidades />,
};
