<script setup lang="ts">
/* Closed until `formEndpoints.support` is set; "sent" is claimed only on a 2xx this code read back. */
import { ref, useId } from 'vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import TbdValue from '@/components/atoms/TbdValue.vue';
import TextField from '@/components/atoms/TextField.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import { t } from '@/content';
import { formEndpoints, game } from '@/data/universe';
import { useFormSubmit } from '@/composables/useFormSubmit';

const uid = useId();

const form = ref({ name: '', email: '', order: '', message: '' });

const trap = ref('');

const { status, open, sending, send, reject } = useFormSubmit(() => formEndpoints.support);

const emit = defineEmits<{ submit: [typeof form.value] }>();

async function onSubmit(): Promise<void> {
  /* Anti-spam honeypot: `trap` (the hidden `.c-support__aux` field) must stay present and hidden — a non-empty value means a bot. */
  if (trap.value !== '') {
    if (open.value && !sending.value) reject();
    return;
  }

  if (!(await send(form.value))) return;

  emit('submit', form.value);
  form.value = { name: '', email: '', order: '', message: '' };
}
</script>

<template>
  <form class="c-support" :class="{ 'c-support--sending': sending }" @submit.prevent="onSubmit">

    <fieldset class="c-support__set" :disabled="!open || sending" :aria-busy="sending">
      <div class="c-support__grid">
        <p class="c-support__field">
          <MonoLabel as="label" :for="`${uid}-name`">{{ t('support.name') }}</MonoLabel>
          <TextField :id="`${uid}-name`" v-model="form.name" shape="box" type="text" required />
        </p>
        <p class="c-support__field">
          <MonoLabel as="label" :for="`${uid}-email`">{{ t('support.email') }}</MonoLabel>
          <TextField :id="`${uid}-email`" v-model="form.email" shape="box" type="email" required />
        </p>
        <p class="c-support__field">
          <MonoLabel as="label" :for="`${uid}-order`">{{ t('support.order') }}</MonoLabel>
          <TextField :id="`${uid}-order`" v-model="form.order" shape="box" type="text" />
        </p>
      </div>

      <p class="c-support__field">
        <MonoLabel as="label" :for="`${uid}-message`">{{ t('support.message') }}</MonoLabel>
        <TextField
          :id="`${uid}-message`"
          v-model="form.message"
          as="textarea"
          shape="box"
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
        <UiButton
          type="submit"
          variant="primary"
          :aria-describedby="open ? undefined : `${uid}-closed`"
        >
          {{ sending ? t('support.sending') : t('support.submit') }}
        </UiButton>
      </div>
    </fieldset>

    <!-- The mailto fallback stays outside the fieldset: while the form is closed it is the only route to a human, so it must never be disabled. -->
    <p class="c-support__fallback">
      {{ t('support.fallback') }}
      <a v-if="game.supportEmail" :href="`mailto:${game.supportEmail}`">{{ game.supportEmail }}</a>
      <TbdValue v-else />
    </p>

    <p v-if="!open" :id="`${uid}-closed`" class="c-support__closed">{{ t('support.closed') }}</p>

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

.c-support__aux {
  display: none;
}

.c-support__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: center;
}

.c-support__fallback {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  font-size: var(--size-mono-m);
  color: var(--color-ink-faint);
}

/* The closed look comes from TextField's and UiButton's own :disabled, which a disabled fieldset triggers. */
.c-support--sending .c-support__set:disabled .c-field,
.c-support--sending .c-support__set:disabled .c-btn {
  cursor: progress;
}

.c-support__closed {
  padding: var(--space-3) var(--space-4);
  border: 1px dashed var(--color-line-dashed);
  border-radius: var(--radius-m);
  font-size: var(--size-m);
  line-height: 1.5;
  color: var(--color-ink-soft);
}

.c-support__done {
  padding: var(--space-3) var(--space-4);
  border: 1px solid rgba(var(--rgb-accent), 0.4);
  border-radius: var(--radius-m);
  background: rgba(var(--rgb-accent), 0.1);
  font-size: var(--size-m);
}

.c-support__error {
  padding: var(--space-3) var(--space-4);
  border: 1px solid rgba(var(--rgb-threat), 0.5);
  border-radius: var(--radius-m);
  background: rgba(var(--rgb-threat), 0.12);
  font-size: var(--size-m);
  line-height: 1.5;
  color: var(--color-ink);
}
</style>
