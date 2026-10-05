/* One shared reading of the viewport for Home's hero and the bands under it, so they agree on when a live resize is under way. */
import { onBeforeUnmount, onMounted, readonly, ref } from 'vue';
import { viewHeight } from '@/composables/useMediaQuery';

const RESIZE_SETTLE = 200;

const vw = ref(window.innerWidth);
const vh = ref(viewHeight());
/* The small viewport (a phone's browser bars showing): steady while the bars hide and show mid-scroll. */
let svhProbe: HTMLElement | null = null;
function smallHeight(): number {
  if (!svhProbe && typeof CSS !== 'undefined' && CSS.supports('height', '100svh')) {
    svhProbe = document.createElement('div');
    svhProbe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100svh;visibility:hidden;pointer-events:none';
    document.body.append(svhProbe);
  }
  return Math.min(viewHeight(), svhProbe?.offsetHeight || Infinity);
}
const svh = ref(smallHeight());
/* The body's width: innerWidth and the root's clientWidth can both count base.css's scrollbar gutter. */
const pageW = ref(document.body.clientWidth);
const resizing = ref(false);
let settleTimer = 0;
let users = 0;
let observer: ResizeObserver | null = null;

/* At first use: the page may have resized since this module loaded, and that is not a live resize. */
function sync(): void {
  vw.value = window.innerWidth;
  vh.value = viewHeight();
  svh.value = smallHeight();
  pageW.value = document.body.clientWidth;
}

function read(): void {
  const w = window.innerWidth;
  const h = viewHeight();
  const pw = document.body.clientWidth;
  if (w === vw.value && h === vh.value && pw === pageW.value) return;
  vw.value = w;
  vh.value = h;
  svh.value = smallHeight();
  pageW.value = pw;
  resizing.value = true;
  window.clearTimeout(settleTimer);
  settleTimer = window.setTimeout(() => (resizing.value = false), RESIZE_SETTLE);
}

export function useViewport() {
  if (users === 0) sync();

  onMounted(() => {
    if (users++ > 0) return;
    window.addEventListener('resize', read);
    observer = new ResizeObserver(read);
    observer.observe(document.documentElement);
  });

  onBeforeUnmount(() => {
    if (--users > 0) return;
    window.removeEventListener('resize', read);
    observer?.disconnect();
    observer = null;
    window.clearTimeout(settleTimer);
    resizing.value = false;
  });

  return { vw: readonly(vw), vh: readonly(vh), svh: readonly(svh), pageW: readonly(pageW), resizing: readonly(resizing) };
}
