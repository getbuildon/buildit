import assert from "node:assert/strict"
import test from "node:test"
import {
  finalizeTotalSurfaceInput,
  formatTotalSurfaceFromNumber,
  hasTotalSurfaceValue,
  normalizeTotalSurfaceInput,
  parseSurfaceNumber,
} from "./totalSurfaceInput"

test("normaliza enteros con separador de miles", () => {
  assert.equal(normalizeTotalSurfaceInput("2000"), "2.000")
  assert.equal(normalizeTotalSurfaceInput("2.000"), "2.000")
  assert.equal(normalizeTotalSurfaceInput("45"), "45")
})

test("acepta hasta 2 decimales con coma o punto", () => {
  assert.equal(normalizeTotalSurfaceInput("45,5"), "45,5")
  assert.equal(normalizeTotalSurfaceInput("45,50"), "45,50")
  assert.equal(normalizeTotalSurfaceInput("45.5"), "45,5")
  assert.equal(normalizeTotalSurfaceInput("45.50"), "45,50")
  assert.equal(normalizeTotalSurfaceInput("45,555"), "45,55")
  assert.equal(normalizeTotalSurfaceInput("2.000,5"), "2.000,5")
  assert.equal(normalizeTotalSurfaceInput("2.000,50"), "2.000,50")
  assert.equal(normalizeTotalSurfaceInput("2.000,"), "2.000,")
  assert.equal(normalizeTotalSurfaceInput("45."), "45,")
})

test("seguir tipeando un entero formateado no lo convierte en decimal", () => {
  assert.equal(normalizeTotalSurfaceInput("2.0005"), "20.005")
})

test("cierra el formato al salir del campo", () => {
  assert.equal(finalizeTotalSurfaceInput("45,"), "45")
  assert.equal(finalizeTotalSurfaceInput("2.000,50"), "2.000,50")
  assert.equal(finalizeTotalSurfaceInput(""), "")
})

test("parsea el valor numérico correcto", () => {
  assert.equal(parseSurfaceNumber("2.000"), 2000)
  assert.equal(parseSurfaceNumber("45,5"), 45.5)
  assert.equal(parseSurfaceNumber("2.000,50"), 2000.5)
  assert.equal(parseSurfaceNumber("0,5"), 0.5)
  assert.equal(parseSurfaceNumber(""), null)
})

test("formatea desde número sin forzar decimales", () => {
  assert.equal(formatTotalSurfaceFromNumber(2000), "2.000")
  assert.equal(formatTotalSurfaceFromNumber(45.5), "45,5")
  assert.equal(formatTotalSurfaceFromNumber(2000.5), "2.000,5")
  assert.equal(formatTotalSurfaceFromNumber(45.55), "45,55")
})

test("exige un valor mayor a 0", () => {
  assert.equal(hasTotalSurfaceValue("0"), false)
  assert.equal(hasTotalSurfaceValue("0,00"), false)
  assert.equal(hasTotalSurfaceValue("0,5"), true)
  assert.equal(hasTotalSurfaceValue("45"), true)
})
