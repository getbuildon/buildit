"use client"

import { useState } from "react"

import { FaqAccordionItem } from "@/components/landing/FaqAccordionItem"
import { FAQ_ITEMS } from "@/lib/landing/faqItems"

export function LandingFaqSection() {
  const [openItemId, setOpenItemId] = useState<string | null>(
    FAQ_ITEMS[0]?.id ?? null,
  )

  return (
    <section id="faq" className="bg-[#fefcfb] px-6 py-14">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
        <div className="pt-4">
          <div className="flex flex-col gap-5">
            <h2 className="font-recoleta text-[36px] leading-[1.05] text-[#111113]">
              ¿Te quedaron <span className="text-primary">dudas?</span>
            </h2>
            <p className="text-lg leading-[1.2] tracking-[0.36px] text-[#272a2d]">
              Estas son las respuestas a las preguntas que nos hacen con mayor
              frecuencia.
            </p>
          </div>
        </div>

        <div>
          {FAQ_ITEMS.map((item) => (
            <FaqAccordionItem
              key={item.id}
              item={item}
              open={openItemId === item.id}
              onToggle={() =>
                setOpenItemId((current) =>
                  current === item.id ? null : item.id,
                )
              }
            />
          ))}
        </div>
      </div>
    </section>
  )
}
