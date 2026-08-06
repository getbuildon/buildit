"use client"

import Image from "next/image"

import { useLandingActions } from "@/components/landing/LandingActionsProvider"

export function LandingHeroMobile() {
  const { openContactModal, scrollToPlans } = useLandingActions()

  return (
    <section id="landing-hero" className="relative z-2 overflow-visible">
      <div className="relative">
        <div aria-hidden className="absolute inset-0">
          <Image
            src="/landing/hero/bg.png"
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[rgba(33,34,37,0.8)]" />
        </div>

        <div className="relative z-10 min-h-[474px] px-6 pb-20 pt-10 text-center">
          <h1 className="font-recoleta text-[36px] leading-[1.05] text-white">
            La forma más simple de controlar y comunicar el{" "}
            <span className="text-primary">avance de obra</span>
          </h1>

          <p className="mx-auto max-w-[342px] pt-6 text-lg leading-[1.2] tracking-[0.36px] text-white">
            Gestioná tus proyectos de construcción con total visibilidad.
            Monitoreá avances, coordiná equipos y mantené informados a tus
            clientes desde un solo lugar.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-9">
            <button
              type="button"
              onClick={scrollToPlans}
              className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-6 py-3.5 text-base font-medium leading-[1.4] text-white"
            >
              <Image
                src="/landing/hero/arrow-icon.svg"
                alt=""
                width={16}
                height={16}
                aria-hidden
                className="size-4"
              />
              Ver planes
            </button>

            <button
              type="button"
              onClick={openContactModal}
              className="inline-flex items-center rounded-[10px] border border-[#777b84] px-[25px] py-[15px] text-base font-medium leading-[1.4] text-white"
            >
              Solicitar demo
            </button>
          </div>
        </div>

        <div className="relative z-0 h-[181px] bg-[#f3671f]" />
      </div>

      <div className="pointer-events-none absolute left-1/2 top-[426px] z-20 w-[calc(100%-32px)] max-w-[357px] -translate-x-1/2 px-[10px]">
        <Image
          src="/landing/hero/dashboard.png"
          alt="Panel de BuildOn mostrando el avance de obra de un proyecto"
          width={715}
          height={414}
          priority
          className="h-[207px] w-full object-cover object-top shadow-[0px_15.651px_39.127px_0px_rgba(0,0,0,0.4)]"
          sizes="(max-width: 390px) 92vw, 357px"
        />
      </div>

      <div className="pointer-events-none absolute right-[11%] top-[506px] z-30 h-[140px] w-[133px]">
        <Image
          src="/landing/hero/phone.png"
          alt="Vista mobile de BuildOn"
          width={266}
          height={280}
          className="h-full w-full object-cover object-top shadow-[0px_26.261px_65.653px_0px_rgba(0,0,0,0.15)]"
          sizes="133px"
        />
      </div>
    </section>
  )
}
