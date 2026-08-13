export type SavePerfStepMeta = Record<string, string | number | boolean>

export type SavePerfStep = {
  name: string
  durationMs: number
  meta?: SavePerfStepMeta
}

export type SavePerfReport = {
  label: string
  ok: boolean
  totalMs: number
  steps: SavePerfStep[]
  payload: SavePerfStepMeta
}

export function isConfigSavePerfEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_CONFIG_SAVE_PERF === "1"
  )
}

export function jsonPayloadBytes(value: unknown): number {
  try {
    return new TextEncoder().encode(JSON.stringify(value)).length
  } catch {
    return 0
  }
}

export function createConfigSavePerfTrace(label: string) {
  const steps: SavePerfStep[] = []
  const payload: SavePerfStepMeta = {}
  let lastMark = performance.now()
  const startedAt = lastMark

  return {
    setPayload(meta: SavePerfStepMeta) {
      Object.assign(payload, meta)
    },

    step(name: string, meta?: SavePerfStepMeta) {
      const now = performance.now()
      steps.push({
        name,
        durationMs: Math.round(now - lastMark),
        meta,
      })
      lastMark = now
    },

    finish(ok: boolean): SavePerfReport {
      const report: SavePerfReport = {
        label,
        ok,
        totalMs: Math.round(performance.now() - startedAt),
        steps,
        payload,
      }

      if (isConfigSavePerfEnabled()) {
        logConfigSavePerfReport(report)
      }

      return report
    },
  }
}

function logConfigSavePerfReport(report: SavePerfReport) {
  const prefix = `[Config save perf] ${report.label}`

  console.groupCollapsed(
    `${prefix} — ${report.totalMs}ms ${report.ok ? "✓" : "✗"}`,
  )

  if (Object.keys(report.payload).length > 0) {
    console.log("Payload", report.payload)
  }

  console.table(
    report.steps.map((step) => ({
      step: step.name,
      ms: step.durationMs,
      ...step.meta,
    })),
  )

  const slowest = [...report.steps].sort((a, b) => b.durationMs - a.durationMs)[0]
  if (slowest) {
    console.log(`Paso más lento: ${slowest.name} (${slowest.durationMs}ms)`)
  }

  console.groupEnd()
}

export function summarizeConfigSaveStructure(floors: Array<{ units: unknown[] }>) {
  const floorCount = floors.length
  const unitCount = floors.reduce((sum, floor) => sum + floor.units.length, 0)

  return { floorCount, unitCount }
}

export function summarizeConfigSaveRubros(
  groups: Array<{ rubros: Array<{ tasks: unknown[] }> }>,
) {
  const groupCount = groups.length
  let rubroCount = 0
  let taskCount = 0

  for (const group of groups) {
    rubroCount += group.rubros.length
    for (const rubro of group.rubros) {
      taskCount += rubro.tasks.length
    }
  }

  return { groupCount, rubroCount, taskCount }
}

export function countAssignmentRows(assignments: Record<string, string[]>): number {
  return Object.values(assignments).reduce((sum, taskIds) => sum + taskIds.length, 0)
}

export function summarizePendingUnitAssets(
  units: Array<{
    planImage?: { file?: File } | null
    renderImage?: { file?: File } | null
    planRemoved?: boolean
    renderRemoved?: boolean
  }>,
) {
  let uploadCount = 0
  let clearCount = 0

  for (const unit of units) {
    if (unit.planImage?.file || unit.renderImage?.file) uploadCount += 1
    if (unit.planRemoved) clearCount += 1
    if (unit.renderRemoved) clearCount += 1
  }

  return { uploadCount, clearCount }
}
