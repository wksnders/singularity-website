<script setup lang="ts">
/**
 * CHARACTER — the door into the lore. Epithet above the name, one faction
 * emblem per membership (multi-faction is canon), art owning the right half on
 * desktop, and the brand's programs as a strip that exits to the gallery.
 */
import { computed } from 'vue';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import BaseLink from '@/components/atoms/BaseLink.vue';
import FactionDot from '@/components/atoms/FactionDot.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import Breadcrumbs from '@/components/molecules/Breadcrumbs.vue';
import ContentCard from '@/components/molecules/ContentCard.vue';
import EmptyState from '@/components/molecules/EmptyState.vue';
import MarkdownBlock from '@/components/molecules/MarkdownBlock.vue';
import { useDocumentTitle } from '@/composables/useDocumentTitle';
import { docHtml, getDoc, metaString, t } from '@/content';
import {
  brandById,
  chapters,
  characterById,
  characters,
  factionById,
  programsOfBrand,
  stories,
} from '@/data/universe';
import { to } from '@/site/links';

const props = defineProps<{ characterId: string }>();

const character = computed(() => characterById(props.characterId));
const doc = computed(() => getDoc(`universe/characters/${props.characterId}`));
const hasLore = computed(() => Boolean(docHtml(doc.value)));

const name = computed(() => metaString(doc.value, 'name', character.value?.name ?? ''));
const epithet = computed(() => metaString(doc.value, 'epithet', character.value?.epithet ?? ''));

useDocumentTitle(() => name.value);

const memberships = computed(() =>
  character.value && Array.isArray(character.value.factionIds)
    ? character.value.factionIds
        .map((id) => factionById(id))
        .filter((f): f is NonNullable<ReturnType<typeof factionById>> => Boolean(f))
    : [],
);

const brand = computed(() =>
  character.value?.brandId
    ? brandById(character.value.brandId)
    : character.value?.personalBrandId
      ? brandById(character.value.personalBrandId)
      : null,
);

const brandPrograms = computed(() => (brand.value ? programsOfBrand(brand.value.id) : []));
const shownPrograms = computed(() => brandPrograms.value.slice(0, 5));
const remainingPrograms = computed(() =>
  Math.max((brand.value?.programCount ?? 0) - shownPrograms.value.length, 0),
);

/** Lateral hops walk the character's own brand, not the whole cast. */
const siblings = computed(() => {
  const pool = characters.filter((c) => c.brandId && c.brandId === character.value?.brandId);
  const index = pool.findIndex((c) => c.id === props.characterId);
  if (pool.length < 2 || index < 0) return { prev: null, next: null };
  const prev = pool[(index - 1 + pool.length) % pool.length];
  const next = pool[(index + 1) % pool.length];
  return {
    prev: { label: prev.name, to: to('character', { characterId: prev.id }) },
    next: { label: next.name, to: to('character', { characterId: next.id }) },
  };
});

/** "Appears in" is derived from the story cast lists — no second data set. */
const appearsIn = computed(() =>
  stories
    .filter((story) => story.castIds.includes(props.characterId))
    .map((story) => {
      const chapter = chapters.find((c) => c.id === story.chapterId) ?? null;
      return { story, chapter };
    }),
);

const nextInFaction = computed(() => {
  const factionId = memberships.value[0]?.id;
  if (!factionId) return null;
  const pool = characters.filter(
    (c) => Array.isArray(c.factionIds) && c.factionIds.includes(factionId) && c.id !== props.characterId,
  );
  return pool[0] ?? null;
});

const cardsQuery = computed(() =>
  memberships.value[0] ? { faction: memberships.value[0].id } : undefined,
);
</script>

<template>
  <template v-if="character">
    <section
      class="char__hero"
      :style="{
        '--faction': memberships[0]?.color,
        '--faction-text': memberships[0]?.colorText,
      }"
    >
      <div class="char__copy l-wrap">
        <Breadcrumbs
          :crumbs="[
            { label: t('ia.universe.label'), to: to('universe') },
            memberships[0]
              ? { label: memberships[0].name, to: to('faction', { factionId: memberships[0].id }) }
              : { label: t('universe.anyFaction'), to: to('unaligned') },
            ...(brand ? [{ label: brand.name, to: to('brand', { brandId: brand.id }) }] : []),
            { label: name },
          ]"
          :prev="siblings.prev"
          :next="siblings.next"
        />

        <p class="char__epithet">{{ epithet }}</p>
        <h1 class="char__name">{{ name }}</h1>

        <div class="char__emblems">
          <BaseLink
            v-for="faction in memberships"
            :key="faction.id"
            :to="to('faction', { factionId: faction.id })"
            class="char__emblem"
            :style="{ '--faction': faction.color }"
          >
            <FactionDot :color="faction.color" :size="9" />
            {{ faction.name }}
          </BaseLink>
          <span v-if="character.factionIds === 'any'" class="char__emblem char__emblem--any">
            <FactionDot :color="null" :size="9" />
            {{ t('universe.anyFaction') }}
          </span>
        </div>
        <MonoLabel tone="faint">{{ t('character.emblemNote') }}</MonoLabel>

        <MarkdownBlock
          v-if="hasLore"
          :slug="`universe/characters/${characterId}`"
          measure
          class="char__lore"
        />
        <p v-else class="char__lore">{{ t('character.lorePlaceholder') }}</p>

        <div class="char__cta l-row">
          <UiButton :to="to('cards', {}, { query: cardsQuery })">
            {{ t('character.ctaCards') }}
          </UiButton>
          <UiButton variant="quiet" :to="to('story', {}, { hash: '#chapters' })">
            {{ t('character.ctaChapter') }}
          </UiButton>
        </div>
      </div>

      <div class="char__art">
        <ArtFrame
          :art="character.art"
          ratio="3 / 4"
          :placeholder="t('character.artPlaceholder')"
          eager
        />
        <MonoLabel tone="faint" class="char__art-note">{{ t('character.artCredit') }}</MonoLabel>
      </div>
    </section>

    <section v-if="brand" class="l-band l-band--alt l-band--line-top">
      <div class="l-wrap">
        <div class="char__band-head">
          <h2 class="char__h2">{{ t('character.playsWith') }} {{ brand.name }}</h2>
          <UiButton variant="quiet" :to="to('brand', { brandId: brand.id })">
            {{ t('character.brandStory') }}
          </UiButton>
        </div>

        <div class="char__programs">
          <ArtFrame
            v-for="program in shownPrograms"
            :key="program.id"
            :art="program.art"
            ratio="63 / 88"
            radius="s"
            :placeholder="t('cards.artPlaceholder')"
          />
          <BaseLink
            v-if="remainingPrograms"
            :to="to('cards', {}, { query: cardsQuery })"
            class="char__more"
          >
            +{{ remainingPrograms }}<br />{{ t('character.moreInGallery') }}
          </BaseLink>
        </div>

        <p class="char__note">{{ t('character.cardTextNote') }}</p>
      </div>
    </section>

    <section class="l-band l-band--line-top">
      <div class="l-wrap">
        <h2 class="char__h2">{{ t('character.appearsIn') }}</h2>
        <div class="l-grid l-grid--wide char__gap">
          <ContentCard
            v-for="entry in appearsIn"
            :key="entry.story.id"
            :to="to('story', {}, { hash: `#ch-${String(entry.chapter?.number ?? 1).padStart(2, '0')}` })"
            :kicker="`${t('home.chapter.label')} ${String(entry.chapter?.number ?? 1).padStart(2, '0')}`"
            :title="entry.story.title"
            :placeholder="t('character.chapterArtPlaceholder')"
          />
          <EmptyState
            v-if="!appearsIn.length"
            variant="notYet"
            :title="t('character.noStoriesTitle')"
            :body="t('character.noStoriesBody')"
          />
        </div>

        <div v-if="nextInFaction" class="char__next">
          <MonoLabel tone="faint">
            {{ t('character.nextIn') }} {{ memberships[0]?.name }}
          </MonoLabel>
          <UiButton variant="quiet" :to="to('character', { characterId: nextInFaction.id })">
            {{ nextInFaction.name }} →
          </UiButton>
        </div>
      </div>
    </section>
  </template>

  <section v-else class="l-band">
    <div class="l-wrap l-wrap--reading">
      <EmptyState
        variant="notYet"
        :title="t('character.missingTitle')"
        :body="t('character.missingBody')"
      />
    </div>
  </section>
</template>

<style>
.char__hero {
  display: flex;
  flex-wrap: wrap-reverse;
  align-items: stretch;
  border-bottom: 1px solid var(--color-line);
}

.char__copy {
  flex: 1 1 460px;
  min-width: 0;
  padding-block: calc(var(--nav-height) + var(--space-8)) var(--band-y);
}

.char__art {
  flex: 1 1 380px;
  min-width: 0;
  position: relative;
  border-left: 2px solid var(--faction);
}

.char__art > .c-art {
  height: 100%;
}

.char__art-note {
  position: absolute;
  left: var(--space-4);
  bottom: var(--space-3);
}

.char__epithet {
  margin-top: var(--space-6);
  font-size: var(--size-body-l);
  letter-spacing: 0.04em;
  color: var(--faction-text);
}

.char__name {
  margin-top: var(--space-2);
  font-size: clamp(2rem, 6.4vw, 3.75rem);
}

.char__emblems {
  margin-top: var(--space-5);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.char__emblem {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 44px;
  padding-inline: 14px;
  border: 1px solid var(--faction);
  border-radius: var(--radius-pill);
  font-size: var(--size-m);
  color: var(--color-ink);
  white-space: nowrap;
}

.char__emblem:hover {
  background: rgba(var(--rgb-ink), 0.06);
  color: var(--color-ink);
  text-decoration: none;
}

.char__emblem--any {
  border-color: var(--color-line-strong);
}

.char__lore {
  margin-top: var(--space-6);
  max-width: 56ch;
  font-size: var(--size-body-l);
  line-height: 1.65;
  color: var(--color-ink-soft);
}

.char__cta {
  margin-top: var(--space-8);
  gap: var(--space-4);
}

.char__band-head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: baseline;
  justify-content: space-between;
}

.char__h2 {
  font-size: clamp(1.375rem, 3.4vw, 2rem);
}

.char__programs {
  margin-top: var(--space-6);
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--space-3);
}

.char__more {
  display: grid;
  place-items: center;
  aspect-ratio: 63 / 88;
  border: 1px dashed var(--color-line-dashed);
  border-radius: var(--radius-s);
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  text-align: center;
  color: var(--color-ink-muted);
}

.char__note,
.char__gap {
  margin-top: var(--space-6);
}

.char__note {
  max-width: 68ch;
  font-size: var(--size-m);
  line-height: 1.6;
  color: var(--color-ink-faint);
}

.char__next {
  margin-top: var(--space-8);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-6);
  align-items: center;
  justify-content: space-between;
}
</style>
