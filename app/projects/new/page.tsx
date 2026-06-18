"use client"

import { CreateNewProjectView } from "@/components/projects/new/CreateNewProjectView"
import withAuth from "@/hoc/withAuth"

function NewProjectPage() {
  return <CreateNewProjectView />
}

export default withAuth(NewProjectPage)
