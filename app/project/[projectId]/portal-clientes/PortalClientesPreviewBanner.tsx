type PortalClientesPreviewBannerProps = {
  onBackToEdit: () => void
}

export function PortalClientesPreviewBanner({
  onBackToEdit,
}: PortalClientesPreviewBannerProps) {
  return (
    <div className="w-full rounded-[10px] border border-[#ffd7c2] bg-[#fff6f1] px-4 py-3 shadow-[0_0_5px_rgba(243,103,31,0.08)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[16px] font-normal leading-[1.4] text-[#111113]">
          Estás previsualizando los cambios del portal del cliente.
        </p>
        <button
          type="button"
          onClick={onBackToEdit}
          className="shrink-0 rounded-[6px] border border-[#ff7433] px-3 py-2 text-[14px] font-medium leading-[1.4] text-[#ff7433] transition-colors hover:bg-[#fff0e8]"
        >
          Volver a editar
        </button>
      </div>
    </div>
  )
}
