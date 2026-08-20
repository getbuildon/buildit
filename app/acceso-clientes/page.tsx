"use client"

import { AccessLoginForm } from "@/components/auth/AccessLoginForm"
import { withGuestAuth } from "@/hoc/withGuestAuth"

function AccesoClientesPage() {
  return <AccessLoginForm audience="cliente" />
}

export default withGuestAuth(AccesoClientesPage)
