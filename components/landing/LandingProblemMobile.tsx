"use client"

import Image from "next/image"
import { useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

import { LandingReveal } from "@/components/landing/LandingReveal"
import { LANDING_REVEAL_DEFAULTS } from "@/lib/landing/landingReveal"
import { PROBLEM_ITEMS } from "@/lib/landing/problemItems"

gsap.registerPlugin(ScrollTrigger)

function ProblemCardMobile({
  iconSrc,
  title,
  description,
}: {
  iconSrc: string
  title: string
  description: string
}) {
  return (
    <article
      data-problem-card-mobile
      className="relative w-full border border-solid border-[#edeef0] bg-white drop-shadow-[0px_-10px_3.85px_rgba(0,0,0,0.04)] not-last:-mb-[18px]"
    >
      <div className="flex items-start gap-5 px-[17px] py-[33px]">
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
          <h3 className="font-recoleta text-lg leading-[1.05] text-[#18191b]">
            {title}
          </h3>
          <p className="pt-1.5 text-base leading-[1.4] text-[#272a2d]">
            {description}
          </p>
        </div>
      </div>
    </article>
  )
}

export function LandingProblemMobile() {
  const listRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const list = listRef.current
      if (!list) return

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return
      }

      const cards = gsap.utils.toArray<HTMLElement>(
        "[data-problem-card-mobile]",
        list,
      )

      gsap.set(cards, { y: 48, opacity: 0 })

      cards.forEach((card) => {
        gsap.to(card, {
          y: 0,
          opacity: 1,
          duration: LANDING_REVEAL_DEFAULTS.duration,
          ease: LANDING_REVEAL_DEFAULTS.ease,
          scrollTrigger: {
            trigger: card,
            start: "top 88%",
            once: true,
            invalidateOnRefresh: true,
          },
        })
      })
    },
    { scope: listRef },
  )

  return (
    <section className="relative z-30 bg-[#fefcfb] px-6">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-6 pb-14 pt-10">
        <div className="w-full text-center">
          <LandingReveal direction="up">
            <h2 className="font-recoleta text-2xl leading-[1.05] text-[#18191b]">
              No podés controlar lo que no podés{" "}
              <span className="text-primary">ver</span>.
            </h2>
          </LandingReveal>
          <LandingReveal direction="up" delay={0.12}>
            <p className="pt-5 text-base leading-[1.4] text-[#272a2d]">
              El problema no es el esfuerzo del equipo. Está en la falta de
              trazabilidad, seguimiento y alineación entre las personas que
              construyen.
            </p>
          </LandingReveal>
        </div>

        <div ref={listRef} className="flex w-full flex-col">
          {PROBLEM_ITEMS.map((item) => (
            <ProblemCardMobile
              key={item.id}
              iconSrc={item.iconSrc}
              title={item.title}
              description={item.description}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
