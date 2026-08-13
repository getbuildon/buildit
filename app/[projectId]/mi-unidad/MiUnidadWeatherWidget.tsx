import { CloudSun } from "lucide-react"
import type { ProjectWeatherSnapshot } from "@/lib/weather/openMeteo"

type MiUnidadWeatherWidgetProps = {
  weather: ProjectWeatherSnapshot | null
}

export function MiUnidadWeatherWidget({ weather }: MiUnidadWeatherWidgetProps) {
  if (!weather) return null

  return (
    <div className="shrink-0 rounded-[13px] border border-[#e8ecf0] bg-white px-[17px] py-[13px] shadow-[0_1px_1.5px_rgba(0,0,0,0.07)]">
      <div className="flex items-center gap-6">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[24px] font-medium leading-[1.05] text-[#111113]">
              {weather.temperatureC}°
            </p>
            <p className="text-[12px] leading-[18px] text-[#777b84]">C</p>
          </div>
          <div className="pt-0.5">
            <p className="text-[12px] font-medium leading-[1.4] text-[#43484e]">
              {weather.city}
            </p>
            <p className="text-[12px] leading-[1.4] tracking-[-0.36px] text-[#5a6169]">
              {weather.description}
            </p>
          </div>
        </div>
        <CloudSun className="size-10 shrink-0 text-[#ff7433]" strokeWidth={1.5} aria-hidden />
      </div>
    </div>
  )
}
