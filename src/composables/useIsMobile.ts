import { ref, onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'

const MOBILE_BREAKPOINT = 768
const DEBOUNCE_DELAY_MS = 150

export function useIsMobile(): { isMobile: Ref<boolean> } {
  const isMobile = ref<boolean>(
    typeof window !== 'undefined'
      ? window.innerWidth <= MOBILE_BREAKPOINT
      : false
  )

  let timerId: ReturnType<typeof setTimeout> | null = null

  function onResize(): void {
    if (timerId !== null) clearTimeout(timerId)
    timerId = setTimeout(() => {
      isMobile.value = window.innerWidth <= MOBILE_BREAKPOINT
      timerId = null
    }, DEBOUNCE_DELAY_MS)
  }

  onMounted(() => window.addEventListener('resize', onResize))
  onUnmounted(() => {
    window.removeEventListener('resize', onResize)
    if (timerId !== null) clearTimeout(timerId)
  })

  return { isMobile }
}
