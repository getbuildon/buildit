"use client"

import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"

type BackofficeBrandLinkProps = {
  className?: string
}

export function BackofficeBrandLink({ className }: BackofficeBrandLinkProps) {
  return (
    <Link
      href="/home"
      className={cn(
        "flex min-w-0 items-center gap-2.5 rounded-lg transition-opacity hover:opacity-90",
        className,
      )}
      aria-label="Ir al inicio de BuildOn"
    >
      <div className="relative size-8 shrink-0 overflow-hidden rounded-full bg-[#212225]">
        <Image
          src="/backoffice/buildon-iso.svg"
          alt=""
          width={20}
          height={15}
          aria-hidden
          className="absolute left-1/2 top-1/2 h-[14.5px] w-5 -translate-x-1/2 -translate-y-1/2"
        />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold leading-[15.6px] text-white">
          BuildOn
        </p>
        <p className="truncate text-xs leading-[1.4] tracking-[-0.36px] text-[#777b84]">
          Administración
        </p>
      </div>
    </Link>
  )
}
