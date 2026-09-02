import assert from "node:assert/strict"
import test from "node:test"
import { isProtectedProjectOwnerMember } from "../projects/projectUserTypeDisplay"

test("el dueño de la obra no se edita ni se elimina", () => {
  assert.equal(isProtectedProjectOwnerMember("Owner"), true)
  assert.equal(isProtectedProjectOwnerMember("Admin"), false)
  assert.equal(isProtectedProjectOwnerMember("Supervisor"), false)
})
