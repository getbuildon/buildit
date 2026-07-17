import {
  getUnitVariantField,
  getUnitVariantFieldLabel,
  isUnitVariantFieldEnabled,
  OFFICE_SIZE_OPTIONS,
  UNIT_ROOM_COUNT_OPTIONS,
  type StructureUnitType,
} from "@/lib/projects/unitTypes"
import { CreateProjectFormField, createProjectSelectClassName } from "@/components/projects/new/CreateProjectFormField"
import { createProjectCompactInputStyle } from "@/components/projects/new/CreateProjectFormField"

type UnitVariantFieldProps = {
  unitId: string
  type: StructureUnitType
  roomCount: string
  officeSize: string
  onChange: (patch: { roomCount?: string; officeSize?: string }) => void
}

export function UnitVariantField({
  unitId,
  type,
  roomCount,
  officeSize,
  onChange,
}: UnitVariantFieldProps) {
  const enabled = isUnitVariantFieldEnabled(type)
  const label = getUnitVariantFieldLabel(type)
  const field = getUnitVariantField(type)
  const value = field === "officeSize" ? officeSize : roomCount

  return (
    <CreateProjectFormField label={label} htmlFor={`unit-variant-${unitId}`}>
      <select
        id={`unit-variant-${unitId}`}
        value={value}
        disabled={!enabled}
        onChange={(e) => {
          if (field === "officeSize") {
            onChange({ officeSize: e.target.value })
            return
          }
          onChange({ roomCount: e.target.value })
        }}
        className={createProjectSelectClassName}
        style={{
          ...createProjectCompactInputStyle,
          opacity: enabled ? 1 : 0.5,
          cursor: enabled ? "pointer" : "not-allowed",
        }}
      >
        <option value="">—</option>
        {field === "officeSize"
          ? OFFICE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))
          : UNIT_ROOM_COUNT_OPTIONS.map((count) => (
              <option key={count} value={String(count)}>
                {count}
              </option>
            ))}
      </select>
    </CreateProjectFormField>
  )
}
