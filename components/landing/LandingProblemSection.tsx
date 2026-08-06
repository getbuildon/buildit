import Image from "next/image"

import { PROBLEM_ITEMS } from "@/lib/landing/problemItems"

function ProblemCard({
  iconSrc,
  title,
  description,
}: {
  iconSrc: string
  title: string
  description: string
}) {
  return (
    <article className="w-full bg-white ring-1 ring-[#edeef0] ring-inset">
      <div className="flex items-start gap-5 px-[33px] py-[49px]">
        <div className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-white shadow-[0px_1px_1.5px_rgba(0,0,0,0.1),0px_1px_1px_rgba(0,0,0,0.1)]">
          <Image
            src={iconSrc}
            alt=""
            width={20}
            height={20}
            aria-hidden
            className="size-5"
          />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-recoleta text-2xl leading-[1.05] text-[#18191b]">
            {title}
          </h3>
          <p className="pt-1.5 text-lg leading-[1.2] tracking-[0.36px] text-[#272a2d]">
            {description}
          </p>
        </div>
      </div>
    </article>
  )
}

export function LandingProblemSection() {
  return (
    <section className="hidden bg-[#fefcfb] lg:block">
      <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-10 lg:py-24 xl:px-20 xl:py-28">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-x-12 xl:gap-x-24">
          <div className="relative min-w-0 pt-8 lg:max-w-[512px]">
            <h2 className="max-w-[448px] font-recoleta text-4xl leading-[1.05] text-[#18191b] xl:text-[48px]">
              No podés controlar lo que no podés{" "}
              <span className="text-primary">ver</span>.
            </h2>
            <p className="max-w-[448px] pt-5 text-lg leading-[1.4] text-[#272a2d] xl:text-[20px]">
              El problema no es el esfuerzo del equipo. Está en la falta de
              trazabilidad, seguimiento y alineación entre las personas que
              construyen.
            </p>

            <Image
              src="/landing/problem/plus-decoration.svg"
              alt=""
              width={79}
              height={84}
              aria-hidden
              className="pointer-events-none absolute left-8 top-[408px] hidden h-[84px] w-[79px] xl:block"
            />
          </div>

          <div className="flex min-w-0 flex-col gap-5 overflow-visible">
            {PROBLEM_ITEMS.map((item) => (
              <ProblemCard
                key={item.id}
                iconSrc={item.iconSrc}
                title={item.title}
                description={item.description}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
