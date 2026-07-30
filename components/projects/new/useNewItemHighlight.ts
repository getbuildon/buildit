"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { scrollIntoViewWithBottomInset } from "@/lib/dom/scrollIntoViewWithInset"
import { cn } from "@/lib/utils"

export const NEW_ITEM_HIGHLIGHT_CLASS = "new-item-highlight"

export function newItemHighlightClass(isHighlighted: boolean) {
  return cn(isHighlighted && NEW_ITEM_HIGHLIGHT_CLASS)
}

const MAX_SCROLL_ATTEMPTS = 24
const SCROLL_RETRY_DELAYS_MS = [0, 120, 360, 520] as const
const HIGHLIGHT_DURATION_MS = 2550

export function useNewItemHighlight(durationMs = HIGHLIGHT_DURATION_MS) {
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const timeoutRef = useRef<number | null>(null)
  const retryTimeoutsRef = useRef<number[]>([])

  const markAsNew = useCallback((id: string) => {
    setHighlightedId(id)
  }, [])

  const isHighlighted = useCallback(
    (id: string) => highlightedId === id,
    [highlightedId],
  )

  useLayoutEffect(() => {
    if (!highlightedId) return

    let cancelled = false
    let attempts = 0

    const scrollToHighlightedItem = () => {
      if (cancelled) return

      const element = document.querySelector<HTMLElement>(
        `[data-new-item-id="${CSS.escape(highlightedId)}"]`,
      )

      if (element) {
        scrollIntoViewWithBottomInset(element, { extraBottom: 40 })
        return true
      }

      if (attempts < MAX_SCROLL_ATTEMPTS) {
        attempts += 1
        requestAnimationFrame(scrollToHighlightedItem)
      }

      return false
    }

    const clearRetryTimeouts = () => {
      for (const timeoutId of retryTimeoutsRef.current) {
        window.clearTimeout(timeoutId)
      }
      retryTimeoutsRef.current = []
    }

    const scheduleScrollRetries = () => {
      clearRetryTimeouts()

      for (const delay of SCROLL_RETRY_DELAYS_MS) {
        const timeoutId = window.setTimeout(() => {
          if (cancelled) return
          scrollToHighlightedItem()
        }, delay)
        retryTimeoutsRef.current.push(timeoutId)
      }
    }

    const foundImmediately = scrollToHighlightedItem()
    if (!foundImmediately) {
      scheduleScrollRetries()
    } else {
      scheduleScrollRetries()
    }

    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => {
      setHighlightedId(null)
    }, durationMs)

    return () => {
      cancelled = true
      clearRetryTimeouts()
    }
  }, [durationMs, highlightedId])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [])

  return { markAsNew, isHighlighted }
}
