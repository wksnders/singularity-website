<script setup lang="ts">
/**
 * Support triages before it collects: rules questions go to the FAQ and
 * Discord, and this form is for orders, refunds and missing pieces only.
 * Every field has a visible label.
 *
 * There is no support endpoint yet, so the form is CLOSED: the fields are
 * disabled and the note says so. Someone reporting a missing component must
 * never be told "sent" by a form that dropped the message.
 * `formEndpoints.support` in the data file is the one switch — see the
 * contract documented beside it before flipping it.
 */
import { computed, ref } from 'vue';
import TbdValue from '@/components/atoms/TbdValue.vue';
import { t } from '@/content';
import { formEndpoints, game } from '@/data/universe';

const done = ref(false);
const form = ref({ name: '', email: '', order: '', message: '' });

const open = computed(() => Boolean(formEndpoints.support));

const emit = defineEmits<{ submit: [typeof form.value] }>();

function onSubmit(): void {
  /* Closed forms cannot report success — see NewsletterForm for the same note. */
  if (!open.value) return;
  done.value = true;
  emit('submit', form.value);
}
</script>

<template>
  <form class="c-support" @submit.prevent="onSubmit">
    <!-- One fieldset gates every control at once, so a new field can never be
         added and left live while the form is closed. -->
    <fieldset class="c-support__set" :disabled="!open">
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

      <div class="c-support__actions">
        <button
          type="submit"
          class="c-support__submit"
          :aria-describedby="open ? undefined : 'support-closed'"
        >
          {{ t('support.submit') }}
        </button>
      </div>
    </fieldset>

    <!-- The way out stays OUTSIDE the fieldset: while the form is closed this
         is the only real route to a human, so it must never be disabled. -->
    <p class="c-support__fallback">
      {{ t('support.fallback') }}
      <a v-if="game.supportEmail" :href="`mailto:${game.supportEmail}`">{{ game.supportEmail }}</a>
      <TbdValue v-else />
    </p>

    <p v-if="!open" id="support-closed" class="c-support__closed">{{ t('support.closed') }}</p>

    <p v-if="done" role="status" class="c-support__done">{{ t('support.done') }}</p>
  </form>
</template>

<style>
.c-support {
  display: grid;
  gap: var(--space-4);
}

/* A fieldset used purely as a gate: no border, no padding, no layout of its own. */
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

/* Closed state: quieted with existing ink/line roles rather than opacity, so
   the text keeps a known contrast ratio instead of an unpredictable one. */
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
</style>
