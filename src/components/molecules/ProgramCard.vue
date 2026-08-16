<script setup lang="ts">
/**
 * Card class 3 of 3 — a printed program card, plus its brand caption.
 *
 * The face itself is `CardFace`: image and wording together, always. An
 * unrevealed program renders as a sealed slot, not an empty card.
 */
import { computed } from 'vue';
import BrandMark from '@/components/atoms/BrandMark.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import CardFace from '@/components/molecules/CardFace.vue';
import { t } from '@/content';
import { expandIcons } from '@/site/cardText';
import type { CardLine } from '@/site/cardText';
import type { Program } from '@/data/types';

const props = defineProps<{
  program: Program;
  brandLabel?: string;
  /** `brand.icon`. Falls back to the faction dot when the mark has not shipped. */
  brandIcon?: string | null;
  color?: string | null;
  /** Sealed-in-the-box programs: locks are editorial, never tracked state. */
  sealedLabel?: string;
  /** Show the printed sub-type above the name. For a grid that is all one
      brand's cards, where the sub-type is the distinction worth drawing. */
  branded?: boolean;
}>();

/** Sub-type sits on the printed type line, not in a row of its own. */
const typeLine = computed(() =>
  props.program.subType ? `${props.program.type} · ${props.program.subType}` : props.program.type,
);

/**
 * The whole printed face, in printed order — everything a reader who cannot see
 * the card would otherwise lose. Name and brand are omitted only because the
 * visible caption below already carries them. A card prints `unlock` or
 * `flavour`, never both.
 */
const lines = computed<CardLine[]>(() =>
  [
    { label: t('cards.cost'), values: [props.program.cost] },
    { label: t('cards.type'), values: [typeLine.value] },
    { label: t('cards.rules'), values: props.program.rules.map(expandIcons) },
    props.program.unlock
      ? { label: t('cards.unlock'), values: [expandIcons(props.program.unlock)] }
      : { label: t('cards.flavour'), values: [props.program.flavour] },
    { label: t('cards.set'), values: [t(`cards.sets.${props.program.set}`)] },
  ].filter((line) => line.values.some(Boolean)),
);
</script>

<template>
  <div class="c-prog" :style="color ? { '--faction': color } : undefined">
    <CardFace
      v-if="program.revealed"
      :art="program.cardArt"
      :placeholder="t('cards.artPlaceholder')"
      :lines="lines"
    />
    <div v-else class="c-prog__sealed">
      <MonoLabel tone="faint">{{ sealedLabel || t('cards.unrevealed') }}</MonoLabel>
    </div>

    <div class="c-prog__caption">
      <MonoLabel v-if="branded && program.subType" class="c-prog__subtype">
        {{ program.subType }}
      </MonoLabel>
      <h3 class="c-prog__name">{{ program.revealed ? program.name : t('cards.unnamed') }}</h3>
      <p v-if="brandLabel" class="c-prog__brand">
        <BrandMark :icon="brandIcon" :name="brandLabel" :color="color" :size="20" />
        {{ brandLabel }}
      </p>

    </div>
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

.c-prog .c-prog__subtype {
  color: var(--faction-text);
}

</style>
