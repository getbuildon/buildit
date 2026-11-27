"use client"

import { Ingresar } from "@/components/acceso/Ingresar"
import { withGuestAuth } from "@/hoc/withGuestAuth"

function AccesoEquipoPage() {
  return <Ingresar audience="equipo" />
}

export default withGuestAuth(AccesoEquipoPage)
