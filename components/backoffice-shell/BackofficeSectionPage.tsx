type BackofficeSectionPageProps = {
  title: string
  description: string
}

export function BackofficeSectionPage({
  title,
  description,
}: BackofficeSectionPageProps) {
  return (
    <div className="px-12 py-10">
      <h1 className="font-recoleta text-[28px] leading-[1.05] text-[#272a2d]">
        {title}
      </h1>
      <p className="pt-6 max-w-2xl text-sm leading-[1.4] text-[#696e77]">
        {description}
      </p>
    </div>
  )
}
