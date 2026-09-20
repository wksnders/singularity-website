<script setup lang="ts">
/* One of N and never none, so the chosen chip carries `aria-current`: `aria-pressed` would announce every printing as its own independent toggle. */
import MonoLabel from '@/components/atoms/MonoLabel.vue';

defineProps<{
  printings: readonly { id: string; label: string }[];
  activeId: string | null;
  /** Shown beside the chips, and the group's accessible name. */
  label: string;
}>();

defineEmits<{ select: [id: string] }>();
</script>

<template>
  <div v-if="printings.length > 1" class="c-printings">
    <MonoLabel tone="faint" as="span">{{ label }}</MonoLabel>
    <div class="c-printings__chips" role="group" :aria-label="label">
      <button
        v-for="printing in printings"
        :key="printing.id"
        type="button"
        class="c-printings__chip"
        :aria-current="printing.id === activeId ? 'true' : undefined"
        @click="$emit('select', printing.id)"
      >
        {{ printing.label }}
      </button>
    </div>
  </div>
</template>

<style>
.c-printings,
.c-printings__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}

/* No text-transform: a printing's label is a product name and shows as written. */
.c-printings__chip {
  min-height: 44px;
  padding-inline: var(--space-4);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-ink-soft);
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  letter-spacing: var(--track-mono-tight);
  cursor: pointer;
  white-space: nowrap;
}

.c-printings__chip[aria-current] {
  border-color: rgba(var(--rgb-accent), 0.55);
  background: var(--color-accent-wash);
  color: var(--color-ink);
}
</style>
