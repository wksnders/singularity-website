<script setup lang="ts">
/* Closed until `formEndpoints.support` is set; "sent" is claimed only on a 2xx this code read back. */
import { computed, ref } from 'vue';
import TbdValue from '@/components/atoms/TbdValue.vue';
import { t } from '@/content';
import { formEndpoints, game } from '@/data/universe';

type Status = 'idle' | 'sending' | 'done' | 'error';

const status = ref<Status>('idle');
const form = ref({ name: '', email: '', order: '', message: '' });

const trap = ref('');

const endpoint = computed(() => formEndpoints.support);
const open = computed(() => Boolean(endpoint.value));
const sending = computed(() => status.value === 'sending');

const emit = defineEmits<{ submit: [typeof form.value] }>();

const TIMEOUT_MS = 15000;

async function onSubmit(): Promise<void> {
  const target = endpoint.value;
  /* The `sending` guard is not redundant with the disabled button: Enter in a text field submits without it. */
  if (!target || sending.value) return;

  /* Anti-spam honeypot: `trap` (the hidden `.c-support__aux` field) must stay present and hidden — a non-empty value means a bot. */
  if (trap.value !== '') {
    status.value = 'error';
    return;
  }

  status.value = 'sending';

  const payload: Record<string, string> = { ...target.fields, ...form.value };

  try {
    const response = await fetch(target.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        /* Without this some providers answer with a redirect to their own thank-you page instead of a status this code can read. */
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) throw new Error(`support endpoint answered ${response.status}`);

    emit('submit', form.value);
    form.value = { name: '', email: '', order: '', message: '' };
    status.value = 'done';
  } catch (error) {
    console.error('[support] send failed', error);
    status.value = 'error';
  }
}
</script>

<template>
  <form class="c-support" :class="{ 'c-support--sending': sending }" @submit.prevent="onSubmit">

    <fieldset class="c-support__set" :disabled="!open || sending" :aria-busy="sending">
      <div class="c-support__grid">
        <p class="c-support__field">
          <label class="c-support__label" for="support-name">{{ t('support.name') }}</label>
          <input id="support-name" v-model="form.name" class="c-support__input" type="text" required />
        </p>
        <p class="c-support__field">
          <label class="c-support__label" for="support-email">{{ t('support.email') }}</label>
          <input
            id="support-email"
            v-model="form.email"
            class="c-support__input"
            type="email"
            required
          />
        </p>
        <p class="c-support__field">
          <label class="c-support__label" for="support-order">{{ t('support.order') }}</label>
          <input id="support-order" v-model="form.order" class="c-support__input" type="text" />
        </p>
      </div>

      <p class="c-support__field">
        <label class="c-support__label" for="support-message">{{ t('support.message') }}</label>
        <textarea
          id="support-message"
          v-model="form.message"
          class="c-support__input c-support__input--area"
          rows="5"
          required
        />
      </p>

      <input
        v-model="trap"
        class="c-support__aux"
        type="text"
        name="website"
        tabindex="-1"
        autocomplete="off"
      />

      <div class="c-support__actions">
        <button
          type="submit"
          class="c-support__submit"
          :aria-describedby="open ? undefined : 'support-closed'"
        >
          {{ sending ? t('support.sending') : t('support.submit') }}
        </button>
      </div>
    </fieldset>

    <!-- The mailto fallback stays outside the fieldset: while the form is closed it is the only route to a human, so it must never be disabled. -->
    <p class="c-support__fallback">
      {{ t('support.fallback') }}
      <a v-if="game.supportEmail" :href="`mailto:${game.supportEmail}`">{{ game.supportEmail }}</a>
      <TbdValue v-else />
    </p>

    <p v-if="!open" id="support-closed" class="c-support__closed">{{ t('support.closed') }}</p>

    <p v-if="status === 'done'" role="status" class="c-support__done">{{ t('support.done') }}</p>

    <!-- role="alert", not "status": the message is lost, so the failure has to interrupt. -->
    <p v-if="status === 'error'" role="alert" class="c-support__error">{{ t('support.error') }}</p>
  </form>
</template>

<style>
.c-support {
  display: grid;
  gap: var(--space-4);
}

.c-support__set {
  display: grid;
  gap: var(--space-4);
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
}

.c-support__grid {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.c-support__field {
  display: grid;
  gap: var(--space-2);
}

.c-support__label {
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-ink-soft);
}

.c-support__input {
  min-height: 48px;
  padding: 12px var(--space-4);
  background: var(--color-bg);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-m);
  color: var(--color-ink);
  font-size: var(--size-field);
}

.c-support__input--area {
  resize: vertical;
  line-height: 1.5;
}

.c-support__aux {
  display: none;
}

.c-support__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: center;
}

.c-support__submit {
  min-height: 48px;
  padding-inline: 24px;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.c-support__fallback {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  font-size: var(--size-mono-m);
  color: var(--color-ink-faint);
}

/* Closed state is quieted with ink/line tokens rather than opacity so the text keeps a known contrast ratio. */
.c-support__set:disabled .c-support__input {
  border-color: var(--color-line);
  color: var(--color-ink-faint);
  cursor: not-allowed;
}

.c-support__set:disabled .c-support__submit {
  background: transparent;
  border: 1px solid var(--color-line);
  color: var(--color-ink-faint);
  cursor: not-allowed;
}

.c-support--sending .c-support__set:disabled .c-support__input,
.c-support--sending .c-support__set:disabled .c-support__submit {
  cursor: progress;
}

.c-support__closed {
  padding: var(--space-3) 14px;
  border: 1px dashed var(--color-line-dashed);
  border-radius: var(--radius-m);
  font-size: var(--size-m);
  line-height: 1.5;
  color: var(--color-ink-soft);
}

.c-support__done {
  padding: var(--space-3) 14px;
  border: 1px solid rgba(var(--rgb-accent), 0.4);
  border-radius: var(--radius-m);
  background: rgba(var(--rgb-accent), 0.1);
  font-size: var(--size-m);
}

.c-support__error {
  padding: var(--space-3) 14px;
  border: 1px solid rgba(var(--rgb-threat), 0.5);
  border-radius: var(--radius-m);
  background: rgba(var(--rgb-threat), 0.12);
  font-size: var(--size-m);
  line-height: 1.5;
  color: var(--color-ink);
}
</style>
