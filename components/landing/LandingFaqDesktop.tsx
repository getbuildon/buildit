"use client"

import { useState } from "react"

import { FaqAccordionItem } from "@/components/landing/FaqAccordionItem"
import { FAQ_ITEMS } from "@/lib/landing/faqItems"

export function LandingFaqDesktop() {
  const [openItemId, setOpenItemId] = useState<string | null>(
    FAQ_ITEMS[0]?.id ?? null,
  )

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-10 lg:py-24 xl:px-20 xl:py-28">
      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[416px_minmax(0,624px)] xl:justify-between xl:gap-20">
        <div className="pt-4">
          <div className="flex max-w-[416px] flex-col gap-5">
            <h2 className="font-recoleta text-4xl leading-[1.05] text-[#111113] xl:text-[48px]">
              ¿Te quedaron{" "}
              <span className="text-primary">dudas?</span>
            </h2>
            <p className="text-lg leading-[1.4] text-[#272a2d] xl:text-xl">
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
