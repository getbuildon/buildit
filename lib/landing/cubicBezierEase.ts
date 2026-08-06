const NEWTON_ITERATIONS = 8

function calcBezier(t: number, a1: number, a2: number) {
  return (
    (((1 - 3 * a2 + 3 * a1) * t + (3 * a2 - 6 * a1)) * t + 3 * a1) * t
  )
}

function getSlope(t: number, a1: number, a2: number) {
  return (
    3 * (1 - 3 * a2 + 3 * a1) * t * t + 2 * (3 * a2 - 6 * a1) * t + 3 * a1
  )
}

function getTForX(x: number, x1: number, x2: number) {
  let guess = x

  for (let index = 0; index < NEWTON_ITERATIONS; index += 1) {
    const slope = getSlope(guess, x1, x2)
    if (slope === 0) return guess

    const delta = calcBezier(guess, x1, x2) - x
    guess -= delta / slope
  }

  return guess
}

export function createCubicBezierEase(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  if (x1 === y1 && x2 === y2) {
    return (progress: number) => progress
  }

  return (progress: number) => {
    if (progress === 0 || progress === 1) return progress

    return calcBezier(getTForX(progress, x1, x2), y1, y2)
  }
}
