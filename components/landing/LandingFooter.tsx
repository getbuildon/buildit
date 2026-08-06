import Image from "next/image"
import Link from "next/link"

import { LANDING_FOOTER_LINKS } from "@/lib/landing/footerLinks"

export function LandingFooter() {
  return (
    <footer className="border-t border-[rgba(175,179,186,0.5)] bg-[#fefcfb] px-4 pb-4 pt-8">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-10">
        <div className="flex items-start gap-10">
          <div className="relative size-20 shrink-0">
            <Image
              src="/landing/footer/iso-logo.svg"
              alt="BuildOn"
              width={80}
              height={58}
              className="absolute left-1/2 top-1/2 h-[58px] w-20 -translate-x-1/2 -translate-y-1/2"
            />
          </div>

          <div className="flex flex-1 flex-col gap-3 pt-2">
            {LANDING_FOOTER_LINKS.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                {...(link.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="inline-flex w-fit items-center gap-1 text-base leading-[1.4] text-[#5a6169]"
              >
                {link.label}
                <Image
                  src="/landing/footer/arrow-up-right.svg"
                  alt=""
                  width={16}
                  height={16}
                  aria-hidden
                  className="size-4"
                />
              </Link>
            ))}
          </div>
        </div>

        <div className="w-full border-t border-[#edeef0] py-3">
          <p className="text-sm leading-[1.4] text-[#696e77]">
            © 2026 BuildOn. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
