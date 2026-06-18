import { Calendar, ImageUp, MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  CreateProjectFormField,
  createProjectInputClassName,
  createProjectInputStyle,
} from "@/components/projects/new/CreateProjectFormField"
import {
  CREATE_PROJECT_COLORS,
  CREATE_PROJECT_TYPE,
} from "@/lib/projects/createProjectTokens"
import type { CreateProjectDraft } from "@/lib/projects/createProjectDraft"
import { cn } from "@/lib/utils"

type CreateProjectBasicInfoStepProps = {
  draft: CreateProjectDraft
  onChange: (patch: Partial<CreateProjectDraft>) => void
}

export function CreateProjectBasicInfoStep({
  draft,
  onChange,
}: CreateProjectBasicInfoStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <CreateProjectFormField label="Nombre del Proyecto" htmlFor="project-name">
        <Input
          id="project-name"
          name="project-name"
          placeholder="Ej: Edificio Las Palmas"
          value={draft.projectName}
          onChange={(e) => onChange({ projectName: e.target.value })}
          className={createProjectInputClassName}
          style={createProjectInputStyle}
        />
      </CreateProjectFormField>

      <CreateProjectFormField label="Ubicación" htmlFor="project-location">
        <div className="relative">
          <MapPin
            className="pointer-events-none absolute top-[15px] left-3 size-4 text-[#90a1b9]"
            aria-hidden
          />
          <Input
            id="project-location"
            name="project-location"
            placeholder="Dirección completa"
            value={draft.location}
            onChange={(e) => onChange({ location: e.target.value })}
            className={cn(createProjectInputClassName, "pl-10")}
            style={createProjectInputStyle}
          />
        </div>
      </CreateProjectFormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <CreateProjectFormField label="Fecha de Inicio" htmlFor="project-start">
          <div className="relative">
            <Calendar
              className="pointer-events-none absolute top-[15px] left-3 size-4 text-[#90a1b9]"
              aria-hidden
            />
            <Input
              id="project-start"
              name="project-start"
              type="date"
              value={draft.startDate}
              onChange={(e) => onChange({ startDate: e.target.value })}
              className={cn(createProjectInputClassName, "pl-10")}
              style={createProjectInputStyle}
            />
          </div>
        </CreateProjectFormField>

        <CreateProjectFormField
          label="Fecha de Finalización Estimada"
          htmlFor="project-end"
        >
          <div className="relative">
            <Calendar
              className="pointer-events-none absolute top-[15px] left-3 size-4 text-[#90a1b9]"
              aria-hidden
            />
            <Input
              id="project-end"
              name="project-end"
              type="date"
              value={draft.endDate}
              onChange={(e) => onChange({ endDate: e.target.value })}
              className={cn(createProjectInputClassName, "pl-10")}
              style={createProjectInputStyle}
            />
          </div>
        </CreateProjectFormField>
      </div>

      <CreateProjectFormField label="Imagen del Proyecto (Opcional)">
        <div
          className="flex h-[132px] flex-col items-center justify-center gap-1 rounded-[10px] border-2 border-dashed px-6"
          style={{ borderColor: CREATE_PROJECT_COLORS.uploadBorder }}
        >
          <ImageUp className="size-8 text-[#90a1b9]" aria-hidden />
          <p
            className={CREATE_PROJECT_TYPE.uploadPrimary}
            style={{ color: CREATE_PROJECT_COLORS.backLink }}
          >
            Arrastra una imagen o haz click para seleccionar
          </p>
          <p
            className={CREATE_PROJECT_TYPE.uploadSecondary}
            style={{ color: CREATE_PROJECT_COLORS.uploadHint }}
          >
            PNG, JPG hasta 10MB
          </p>
        </div>
      </CreateProjectFormField>
    </div>
  )
}
