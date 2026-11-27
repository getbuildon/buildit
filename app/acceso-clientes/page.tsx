"use client"

import { Ingresar } from "@/components/acceso/Ingresar"
import { withGuestAuth } from "@/hoc/withGuestAuth"

function AccesoClientesPage() {
  return <Ingresar audience="cliente" />
}

export default withGuestAuth(AccesoClientesPage)
