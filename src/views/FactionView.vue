<script setup lang="ts">
/**
 * FACTION — the one page where a faction takes the whole page over. Colour
 * arrives as --faction / --faction-text from data, so faction five needs no new
 * CSS and no new template. Brands carry their own stories, not just card lists.
 */
import { computed } from 'vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import Breadcrumbs from '@/components/molecules/Breadcrumbs.vue';
import BrandTile from '@/components/molecules/BrandTile.vue';
import ContentCard from '@/components/molecules/ContentCard.vue';
import EmptyState from '@/components/molecules/EmptyState.vue';
import EntityTile from '@/components/molecules/EntityTile.vue';
import MarkdownBlock from '@/components/molecules/MarkdownBlock.vue';
import PageHero from '@/components/organisms/PageHero.vue';
import { useDocumentTitle } from '@/composables/useDocumentTitle';
import { docHtml, getDoc, metaString, t } from '@/content';
import { brandSlotCount, brandsOfFaction, characters, factionById, factions } from '@/data/universe';
import { to } from '@/site/links';
import type { Brand, Character } from '@/data/types';

const props = defineProps<{ factionId: string }>();

const faction = computed(() => factionById(props.factionId));
const doc = computed(() => getDoc(`universe/factions/${props.factionId}`));
const hasLore = computed(() => Boolean(docHtml(doc.value)));

const name = computed(() => metaString(doc.value, 'name', faction.value?.name ?? ''));
const tagline = computed(() => metaString(doc.value, 'tagline', faction.value?.tagline ?? ''));
const shortName = computed(() => metaString(doc.value, 'shortName', name.value));

useDocumentTitle(() => name.value);

const brands = computed(() => (faction.value ? brandsOfFaction(faction.value.id) : []));
const programCount = computed(() =>
  brands.value.reduce((total, brand) => total + brandSlotCount(brand), 0),
);

const cast = computed<Character[]>(() =>
  faction.value
    ? characters.filter(
        (c) => Array.isArray(c.factionIds) && c.factionIds.includes(faction.value!.id),
      )
    : [],
);

/** Lateral hops: the spine walks sideways through the factions. */
const neighbours = computed(() => {
  const index = factions.findIndex((f) => f.id === props.factionId);
  if (index < 0) return { prev: null, next: null, position: null };
  const prev = factions[(index - 1 + factions.length) % factions.length];
  const next = factions[(index + 1) % factions.length];
  return {
    prev: { label: prev.name, to: to('faction', { factionId: prev.id }) },
    next: { label: next.name, to: to('faction', { factionId: next.id }) },
    position: { label: t('faction.hero.position'), index: index + 1, total: factions.length },
  };
});

const tags = (character: Character) =>
  Array.isArray(character.factionIds)
    ? character.factionIds
        .map((id) => factionById(id))
        .filter((f): f is NonNullable<ReturnType<typeof factionById>> => Boolean(f))
        .map((f) => ({ label: f.name, color: f.color }))
    : [{ label: t('universe.anyFaction'), color: null }];

const brandNote = (brand: Brand) => `${brandSlotCount(brand)} ${t('faction.stats.programs')}`;
</script>

<template>
  <div
    v-if="faction"
    class="faction"
    :style="{ '--faction': faction.color, '--faction-text': faction.colorText }"
  >
    <PageHero
      :placeholder="t('faction.hero.artPlaceholder')"
      :pending-note="t('faction.hero.pending')"
      glow="110% 80% at 76% 8%"
      min-height="min(80dvh, 720px)"
    >
      <Breadcrumbs
        :crumbs="[{ label: t('ia.universe.label'), to: to('universe') }, { label: name }]"
        :prev="neighbours.prev"
        :next="neighbours.next"
        :position="neighbours.position"
      />
      <h1 class="faction__name">{{ name }}</h1>
      <p class="faction__tagline">{{ tagline }}</p>

      <MarkdownBlock v-if="hasLore" :slug="`universe/factions/${factionId}`" measure class="faction__lore" />
      <p v-else class="faction__lore-placeholder">{{ t('faction.hero.lorePlaceholder') }}</p>

      <p class="faction__stats">
        <span>{{ brands.length }} {{ t('faction.stats.brands') }}</span>
        <span>{{ programCount }} {{ t('faction.stats.programs') }}</span>
        <span>{{ cast.length }} {{ t('faction.stats.characters') }}</span>
      </p>
    </PageHero>

    <section class="l-band l-band--line-top">
      <div class="l-wrap">
        <h2 class="faction__h2">{{ t('faction.brands.title') }}</h2>
        <MonoLabel tone="faint">{{ t('faction.brands.note') }}</MonoLabel>
        <div class="l-grid l-grid--wide faction__gap">
          <BrandTile
            v-for="brand in brands"
            :key="brand.id"
            :brand="brand"
            :faction="faction"
            :note="brandNote(brand)"
          />
        </div>
      </div>
    </section>

    <section class="l-band l-band--alt l-band--line-top">
      <div class="l-wrap">
        <h2 class="faction__h2">{{ t('faction.cast.title') }} {{ shortName }}</h2>
        <div class="l-grid l-grid--tiles faction__gap">
          <EntityTile
            v-for="character in cast"
            :key="character.id"
            :to="to('character', { characterId: character.id }, { query: { faction: faction.id } })"
            :art="character.art"
            :epithet="character.epithet"
            :name="character.name"
            :tags="tags(character)"
            :placeholder="t('universe.artPlaceholder')"
          />
        </div>
      </div>
    </section>

    <section class="l-band l-band--line-top">
      <div class="l-wrap l-grid l-grid--wide">
        <ContentCard
          :to="to('story', {}, { hash: '#chapters' })"
          :kicker="t('ia.story.label')"
          :title="`${shortName} ${t('faction.exits.storyTitle')}`"
          :body="t('faction.exits.storyBody')"
        />
        <ContentCard
          :to="to('cards', {}, { query: { faction: faction.id } })"
          :kicker="t('faction.exits.cardsKicker')"
          :title="`${programCount} ${shortName} ${t('faction.stats.programs')}`"
          :body="t('faction.exits.cardsBody')"
        />
      </div>
    </section>
  </div>

  <section v-else class="l-band">
    <div class="l-wrap l-wrap--reading">
      <EmptyState
        :title="t('faction.missingTitle')"
        :body="t('faction.missingBody')"
      />
    </div>
  </section>
</template>

<style>
.faction__name {
  margin-top: var(--space-6);
  font-size: clamp(2rem, 6.4vw, 4rem);
}

.faction__tagline {
  margin-top: var(--space-2);
  font-size: var(--size-body-l);
  color: var(--faction-text);
}

.faction__lore,
.faction__lore-placeholder {
  margin-top: var(--space-6);
  max-width: 60ch;
  font-size: var(--size-body-l);
  line-height: 1.6;
  color: var(--color-ink-soft);
}

.faction__stats {
  margin-top: var(--space-6);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-ink-muted);
}

.faction__stats span {
  padding: var(--space-2) 14px;
  border: 1px solid rgba(var(--rgb-ink), 0.2);
  border-radius: var(--radius-pill);
  white-space: nowrap;
}

.faction__h2 {
  font-size: var(--size-h2);
}

.faction__gap {
  margin-top: var(--space-6);
}
</style>
