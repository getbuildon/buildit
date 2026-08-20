"use client"

import Link from "next/link"
import { useState } from "react"
import { ChevronDown, CircleUserRound } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { LANDING_LOGIN_MENU_ITEMS } from "@/lib/landing/loginMenuItems"
import { cn } from "@/lib/utils"

export function LandingLoginMenu() {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 rounded-[10px] px-3 py-2.5 text-sm leading-[1.4] text-[#272a2d] transition-colors hover:bg-white",
            open && "bg-white",
          )}
        >
          <CircleUserRound className="size-4" strokeWidth={1.75} aria-hidden />
          Iniciar sesión
          <ChevronDown
            className={cn(
              "size-3 shrink-0 transition-transform",
              open && "rotate-180",
            )}
            strokeWidth={1.75}
            aria-hidden
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-max rounded-[10px] border-0 bg-white p-2 text-[#111113] shadow-[0px_48px_60px_rgba(0,0,0,0.4)]"
      >
        <div className="flex flex-col">
          {LANDING_LOGIN_MENU_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[10px] p-2 text-left text-sm leading-[1.4] text-[#111113] transition-colors hover:bg-[#ffeae0]"
            >
              <p className="font-medium">{item.title}</p>
              <p className="whitespace-nowrap font-normal">{item.description}</p>
            </Link>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
