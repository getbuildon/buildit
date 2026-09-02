import assert from "node:assert/strict"
import test from "node:test"
import {
  calculateProjectProgressPercent,
  calculateUnitProgressPercent,
  formatProgressPercentLabel,
  progressBarWidthPercent,
  type RubroProgressContext,
} from "./dashboardProgress"

function weightsForRubros(rubroIds: string[]): Map<string, number> {
  const share = 100 / rubroIds.length
  return new Map(rubroIds.map((id) => [id, share]))
}

test("Las PALMAS: 1 certificada de 3 en un rubro de 6 muestra ~6%", () => {
  const rubroIds = ["cerco", "r2", "r3", "r4", "r5", "r6"]
  const taskToRubro = new Map([
    ["t1", "cerco"],
    ["t2", "cerco"],
    ["t3", "cerco"],
    ["t4", "r2"],
    ["t5", "r3"],
    ["t6", "r4"],
  ])
  const ctx: RubroProgressContext = {
    taskToRubro,
    rubroWeights: weightsForRubros(rubroIds),
  }
  const assigned = ["t1", "t2", "t3", "t4", "t5", "t6"]
  const unitId = "unit-1"
  const value = calculateUnitProgressPercent(unitId, assigned, [
    {
      unit_id: unitId,
      task_id: "t1",
      status: "approved",
      progress_state: "completed",
    },
  ], ctx)

  assert.ok(value > 5 && value < 6)
  assert.equal(formatProgressPercentLabel(value), "5.5%")
})

test("obra con avance real menor a 1% no se muestra como 0%", () => {
  const rubroIds = Array.from({ length: 50 }, (_, i) => `r${i}`)
  const taskToRubro = new Map(rubroIds.map((id) => [`task-${id}`, id]))
  const ctx: RubroProgressContext = {
    taskToRubro,
    rubroWeights: weightsForRubros(rubroIds),
  }

  const units = Array.from({ length: 4 }, (_, i) => `u${i}`)
  const floors = Array.from({ length: 11 }, (_, floorIndex) =>
    floorIndex === 0 ? units : [`empty-${floorIndex}-a`, `empty-${floorIndex}-b`],
  )
  const allTaskIds = rubroIds.map((id) => `task-${id}`)
  const byUnit: Record<string, string[]> = {}
  for (const floor of floors) {
    for (const unitId of floor) {
      byUnit[unitId] = allTaskIds
    }
  }

  const project = calculateProjectProgressPercent(
    floors,
    allTaskIds,
    byUnit,
    [
      {
        unit_id: "u0",
        task_id: "task-r0",
        status: "approved",
        progress_state: "completed",
      },
      {
        unit_id: "u0",
        task_id: "task-r1",
        status: "approved",
        progress_state: "completed",
      },
    ],
    ctx,
  )

  assert.ok(project > 0)
  assert.ok(project < 1)
  assert.match(formatProgressPercentLabel(project), /^\d+\.\d%$/)
  assert.notEqual(formatProgressPercentLabel(project), "0%")
  assert.equal(progressBarWidthPercent(project), 1)
})

test("el porcentaje de UI recorta a 1 decimal hacia abajo", () => {
  assert.equal(formatProgressPercentLabel(0), "0%")
  assert.equal(formatProgressPercentLabel(12), "12%")
  assert.equal(formatProgressPercentLabel(0.69), "0.6%")
  assert.equal(formatProgressPercentLabel(0.7), "0.7%")
  assert.equal(formatProgressPercentLabel(0.5555555555555556), "0.5%")
  assert.equal(formatProgressPercentLabel(5.555555555555555), "5.5%")
  assert.equal(formatProgressPercentLabel(-0.5555555555555556), "-0.5%")
  assert.equal(progressBarWidthPercent(0), 0)
})

test("entries sin unidad no suman al progreso de la unidad", () => {
  const ctx: RubroProgressContext = {
    taskToRubro: new Map([["t1", "r1"]]),
    rubroWeights: new Map([["r1", 100]]),
  }
  const value = calculateUnitProgressPercent(
    "unit-1",
    ["t1"],
    [
      {
        unit_id: null,
        task_id: "t1",
        status: "approved",
        progress_state: "completed",
      },
    ],
    ctx,
  )
  assert.equal(value, 0)
  assert.equal(formatProgressPercentLabel(value), "0%")
})
