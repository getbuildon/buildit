import { spawn, spawnSync } from "node:child_process"
import { networkInterfaces } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const nextBin = path.join(projectRoot, "node_modules", ".bin", "next")
const scriptPath = fileURLToPath(import.meta.url)

function getLanIp() {
  for (const iface of Object.values(networkInterfaces())) {
    if (!iface) continue
    for (const cfg of iface) {
      if (cfg.family === "IPv4" && !cfg.internal) {
        return cfg.address
      }
    }
  }
  return null
}

function mergeNodeOptions() {
  const extra = ["--disable-warning=DEP0205"]
  const current = process.env.NODE_OPTIONS?.trim()
  if (!current) return extra.join(" ")
  const parts = current.split(/\s+/).filter(Boolean)
  for (const flag of extra) {
    if (!parts.includes(flag)) parts.push(flag)
  }
  return parts.join(" ")
}

function resolvePreferredNode() {
  const nvmResult = spawnSync(
    "bash",
    [
      "-lc",
      'export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"; . "$NVM_DIR/nvm.sh" 2>/dev/null; nvm which 20 2>/dev/null',
    ],
    { encoding: "utf8" },
  )
  const nvmNode = nvmResult.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .at(-1)
  if (nvmNode?.startsWith("/")) return nvmNode
  return process.execPath
}

const nodeMajor = Number(process.version.slice(1).split(".")[0])
const preferredNode = resolvePreferredNode()

if (nodeMajor >= 25 && preferredNode !== process.execPath) {
  const rerun = spawnSync(preferredNode, [scriptPath], {
    cwd: projectRoot,
    stdio: "inherit",
    env: process.env,
  })
  process.exit(rerun.status ?? 1)
}

const ip = getLanIp()

console.log("")
if (nodeMajor >= 25) {
  console.log(`  ⚠️  Node ${process.version} — instalá Node 20: nvm install 20 && nvm use`)
  console.log("")
}
console.log("  Celular (misma WiFi) — usá esta URL:")
if (ip) {
  console.log(`  → http://${ip}:3000`)
} else {
  console.log("  → No se detectó IP. Probá: ipconfig getifaddr en0")
}
console.log("")
console.log("  NO abras http://0.0.0.0:3000 (en el celular queda en blanco)")
console.log("")

const child = spawn(
  preferredNode,
  [nextBin, "dev", "--webpack", "-H", "0.0.0.0", "-p", "3000"],
  {
    cwd: projectRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_OPTIONS: mergeNodeOptions(),
    },
  },
)

child.on("exit", (code) => process.exit(code ?? 0))
