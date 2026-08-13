"use client"

import { Suspense } from "react"

import { CreateProjectLoadingScreen } from "@/components/projects/new/CreateProjectLoadingScreen"
import { CreateNewProjectView } from "@/components/projects/new/CreateNewProjectView"
import withAuth from "@/hoc/withAuth"

function NewProjectPageContent() {
  return <CreateNewProjectView />
}

function NewProjectPage() {
  return (
    <Suspense fallback={<CreateProjectLoadingScreen />}>
      <NewProjectPageContent />
    </Suspense>
  )
}

export default withAuth(NewProjectPage)
