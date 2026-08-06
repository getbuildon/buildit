"use client"

import Image from "next/image"

import { useLandingActions } from "@/components/landing/LandingActionsProvider"

export function LandingHeroDesktop() {
  const { openContactModal, scrollToPlans } = useLandingActions()

  return (
    <section id="inicio" className="relative z-2 overflow-visible">
      <div className="relative min-h-[1394px]">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-[752px] overflow-hidden"
        >
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

        <div className="relative z-10 mx-auto flex h-[752px] max-w-[1440px] flex-col items-center px-6 pb-12 pt-32 text-center lg:px-20 xl:px-[300px]">
          <h1 className="max-w-[840px] font-recoleta text-[64px] leading-[1.05] text-white">
            La forma más simple de controlar y comunicar el{" "}
            <span className="text-primary">avance de obra</span>
          </h1>

          <p className="max-w-[576px] pt-6 text-xl leading-[1.4] text-white">
            Gestioná tus proyectos de construcción con total visibilidad.
            Monitoreá avances, coordiná equipos y mantené informados a tus
            clientes desde un solo lugar.
          </p>

          <div className="flex items-center justify-center gap-3 pt-9">
            <button
              type="button"
              onClick={scrollToPlans}
              className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-6 py-3.5 text-base font-medium leading-[1.4] text-white transition-colors hover:bg-[#e5662e]"
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
              className="inline-flex items-center rounded-[10px] border border-[#777b84] px-[25px] py-[15px] text-base font-medium leading-[1.4] text-white transition-colors hover:border-white/80 hover:bg-white/5"
            >
              Solicitar demo
            </button>
          </div>
        </div>

        <div className="relative z-0 h-[642px] bg-[#f3671f]" />

        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-full max-w-[1440px]">
          <div className="absolute left-1/2 top-[606px] z-20 w-[calc(100%-64px)] max-w-[1160px] -translate-x-1/2 px-8">
            <Image
              src="/landing/hero/desktop/dashboard-main.png"
              alt="Panel de BuildOn mostrando el avance de obra de un proyecto"
              width={1096}
              height={635}
              priority
              className="h-auto w-full object-cover object-top shadow-[0px_48px_120px_0px_rgba(0,0,0,0.4)]"
              sizes="(max-width: 1440px) 80vw, 1096px"
            />
          </div>

          <div className="absolute left-[4.8%] top-[801px] z-30 w-[20.6%] min-w-[220px] max-w-[297px]">
            <Image
              src="/landing/hero/desktop/task-panel.png"
              alt=""
              width={297}
              height={312}
              className="h-auto w-full object-cover object-top shadow-[0px_48px_120px_0px_rgba(0,0,0,0.15)]"
              sizes="297px"
            />
          </div>

          <div className="absolute right-[4.8%] top-[816px] z-30 w-[27.6%] min-w-[280px] max-w-[398px]">
            <Image
              src="/landing/hero/desktop/phone-card.png"
              alt="Certificación de tareas en BuildOn"
              width={398}
              height={274}
              className="h-auto w-full object-cover object-top shadow-[0px_48px_120px_0px_rgba(0,0,0,0.15)]"
              sizes="398px"
            />
          </div>

          <div className="absolute left-1/2 top-[1195px] z-30 w-[39.7%] min-w-[420px] max-w-[571px] -translate-x-1/2">
            <Image
              src="/landing/hero/desktop/unit-bar.png"
              alt="Detalle de unidad con progreso en BuildOn"
              width={571}
              height={117}
              className="h-auto w-full object-cover object-top shadow-[-9px_54px_109.5px_0px_rgba(0,0,0,0.15)]"
              sizes="571px"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
