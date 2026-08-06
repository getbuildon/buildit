"use client"

import { useState } from "react"

import { FaqAccordionItem } from "@/components/landing/FaqAccordionItem"
import { FAQ_ITEMS } from "@/lib/landing/faqItems"

export function LandingFaqDesktop() {
  const [openItemId, setOpenItemId] = useState<string | null>(
    FAQ_ITEMS[0]?.id ?? null,
  )

  return (
    <div className="mx-auto max-w-[1280px] px-20 py-28">
      <div className="grid grid-cols-[416px_minmax(0,624px)] justify-between gap-20">
        <div className="pt-4">
          <div className="flex max-w-[416px] flex-col gap-5">
            <h2 className="font-recoleta text-[48px] leading-[1.05] text-[#111113]">
              ¿Te quedaron{" "}
              <span className="text-primary">dudas?</span>
            </h2>
            <p className="text-xl leading-[1.4] text-[#272a2d]">
              Estas son las respuestas a las preguntas que nos hacen con mayor
              frecuencia.
            </p>
          </div>
        </div>

        <div className="w-full max-w-[624px] justify-self-end">
          {FAQ_ITEMS.map((item) => (
            <FaqAccordionItem
              key={item.id}
              item={item}
              variant="desktop"
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
    </div>
  )
}
