/* "Sent" is claimed only on a 2xx this code read back. That is why the endpoint must accept JSON and answer with CORS headers (see `FormEndpoint`): a provider that needs a real form POST or `mode: 'no-cors'` cannot be driven from here, because its result is unreadable. */

import { computed, ref } from 'vue';
import type { FormEndpoint } from '@/data/types';

export type SubmitStatus = 'idle' | 'sending' | 'done' | 'error';

const TIMEOUT_MS = 15000;

export function useFormSubmit(endpoint: () => FormEndpoint | null) {
  const status = ref<SubmitStatus>('idle');

  const open = computed(() => Boolean(endpoint()));
  const sending = computed(() => status.value === 'sending');

  /** Resolves true only when the endpoint answered 2xx. The caller clears its own fields on true and keeps them on false. */
  async function send(payload: Record<string, string>): Promise<boolean> {
    const target = endpoint();
    /* The `sending` guard is not redundant with a disabled button: Enter in a text field submits without it. */
    if (!target || sending.value) return false;

    status.value = 'sending';

    try {
      const response = await fetch(target.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          /* Without this some providers answer with a redirect to their own thank-you page instead of a status this code can read. */
          Accept: 'application/json',
        },
        body: JSON.stringify({ ...target.fields, ...payload }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (!response.ok) throw new Error(`form endpoint answered ${response.status}`);

      status.value = 'done';
      return true;
    } catch (error) {
      console.error('[form] send failed', error);
      status.value = 'error';
      return false;
    }
  }

  /** Report failure without sending: the honeypot's answer to a bot. */
  function reject(): void {
    status.value = 'error';
  }

  return { status: computed(() => status.value), open, sending, send, reject };
}
