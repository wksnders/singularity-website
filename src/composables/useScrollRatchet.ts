import { onBeforeUnmount, onMounted } from 'vue';
import type { Ref } from 'vue';
import { prefersReducedMotion } from '@/composables/useMediaQuery';

/** Drifts each `[data-pace]` child on downward scroll only. Each must hold its content twice: it wraps at half its height. */
export function useScrollRatchet(root: Ref<HTMLElement | null>): { refresh: () => void } {
  let active = false;
  let frame = 0;
  let lastY = 0;
  let travel = 0;
  let heights = new WeakMap<HTMLElement, { cells: number; half: number }>();

  function turn(): void {
    frame = 0;
    const y = window.scrollY;
    if (y > lastY) travel += y - lastY;
    lastY = y;
    if (!root.value || y > window.innerHeight * 1.2) return;
    /* Read every height before writing any transform, or each write forces a layout. */
    const columns = [...root.value.querySelectorAll<HTMLElement>('[data-pace]')];
    const halves = columns.map((column) => {
      const cells = column.firstElementChild?.childElementCount ?? 0;
      const cached = heights.get(column);
      if (cached?.cells === cells) return cached.half;
      const half = column.offsetHeight / 2 || 1;
      heights.set(column, { cells, half });
      return half;
    });
    columns.forEach((column, i) => {
      const offset = (travel * Number(column.dataset.pace)) % halves[i];
      column.style.transform = `translateY(${(offset - halves[i]).toFixed(1)}px)`;
    });
  }

  function onResize(): void {
    heights = new WeakMap();
  }

  function onScroll(): void {
    if (!frame) frame = requestAnimationFrame(turn);
  }

  function refresh(): void {
    if (active) onScroll();
  }

  onMounted(() => {
    if (prefersReducedMotion()) return;
    active = true;
    lastY = window.scrollY;
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
  });

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    if (frame) cancelAnimationFrame(frame);
  });

  return { refresh };
}
