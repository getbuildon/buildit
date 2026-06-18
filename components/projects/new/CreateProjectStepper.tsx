import React from "react"
import { cn } from "@/lib/utils"
import {
  CREATE_PROJECT_COLORS,
  CREATE_PROJECT_TYPE,
} from "@/lib/projects/createProjectTokens"
import type { CreateProjectStepConfig } from "@/lib/projects/createProjectSteps"

export type CreateProjectStep = CreateProjectStepConfig

type CreateProjectStepperProps = {
  steps: CreateProjectStep[]
  activeStepId: string
}

// SVG icons extracted from Figma node 1127:2891 — 20x20 viewport
function StepIconBasic({ active }: { active: boolean }) {
  const s = active ? "white" : "#afb3ba"
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M5 18.3334V3.33341C5 2.89139 5.17559 2.46746 5.48816 2.1549C5.80072 1.84234 6.22464 1.66675 6.66667 1.66675H13.3333C13.7754 1.66675 14.1993 1.84234 14.5118 2.1549C14.8244 2.46746 15 2.89139 15 3.33341V18.3334H5Z" stroke={s} strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5.00008 10H3.33341C2.89139 10 2.46746 10.1756 2.1549 10.4882C1.84234 10.8007 1.66675 11.2246 1.66675 11.6667V16.6667C1.66675 17.1087 1.84234 17.5326 2.1549 17.8452C2.46746 18.1577 2.89139 18.3333 3.33341 18.3333H5.00008" stroke={s} strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 7.5H16.6667C17.1087 7.5 17.5326 7.6756 17.8452 7.98816C18.1577 8.30072 18.3333 8.72464 18.3333 9.16667V16.6667C18.3333 17.1087 18.1577 17.5326 17.8452 17.8452C17.5326 18.1577 17.1087 18.3333 16.6667 18.3333H15" stroke={s} strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8.33325 5H11.6666" stroke={s} strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8.33325 8.33325H11.6666" stroke={s} strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8.33325 11.6667H11.6666" stroke={s} strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8.33325 15H11.6666" stroke={s} strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function StepIconStructure({ active }: { active: boolean }) {
  const s = active ? "white" : "#afb3ba"
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M10.6916 1.81656C10.4744 1.71751 10.2385 1.66626 9.99989 1.66626C9.76123 1.66626 9.52536 1.71751 9.30822 1.81656L2.16656 5.06656C2.01868 5.13176 1.89295 5.23856 1.80469 5.37394C1.71643 5.50932 1.66943 5.66744 1.66943 5.82906C1.66943 5.99067 1.71643 6.1488 1.80469 6.28418C1.89295 6.41956 2.01868 6.52635 2.16656 6.59156L9.31656 9.84989C9.53369 9.94893 9.76956 10.0002 10.0082 10.0002C10.2469 10.0002 10.4828 9.94893 10.6999 9.84989L17.8499 6.59989C17.9978 6.53469 18.1235 6.42789 18.2118 6.29251C18.3 6.15713 18.347 5.999 18.347 5.83739C18.347 5.67578 18.3 5.51765 18.2118 5.38227C18.1235 5.24689 17.9978 5.14009 17.8499 5.07489L10.6916 1.81656Z" stroke={s} strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M1.66675 10C1.66636 10.1594 1.71168 10.3155 1.79735 10.45C1.88302 10.5844 2.00543 10.6914 2.15008 10.7583L9.31675 14.0167C9.53275 14.1145 9.76714 14.1651 10.0043 14.1651C10.2414 14.1651 10.4757 14.1145 10.6918 14.0167L17.8418 10.7667C17.9893 10.7004 18.1143 10.5926 18.2016 10.4564C18.2889 10.3203 18.3347 10.1617 18.3334 10" stroke={s} strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M1.66675 14.1667C1.66636 14.3261 1.71168 14.4823 1.79735 14.6167C1.88302 14.7511 2.00543 14.8581 2.15008 14.9251L9.31675 18.1834C9.53275 18.2812 9.76714 18.3318 10.0043 18.3318C10.2414 18.3318 10.4757 18.2812 10.6918 18.1834L17.8418 14.9334C17.9893 14.8671 18.1143 14.7593 18.2016 14.6232C18.2889 14.4871 18.3347 14.3285 18.3334 14.1667" stroke={s} strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function StepIconTasks({ active }: { active: boolean }) {
  const s = active ? "white" : "#afb3ba"
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M12.2499 5.24994C12.0972 5.40572 12.0117 5.61515 12.0117 5.83328C12.0117 6.0514 12.0972 6.26083 12.2499 6.41661L13.5832 7.74994C13.739 7.90263 13.9484 7.98816 14.1665 7.98816C14.3847 7.98816 14.5941 7.90263 14.7499 7.74994L17.8915 4.60828C18.3106 5.53427 18.4374 6.56597 18.2553 7.5659C18.0731 8.56582 17.5905 9.48648 16.8718 10.2052C16.1531 10.9239 15.2324 11.4065 14.2325 11.5887C13.2326 11.7708 12.2009 11.644 11.2749 11.2249L5.51655 16.9833C5.18503 17.3148 4.73539 17.501 4.26655 17.501C3.79771 17.501 3.34807 17.3148 3.01655 16.9833C2.68503 16.6518 2.49878 16.2021 2.49878 15.7333C2.49878 15.2644 2.68503 14.8148 3.01655 14.4833L8.77488 8.72494C8.35585 7.79895 8.22898 6.76725 8.41116 5.76732C8.59335 4.7674 9.07595 3.84674 9.79465 3.12804C10.5133 2.40935 11.434 1.92675 12.4339 1.74456C13.4339 1.56237 14.4656 1.68925 15.3915 2.10828L12.2582 5.24161L12.2499 5.24994Z" stroke={s} strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function StepIconTeam({ active }: { active: boolean }) {
  const s = active ? "white" : "#afb3ba"
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M13.3334 17.5V15.8333C13.3334 14.9493 12.9822 14.1014 12.3571 13.4763C11.732 12.8512 10.8841 12.5 10.0001 12.5H5.00008C4.11603 12.5 3.26818 12.8512 2.64306 13.4763C2.01794 14.1014 1.66675 14.9493 1.66675 15.8333V17.5" stroke={s} strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.50008 9.16667C9.34103 9.16667 10.8334 7.67428 10.8334 5.83333C10.8334 3.99238 9.34103 2.5 7.50008 2.5C5.65913 2.5 4.16675 3.99238 4.16675 5.83333C4.16675 7.67428 5.65913 9.16667 7.50008 9.16667Z" stroke={s} strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18.3333 17.5001V15.8334C18.3327 15.0948 18.0869 14.3774 17.6344 13.7937C17.1819 13.2099 16.5484 12.793 15.8333 12.6084" stroke={s} strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.3333 2.6084C14.0503 2.79198 14.6858 3.20898 15.1396 3.79366C15.5935 4.37833 15.8398 5.09742 15.8398 5.83757C15.8398 6.57771 15.5935 7.2968 15.1396 7.88147C14.6858 8.46615 14.0503 8.88315 13.3333 9.06673" stroke={s} strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const STEP_ICONS: Record<string, (props: { active: boolean }) => React.ReactElement> = {
  basic: StepIconBasic,
  structure: StepIconStructure,
  tasks: StepIconTasks,
  team: StepIconTeam,
}

export function CreateProjectStepper({
  steps,
  activeStepId,
}: CreateProjectStepperProps) {
  const activeIndex = steps.findIndex((s) => s.id === activeStepId)

  return (
    <nav
      className="flex w-full items-start"
      aria-label="Pasos para crear obra"
    >
      {steps.map((step, index) => {
        const isActive = index === activeIndex
        const isPast = index < activeIndex
        const isHighlighted = isActive || isPast
        const StepIcon = STEP_ICONS[step.id] ?? StepIconBasic
        const showConnector = index < steps.length - 1

        return (
          <React.Fragment key={step.id}>
            {/* Step: fixed 90px, circle centered horizontally */}
            <div
              className="flex shrink-0 flex-col items-center"
              style={{ width: "90px", gap: "8px" }}
            >
              {/* Circle: 40×40, full border-radius */}
              <div
                className="flex items-center justify-center"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "9999px",
                  backgroundColor: isHighlighted
                    ? CREATE_PROJECT_COLORS.primary
                    : CREATE_PROJECT_COLORS.stepInactiveBg,
                  flexShrink: 0,
                  boxShadow: isHighlighted ? "0 0 20px rgba(243, 103, 31, 0.30)" : "none",
                }}
                aria-current={isActive ? "step" : undefined}
              >
                <StepIcon active={isHighlighted} />
              </div>

              {/* Label */}
              <p
                className={cn(CREATE_PROJECT_TYPE.stepLabel, "w-full text-center leading-[16px]")}
                style={{
                  color: isHighlighted
                    ? CREATE_PROJECT_COLORS.stepActiveLabel
                    : CREATE_PROJECT_COLORS.stepInactiveLabel,
                }}
              >
                {step.label}
              </p>
            </div>

            {/* Connector: flex-1, line at mt-[20px] = circle center */}
            {showConnector ? (
              <div
                className="min-w-0 flex-1"
                style={{ marginTop: "20px" }}
                aria-hidden
              >
                <div
                  style={{
                    height: "2px",
                    width: "100%",
                    backgroundColor: isPast
                      ? CREATE_PROJECT_COLORS.primary
                      : CREATE_PROJECT_COLORS.stepConnector,
                  }}
                />
              </div>
            ) : null}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
