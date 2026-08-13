import type { SVGProps } from "react"
import { MI_UNIDAD_WEATHER_WIDGET } from "@/lib/project/designTokens"
import type { ProjectWeatherSnapshot } from "@/lib/weather/openMeteo"
import { cn } from "@/lib/utils"

type MiUnidadWeatherWidgetProps = {
  weather: ProjectWeatherSnapshot | null
  className?: string
}

function WeatherWidgetIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <path
        d="M29.1667 31.6667H15C12.8364 31.6661 10.7157 31.0639 8.87463 29.9274C7.0336 28.791 5.54487 27.1649 4.57478 25.231C3.6047 23.2971 3.19149 21.1316 3.38132 18.9764C3.57115 16.8212 4.35655 14.7612 5.64974 13.0266C6.94294 11.2921 8.69299 9.95132 10.7043 9.15414C12.7157 8.35696 14.9091 8.13479 17.0394 8.51244C19.1698 8.89009 21.1531 9.85269 22.7679 11.2927C24.3826 12.7327 25.5652 14.5933 26.1833 16.6667H29.1667C31.1558 16.6667 33.0634 17.4568 34.47 18.8634C35.8765 20.2699 36.6667 22.1775 36.6667 24.1667C36.6667 26.1558 35.8765 28.0634 34.47 29.47C33.0634 30.8765 31.1558 31.6667 29.1667 31.6667Z"
        stroke="currentColor"
        strokeWidth="1.28333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function MiUnidadWeatherWidget({
  weather,
  className,
}: MiUnidadWeatherWidgetProps) {
  if (!weather) return null

  return (
    <div className={cn(MI_UNIDAD_WEATHER_WIDGET.container, className)}>
      <div className="flex min-w-0 flex-col items-start">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <p className={MI_UNIDAD_WEATHER_WIDGET.temperature}>
            {weather.temperatureC}°
          </p>
          <p className={MI_UNIDAD_WEATHER_WIDGET.unit}>C</p>
        </div>
        <div className="flex flex-col items-start pt-[2px]">
          <p className={cn(MI_UNIDAD_WEATHER_WIDGET.city, "whitespace-nowrap")}>
            {weather.city}
          </p>
          <p className={cn(MI_UNIDAD_WEATHER_WIDGET.description, "whitespace-nowrap")}>
            {weather.description}
          </p>
        </div>
      </div>
      <WeatherWidgetIcon className="size-10 shrink-0 text-[#777b84]" />
    </div>
  )
}
