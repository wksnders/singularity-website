<script setup lang="ts">
/**
 * Card class 3 of 3 — a printed program card.
 * The card IS an image (63×88, the printed proportions); its wording is DATA,
 * shown in a disclosure below, which is what makes the gallery searchable,
 * screen-readable, errata-linkable and translatable without redrawing anything.
 * An unrevealed program renders as a sealed slot, not an empty card.
 */
import { ref } from 'vue';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import BrandMark from '@/components/atoms/BrandMark.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import { t } from '@/content';
import type { Program } from '@/data/types';

const props = defineProps<{
  program: Program;
  brandLabel?: string;
  /** `brand.icon`. Falls back to the faction dot when the mark has not shipped. */
  brandIcon?: string | null;
  color?: string | null;
  /** Sealed-in-the-box programs: locks are editorial, never tracked state. */
  sealedLabel?: string;
}>();

const open = ref(false);
const cardId = `card-${props.program.id}`;
</script>

<template>
  <div class="c-prog" :style="color ? { '--faction': color } : undefined">
    <ArtFrame
      v-if="program.revealed"
      :art="program.art"
      ratio="63 / 88"
      radius="s"
      :placeholder="t('cards.artPlaceholder')"
    />
    <div v-else class="c-prog__sealed">
      <MonoLabel tone="faint">{{ sealedLabel || t('cards.unrevealed') }}</MonoLabel>
    </div>

    <div class="c-prog__caption">
      <h3 class="c-prog__name">{{ program.revealed ? program.name : t('cards.unnamed') }}</h3>
      <p v-if="brandLabel" class="c-prog__brand">
        <BrandMark :icon="brandIcon" :name="brandLabel" :color="color" :size="20" />
        {{ brandLabel }}
      </p>
    </div>

    <template v-if="program.revealed">
      <button
        type="button"
        class="c-prog__toggle"
        :aria-expanded="open"
        :aria-controls="cardId"
        @click="open = !open"
      >
        {{ t('cards.cardText') }} {{ open ? '▴' : '▾' }}
      </button>
      <dl v-show="open" :id="cardId" class="c-prog__text">
        <dt>{{ t('cards.cost') }}</dt>
        <dd>{{ program.cost }}</dd>
        <dt>{{ t('cards.type') }}</dt>
        <dd>{{ program.type }}</dd>
        <dt>{{ t('cards.rules') }}</dt>
        <dd>{{ program.rules }}</dd>
        <dt>{{ t('cards.flavour') }}</dt>
        <dd class="c-prog__flavour">{{ program.flavour }}</dd>
      </dl>
    </template>
  </div>
</template>

<style>
.c-prog {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.c-prog__sealed {
  display: grid;
  place-items: center;
  aspect-ratio: 63 / 88;
  padding: var(--space-3);
  border: 1px dashed var(--color-line-dashed);
  border-radius: var(--radius-s);
  text-align: center;
}

.c-prog__caption {
  display: grid;
  gap: var(--space-1);
}

.c-prog__name {
  font-family: var(--font-body);
  font-size: var(--size-m);
  font-weight: 500;
  letter-spacing: normal;
}

.c-prog__brand {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: var(--size-mono-m);
  color: var(--color-ink-faint);
}

.c-prog__toggle {
  align-self: start;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-accent-text);
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
}

.c-prog__text {
  margin: 0;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-1) var(--space-3);
  font-size: var(--size-mono-m);
  line-height: 1.5;
}

.c-prog__text dt {
  font-family: var(--font-mono);
  font-size: var(--size-mono-xs);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-ink-faint);
}

.c-prog__text dd {
  margin: 0;
  color: var(--color-ink-muted);
}

.c-prog__flavour {
  font-style: italic;
}
</style>
