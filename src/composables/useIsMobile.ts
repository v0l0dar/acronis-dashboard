import { ref, onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'

const MOBILE_BREAKPOINT = 768

export function useIsMobile(): { isMobile: Ref<boolean> } {
  const isMobile = ref<boolean>(
    typeof window !== 'undefined'
      ? window.innerWidth <= MOBILE_BREAKPOINT
      : false
  )

  function onResize(): void {
    isMobile.value = window.innerWidth <= MOBILE_BREAKPOINT
  }

  onMounted(() => window.addEventListener('resize', onResize))
  onUnmounted(() => window.removeEventListener('resize', onResize))

  return { isMobile }
}
