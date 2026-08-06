"use client"

import { useEffect, useState, useTransition } from "react"
import { Minus, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

import {
  getBackofficeProjectBilling,
  recordBackofficeManualCharge,
  recordBackofficeManualPayment,
  type BackofficeProjectRow,
  type SubscriptionBillingSummary,
} from "@/app/backoffice/proyectos/actions"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { formatArgentinaTableDate } from "@/lib/datetime/argentinaDateTime"
import {
  formatBillingBalanceLabel,
  formatBillingUsd,
  getBillingEntryTypeLabel,
  getManualPaymentMethodLabel,
  MANUAL_PAYMENT_METHODS,
  type ManualPaymentMethod,
} from "@/lib/backoffice/subscriptionBilling"
import { cn } from "@/lib/utils"

const FIELD_CLASSNAME =
  "h-[42px] rounded-xl border-[#edeef0] bg-white text-sm leading-[1.4] text-[#18191b] placeholder:text-[#696e77] shadow-none focus-visible:border-[#ff7433] focus-visible:ring-0"

const LABEL_CLASSNAME = "text-xs font-medium leading-[1.4] text-[#5a6169]"

type ProjectBillingDialogProps = {
  project: BackofficeProjectRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type EntryFormMode = "payment" | "charge"

type EntryFormState = {
  amountUsd: string
  effectiveAt: Date
  paymentMethod: ManualPaymentMethod
  note: string
}

function emptyEntryForm(): EntryFormState {
  return {
    amountUsd: "",
    effectiveAt: new Date(),
    paymentMethod: "transferencia",
    note: "",
  }
}

function defaultEntryForm(
  mode: EntryFormMode,
  project: BackofficeProjectRow | null,
): EntryFormState {
  const base = emptyEntryForm()

  if (
    mode === "charge" &&
    project?.amountUsd != null &&
    project.amountUsd > 0
  ) {
    return {
      ...base,
      amountUsd: String(project.amountUsd),
    }
  }

  return base
}

function BillingSummaryCards({ billing }: { billing: SubscriptionBillingSummary }) {
  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
      <div className="rounded-xl border border-[#edeef0] bg-[#fafafa] px-3 py-2.5">
        <p className="text-[10px] font-medium uppercase tracking-wide text-[#777b84]">
          Saldo
        </p>
        <p
          className={cn(
            "pt-1 text-sm font-semibold tabular-nums",
            billing.balanceUsd > 0
              ? "text-[#c2410c]"
              : billing.balanceUsd < 0
                ? "text-[#208368]"
                : "text-[#363a3f]",
          )}
        >
          {formatBillingBalanceLabel(billing.balanceUsd)}
        </p>
      </div>
      <div className="rounded-xl border border-[#edeef0] bg-white px-3 py-2.5">
        <p className="text-[10px] font-medium uppercase tracking-wide text-[#777b84]">
          Cargos
        </p>
        <p className="pt-1 text-sm font-medium tabular-nums text-[#363a3f]">
          {formatBillingUsd(billing.totalChargesUsd)}
        </p>
      </div>
      <div className="rounded-xl border border-[#edeef0] bg-white px-3 py-2.5">
        <p className="text-[10px] font-medium uppercase tracking-wide text-[#777b84]">
          Pagos
        </p>
        <p className="pt-1 text-sm font-medium tabular-nums text-[#208368]">
          {formatBillingUsd(billing.totalPaymentsUsd)}
        </p>
      </div>
      <div className="rounded-xl border border-[#edeef0] bg-white px-3 py-2.5">
        <p className="text-[10px] font-medium uppercase tracking-wide text-[#777b84]">
          Deuda
        </p>
        <p
          className={cn(
            "pt-1 text-sm font-medium tabular-nums",
            billing.debtUsd > 0 ? "text-[#dc3e42]" : "text-[#363a3f]",
          )}
        >
          {billing.debtUsd > 0 ? formatBillingUsd(billing.debtUsd) : "—"}
        </p>
      </div>
    </div>
  )
}

function BillingHistoryTable({ billing }: { billing: SubscriptionBillingSummary }) {
  if (billing.entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#edeef0] px-4 py-8 text-center">
        <p className="text-sm text-[#696e77]">Todavía no hay movimientos.</p>
        <p className="pt-1 text-xs text-[#777b84]">
          Los cargos por prorrateo y los pagos manuales aparecerán acá.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#edeef0]">
      <div className="grid grid-cols-[88px_minmax(0,1fr)_minmax(0,1.2fr)_96px] gap-2 border-b border-[#f4f5f6] bg-[#fafafa] px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-[#777b84]">
        <span>Fecha</span>
        <span>Tipo</span>
        <span>Detalle</span>
        <span className="text-right">Monto</span>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {billing.entries.map((entry) => (
          <div
            key={entry.id}
            className="grid grid-cols-[88px_minmax(0,1fr)_minmax(0,1.2fr)_96px] gap-2 border-b border-[#f4f5f6] px-3 py-2.5 last:border-b-0"
          >
            <span className="whitespace-nowrap text-xs tabular-nums text-[#696e77]">
              {formatArgentinaTableDate(entry.effectiveAt)}
            </span>
            <span className="text-xs font-medium text-[#363a3f]">
              {getBillingEntryTypeLabel(entry.entryType)}
              {entry.paymentMethod
                ? ` · ${getManualPaymentMethodLabel(entry.paymentMethod)}`
                : null}
            </span>
            <span className="truncate text-xs text-[#696e77]">
              {entry.description ?? "—"}
            </span>
            <span
              className={cn(
                "text-right text-xs font-medium tabular-nums",
                entry.amountUsd > 0
                  ? "text-[#c2410c]"
                  : entry.amountUsd < 0
                    ? "text-[#208368]"
                    : "text-[#363a3f]",
              )}
            >
              {formatBillingUsd(entry.amountUsd, { signed: true })}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ProjectBillingDialog({
  project,
  open,
  onOpenChange,
}: ProjectBillingDialogProps) {
  const router = useRouter()
  const [billing, setBilling] = useState<SubscriptionBillingSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [entryFormMode, setEntryFormMode] = useState<EntryFormMode | null>(null)
  const [entryForm, setEntryForm] = useState(emptyEntryForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, startSave] = useTransition()

  useEffect(() => {
    if (!open || !project) {
      setBilling(null)
      setLoadError(null)
      setEntryFormMode(null)
      setEntryForm(emptyEntryForm())
      setFormError(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setLoadError(null)

    getBackofficeProjectBilling(project.id)
      .then((result) => {
        if (!cancelled) setBilling(result)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : "No pudimos cargar la facturación.",
          )
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, project])

  const openEntryForm = (mode: EntryFormMode) => {
    setFormError(null)
    setEntryForm(defaultEntryForm(mode, project))
    setEntryFormMode(mode)
  }

  const closeEntryForm = () => {
    setEntryFormMode(null)
    setFormError(null)
    setEntryForm(emptyEntryForm())
  }

  const handleSaveEntry = () => {
    if (!project || !entryFormMode) return

    setFormError(null)
    const amountUsd = Number(entryForm.amountUsd.replace(",", "."))

    startSave(async () => {
      const result =
        entryFormMode === "payment"
          ? await recordBackofficeManualPayment(project.id, {
              amountUsd,
              paidAt: entryForm.effectiveAt.toISOString(),
              paymentMethod: entryForm.paymentMethod,
              note: entryForm.note.trim() || undefined,
            })
          : await recordBackofficeManualCharge(project.id, {
              amountUsd,
              effectiveAt: entryForm.effectiveAt.toISOString(),
              note: entryForm.note.trim() || undefined,
            })

      if (!result.ok) {
        setFormError(result.error)
        return
      }

      const refreshed = await getBackofficeProjectBilling(project.id)
      setBilling(refreshed)
      closeEntryForm()
      router.refresh()
    })
  }

  const isPaymentForm = entryFormMode === "payment"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-[#edeef0] p-0">
        <DialogHeader className="border-b border-[#f4f5f6] px-6 py-5">
          <DialogTitle className="text-lg font-semibold text-[#18191b]">
            Facturación
          </DialogTitle>
          <DialogDescription className="text-sm text-[#696e77]">
            {project
              ? `${project.name}${project.company ? ` · ${project.company.name}` : ""}`
              : "Historial de cargos y pagos del proyecto."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="size-5 text-[#777b84]" />
            </div>
          ) : loadError ? (
            <p className="text-sm text-[#dc3e42]">{loadError}</p>
          ) : billing ? (
            <>
              <BillingSummaryCards billing={billing} />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-[#18191b]">Movimientos</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className={cn(
                      "h-8 rounded-lg border-[#edeef0] text-xs",
                      entryFormMode === "charge" && "border-[#ffd6c2] bg-[#fff6f1]",
                    )}
                    onClick={() =>
                      entryFormMode === "charge" ? closeEntryForm() : openEntryForm("charge")
                    }
                  >
                    <Minus className="size-3.5" />
                    Registrar cargo
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className={cn(
                      "h-8 rounded-lg border-[#edeef0] text-xs",
                      entryFormMode === "payment" && "border-[#ffd6c2] bg-[#fff6f1]",
                    )}
                    onClick={() =>
                      entryFormMode === "payment" ? closeEntryForm() : openEntryForm("payment")
                    }
                  >
                    <Plus className="size-3.5" />
                    Registrar pago
                  </Button>
                </div>
              </div>

              {entryFormMode ? (
                <div
                  className={cn(
                    "rounded-xl border p-4",
                    isPaymentForm
                      ? "border-[#dbeafe] bg-[#f0f7ff]"
                      : "border-[#ffd6c2] bg-[#fff6f1]",
                  )}
                >
                  <p className="text-sm font-medium text-[#18191b]">
                    {isPaymentForm ? "Nuevo pago" : "Nuevo cargo"}
                  </p>
                  <div className="grid gap-4 pt-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="entry-amount" className={LABEL_CLASSNAME}>
                        Monto (USD)
                      </Label>
                      <Input
                        id="entry-amount"
                        inputMode="decimal"
                        value={entryForm.amountUsd}
                        onChange={(event) =>
                          setEntryForm((current) => ({
                            ...current,
                            amountUsd: event.target.value,
                          }))
                        }
                        placeholder="200"
                        className={FIELD_CLASSNAME}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label className={LABEL_CLASSNAME}>
                        {isPaymentForm ? "Fecha de pago" : "Fecha del cargo"}
                      </Label>
                      <DatePicker
                        value={entryForm.effectiveAt}
                        onChange={(date) => {
                          if (date) {
                            setEntryForm((current) => ({
                              ...current,
                              effectiveAt: date,
                            }))
                          }
                        }}
                        className={FIELD_CLASSNAME}
                      />
                    </div>

                    {isPaymentForm ? (
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="entry-method" className={LABEL_CLASSNAME}>
                          Método
                        </Label>
                        <select
                          id="entry-method"
                          value={entryForm.paymentMethod}
                          onChange={(event) =>
                            setEntryForm((current) => ({
                              ...current,
                              paymentMethod: event.target.value as ManualPaymentMethod,
                            }))
                          }
                          className={cn(FIELD_CLASSNAME, "px-3")}
                        >
                          {MANUAL_PAYMENT_METHODS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}

                    <div
                      className={cn(
                        "flex flex-col gap-1.5",
                        !isPaymentForm && "sm:col-span-2",
                      )}
                    >
                      <Label htmlFor="entry-note" className={LABEL_CLASSNAME}>
                        Nota (opcional)
                      </Label>
                      <Input
                        id="entry-note"
                        value={entryForm.note}
                        onChange={(event) =>
                          setEntryForm((current) => ({
                            ...current,
                            note: event.target.value,
                          }))
                        }
                        placeholder={
                          isPaymentForm
                            ? "Ref. transferencia, factura, etc."
                            : "Renovación, fee extra, ajuste, etc."
                        }
                        className={FIELD_CLASSNAME}
                      />
                    </div>
                  </div>

                  {formError ? (
                    <p className="pt-3 text-xs text-[#dc3e42]">{formError}</p>
                  ) : null}

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-lg text-xs"
                      disabled={isSaving}
                      onClick={closeEntryForm}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 rounded-lg bg-[#ff7433] text-xs hover:bg-[#e5662d]"
                      disabled={isSaving}
                      onClick={handleSaveEntry}
                    >
                      {isSaving
                        ? "Guardando..."
                        : isPaymentForm
                          ? "Guardar pago"
                          : "Guardar cargo"}
                    </Button>
                  </div>
                </div>
              ) : null}

              <BillingHistoryTable billing={billing} />
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
