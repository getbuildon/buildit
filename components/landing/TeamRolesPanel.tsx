import Image from "next/image"

import { LandingReveal } from "@/components/landing/LandingReveal"
import { TEAM_ROLES } from "@/lib/landing/pricingPlans"

export function TeamRolesPanel() {
  return (
    <div className="bg-white px-6 pb-14 pt-10 md:px-10">
      <div className="flex flex-col gap-2">
        <LandingReveal direction="up">
          <h3 className="font-recoleta text-2xl leading-[1.05] text-[#18191b]">
            ¿Quién es quién en tu equipo?
          </h3>
        </LandingReveal>
        <LandingReveal direction="up" delay={0.12}>
          <p className="text-base leading-[1.4] text-[#43484e]">
            Los cupos de cada plan se reparten entre estos tres tipos de usuario.
          </p>
        </LandingReveal>
      </div>

      <div className="flex flex-col gap-6 pt-6">
        {TEAM_ROLES.map((role, index) => (
          <LandingReveal key={role.title} direction="up" delay={0.08 * index}>
          <div>
            <div className="flex items-start gap-2">
              <div className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-[#fff5ef]">
                <Image
                  src={role.iconSrc}
                  alt=""
                  width={20}
                  height={20}
                  aria-hidden
                  className="size-5"
                />
              </div>
              <h4 className="flex min-h-[42px] items-center text-lg font-medium leading-[1.05] text-[#18191b]">
                {role.title}
              </h4>
            </div>
            <p className="pt-2 text-base leading-[1.4] text-[#43484e]">
              {role.description}
            </p>
            <p className="pt-1 text-sm leading-[1.4] text-[#5a6169]">
              {role.examples}
            </p>
          </div>
          </LandingReveal>
        ))}
      </div>
    </div>
  )
}
