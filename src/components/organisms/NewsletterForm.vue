<script setup lang="ts">
// Submission stays disabled until `formEndpoints.newsletter` (src/data/universe.ts) holds an endpoint, so the form never claims to have sent what it did not send.
import { ref, useId } from 'vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import TextField from '@/components/atoms/TextField.vue';
import { t } from '@/content';
import { formEndpoints } from '@/data/universe';
import { useFormSubmit } from '@/composables/useFormSubmit';

const uid = useId();
const email = ref('');

const { status, open, sending, send } = useFormSubmit(() =>
  formEndpoints.newsletter ? { url: formEndpoints.newsletter } : null,
);

async function onSubmit(): Promise<void> {
  if (await send({ email: email.value })) email.value = '';
}
</script>

<template>
  <form class="c-newsletter" @submit.prevent="onSubmit">
    <MonoLabel tone="accent" class="c-newsletter__tab">{{ t('newsletter.kicker') }}</MonoLabel>
    <h3 class="c-newsletter__title">{{ t('newsletter.title') }}</h3>
    <p class="c-newsletter__lede">{{ t('newsletter.lede') }}</p>

    <div class="c-newsletter__field">
      <span class="c-newsletter__box">
        <label class="l-sr-only" :for="`${uid}-email`">{{ t('newsletter.label') }}</label>
        <TextField
          :id="`${uid}-email`"
          v-model="email"
          type="email"
          name="email"
          required
          :disabled="!open || sending"
          :aria-describedby="open ? undefined : `${uid}-closed`"
          :placeholder="t('newsletter.placeholder')"
        />
      </span>
      <button
        type="submit"
        class="c-newsletter__submit"
        :disabled="!open || sending"
        :aria-describedby="open ? undefined : `${uid}-closed`"
      >
        {{ t('newsletter.submit') }}
      </button>
    </div>

    <p v-if="!open" :id="`${uid}-closed`" class="c-newsletter__note">
      {{ t('newsletter.closed') }}
    </p>

    <p class="c-newsletter__fine">{{ t('newsletter.fine') }}</p>

    <p v-if="status === 'done'" role="status" class="c-newsletter__note c-newsletter__note--done">
      {{ t('newsletter.done') }}
    </p>

    <!-- role="alert", not "status": the address went nowhere, so the failure has to interrupt. -->
    <p v-if="status === 'error'" role="alert" class="c-newsletter__note">{{ t('newsletter.error') }}</p>
  </form>
</template>

<style>
/* `--shape` cuts the kicker's tab: change it with --tab-w and --tab-h, which stay in rem so the tab grows with its text. */
.c-newsletter {
  --tab-w: min(13.375rem, 100% - 2.5rem);
  --tab-h: 1.875rem;
  --shape: polygon(0 0, var(--tab-w) 0, calc(var(--tab-w) + var(--tab-h)) var(--tab-h), 100% var(--tab-h), 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%);
  --glow-at: 100% 100%;

  position: relative;
  isolation: isolate;
  padding: calc(var(--tab-h) + 14px) 22px 22px;
}

.c-newsletter::before,
.c-newsletter::after {
  content: '';
  position: absolute;
  clip-path: var(--shape);
  pointer-events: none;
}

.c-newsletter::before {
  inset: 0;
  z-index: -2;
  background: rgba(var(--rgb-accent-text), 0.5);
}

.c-newsletter::after {
  inset: 1.5px;
  z-index: -1;
  background:
    radial-gradient(110% 80% at var(--glow-at), rgba(var(--rgb-uv-glow), 0.34), rgba(var(--rgb-uv-glow), 0) 60%),
    rgba(var(--rgb-plate), 0.94);
}

.c-newsletter__tab {
  position: absolute;
  left: var(--space-5);
  top: 0;
  max-width: calc(var(--tab-w) - var(--space-6));
  height: var(--tab-h);
  display: flex;
  align-items: center;
  line-height: 1.15;
}

.c-newsletter__title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.312rem;
  line-height: 1.15;
}

.c-newsletter__lede {
  margin-top: var(--space-2);
  font-size: var(--size-m);
  line-height: 1.5;
  color: rgba(var(--rgb-ink), 0.82);
}

.c-newsletter__field {
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.c-newsletter__box {
  --chamfer: polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px);

  position: relative;
  isolation: isolate;
  flex: 1 1 150px;
  display: flex;
}

.c-newsletter__box::before,
.c-newsletter__box::after {
  content: '';
  position: absolute;
  z-index: -1;
  clip-path: var(--chamfer);
}

.c-newsletter__box::before {
  inset: 0;
  background: rgba(var(--rgb-accent-text), 0.35);
}

.c-newsletter__box::after {
  inset: 1px;
  background: rgba(var(--rgb-bg), 0.9);
}

.c-newsletter__box .c-field {
  border: 0;
  border-radius: 0;
  background: transparent;
}

.c-newsletter__submit {
  position: relative;
  isolation: isolate;
  min-height: 48px;
  padding: 0 26px;
  border: 0;
  background: transparent;
  color: var(--color-ink-bright);
  font: inherit;
  font-size: var(--size-body);
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  filter: drop-shadow(0 0 14px rgba(var(--rgb-uv-glow), 0.45));
}

.c-newsletter__submit::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: var(--color-uv);
  clip-path: polygon(16px 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 16px 100%, 0 50%);
}

.c-newsletter__submit:disabled {
  color: var(--color-ink-faint);
  cursor: not-allowed;
}

.c-newsletter__submit:disabled::before {
  background: rgba(var(--rgb-uv), 0.35);
}

.c-newsletter__fine {
  margin-top: 10px;
  font-size: var(--size-label-m);
  line-height: 1.5;
  color: var(--color-ink-soft);
}

.c-newsletter__note {
  margin-top: var(--space-3);
  padding: var(--space-3) 14px;
  border: 1px dashed var(--color-line-dashed);
  font-size: var(--size-m);
  line-height: 1.5;
  color: var(--color-ink-soft);
}

.c-newsletter__note--done {
  border: 1px solid rgba(var(--rgb-accent), 0.4);
  background: rgba(var(--rgb-accent), 0.1);
  color: var(--color-ink);
  clip-path: polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px);
}
</style>
