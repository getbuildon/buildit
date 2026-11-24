/* Datos de ejemplo para el catálogo. No se exportan. */

export type UnitRow = {
  id: string
  name: string
  floor: number
  type: string
  area: number
  progress: number
  client?: string
  status: "a-tiempo" | "atrasada" | "terminada"
  updatedAt: Date
}

const types = ["Monoambiente", "2 ambientes", "3 ambientes"]
const clients = ["Lucía Fernández", "Martín Gómez", undefined, "Carla Ruiz", "Juan Pérez", undefined, "Sofía Díaz"]

export const units: UnitRow[] = Array.from({ length: 14 }, (_, index) => {
  const floor = Math.floor(index / 4) + 1
  const letter = "ABCD"[index % 4]
  const progress = [100, 82, 64.5, 45, 38, 12, 0][index % 7]
  return {
    id: `${floor}${letter}`,
    name: `${floor}${letter}`,
    floor,
    type: types[index % 3],
    area: [38.5, 52, 68.25][index % 3],
    progress,
    client: clients[index % clients.length],
    status: progress === 100 ? "terminada" : index % 5 === 3 ? "atrasada" : "a-tiempo",
    updatedAt: new Date(2026, 10, 18 - index),
  }
})
