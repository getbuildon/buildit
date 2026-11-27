"use client"

import { Check, Info, X } from "lucide-react"

import { Icon } from "@/library/atoms/icon/Icon"
import { Tooltip } from "@/library/atoms/tooltip/Tooltip"
import { cn } from "@/library/lib/cn"

import {
  getProjectPermissionColumnIndex,
  PROJECT_PERMISSION_DISPLAY_COLUMNS,
  PROJECT_PERMISSION_TABLE,
  PROJECT_ROLE_PERMISSION_TOOLTIPS,
  type ProjectPermissionValue,
} from "@/lib/project/projectPermissions"

/** Un casillero de la tabla: ✓ o ✕, con la palabra para el lector de pantalla. */
function Casillero({ valor }: { valor: ProjectPermissionValue }) {
  if (valor === false) {
    return (
      <span className="text-fn-danger">
        <Icon icon={X} size="sm" />
        <span className="sr-only">No</span>
      </span>
    )
  }
  return (
    <span className="inline-flex flex-col items-center text-fn-ok">
      <Icon icon={Check} size="sm" />
      <span className="sr-only">Sí</span>
      {valor === "unitOnly" ? <span className="text-micro font-regular text-ink-muted">Su unidad</span> : null}
    </span>
  )
}

/** Qué puede hacer cada tipo de usuario. El ícono de info de cada columna explica el tipo y sus roles. */
export function TablaDePermisos() {
  return (
    <div role="region" aria-label="Tabla de permisos" tabIndex={0} className="focus-ring overflow-x-auto rounded-control">
      <table className="w-full min-w-160 border-collapse text-body">
        <caption className="sr-only">Qué puede hacer cada tipo de usuario</caption>
        <thead>
          <tr className="border-b-2 border-line">
            <th scope="col" className="h-10 w-40 px-group text-left text-meta font-regular text-ink-muted">
              Pantalla / Acción
            </th>
            {PROJECT_PERMISSION_DISPLAY_COLUMNS.map((columna) => {
              const ayuda = PROJECT_ROLE_PERMISSION_TOOLTIPS[columna]
              return (
                <th key={columna} scope="col" className="h-10 px-compact text-center text-label">
                  <span className="inline-flex items-center gap-1.5">
                    {columna}
                    <Tooltip
                      content={
                        <span className="flex flex-col gap-related text-center">
                          <span>{ayuda.description}</span>
                          <span className="opacity-75">{ayuda.roles}</span>
                        </span>
                      }
                    >
                      <button
                        type="button"
                        aria-label={`Qué hace un ${columna}`}
                        className="focus-ring grid size-6 cursor-help place-items-center rounded-pill text-ink-muted"
                      >
                        <Icon icon={Info} size="xs" />
                      </button>
                    </Tooltip>
                  </span>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {PROJECT_PERMISSION_TABLE.map((fila, indice) => (
            <tr key={fila.action} className={cn("border-b border-line last:border-b-0", indice % 2 === 1 && "bg-canvas-sunken")}>
              <th scope="row" className="h-11 px-group text-left font-regular">
                {fila.action}
              </th>
              {PROJECT_PERMISSION_DISPLAY_COLUMNS.map((columna) => (
                <td key={columna} className="text-center">
                  <Casillero valor={fila.values[getProjectPermissionColumnIndex(columna)] ?? false} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
