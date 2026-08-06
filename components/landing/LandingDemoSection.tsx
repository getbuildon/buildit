"use client"

import Image from "next/image"

import { useLandingActions } from "@/components/landing/LandingActionsProvider"
import { LandingDemoDesktop } from "@/components/landing/LandingDemoDesktop"

function LandingDemoMobile() {
  const { openContactModal } = useLandingActions()

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10">
      <div className="overflow-hidden rounded-[4px] bg-[#212225] shadow-[0px_48px_120px_0px_rgba(0,0,0,0.2)]">
        <div className="flex flex-col gap-8 px-6 pb-8 pt-6">
          <div>
            <h2 className="font-recoleta text-[36px] leading-[1.05] text-white">
              ¿Necesitás ayuda para{" "}
              <span className="text-primary">elegir un plan</span>?
            </h2>
            <p className="pt-5 text-lg leading-[1.2] tracking-[0.36px] text-[#afb3ba]">
              Si no sabés qué plan se adapta mejor a tu proyecto, o si BuildOn
              es para vos, podemos hacerte una demostración y ayudarte a
              encontrar la mejor forma de implementarlo en tu operación.
            </p>
          </div>

          <button
            type="button"
            onClick={openContactModal}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-primary px-4 py-3.5 text-sm font-medium leading-[1.4] text-white"
          >
            <Image
              src="/landing/hero/arrow-icon.svg"
              alt=""
              width={16}
              height={16}
              aria-hidden
              className="size-4"
            />
            Contactar al equipo
          </button>
        </div>

        <div className="relative h-[200px] w-full">
          <Image
            src="/landing/demo/cta-image.png"
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
        </div>
      </div>
    </div>
  )
}

export function LandingDemoSection() {
  return (
    <section id="demo" className="bg-primary">
      <div className="lg:hidden">
        <LandingDemoMobile />
      </div>

      <div className="hidden lg:block">
        <LandingDemoDesktop />
      </div>
    </section>
  )
}
