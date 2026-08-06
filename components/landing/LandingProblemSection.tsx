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
    <article className="w-[514px] bg-white ring-1 ring-[#edeef0] ring-inset">
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

        <div className="w-[384px] shrink-0">
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
      <div className="mx-auto max-w-[1280px] px-20 py-28">
        <div className="grid grid-cols-[512px_512px] justify-between gap-x-24">
          <div className="relative w-[512px] pt-8">
            <h2 className="w-[448px] font-recoleta text-[48px] leading-[1.05] text-[#18191b]">
              No podés controlar lo que no podés{" "}
              <span className="text-primary">ver</span>.
            </h2>
            <p className="w-[448px] pt-5 text-[20px] leading-[1.4] text-[#272a2d]">
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
              className="pointer-events-none absolute left-8 top-[408px] h-[84px] w-[79px]"
            />
          </div>

          <div className="flex w-[512px] flex-col gap-5 overflow-visible">
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
