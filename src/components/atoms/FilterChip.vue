<script setup lang="ts">
// Must stay visually distinct from JumpChip (pill, sentence case, aria-pressed) so a filter never reads as navigation.
defineProps<{
  active: boolean;
  color?: string | null;
  showDot?: boolean;
  count?: number;
}>();
defineEmits<{ toggle: [] }>();
</script>

<template>
  <button
    type="button"
    class="c-chip"
    :class="{ 'is-active': active }"
    :aria-pressed="active"
    :style="color ? { '--faction': color } : undefined"
    @click="$emit('toggle')"
  >
    <span v-if="showDot" class="c-chip__dot" aria-hidden="true" />
    <slot />
    <span v-if="count !== undefined" class="c-chip__count">{{ count }}</span>
  </button>
</template>

<style>
.c-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 44px;
  padding-inline: 16px;
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-ink-muted);
  font-size: var(--size-m);
  white-space: nowrap;
  cursor: pointer;
  transition:
    background var(--dur-2) var(--ease-out),
    border-color var(--dur-2) var(--ease-out),
    color var(--dur-2) var(--ease-out);
}

.c-chip:hover {
  background: rgba(var(--rgb-ink), 0.06);
  color: var(--color-ink);
}

.c-chip.is-active {
  background: var(--color-accent-wash);
  border-color: rgba(var(--rgb-accent), 0.45);
  color: var(--color-ink);
}

.c-chip__count {
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  color: var(--color-ink-soft);
}

.c-chip__dot {
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
  border-radius: var(--radius-pill);
  background: var(--faction);
}
</style>
