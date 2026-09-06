<script setup lang="ts">
// Sealed programs are editorial: sealedLabel locks are never tracked state.
import { computed } from 'vue';
import BaseLink from '@/components/atoms/BaseLink.vue';
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

  brandTo?: import('vue-router').RouteLocationRaw;

  brandIcon?: string | null;
  color?: string | null;

  sealedLabel?: string;

  branded?: boolean;
}>();

defineEmits<{ select: [] }>();

const typeLine = computed(() =>
  props.program.subType ? `${props.program.type} · ${props.program.subType}` : props.program.type,
);

// These lines are the card's screen-reader-only text, in printed order; a card prints unlock or flavour, never both.
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
      class="c-prog__open"
      sizes="200px"
      :art="program.cardArt"
      :placeholder="t('cards.artPlaceholder')"
      :lines="lines"
      :action-label="`${t('character.enlarge')}: ${program.name}`"
      @select="$emit('select')"
    >
      <template #overlay>
        <span class="c-prog__zoom" aria-hidden="true">{{ t('character.enlarge') }}</span>
      </template>
    </CardFace>
    <div v-else class="c-prog__sealed">
      <MonoLabel tone="faint">{{ sealedLabel || t('cards.unrevealed') }}</MonoLabel>
    </div>

    <div class="c-prog__caption">
      <MonoLabel v-if="branded && program.subType" class="c-prog__subtype">
        {{ program.subType }}
      </MonoLabel>
      <h3 class="c-prog__name">{{ program.revealed ? program.name : t('cards.unnamed') }}</h3>
      <p v-if="brandLabel" class="c-prog__brand">
        <BaseLink v-if="brandTo" :to="brandTo" class="c-prog__brand-link">
          <BrandMark :icon="brandIcon" :name="brandLabel" :color="color" :size="20" />
          {{ brandLabel }}
        </BaseLink>
        <template v-else>
          <BrandMark :icon="brandIcon" :name="brandLabel" :color="color" :size="20" />
          {{ brandLabel }}
        </template>
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

.c-prog__open {
  display: block;
  width: 100%;
}

.c-prog__zoom {
  position: absolute;
  right: var(--space-2);
  bottom: var(--space-2);
  padding: 3px 7px;
  border-radius: var(--radius-s);
  background: rgba(var(--rgb-bg), 0.8);
  font-family: var(--font-mono);
  font-size: var(--size-mono-xs);
  letter-spacing: var(--track-mono);
  text-transform: uppercase;
  color: var(--color-accent-text);
  opacity: 0;
  transition: opacity var(--dur-2) var(--ease-out);
}

/* focus-WITHIN: the focus lands on the button inside, not on this wrapper. */
.c-prog__open:hover .c-prog__zoom,
.c-prog__open:focus-within .c-prog__zoom {
  opacity: 1;
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

.c-prog__brand-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 44px;
  color: inherit;
}

.c-prog__brand-link:hover,
.c-prog__brand-link:focus-visible {
  color: var(--color-accent-text);
}

.c-prog .c-prog__subtype {
  color: var(--faction-text);
}

</style>
