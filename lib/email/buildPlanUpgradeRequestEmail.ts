import {
  formatTeamSeatSummarySubtitle,
  getUserTypeLimitDisplayLabel,
  seatBucketForUserType,
} from "@/lib/company/projectSubscriptionLimits"
import type { TeamSeatSummary } from "@/lib/company/subscriptionTypes"
import type { ProjectUserType } from "@/lib/projects/createProjectDraft"

export type PlanUpgradeRequestEmailInput =
  | {
      kind: "userType"
      requesterName: string
      requesterEmail: string
      companyName: string
      projectName: string
      planName: string
      userType: ProjectUserType
      seatSummary: TeamSeatSummary
      comments?: string
    }
  | {
      kind: "surface"
      requesterName: string
      requesterEmail: string
      companyName: string
      projectName: string
      planName: string
      planSurfaceMaxM2: number
      unitsSurfaceM2: number
      comments?: string
    }

export function buildPlanUpgradeRequestEmail(input: PlanUpgradeRequestEmailInput) {
  if (input.kind === "surface") {
    return {
      subject: `[BuildOn] Solicitud de mejora de plan — ${input.projectName}`,
      emailTitle: "Solicitud de mejora de plan",
      heading: "Solicitud de mejora de plan",
      intro:
        "Un usuario del proyecto solicitó ampliar el plan para aumentar la superficie cubierta de la obra.",
      rows: [
        { label: "Solicitante", value: input.requesterName },
        { label: "Correo del solicitante", value: input.requesterEmail },
        { label: "Organización", value: input.companyName },
        { label: "Proyecto", value: input.projectName },
        { label: "Plan actual", value: input.planName },
        {
          label: "Superficie permitida por el plan",
          value: `${new Intl.NumberFormat("es-AR").format(input.planSurfaceMaxM2)} m²`,
        },
        {
          label: "Suma de unidades configuradas",
          value: `${new Intl.NumberFormat("es-AR").format(input.unitsSurfaceM2)} m²`,
        },
        {
          label: "Excedente",
          value: `${new Intl.NumberFormat("es-AR").format(input.unitsSurfaceM2 - input.planSurfaceMaxM2)} m²`,
        },
        { label: "Comentarios", value: input.comments?.trim() || "—" },
      ],
    }
  }

  const userTypeLabel = getUserTypeLimitDisplayLabel(input.userType)
  const bucket = seatBucketForUserType(input.userType)
  const usage =
    bucket === "clients" ? null : input.seatSummary.usage[bucket]
  const limit =
    bucket === "clients" ? null : input.seatSummary.limits[bucket]

  return {
    subject: `[BuildOn] Solicitud de mejora de plan — ${input.projectName}`,
    emailTitle: "Solicitud de mejora de plan",
    heading: "Solicitud de mejora de plan",
    intro:
      "Un usuario del proyecto solicitó ampliar el plan para agregar más miembros al equipo.",
    rows: [
      { label: "Solicitante", value: input.requesterName },
      { label: "Correo del solicitante", value: input.requesterEmail },
      { label: "Organización", value: input.companyName },
      { label: "Proyecto", value: input.projectName },
      { label: "Plan actual", value: input.planName },
      {
        label: "Tipo de usuario solicitado",
        value: userTypeLabel,
      },
      {
        label: "Uso actual del plan",
        value: formatTeamSeatSummarySubtitle(input.seatSummary),
      },
      ...(usage != null && limit != null
        ? [
            {
              label: `Cupos ${userTypeLabel}`,
              value: `${usage}/${limit}`,
            },
          ]
        : []),
      { label: "Comentarios", value: input.comments?.trim() || "—" },
    ],
  }
}
