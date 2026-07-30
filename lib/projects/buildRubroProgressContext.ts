import {
  resolveRubroEffectiveWeights,
  type RubroWeightInput,
} from "@/lib/projects/rubroWeights"
import type { RubroProgressContext } from "@/lib/projects/dashboardProgress"

type TaskRow = {
  id: string
  rubro_id: string
}

type RubroRow = {
  id: string
  weight_percent: number | null
}

export function buildRubroProgressContext(
  rubros: RubroRow[],
  tasks: TaskRow[],
): RubroProgressContext {
  const rubroWeightInputs: RubroWeightInput[] = rubros.map((rubro) => ({
    id: rubro.id,
    weightPercent: rubro.weight_percent,
  }))

  const rubroWeights = resolveRubroEffectiveWeights(rubroWeightInputs)
  const taskToRubro = new Map(tasks.map((task) => [task.id, task.rubro_id]))

  return { taskToRubro, rubroWeights }
}
