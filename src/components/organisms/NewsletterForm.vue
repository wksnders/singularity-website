<script setup lang="ts">
// Submission stays disabled until `formEndpoints.newsletter` (src/data/universe.ts) holds an endpoint, so the form never claims to have sent what it did not send.
import { ref, useId } from 'vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import TextField from '@/components/atoms/TextField.vue';
import UiButton from '@/components/atoms/UiButton.vue';
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
  <form class="l-surface l-surface--pad c-newsletter" @submit.prevent="onSubmit">
    <MonoLabel tone="accent">{{ t('newsletter.kicker') }}</MonoLabel>
    <p class="c-newsletter__lede">{{ t('newsletter.lede') }}</p>

    <MonoLabel as="label" class="c-newsletter__label" :for="`${uid}-email`">{{ t('newsletter.label') }}</MonoLabel>
    <div class="c-newsletter__field">
      <TextField
        :id="`${uid}-email`"
        v-model="email"
        class="c-newsletter__input"
        type="email"
        name="email"
        required
        :disabled="!open || sending"
        :aria-describedby="open ? undefined : `${uid}-closed`"
        :placeholder="t('newsletter.placeholder')"
      />
      <UiButton
        type="submit"
        variant="secondary"
        :disabled="!open || sending"
        :aria-describedby="open ? undefined : `${uid}-closed`"
      >
        {{ t('newsletter.submit') }}
      </UiButton>
    </div>

    <p v-if="!open" :id="`${uid}-closed`" class="c-newsletter__closed">
      {{ t('newsletter.closed') }}
    </p>

    <p class="c-newsletter__fine">{{ t('newsletter.fine') }}</p>

    <p v-if="status === 'done'" role="status" class="c-newsletter__done">{{ t('newsletter.done') }}</p>

    <!-- role="alert", not "status": the address went nowhere, so the failure has to interrupt. -->
    <p v-if="status === 'error'" role="alert" class="c-newsletter__closed">{{ t('newsletter.error') }}</p>
  </form>
</template>

<style>
.c-newsletter__lede {
  margin-top: var(--space-3);
  font-size: var(--size-body);
  line-height: 1.5;
  color: var(--color-ink-muted);
}

.c-newsletter__label {
  display: block;
  margin-top: var(--space-5);
}

.c-newsletter__field {
  margin-top: var(--space-3);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.c-newsletter__input {
  flex: 1 1 180px;
}

.c-newsletter__closed {
  margin-top: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1px dashed var(--color-line-dashed);
  border-radius: var(--radius-m);
  font-size: var(--size-m);
  line-height: 1.5;
  color: var(--color-ink-soft);
}

.c-newsletter__fine {
  margin-top: var(--space-3);
  font-size: var(--size-mono-m);
  line-height: 1.5;
  color: var(--color-ink-faint);
}

.c-newsletter__done {
  margin-top: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1px solid rgba(var(--rgb-accent), 0.4);
  border-radius: var(--radius-m);
  background: rgba(var(--rgb-accent), 0.1);
  font-size: var(--size-m);
  line-height: 1.5;
}
</style>
