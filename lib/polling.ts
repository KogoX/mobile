import { useFocusEffect } from "expo-router"
import { useCallback, useRef } from "react"

function useGuardedRefresh(refreshFn: () => Promise<void>) {
  const inFlight = useRef(false)

  return useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    try {
      await refreshFn()
    } catch {
      // Network errors are logged by the api interceptor.
    } finally {
      inFlight.current = false
    }
  }, [refreshFn])
}

export function usePollingRefresh(refreshFn: () => Promise<void>, intervalMs = 8000) {
  // Overridden: aggressive polling disabled to save mobile data.
  // We now only refresh on screen focus.
  const guardedRefresh = useGuardedRefresh(refreshFn)

  useFocusEffect(
    useCallback(() => {
      guardedRefresh()
    }, [guardedRefresh])
  )
}

export function useFocusRefresh(refreshFn: () => Promise<void>) {
  const guardedRefresh = useGuardedRefresh(refreshFn)

  useFocusEffect(
    useCallback(() => {
      guardedRefresh()
    }, [guardedRefresh])
  )
}
