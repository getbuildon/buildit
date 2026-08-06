import { Spinner } from "@/components/ui/spinner"

export default function BackofficeDashboardLoading() {
  return (
    <div className="flex min-h-[480px] items-center justify-center px-6 py-10 lg:px-12">
      <Spinner className="size-8 text-[#ff7433]" />
    </div>
  )
}
