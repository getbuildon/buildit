import {
  Check,
  ChevronDown,
  HardHat,
  Headphones,
  LayoutDashboard,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react"
import type { ReactNode } from "react"

import type { BillingPeriod, PricingPlan } from "@/lib/landing/pricingPlans"
import { getPlanDisplayPrice } from "@/lib/landing/pricingPlans"
import { cn } from "@/lib/utils"

type PricingPlanCardProps = {
  plan: PricingPlan
  billing: BillingPeriod
}

function TeamIcon({ index, dark }: { index: number; dark: boolean }) {
  const className = cn("size-4", dark ? "text-[#ff7433]" : "text-primary")
  if (index === 0) return <UserCog className={className} strokeWidth={1.75} />
  if (index === 1) return <ShieldCheck className={className} strokeWidth={1.75} />
  return <HardHat className={className} strokeWidth={1.75} />
}

function BulletIcon({ index, dark }: { index: number; dark: boolean }) {
  const wrapperClass = cn(
    "flex size-5 shrink-0 items-center justify-center rounded-full",
    dark ? "bg-primary" : "bg-[#fff5ef]",
  )
  const iconClass = cn("size-3", dark ? "text-white" : "text-primary")

  let icon: ReactNode
  if (index === 0) icon = <Users className={iconClass} strokeWidth={2} />
  else if (index === 1) icon = <Headphones className={iconClass} strokeWidth={2} />
  else if (index === 2)
    icon = <LayoutDashboard className={iconClass} strokeWidth={2} />
  else icon = <Check className={iconClass} strokeWidth={2.5} />

  return <div className={wrapperClass}>{icon}</div>
}

export function PricingPlanCard({ plan, billing }: PricingPlanCardProps) {
  const isDark = plan.theme === "dark"
  const price = getPlanDisplayPrice(plan, billing)
  const isQuote = Boolean(plan.priceLabel)

  return (
    <article
      className={cn(
        "rounded border p-[33px]",
        isDark
          ? "border-[#18191b] bg-[#18191b] shadow-[0px_25px_25px_rgba(24,25,27,0.2)]"
          : "border-[#eef0f2] bg-white",
      )}
    >
      {plan.badge ? (
        <span className="mb-5 inline-flex rounded-full bg-primary px-3 py-1 text-[13px] font-medium leading-[19.5px] text-white">
          {plan.badge}
        </span>
      ) : null}

      <div>
        <h3
          className={cn(
            "font-recoleta text-[28px] leading-[1.05]",
            isDark ? "text-[#fefcfb]" : "text-[#18191b]",
          )}
        >
          {plan.name}
        </h3>
        <p
          className={cn(
            "pt-1 text-base leading-[1.4]",
            isDark ? "text-[#afb3ba]" : "text-[#272a2d]",
          )}
        >
          {plan.subtitle}
        </p>
      </div>

      <div className="flex items-end gap-2 py-3">
        <p
          className={cn(
            "font-recoleta leading-none",
            isQuote ? "text-[40px] leading-[40px]" : "text-[48px] leading-[42px]",
            isDark ? "text-[#fefcfb]" : "text-[#18191b]",
          )}
        >
          {price}
        </p>
        {!isQuote ? (
          <p
            className={cn(
              "pb-1 text-base leading-[1.4]",
              isDark ? "text-[#afb3ba]" : "text-[#5a6169]",
            )}
          >
            usd/mes
          </p>
        ) : null}
      </div>

      <div
        className={cn(
          "flex h-10 items-center justify-between rounded border px-[13px] py-[7px]",
          isDark
            ? "border-[#272a2d] bg-[#212225]"
            : "border-[rgba(175,179,186,0.6)] bg-white",
        )}
      >
        <p
          className={cn(
            "text-sm leading-[1.4]",
            isDark ? "text-[#afb3ba]" : "text-[#363a3f]",
          )}
        >
          {plan.surface}
        </p>
        {plan.showSurfaceChevron ? (
          <ChevronDown
            className={cn("size-6", isDark ? "text-[#afb3ba]" : "text-[#363a3f]")}
            strokeWidth={1.75}
          />
        ) : null}
      </div>

      <div
        className={cn(
          "mt-4 border-t pt-[25px]",
          isDark ? "border-white/10" : "border-[#eef0f2]",
        )}
      >
        <p
          className={cn(
            "text-sm leading-[1.4]",
            isDark ? "text-[#777b84]" : "text-[#5a6169]",
          )}
        >
          EQUIPO
        </p>
        <ul className="flex flex-col gap-3 pt-3">
          {plan.teamFeatures.map((feature, index) => (
            <li key={feature} className="flex items-center gap-3">
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-[10px]",
                  isDark ? "bg-white/10" : "bg-[#fff5ef]",
                )}
              >
                <TeamIcon index={index} dark={isDark} />
              </div>
              <span
                className={cn(
                  "text-base leading-[1.4]",
                  isDark ? "text-[#eef0f2]" : "text-[#272a2d]",
                )}
              >
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <ul className="flex flex-col gap-3.5 pt-6">
        {plan.otherFeatures.map((feature, index) => (
          <li key={feature} className="flex items-start gap-3">
            <div className="pt-0.5">
              <BulletIcon index={index} dark={isDark} />
            </div>
            <span
              className={cn(
                "text-base leading-[1.4]",
                isDark ? "text-[#eef0f2]" : "text-[#272a2d]",
              )}
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <div className="pt-8">
        <button
          type="button"
          className={cn(
            "flex h-[52px] w-full items-center justify-center rounded-[10px] px-6 py-3.5 text-base font-medium leading-[1.4]",
            plan.ctaVariant === "outline" &&
              "border border-[#afb3ba] text-[#272a2d]",
            plan.ctaVariant === "primary" && "bg-primary text-white",
            plan.ctaVariant === "dark" &&
              "bg-[#18191b] text-[#fefcfb]",
          )}
        >
          {plan.ctaLabel}
        </button>
      </div>
    </article>
  )
}
