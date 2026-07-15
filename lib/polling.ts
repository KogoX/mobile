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
  const guardedRefresh = useGuardedRefresh(refreshFn)

  useFocusEffect(
    useCallback(() => {
      guardedRefresh()
      const timer = setInterval(guardedRefresh, intervalMs)
      return () => clearInterval(timer)
    }, [guardedRefresh, intervalMs])
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
