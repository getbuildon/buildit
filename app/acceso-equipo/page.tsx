"use client"

import { AccessLoginForm } from "@/components/auth/AccessLoginForm"
import { withGuestAuth } from "@/hoc/withGuestAuth"

function AccesoEquipoPage() {
  return <AccessLoginForm audience="equipo" />
}

export default withGuestAuth(AccesoEquipoPage)
