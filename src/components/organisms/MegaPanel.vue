<script setup lang="ts">
/**
 * One mega panel shell, four panels. One level deep, always: factions but
 * never brands, tracks but never rule sections.
 */
import { computed } from 'vue';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import BaseLink from '@/components/atoms/BaseLink.vue';
import FactionDot from '@/components/atoms/FactionDot.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import { t } from '@/content';
import { characters, factions } from '@/data/universe';
import { to } from '@/site/links';
import type { IaSection } from '@/site/ia';

const props = defineProps<{ section: IaSection }>();

const featured = computed(() => characters[0] ?? null);
const groups = computed(() => props.section.mega ?? []);
</script>

<template>
  <div class="c-mega">
    <div class="c-mega__inner l-wrap">
      <div v-for="group in groups" :key="group.key" class="c-mega__col">
        <MonoLabel tone="faint" class="c-mega__title">{{ t(`ia.${group.key}.label`) }}</MonoLabel>

        <template v-if="group.source === 'factions'">
          <BaseLink
            v-for="faction in factions"
            :key="faction.id"
            :to="to('faction', { factionId: faction.id })"
            class="c-mega__row c-mega__row--faction"
          >
            <FactionDot :color="faction.color" />
            {{ faction.name }}
          </BaseLink>
        </template>

        <template v-else>
          <BaseLink v-for="item in group.items" :key="item.key" :to="item.to" class="c-mega__row">
            <span class="c-mega__label">{{ t(`ia.${item.key}.label`) }}</span>
            <span v-if="item.note" class="c-mega__note">{{ t(`ia.${item.key}.note`) }}</span>
          </BaseLink>
        </template>
      </div>

      <BaseLink
        v-if="section.featuredCharacter && featured"
        :to="to('character', { characterId: featured.id })"
        class="c-mega__col c-mega__featured"
      >
        <MonoLabel tone="faint" class="c-mega__title">{{ t('chrome.featured') }}</MonoLabel>
        <span class="c-mega__art">
          <ArtFrame
            :art="featured.art"
            ratio="16 / 9"
            radius="m"
            :placeholder="t('chrome.featuredPlaceholder')"
          />
          <span class="c-mega__scrim" />
          <span class="c-mega__name">{{ featured.name }}</span>
        </span>
      </BaseLink>
    </div>
  </div>
</template>

<style>
.c-mega {
  border-top: 1px solid var(--color-line);
  background: rgba(var(--rgb-surface), 0.97);
  backdrop-filter: blur(18px);
}

.c-mega__inner {
  display: grid;
  grid-template-columns: 1.1fr 1fr 1.2fr;
  gap: var(--space-8);
  padding-block: var(--space-6) 28px;
}

.c-mega__title {
  display: block;
  margin-bottom: var(--space-3);
}

.c-mega__row {
  display: block;
  padding: var(--space-2) 10px;
  border-radius: var(--radius-s);
  color: var(--color-ink);
}

.c-mega__row:hover {
  background: rgba(var(--rgb-ink), 0.07);
  color: var(--color-ink);
  text-decoration: none;
}

.c-mega__row--faction {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  padding-block: 0;
  font-size: var(--size-m);
}

.c-mega__label {
  display: block;
  font-size: var(--size-m);
  font-weight: 500;
}

.c-mega__note {
  display: block;
  margin-top: 2px;
  font-size: var(--size-mono-m);
  color: rgba(var(--rgb-ink), 0.55);
}

.c-mega__featured {
  color: var(--color-ink);
}

.c-mega__featured:hover {
  text-decoration: none;
}

.c-mega__art {
  position: relative;
  display: block;
  border-radius: var(--radius-m);
  overflow: hidden;
  border-bottom: 2px solid var(--faction);
}

.c-mega__scrim {
  position: absolute;
  inset: 0;
  background: var(--scrim-bottom);
}

.c-mega__name {
  position: absolute;
  left: var(--space-3);
  bottom: 10px;
  font-family: var(--font-display);
  font-size: var(--size-field);
}
</style>
