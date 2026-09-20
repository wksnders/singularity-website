
import { onBeforeUnmount, onMounted } from 'vue';

export function useSlashFocus(
  /** Called at keypress time, so it may pick between fields — and may prepare the one it returns. */
  getField: () => HTMLElement | null | undefined,
  options: {
    /** False while the field is unreachable — behind an open dialog it is inert, and focusing it would swallow the keystroke or type behind the dialog. */
    enabled?: () => boolean;
  } = {},
): void {
  function onKeydown(event: KeyboardEvent): void {
    /* Never swallow modified presses: Ctrl+/ and Cmd+/ belong to the browser and to assistive tech. */
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
    if (options.enabled && !options.enabled()) return;
    /* Nor a keystroke from somewhere the reader is already typing or choosing. */
    const target = event.target as HTMLElement | null;
    if (target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable)) {
      return;
    }
    event.preventDefault();
    getField()?.focus();
  }

  onMounted(() => window.addEventListener('keydown', onKeydown));
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
}
