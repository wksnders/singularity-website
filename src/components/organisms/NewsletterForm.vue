<script setup lang="ts">
/**
 * A real form: visible label, one field, a submit that reports back.
 *
 * There is no list provider yet, so the form is CLOSED: the field and the
 * button are disabled and the note says so. It never claims to have sent
 * anything it did not send. `formEndpoints.newsletter` in the data file is the
 * one switch — see the contract documented beside it before flipping it.
 */
import { computed, ref } from 'vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import { t } from '@/content';
import { formEndpoints } from '@/data/universe';

const email = ref('');
const done = ref(false);

const open = computed(() => Boolean(formEndpoints.newsletter));

const emit = defineEmits<{ submit: [string] }>();

function onSubmit(): void {
  /* Closed forms cannot report success. The button is disabled too; this is
     the belt to that pair of braces (Enter in a text field also submits). */
  if (!open.value) return;
  done.value = true;
  emit('submit', email.value);
}
</script>

<template>
  <form class="c-newsletter" @submit.prevent="onSubmit">
    <MonoLabel tone="accent">{{ t('newsletter.kicker') }}</MonoLabel>
    <p class="c-newsletter__lede">{{ t('newsletter.lede') }}</p>

    <label class="c-newsletter__label" for="newsletter-email">{{ t('newsletter.label') }}</label>
    <div class="c-newsletter__field">
      <input
        id="newsletter-email"
        v-model="email"
        class="c-newsletter__input"
        type="email"
        name="email"
        required
        :disabled="!open"
        :aria-describedby="open ? undefined : 'newsletter-closed'"
        :placeholder="t('newsletter.placeholder')"
      />
      <button
        type="submit"
        class="c-newsletter__submit"
        :disabled="!open"
        :aria-describedby="open ? undefined : 'newsletter-closed'"
      >
        {{ t('newsletter.submit') }}
      </button>
    </div>

    <!-- Not a defect message: a reserved slot admitting the gap, like [ TBD ]. -->
    <p v-if="!open" id="newsletter-closed" class="c-newsletter__closed">
      {{ t('newsletter.closed') }}
    </p>

    <p class="c-newsletter__fine">{{ t('newsletter.fine') }}</p>

    <p v-if="done" role="status" class="c-newsletter__done">{{ t('newsletter.done') }}</p>
  </form>
</template>

<style>
.c-newsletter {
  padding: clamp(20px, 3vw, 28px);
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-l);
}

.c-newsletter__lede {
  margin-top: var(--space-3);
  font-size: var(--size-body);
  line-height: 1.5;
  color: var(--color-ink-muted);
}

.c-newsletter__label {
  display: block;
  margin-top: var(--space-5);
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-ink-soft);
}

.c-newsletter__field {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.c-newsletter__input {
  flex: 1 1 180px;
  min-height: 48px;
  padding-inline: var(--space-4);
  background: var(--color-bg);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-pill);
  color: var(--color-ink);
  font-size: var(--size-field);
}

.c-newsletter__submit {
  min-height: 48px;
  padding-inline: 22px;
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-ink);
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}

/* Closed state: quieted with existing ink/line roles rather than opacity, so
   the text keeps a known contrast ratio instead of an unpredictable one. */
.c-newsletter__input:disabled,
.c-newsletter__submit:disabled {
  border-color: var(--color-line);
  color: var(--color-ink-faint);
  cursor: not-allowed;
}

.c-newsletter__closed {
  margin-top: var(--space-3);
  padding: var(--space-3) 14px;
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
  padding: var(--space-3) 14px;
  border: 1px solid rgba(var(--rgb-accent), 0.4);
  border-radius: var(--radius-m);
  background: rgba(var(--rgb-accent), 0.1);
  font-size: var(--size-m);
  line-height: 1.5;
}
</style>
