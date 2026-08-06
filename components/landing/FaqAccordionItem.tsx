"use client"

import Image from "next/image"

import { AnimatedCollapsible } from "@/components/ui/animated-collapsible"
import type { FaqItem } from "@/lib/landing/faqItems"
import { cn } from "@/lib/utils"

type FaqAccordionItemProps = {
  item: FaqItem
  open: boolean
  onToggle: () => void
}

export function FaqAccordionItem({
  item,
  open,
  onToggle,
}: FaqAccordionItemProps) {
  return (
    <div className="border-b border-[#eef0f2]">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="font-recoleta text-lg leading-[1.05] text-[#18191b]">
          {item.question}
        </span>

        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f7f8f9]"
        >
          <Image
            src={
              open
                ? "/landing/faq/icon-minus.svg"
                : "/landing/faq/icon-plus.svg"
            }
            alt=""
            width={16}
            height={16}
            className="size-4"
          />
        </span>
      </button>

      <AnimatedCollapsible open={open}>
        <p
          className={cn(
            "pb-5 text-lg leading-[1.2] tracking-[0.36px] text-[#43484e]",
          )}
        >
          {item.answer}
        </p>
      </AnimatedCollapsible>
    </div>
  )
}
