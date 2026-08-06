import Image from "next/image"

import { TEAM_ROLES } from "@/lib/landing/pricingPlans"

export function TeamRolesPanelDesktop() {
  return (
    <div className="rounded-[24px] border border-[#edeef0] bg-white p-[41px]">
      <h3 className="font-recoleta text-2xl leading-[1.05] text-[#18191b]">
        ¿Quién es quién en tu equipo?
      </h3>
      <p className="pt-2 text-base leading-[1.4] text-[#43484e]">
        Los cupos de cada plan se reparten entre estos tres tipos de usuario.
      </p>

      <div className="grid grid-cols-1 gap-8 pt-8 xl:grid-cols-3">
        {TEAM_ROLES.map((role) => (
          <div key={role.title}>
            <div className="grid size-10 place-items-center rounded-[14px] bg-[#fff5ef]">
              <Image
                src={role.iconSrc}
                alt=""
                width={20}
                height={20}
                aria-hidden
                className="size-5"
              />
            </div>
            <h4 className="pt-4 text-lg font-medium leading-[1.05] text-[#18191b]">
              {role.title}
            </h4>
            <p className="pt-2 text-base leading-[1.4] text-[#43484e]">
              {role.description}
            </p>
            <p className="pt-3 text-sm leading-[1.4] text-[#5a6169]">
              {role.examples}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
