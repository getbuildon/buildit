"use client"

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react"

import { ContactTeamModal } from "@/components/landing/ContactTeamModal"
import { scrollToLandingSection } from "@/lib/landing/scrollToLandingSection"

type LandingActionsContextValue = {
  openContactModal: () => void
  scrollToPlans: () => void
}

const LandingActionsContext = createContext<LandingActionsContextValue | null>(
  null,
)

export function LandingActionsProvider({ children }: { children: ReactNode }) {
  const [contactOpen, setContactOpen] = useState(false)

  const openContactModal = useCallback(() => {
    setContactOpen(true)
  }, [])

  const scrollToPlans = useCallback(() => {
    scrollToLandingSection("planes")
  }, [])

  return (
    <LandingActionsContext.Provider
      value={{ openContactModal, scrollToPlans }}
    >
      {children}
      <ContactTeamModal open={contactOpen} onOpenChange={setContactOpen} />
    </LandingActionsContext.Provider>
  )
}

export function useLandingActions() {
  const context = useContext(LandingActionsContext)

  if (!context) {
    throw new Error(
      "useLandingActions must be used within LandingActionsProvider",
    )
  }

  return context
}
