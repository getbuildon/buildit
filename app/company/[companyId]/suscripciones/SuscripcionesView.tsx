"use client"

import { BackButton } from "@/components/ui/BackButton"
import type { HardcodedSubscription } from "@/lib/company/subscriptionMocks"

type SuscripcionesViewProps = {
  subscriptions: HardcodedSubscription[]
}

function SubscriptionCard({ subscription }: { subscription: HardcodedSubscription }) {
  return (
    <article className="rounded-[16px] border border-[#edeef0] bg-white p-5 shadow-[0_0_5px_rgba(243,103,31,0.08)]">
      <div className="mb-5 flex flex-col gap-4 border-b border-[#edeef0] pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
          <div>
            <h2 className="font-recoleta text-[20px] font-normal leading-[1.05] text-[#272a2d]">
              {subscription.planName}
            </h2>
            <p className="mt-1 text-[14px] leading-[1.4] text-[#43484e]">
              {subscription.surfaceLabel}
            </p>
          </div>
          <p className="text-[18px] font-medium leading-[1.4] text-[#1d293d] sm:text-[20px]">
            {subscription.projectName}
          </p>
        </div>

        <button
          type="button"
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-[8px] border border-[#696e77] px-4 text-[14px] font-normal text-[#272a2d] transition-colors hover:bg-[#fefcfb]"
        >
          Mejorar Plan
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <h3 className="text-[14px] font-medium leading-[1.4] text-[#272a2d]">Miembros</h3>
          <div className="mt-3 space-y-1 text-[14px] leading-[1.4] text-[#272a2d]">
            <p>Admins: {subscription.members.admins}</p>
            <p>Supervisores: {subscription.members.supervisors}</p>
            <p>Operadores: {subscription.members.operators}</p>
          </div>
        </div>

        <div>
          <h3 className="text-[14px] font-medium leading-[1.4] text-[#272a2d]">Clientes</h3>
          <p className="mt-3 text-[14px] leading-[1.4] text-[#272a2d]">{subscription.clients}</p>
        </div>

        <div>
          <h3 className="text-[14px] font-medium leading-[1.4] text-[#272a2d]">Precio</h3>
          <p className="mt-3 text-[14px] leading-[1.4] text-[#272a2d]">{subscription.price}</p>
          <p className="mt-1 text-[12px] leading-[1.4] text-[#777b84]">{subscription.billingNote}</p>
        </div>

        <div>
          <h3 className="text-[14px] font-medium leading-[1.4] text-[#272a2d]">Método de Pago</h3>
          <p className="mt-3 text-[14px] leading-[1.4] text-[#272a2d]">{subscription.paymentMethod}</p>
          <p className="mt-1 text-[14px] leading-[1.4] text-[#272a2d]">
            **** **** **** {subscription.cardLast4}
          </p>
          <button
            type="button"
            className="mt-2 text-[14px] leading-[1.4] text-[#272a2d] underline underline-offset-2"
          >
            Cambiar método
          </button>
        </div>
      </div>
    </article>
  )
}

export function SuscripcionesView({ subscriptions }: SuscripcionesViewProps) {
  return (
    <div className="mx-auto w-full max-w-[960px]">
      <header className="mb-8 flex flex-col gap-4">
        <BackButton href="/home" />
        <h1 className="font-recoleta text-[32px] font-normal leading-[1.05] text-[#272a2d]">
          Suscripciones
        </h1>
      </header>

      {subscriptions.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-[#edeef0] bg-white px-6 py-12 text-center shadow-[0_0_5px_rgba(243,103,31,0.08)]">
          <p className="text-[16px] leading-[1.4] text-[#777b84]">
            No hay proyectos activos con suscripción en esta empresa.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {subscriptions.map((subscription) => (
            <SubscriptionCard key={subscription.projectId} subscription={subscription} />
          ))}
        </div>
      )}
    </div>
  )
}
