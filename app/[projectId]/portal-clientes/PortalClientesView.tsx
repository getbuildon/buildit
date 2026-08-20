"use client"

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react"
import { createPortal } from "react-dom"
import { AlertCircle, Check, Eye, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import {
  formatDraftDateString,
  parseDraftDateString,
} from "@/lib/projects/createProjectDraft"
import { PORTAL_CLIENTES_LAYOUT } from "@/lib/project/designTokens"
import type {
  PortalClientesData,
  PortalMilestoneItem,
  PortalMilestoneStatus,
  PortalNewsItem,
} from "@/lib/projects/portalClientesTypes"
import {
  revokePortalNewsPreview,
  uploadPortalNewsImage,
  type PortalNewsImageDraft,
} from "@/lib/projects/portalNewsPhoto.client"
import {
  validatePortalClientesContent,
  type PortalMilestoneFieldErrors,
  type PortalNewsFieldErrors,
} from "@/lib/projects/portalClientesValidation"
import { cn } from "@/lib/utils"
import { MilestoneStatusToggle } from "./MilestoneStatusToggle"
import {
  PORTAL_FIELD_ERROR_BORDER_CLASSNAME,
  PortalFieldErrorWrap,
} from "./PortalFieldErrorWrap"
import { PortalNewsImageUpload } from "./PortalNewsImageUpload"
import { savePortalClientesContent } from "./actions"
import type { PortalClientesPreviewContext } from "./actions"
import { PortalClientesPreviewBanner } from "./PortalClientesPreviewBanner"
import { MiUnidadView } from "../mi-unidad/MiUnidadView"

const PORTAL_CARD_CLASSNAME =
  "rounded-[16px] border border-[#edeef0] bg-white p-4 shadow-[0_0_5px_rgba(243,103,31,0.08)] sm:p-[25px]"
const PORTAL_NEWS_TITLE_CLASSNAME =
  "h-[42px] rounded-[10px] border border-[#e2e8f0] bg-white px-3 py-[10px] text-[14px] font-normal leading-5 tracking-[-0.15px] text-[#272a2d] shadow-none placeholder:text-[#43484e] focus-visible:border-[#ff7433] focus-visible:ring-0"
const PORTAL_NEWS_DESCRIPTION_CLASSNAME =
  "min-h-[72px] w-full flex-1 resize-none rounded-[10px] border border-[#e2e8f0] bg-white px-3 py-[10px] text-[14px] font-normal leading-5 tracking-[-0.15px] text-[#272a2d] shadow-none placeholder:text-[#43484e] focus-visible:border-[#ff7433] focus-visible:outline-none focus-visible:ring-0 min-[640px]:h-full"
const PORTAL_MILESTONE_NAME_CLASSNAME =
  "min-w-0 flex-1 border-0 bg-transparent p-0 text-[18px] font-medium leading-[1.05] text-[#111113] shadow-none outline-none placeholder:text-[#777b84] focus-visible:ring-0"
const PORTAL_DATE_PICKER_CLASSNAME =
  "h-[40px] w-[200px] max-w-full border-[#afb3ba] text-[14px]"
const PORTAL_ADD_BUTTON_CLASSNAME =
  "h-auto w-fit gap-1.5 rounded-[10px] border-[#edeef0] bg-transparent px-3 py-2 text-[14px] font-normal leading-[1.4] text-[#43484e] shadow-none hover:border-[#d5d7db] hover:bg-[#f9f9fb] hover:text-[#272a2d]"
const SAVE_FOOTER_ANIMATION_MS = 320
const SAVE_FOOTER_HEIGHT = 96
const SAVE_FOOTER_SCROLL_GAP = 16
const MIN_FOOTER_ALIGN_WIDTH = 240

function useAnimatedFooterVisibility(isDirty: boolean) {
  const [mounted, setMounted] = useState(isDirty)
  const [visible, setVisible] = useState(isDirty)

  useEffect(() => {
    if (isDirty) {
      setMounted(true)
      const frame = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(frame)
    }

    setVisible(false)
    const timeout = window.setTimeout(
      () => setMounted(false),
      SAVE_FOOTER_ANIMATION_MS,
    )
    return () => window.clearTimeout(timeout)
  }, [isDirty])

  return { mounted, visible }
}

type NewsDraft = PortalNewsItem & {
  imageDraft: PortalNewsImageDraft | null
  clearedImage: boolean
}

type PortalEditorSnapshot = {
  weatherCity: string
  news: Array<{
    id: string
    title: string
    description: string
    sortOrder: number
    imageState: string | null
  }>
  milestones: PortalMilestoneItem[]
}

type PendingPortalDelete =
  | { kind: "news"; id: string; index: number; label: string }
  | { kind: "milestone"; id: string; index: number; label: string }

function formatPortalDeleteDescription(
  kind: PendingPortalDelete["kind"],
  index: number,
  label: string,
): string {
  const itemLabel = kind === "news" ? `Novedad ${index + 1}` : `Hito ${index + 1}`
  const trimmedLabel = label.trim()
  const nameFragment =
    trimmedLabel.length > 0 ? ` «${trimmedLabel}»` : kind === "news" ? " (sin título)" : " (sin nombre)"

  return `Vas a eliminar ${itemLabel}${nameFragment}. ¿Deseás continuar?`
}

type Props = {
  projectId: string
  initialData: PortalClientesData
  previewContext: PortalClientesPreviewContext
}

function mapDraftNewsToPreview(items: NewsDraft[]): PortalNewsItem[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    sortOrder: item.sortOrder,
    imageUrl: item.clearedImage
      ? null
      : item.imageDraft?.previewUrl ?? item.imageUrl,
  }))
}

function mapNewsToDraft(item: PortalNewsItem): NewsDraft {
  return {
    ...item,
    imageDraft: null,
    clearedImage: false,
  }
}

function buildEditorSnapshot(
  weatherCity: string,
  news: NewsDraft[],
  milestones: PortalMilestoneItem[],
): PortalEditorSnapshot {
  return {
    weatherCity,
    news: news.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      sortOrder: item.sortOrder,
      imageState: item.imageDraft
        ? `draft:${item.imageDraft.fileName}:${item.imageDraft.fileSize}`
        : item.clearedImage
          ? null
          : item.imageUrl,
    })),
    milestones,
  }
}

function snapshotsEqual(a: PortalEditorSnapshot, b: PortalEditorSnapshot): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function buildSnapshotFromData(data: PortalClientesData): PortalEditorSnapshot {
  return {
    weatherCity: data.weatherCity,
    news: data.news.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      sortOrder: item.sortOrder,
      imageState: item.imageUrl,
    })),
    milestones: data.milestones,
  }
}

type FooterAlign = {
  left: number
  width: number
}

function useContentFooterAlign(contentRef: RefObject<HTMLDivElement | null>) {
  const [align, setAlign] = useState<FooterAlign | null>(null)

  useEffect(() => {
    const node = contentRef.current
    if (!node) return

    const update = () => {
      const rect = node.getBoundingClientRect()
      if (rect.width < MIN_FOOTER_ALIGN_WIDTH) return

      const next = {
        left: Math.round(rect.left),
        width: Math.round(rect.width),
      }

      setAlign((current) => {
        if (
          current &&
          current.left === next.left &&
          current.width === next.width
        ) {
          return current
        }
        return next
      })
    }

    update()

    const observer = new ResizeObserver(update)
    observer.observe(node)

    const layoutRoot = node.closest("main")
    if (layoutRoot instanceof HTMLElement) {
      observer.observe(layoutRoot)
    }

    window.addEventListener("resize", update)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", update)
    }
  }, [contentRef])

  return align
}

function PortalSaveFooter({
  visible,
  saving,
  errorMessage,
  disableSave = false,
  onRequestDiscard,
  onSave,
  align,
}: {
  visible: boolean
  saving: boolean
  errorMessage: string | null
  disableSave?: boolean
  onRequestDiscard: () => void
  onSave: () => void
  align: FooterAlign | null
}) {
  const footerRef = useRef<HTMLDivElement>(null)
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    setPortalTarget(document.body)
  }, [])

  useLayoutEffect(() => {
    if (!visible) {
      setEntered(false)
      return
    }

    if (!align || entered) return

    setEntered(false)
    let innerFrame = 0
    const outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => {
        setEntered(true)
      })
    })

    return () => {
      cancelAnimationFrame(outerFrame)
      cancelAnimationFrame(innerFrame)
    }
  }, [align, entered, visible])

  if (!portalTarget || !align) return null

  return createPortal(
    <div
      aria-hidden={!visible}
      className="pointer-events-none fixed bottom-0 z-50"
      style={{
        left: align.left,
        width: align.width,
      }}
    >
      <div
        className={cn(
          "transition-[transform,opacity] ease-out will-change-transform",
          visible && entered
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-full opacity-0",
        )}
        style={{
          transitionDuration: `${SAVE_FOOTER_ANIMATION_MS}ms`,
        }}
      >
        <section
          ref={footerRef}
          data-viewport-bottom-inset={visible ? "" : undefined}
          className="pointer-events-auto w-full overflow-hidden rounded-t-[12px] border border-b-0 border-[#ffeae0] bg-[#fff6f1] px-[25px] py-[17px]"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="min-w-0 flex flex-col gap-0 leading-[1.4] text-[#111113]">
              <p className="text-[16px] font-medium">Cambios sin guardar</p>
              {errorMessage ? (
                <p className="mt-1 flex items-start gap-1.5 text-[14px] font-normal text-[#b91c1c]">
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span>{errorMessage}</span>
                </p>
              ) : (
                <p className="text-[14px] font-normal">
                  Guardá para que los cambios se vean reflejados en el portal.
                </p>
              )}
            </div>

            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onRequestDiscard}
                disabled={saving}
                className="h-auto min-h-[44px] w-full rounded-[10px] border-[#696e77] bg-transparent px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#363a3f] shadow-none hover:border-[#696e77] hover:bg-[#fff6f1] hover:text-[#272a2d] sm:w-auto"
              >
                Descartar cambios
              </Button>
              <Button
                type="button"
                variant="brand"
                size="brand"
                onClick={onSave}
                disabled={saving || disableSave}
                className="h-auto min-h-[44px] w-full gap-2 rounded-[10px] px-6 py-3 text-[14px] font-normal leading-[1.4] shadow-[0_0_10px_rgba(243,103,31,0.3)] sm:w-auto"
              >
                <Check className="size-4 shrink-0" aria-hidden />
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>,
    portalTarget,
  )
}

export function PortalClientesView({
  projectId,
  initialData,
  previewContext,
}: Props) {
  const toast = useToast()
  const contentRef = useRef<HTMLDivElement>(null)
  const footerAlign = useContentFooterAlign(contentRef)

  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const [weatherCity, setWeatherCity] = useState(initialData.weatherCity)
  const [newsItems, setNewsItems] = useState<NewsDraft[]>(() =>
    initialData.news.map(mapNewsToDraft),
  )
  const [milestones, setMilestones] = useState<PortalMilestoneItem[]>(
    () => initialData.milestones,
  )
  const [removedNewsIds, setRemovedNewsIds] = useState<string[]>([])
  const [removedMilestoneIds, setRemovedMilestoneIds] = useState<string[]>([])
  const [savedSnapshot, setSavedSnapshot] = useState<PortalEditorSnapshot>(() =>
    buildSnapshotFromData(initialData),
  )
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [newsFieldErrors, setNewsFieldErrors] = useState<
    Record<string, PortalNewsFieldErrors>
  >({})
  const [milestoneFieldErrors, setMilestoneFieldErrors] = useState<
    Record<string, PortalMilestoneFieldErrors>
  >({})
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<PendingPortalDelete | null>(null)

  const currentSnapshot = useMemo(
    () => buildEditorSnapshot(weatherCity, newsItems, milestones),
    [weatherCity, newsItems, milestones],
  )

  const isDirty = useMemo(
    () => !snapshotsEqual(currentSnapshot, savedSnapshot),
    [currentSnapshot, savedSnapshot],
  )
  const { mounted: footerMounted, visible: footerVisible } =
    useAnimatedFooterVisibility(isDirty)

  const footerScrollPadding =
    footerMounted && footerVisible
      ? SAVE_FOOTER_HEIGHT + SAVE_FOOTER_SCROLL_GAP
      : 0

  const clearNewsFieldError = (id: string, field: keyof PortalNewsFieldErrors) => {
    setNewsFieldErrors((current) => {
      const entry = current[id]
      if (!entry?.[field]) return current
      const nextEntry = { ...entry, [field]: undefined }
      if (!Object.values(nextEntry).some(Boolean)) {
        const { [id]: _removed, ...rest } = current
        return rest
      }
      return { ...current, [id]: nextEntry }
    })
  }

  const clearMilestoneFieldError = (
    id: string,
    field: keyof PortalMilestoneFieldErrors,
  ) => {
    setMilestoneFieldErrors((current) => {
      const entry = current[id]
      if (!entry?.[field]) return current
      const nextEntry = { ...entry, [field]: undefined }
      if (!Object.values(nextEntry).some(Boolean)) {
        const { [id]: _removed, ...rest } = current
        return rest
      }
      return { ...current, [id]: nextEntry }
    })
  }

  const serverDataKey = useMemo(
    () =>
      JSON.stringify({
        weatherCity: initialData.weatherCity,
        news: initialData.news,
        milestones: initialData.milestones,
      }),
    [initialData],
  )

  useEffect(() => {
    setWeatherCity(initialData.weatherCity)
    setNewsItems(initialData.news.map(mapNewsToDraft))
    setMilestones(initialData.milestones)
    setRemovedNewsIds([])
    setRemovedMilestoneIds([])
    setSavedSnapshot(buildSnapshotFromData(initialData))
    setSaveError(null)
    setNewsFieldErrors({})
    setMilestoneFieldErrors({})
  }, [projectId, serverDataKey, initialData])

  useEffect(() => {
    return () => {
      for (const item of newsItems) {
        revokePortalNewsPreview(item.imageDraft)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup previews on unmount
  }, [])

  const handleAddNews = () => {
    setNewsItems((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        title: "",
        description: "",
        imageUrl: null,
        sortOrder: current.length,
        imageDraft: null,
        clearedImage: false,
      },
    ])
  }

  const handleRemoveNews = (id: string) => {
    setNewsItems((current) => {
      const target = current.find((item) => item.id === id)
      revokePortalNewsPreview(target?.imageDraft ?? null)
      return current
        .filter((item) => item.id !== id)
        .map((item, index) => ({ ...item, sortOrder: index }))
    })
    setRemovedNewsIds((current) =>
      current.includes(id) ? current : [...current, id],
    )
    setNewsFieldErrors((current) => {
      if (!(id in current)) return current
      const { [id]: _removed, ...rest } = current
      return rest
    })
  }

  const handleAddMilestone = () => {
    setMilestones((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name: "",
        estimatedDate: null,
        status: "not_started",
        sortOrder: current.length,
      },
    ])
  }

  const handleRemoveMilestone = (id: string) => {
    setMilestones((current) =>
      current
        .filter((item) => item.id !== id)
        .map((item, index) => ({ ...item, sortOrder: index })),
    )
    setRemovedMilestoneIds((current) =>
      current.includes(id) ? current : [...current, id],
    )
    setMilestoneFieldErrors((current) => {
      if (!(id in current)) return current
      const { [id]: _removed, ...rest } = current
      return rest
    })
  }

  const requestRemoveNews = (id: string, index: number) => {
    const item = newsItems.find((entry) => entry.id === id)
    setPendingDelete({
      kind: "news",
      id,
      index,
      label: item?.title ?? "",
    })
  }

  const requestRemoveMilestone = (id: string, index: number) => {
    const item = milestones.find((entry) => entry.id === id)
    setPendingDelete({
      kind: "milestone",
      id,
      index,
      label: item?.name ?? "",
    })
  }

  const handleConfirmDelete = () => {
    if (!pendingDelete) return

    if (pendingDelete.kind === "news") {
      handleRemoveNews(pendingDelete.id)
    } else {
      handleRemoveMilestone(pendingDelete.id)
    }

    setPendingDelete(null)
  }

  const resetToSnapshot = (snapshot: PortalEditorSnapshot) => {
    for (const item of newsItems) {
      revokePortalNewsPreview(item.imageDraft)
    }

    setWeatherCity(snapshot.weatherCity)
    setNewsItems(
      snapshot.news.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        imageUrl: item.imageState,
        sortOrder: item.sortOrder,
        imageDraft: null,
        clearedImage: false,
      })),
    )
    setMilestones(snapshot.milestones)
    setRemovedNewsIds([])
    setRemovedMilestoneIds([])
    setSavedSnapshot(snapshot)
    setSaveError(null)
    setNewsFieldErrors({})
    setMilestoneFieldErrors({})
  }

  const handleDiscard = () => {
    resetToSnapshot(savedSnapshot)
    setDiscardDialogOpen(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)

    const newsImageState = Object.fromEntries(
      newsItems.map((item) => [
        item.id,
        {
          hasImageDraft: Boolean(item.imageDraft),
          clearedImage: item.clearedImage,
        },
      ]),
    )

    const newsPayload: Array<{
      id: string
      title: string
      description: string
      imageUrl: string | null
      sortOrder: number
    }> = newsItems.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      imageUrl: item.clearedImage ? null : item.imageUrl,
      sortOrder: item.sortOrder,
    }))

    const validation = validatePortalClientesContent(
      newsPayload,
      milestones,
      newsImageState,
    )

    if (!validation.ok) {
      setSaving(false)
      setNewsFieldErrors(validation.newsErrors)
      setMilestoneFieldErrors(validation.milestoneErrors)
      setSaveError(validation.error)
      return
    }

    setNewsFieldErrors({})
    setMilestoneFieldErrors({})

    for (let index = 0; index < newsItems.length; index += 1) {
      const item = newsItems[index]
      let imageUrl = item.clearedImage ? null : item.imageUrl

      if (item.imageDraft) {
        const uploadResult = await uploadPortalNewsImage(
          projectId,
          item.id,
          item.imageDraft.file,
        )
        if (!uploadResult.ok) {
          setSaving(false)
          setSaveError(uploadResult.error)
          return
        }
        imageUrl = uploadResult.publicUrl
      }

      newsPayload[index] = {
        id: item.id,
        title: item.title,
        description: item.description,
        imageUrl,
        sortOrder: item.sortOrder,
      }
    }

    const result = await savePortalClientesContent({
      projectId,
      weatherCity,
      news: newsPayload,
      milestones,
      removedNewsIds,
      removedMilestoneIds,
    })

    setSaving(false)

    if (!result.ok) {
      setSaveError(result.error)
      return
    }

    const nextSnapshot = buildSnapshotFromData(result.data)
    for (const item of newsItems) {
      revokePortalNewsPreview(item.imageDraft)
    }
    setWeatherCity(result.data.weatherCity)
    setNewsItems(result.data.news.map(mapNewsToDraft))
    setMilestones(result.data.milestones)
    setRemovedNewsIds([])
    setRemovedMilestoneIds([])
    setSavedSnapshot(nextSnapshot)
    toast.success("Cambios guardados correctamente.")
  }

  const previewData = useMemo(
    () => ({
      weatherCity,
      news: mapDraftNewsToPreview(newsItems),
      milestones,
      projectName: previewContext.projectName,
      projectLocation: "",
      projectEndDate: previewContext.projectEndDate,
      weather: previewContext.weather,
      units: previewContext.units,
    }),
    [milestones, newsItems, previewContext, weatherCity],
  )

  const openPreview = () => {
    setIsPreviewOpen(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const closePreview = () => {
    setIsPreviewOpen(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (isPreviewOpen) {
    return (
      <MiUnidadView
        projectId={projectId}
        data={previewData}
        greetingName={previewContext.greetingName}
        topSlot={<PortalClientesPreviewBanner onBackToEdit={closePreview} />}
      />
    )
  }

  return (
    <>
      <div
        ref={contentRef}
        className="mx-auto flex w-full flex-col"
        style={{ maxWidth: PORTAL_CLIENTES_LAYOUT.contentMaxWidth }}
      >
        <div
          className="flex flex-col gap-5"
          style={{ paddingBottom: footerScrollPadding }}
        >
          <div className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-col gap-0.5">
              <h1 className="font-recoleta text-[28px] font-normal leading-[1.05] text-[#272a2d]">
                Portal de Clientes
              </h1>
              <p className="text-[14px] leading-[1.4] text-[#43484e]">
                Mantené actualizada la información y el contenido visible para tus clientes.
              </p>
            </div>
            <button
              type="button"
              onClick={openPreview}
              disabled={saving}
              className="flex shrink-0 items-center gap-2 self-start rounded-[10px] border border-[#ffeae0] bg-white px-3 py-2 text-[14px] font-normal leading-[1.4] text-[#363a3f] shadow-[0_0_5px_rgba(243,103,31,0.08)] transition-colors hover:bg-[#fff6f1] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Eye className="size-4 shrink-0" aria-hidden />
              Vista previa
            </button>
          </div>

          <section className={cn(PORTAL_CARD_CLASSNAME, "flex flex-col gap-4")}>
            <div className="flex flex-col gap-0.5">
              <h2 className="text-[20px] font-normal leading-[1.4] text-[#18191b]">
                Clima en Mi Unidad
              </h2>
              <p className="text-[14px] leading-[1.4] text-[#43484e]">
                Ciudad que se usa para mostrar el clima a tus clientes.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-[14px] font-medium leading-[1.4] text-[#43484e]">
                Ciudad
              </p>
              <Input
                value={weatherCity}
                onChange={(event) => setWeatherCity(event.target.value)}
                placeholder="Buenos Aires"
                className={PORTAL_NEWS_TITLE_CLASSNAME}
              />
            </div>
          </section>

          <section className={cn(PORTAL_CARD_CLASSNAME, "flex flex-col gap-6")}>
            <h2 className="text-[20px] font-normal leading-[1.4] text-[#18191b]">
              Banner de Últimas Novedades
            </h2>

            {newsItems.length === 0 ? (
              <p className="text-[14px] leading-[1.4] text-[#696e77]">
                Todavía no hay novedades. Agregá la primera para mostrarla en el portal.
              </p>
            ) : (
              <div className="flex flex-col gap-6">
                {newsItems.map((item, index) => {
                  const itemErrors = newsFieldErrors[item.id]

                  return (
                  <div key={item.id} className="flex flex-col gap-1.5">
                    <div className="flex items-end justify-between gap-2">
                      <p className="text-[14px] font-medium leading-[1.4] text-[#43484e]">
                        Novedad {index + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() => requestRemoveNews(item.id, index)}
                        className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-[#696e77] transition-colors hover:bg-[#edeef0] hover:text-[#272a2d]"
                        aria-label={`Eliminar novedad ${index + 1}`}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>

                    <div className="flex w-full flex-col gap-2 min-[640px]:flex-row min-[640px]:items-stretch">
                      <div className="flex min-h-[122px] min-w-0 flex-1 flex-col gap-2 min-[640px]:self-stretch">
                        <PortalFieldErrorWrap error={itemErrors?.title} className="shrink-0">
                          <Input
                            value={item.title}
                            onChange={(event) => {
                              clearNewsFieldError(item.id, "title")
                              setNewsItems((current) =>
                                current.map((entry) =>
                                  entry.id === item.id
                                    ? { ...entry, title: event.target.value }
                                    : entry,
                                ),
                              )
                            }}
                            placeholder="Título"
                            aria-invalid={Boolean(itemErrors?.title)}
                            className={cn(
                              PORTAL_NEWS_TITLE_CLASSNAME,
                              itemErrors?.title && PORTAL_FIELD_ERROR_BORDER_CLASSNAME,
                            )}
                          />
                        </PortalFieldErrorWrap>
                        <PortalFieldErrorWrap
                          error={itemErrors?.description}
                          className="flex min-h-[72px] flex-1 flex-col"
                          fieldClassName="flex h-full min-h-0 flex-1 flex-col"
                          tooltipClassName="top-3 right-3 translate-y-0"
                        >
                          <textarea
                            value={item.description}
                            onChange={(event) => {
                              clearNewsFieldError(item.id, "description")
                              setNewsItems((current) =>
                                current.map((entry) =>
                                  entry.id === item.id
                                    ? { ...entry, description: event.target.value }
                                    : entry,
                                ),
                              )
                            }}
                            placeholder="Descripción..."
                            aria-invalid={Boolean(itemErrors?.description)}
                            className={cn(
                              PORTAL_NEWS_DESCRIPTION_CLASSNAME,
                              itemErrors?.description && PORTAL_FIELD_ERROR_BORDER_CLASSNAME,
                            )}
                          />
                        </PortalFieldErrorWrap>
                      </div>

                      <PortalNewsImageUpload
                        value={item.imageDraft}
                        existingImageUrl={
                          item.clearedImage ? null : item.imageUrl
                        }
                        errorMessage={itemErrors?.image ?? null}
                        onChange={(draft) => {
                          clearNewsFieldError(item.id, "image")
                          setNewsItems((current) =>
                            current.map((entry) =>
                              entry.id === item.id
                                ? {
                                    ...entry,
                                    imageDraft: draft,
                                    clearedImage: draft ? false : entry.clearedImage,
                                  }
                                : entry,
                            ),
                          )
                        }}
                        onExistingImageRemove={() => {
                          clearNewsFieldError(item.id, "image")
                          setNewsItems((current) =>
                            current.map((entry) =>
                              entry.id === item.id
                                ? {
                                    ...entry,
                                    imageUrl: null,
                                    clearedImage: true,
                                  }
                                : entry,
                            ),
                          )
                        }}
                      />
                    </div>
                  </div>
                  )
                })}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={handleAddNews}
              className={PORTAL_ADD_BUTTON_CLASSNAME}
            >
              <Plus className="size-3.5 text-[#696e77]" aria-hidden />
              Agregar novedad
            </Button>
          </section>

          <section className={cn(PORTAL_CARD_CLASSNAME, "flex flex-col gap-6")}>
            <h2 className="text-[20px] font-normal leading-[1.4] text-[#18191b]">
              Hitos de la construcción
            </h2>

            {milestones.length === 0 ? (
              <p className="text-[14px] leading-[1.4] text-[#696e77]">
                Todavía no hay hitos. Agregá el primero para mostrar el avance en el portal.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {milestones.map((item, index) => {
                  const itemErrors = milestoneFieldErrors[item.id]

                  return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 rounded-[10px] bg-[rgba(237,238,240,0.3)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:pl-6 sm:pr-4"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <PortalFieldErrorWrap
                          error={itemErrors?.name}
                          className="min-w-0 flex-1"
                        >
                          <input
                            type="text"
                            value={item.name}
                            onChange={(event) => {
                              clearMilestoneFieldError(item.id, "name")
                              setMilestones((current) =>
                                current.map((entry) =>
                                  entry.id === item.id
                                    ? { ...entry, name: event.target.value }
                                    : entry,
                                ),
                              )
                            }}
                            placeholder="Nombre del hito"
                            aria-invalid={Boolean(itemErrors?.name)}
                            className={cn(
                              PORTAL_MILESTONE_NAME_CLASSNAME,
                              "w-full",
                              itemErrors?.name &&
                                "rounded-[8px] border border-[#eb8e90] bg-white/60 px-2 py-1 pr-10",
                            )}
                          />
                        </PortalFieldErrorWrap>
                        <button
                          type="button"
                          onClick={() => requestRemoveMilestone(item.id, index)}
                          className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-[#696e77] transition-colors hover:bg-[#edeef0] hover:text-[#272a2d] sm:hidden"
                          aria-label={`Eliminar hito ${item.name || ` ${index + 1}`}`.trim()}
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-2">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[12px] leading-[1.4] tracking-[-0.36px] text-[#777b84]">
                          Fecha estimada
                        </span>
                        <PortalFieldErrorWrap error={itemErrors?.estimatedDate}>
                          <DatePicker
                            value={parseDraftDateString(item.estimatedDate ?? "")}
                            onChange={(date) => {
                              clearMilestoneFieldError(item.id, "estimatedDate")
                              setMilestones((current) =>
                                current.map((entry) =>
                                  entry.id === item.id
                                    ? {
                                        ...entry,
                                        estimatedDate: formatDraftDateString(date) || null,
                                      }
                                    : entry,
                                ),
                              )
                            }}
                            placeholder="--/--/----"
                            className={cn(
                              PORTAL_DATE_PICKER_CLASSNAME,
                              itemErrors?.estimatedDate && PORTAL_FIELD_ERROR_BORDER_CLASSNAME,
                            )}
                            popoverSide="top"
                          />
                        </PortalFieldErrorWrap>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-[12px] leading-[1.4] tracking-[-0.36px] text-[#777b84]">
                          Estado
                        </span>
                        <MilestoneStatusToggle
                          value={item.status}
                          onChange={(status: PortalMilestoneStatus) => {
                            clearMilestoneFieldError(item.id, "status")
                            setMilestones((current) =>
                              current.map((entry) =>
                                entry.id === item.id ? { ...entry, status } : entry,
                              ),
                            )
                          }}
                          errorMessage={itemErrors?.status ?? null}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => requestRemoveMilestone(item.id, index)}
                        className="hidden size-8 shrink-0 self-center items-center justify-center rounded-[8px] text-[#696e77] transition-colors hover:bg-[#edeef0] hover:text-[#272a2d] sm:flex"
                        aria-label={`Eliminar hito ${item.name || ` ${index + 1}`}`.trim()}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                  )
                })}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={handleAddMilestone}
              className={PORTAL_ADD_BUTTON_CLASSNAME}
            >
              <Plus className="size-3.5 text-[#696e77]" aria-hidden />
              Agregar hito
            </Button>
          </section>
        </div>
      </div>

      {footerMounted ? (
        <PortalSaveFooter
          visible={footerVisible}
          saving={saving}
          errorMessage={saveError}
          onRequestDiscard={() => setDiscardDialogOpen(true)}
          onSave={handleSave}
          align={footerAlign}
        />
      ) : null}

      <ConfirmActionDialog
        open={discardDialogOpen}
        onOpenChange={setDiscardDialogOpen}
        title="Descartar cambios"
        description="Se perderán los cambios que no guardaste en el portal de clientes."
        confirmLabel="Descartar cambios"
        cancelLabel="Seguir editando"
        onConfirm={handleDiscard}
      />

      <ConfirmActionDialog
        open={pendingDelete != null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title={
          pendingDelete?.kind === "news"
            ? "¿Eliminar novedad?"
            : pendingDelete?.kind === "milestone"
              ? "¿Eliminar hito?"
              : ""
        }
        description={
          pendingDelete
            ? formatPortalDeleteDescription(
                pendingDelete.kind,
                pendingDelete.index,
                pendingDelete.label,
              )
            : ""
        }
        confirmLabel="Eliminar"
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}
