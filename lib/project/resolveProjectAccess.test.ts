import assert from "node:assert/strict"
import test from "node:test"
import { getProjectPermissions } from "./projectPermissions"
import {
  COMPANY_LAYER_PERMISSIONS,
  companyRoleGrantsProjectAccess,
  resolveProjectAccess,
  unionPermissionValue,
} from "./resolveProjectAccess"

test("billing y member de empresa no dan acceso a la obra", () => {
  assert.equal(companyRoleGrantsProjectAccess("billing"), false)
  assert.equal(companyRoleGrantsProjectAccess("member"), false)
  assert.equal(
    resolveProjectAccess({
      projectUserType: null,
      companyRole: "billing",
      clientUnitIds: [],
      loginAudience: "equipo",
    }),
    null,
  )
})

test("owner de empresa no hereda certificar ni editar tareas", () => {
  const access = resolveProjectAccess({
    projectUserType: null,
    companyRole: "owner",
    clientUnitIds: [],
    loginAudience: "equipo",
  })

  assert.ok(access)
  assert.deepEqual(access.sources, ["company"])
  assert.equal(access.companyRole, "owner")
  assert.equal(access.projectUserType, null)
  assert.equal(access.userType, "Admin")
  assert.equal(access.permissions.configureProject, true)
  assert.equal(access.permissions.addUsers, true)
  assert.equal(access.permissions.manageClients, true)
  assert.equal(access.permissions.viewDashboard, true)
  assert.equal(access.permissions.viewDetailedProgress, true)
  assert.equal(access.permissions.loadProgress, false)
  assert.equal(access.permissions.certifyTasks, false)
  assert.equal(access.permissions.editTasks, false)
  assert.notEqual(
    access.permissions.certifyTasks,
    getProjectPermissions("Owner").certifyTasks,
  )
})

test("admin de empresa tiene capa de cuenta, no de campo", () => {
  const access = resolveProjectAccess({
    projectUserType: null,
    companyRole: "admin",
    clientUnitIds: [],
    loginAudience: "equipo",
  })

  assert.ok(access)
  assert.deepEqual(access.permissions, COMPANY_LAYER_PERMISSIONS)
  assert.equal(access.permissions.loadProgress, false)
})

test("owner de obra tiene bypass de permisos completos", () => {
  const access = resolveProjectAccess({
    projectUserType: "Owner",
    companyRole: "owner",
    clientUnitIds: [],
    loginAudience: "equipo",
  })

  assert.ok(access)
  assert.equal(access.projectUserType, "Owner")
  assert.deepEqual(access.sources, ["company", "project"])
  assert.deepEqual(access.permissions, getProjectPermissions("Owner"))
  assert.equal(access.permissions.certifyTasks, true)
  assert.equal(access.permissions.editTasks, true)
  assert.equal(access.permissions.loadProgress, true)
})

test("admin de empresa que se suma como Admin de obra une capas", () => {
  const access = resolveProjectAccess({
    projectUserType: "Admin",
    companyRole: "admin",
    clientUnitIds: [],
    loginAudience: "equipo",
  })

  assert.ok(access)
  assert.deepEqual(access.sources, ["company", "project"])
  assert.equal(access.permissions.loadProgress, true)
  assert.equal(access.permissions.certifyTasks, true)
  assert.equal(access.permissions.editTasks, true)
  assert.equal(access.permissions.configureProject, true)
})

test("ex owner de empresa que sigue como member de obra conserva la capa de obra", () => {
  const access = resolveProjectAccess({
    projectUserType: "Owner",
    companyRole: null,
    clientUnitIds: [],
    loginAudience: "equipo",
  })

  assert.ok(access)
  assert.deepEqual(access.sources, ["project"])
  assert.deepEqual(access.permissions, getProjectPermissions("Owner"))
})

test("unión: admin de empresa + supervisor de obra", () => {
  const access = resolveProjectAccess({
    projectUserType: "Supervisor",
    companyRole: "admin",
    clientUnitIds: [],
    loginAudience: "equipo",
  })

  assert.ok(access)
  assert.deepEqual(access.sources, ["company", "project"])
  assert.equal(access.userType, "Supervisor")
  assert.equal(access.projectUserType, "Supervisor")
  assert.equal(access.permissions.configureProject, true)
  assert.equal(access.permissions.manageClients, true)
  assert.equal(access.permissions.certifyTasks, true)
  assert.equal(access.permissions.editTasks, true)
  assert.equal(access.permissions.loadProgress, true)
})

test("operador de obra sin rol de empresa solo tiene campo", () => {
  const access = resolveProjectAccess({
    projectUserType: "Operador",
    companyRole: null,
    clientUnitIds: [],
    loginAudience: "equipo",
  })

  assert.ok(access)
  assert.deepEqual(access.sources, ["project"])
  assert.deepEqual(access.permissions, getProjectPermissions("Operador"))
  assert.equal(access.permissions.configureProject, false)
  assert.equal(access.permissions.loadProgress, true)
})

test("cliente solo ve su unidad", () => {
  const access = resolveProjectAccess({
    projectUserType: null,
    companyRole: null,
    clientUnitIds: ["unit-1"],
    loginAudience: "cliente",
  })

  assert.ok(access)
  assert.deepEqual(access.sources, ["client"])
  assert.equal(access.userType, "Cliente")
  assert.equal(access.permissions.clientPortal, true)
  assert.deepEqual(access.assignedUnitIds, ["unit-1"])
  assert.equal(access.permissions.viewDashboard, false)
})

test("cliente + admin de empresa une portal y cuenta", () => {
  const access = resolveProjectAccess({
    projectUserType: null,
    companyRole: "admin",
    clientUnitIds: ["unit-1"],
    loginAudience: "equipo",
  })

  assert.ok(access)
  assert.ok(access.sources.includes("company"))
  assert.ok(access.sources.includes("client"))
  assert.equal(access.permissions.clientPortal, true)
  assert.equal(access.permissions.configureProject, true)
  assert.equal(access.assignedUnitIds, null)
})

test("sin fuentes de acceso no hay contexto", () => {
  assert.equal(
    resolveProjectAccess({
      projectUserType: null,
      companyRole: null,
      clientUnitIds: [],
      loginAudience: "equipo",
    }),
    null,
  )
})

test("unión de permisos: true gana a unitOnly", () => {
  assert.equal(unionPermissionValue(true, "unitOnly"), true)
  assert.equal(unionPermissionValue("unitOnly", false), "unitOnly")
  assert.equal(unionPermissionValue(false, false), false)
})
