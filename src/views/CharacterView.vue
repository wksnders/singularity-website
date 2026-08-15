<script setup lang="ts">
/**
 * CHARACTER — the door into the lore. Epithet above the name, one faction
 * emblem per membership (multi-faction is canon), art owning the right half on
 * desktop, and the brand's programs as a strip that exits to the gallery.
 */
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import BaseLink from '@/components/atoms/BaseLink.vue';
import BrandMark from '@/components/atoms/BrandMark.vue';
import FactionDot from '@/components/atoms/FactionDot.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import Breadcrumbs from '@/components/molecules/Breadcrumbs.vue';
import CardFace from '@/components/molecules/CardFace.vue';
import ContentCard from '@/components/molecules/ContentCard.vue';
import EmptyState from '@/components/molecules/EmptyState.vue';
import MarkdownBlock from '@/components/molecules/MarkdownBlock.vue';
import SectionMarker from '@/components/molecules/SectionMarker.vue';
import CardPool from '@/components/organisms/CardPool.vue';
import type { PoolCard, PoolGroup } from '@/components/organisms/CardPool.vue';
import CardZoom from '@/components/organisms/CardZoom.vue';
import type { ZoomRow } from '@/components/organisms/CardZoom.vue';
import { useDocumentTitle } from '@/composables/useDocumentTitle';
import { useMediaQuery } from '@/composables/useMediaQuery';
import { docHtml, getDoc, metaString, t } from '@/content';
import { expandIcons } from '@/site/cardText';
import type { CardLine } from '@/site/cardText';
import {
  brandById,
  chapters,
  characterById,
  characters,
  factionById,
  printingsOf,
  programsOfBrand,
  resolvePrinting,
  stories,
} from '@/data/universe';
import { outbound, to } from '@/site/links';

const props = defineProps<{ characterId: string }>();

/* Wider than the nav's breakpoint: the picker needs room the nav does not. */
const roomy = useMediaQuery('(min-width: 1120px)');

const character = computed(() => characterById(props.characterId));
const doc = computed(() => getDoc(`universe/characters/${props.characterId}`));
const hasLore = computed(() => Boolean(docHtml(doc.value)));

const epithet = computed(() => metaString(doc.value, 'epithet', character.value?.epithet ?? ''));

const memberships = computed(() =>
  character.value && Array.isArray(character.value.factionIds)
    ? character.value.factionIds
        .map((id) => factionById(id))
        .filter((f): f is NonNullable<ReturnType<typeof factionById>> => Boolean(f))
    : [],
);

/* Honoured only for a faction this character belongs to: unchecked, any id in
   any URL becomes a claim about any character. */
const route = useRoute();
const scopedFaction = computed(() => {
  const id = route.query.faction;
  if (typeof id !== 'string') return null;
  return memberships.value.some((faction) => faction.id === id) ? id : null;
});

const scopeQuery = computed(() =>
  scopedFaction.value ? { faction: scopedFaction.value } : undefined,
);


const printingId = ref('standard');

const printings = computed(() => (character.value ? printingsOf(character.value) : []));

const active = computed(() => {
  const c = character.value;
  if (!c) return null;
  const chosen = printings.value.find((p) => p.id === printingId.value) ?? printings.value[0];
  return resolvePrinting(c, chosen);
});

const name = computed(() => metaString(doc.value, 'name', character.value?.name ?? ''));
useDocumentTitle(() => name.value);


const castPool = computed(() =>
  scopedFaction.value
    ? characters.filter(
        (c) => Array.isArray(c.factionIds) && c.factionIds.includes(scopedFaction.value!),
      )
    : characters,
);

const siblings = computed(() => {
  const pool = castPool.value;
  const index = pool.findIndex((c) => c.id === props.characterId);
  if (pool.length < 2 || index < 0) return { prev: null, next: null, position: null };
  const prev = pool[(index - 1 + pool.length) % pool.length];
  const next = pool[(index + 1) % pool.length];
  return {
    prev: {
      label: prev.name,
      to: to('character', { characterId: prev.id }, { query: scopeQuery.value }),
    },
    next: {
      label: next.name,
      to: to('character', { characterId: next.id }, { query: scopeQuery.value }),
    },
    position: { label: t('character.castLabel'), index: index + 1, total: pool.length },
  };
});


const playedBrands = computed(() => {
  const c = character.value;
  if (!c) return [];
  return [...c.brandIds, ...(c.personalBrandId ? [c.personalBrandId] : [])]
    .map((id) => brandById(id))
    .filter((b): b is NonNullable<ReturnType<typeof brandById>> => Boolean(b));
});

const poolBrands = computed(() => {
  const common = brandById('common');
  const own = playedBrands.value.filter((b) => b.id !== 'common');
  return common ? [...own, common] : own;
});

const groups = computed<PoolGroup[]>(() =>
  poolBrands.value.map((brand) => {
    const faction = brand.factionId ? factionById(brand.factionId) : null;
    return {
      id: brand.id,
      name: brand.name,
      color: faction?.color ?? null,
      textColor: faction?.colorText ?? null,
      icon: brand.icon,
      to: to('brand', { brandId: brand.id }),
      linkLabel: `${t('character.aboutBrand')} ${brand.name} →`,
      note: brand.id === 'common' ? t('character.commonNote') : null,
      cards: programsOfBrand(brand.id).map((program) => ({
        id: program.id,
        name: program.name,
        brandId: brand.id,
        brandName: brand.name,
        art: program.art,
      })),
    };
  }),
);

const galleryQuery = computed(() => ({ brand: poolBrands.value.map((b) => b.id).join(',') }));


const selected = ref<PoolCard | null>(null);
const face = ref<'card' | 'art'>('card');
const zoomOpen = ref(false);

function pick(card: PoolCard): void {
  selected.value = card;
  if (!roomy.value) zoomOpen.value = true;
}

function openCharacterCard(): void {
  selected.value = null;
  zoomOpen.value = true;
}

const detailArt = computed(() => {
  if (selected.value) return selected.value.art;
  return face.value === 'art' ? active.value?.art : active.value?.cardArt;
});

const detailKicker = computed(() =>
  selected.value
    ? selected.value.brandName
    : `${t('character.cardKicker')} · ${t(`cards.sets.${character.value?.set}`)}`,
);

const detailName = computed(() => (selected.value ? selected.value.name : active.value?.name));

const artist = computed(() => detailArt.value?.artist || t('character.artistSlot'));

const cardLines = computed<CardLine[]>(() => {
  const c = character.value;
  const printing = active.value;
  if (!c || !printing) return [];
  return [
    { label: t('character.statHp'), values: [String(c.hp)] },
    { label: t('character.statAbility'), values: [printing.abilityName] },
    {
      label: t('cards.rules'),
      values: c.abilityText.split('\n').map((line) => expandIcons(line.trim())),
    },
    { label: t('cards.flavour'), values: [printing.flavour] },
    { label: t('cards.set'), values: [t(`cards.sets.${c.set}`)] },
  ].filter((line) => line.values.some(Boolean));
});

const zoomRows = computed<ZoomRow[]>(() => {
  const rows: ZoomRow[] = [];
  const setLabel = t(`cards.sets.${character.value?.set}`);
  if (selected.value) {
    rows.push({ label: t('character.rowBrand'), value: selected.value.brandName });
    rows.push({ label: t('character.rowSet'), value: setLabel });
  } else {
    rows.push({ label: t('character.rowSet'), value: setLabel });
    rows.push({
      label: t('character.rowAccess'),
      value: playedBrands.value.map((b) => b.name).join(' · '),
    });
    rows.push({ label: t('character.rowPrinting'), value: active.value?.label ?? '' });
  }
  rows.push({ label: t('character.rowArtist'), value: artist.value });
  if (active.value?.source && !selected.value) {
    const licensor = active.value.licensor ? ` · ${active.value.licensor}` : '';
    rows.push({ label: t('character.rowSource'), value: `${active.value.source}${licensor}` });
  }
  return rows;
});


const appearsIn = computed(() =>
  stories
    .filter((story) => story.castIds.includes(props.characterId))
    .map((story) => ({
      story,
      chapter: chapters.find((c) => c.id === story.chapterId) ?? null,
    })),
);

const sectionTotal = computed(() => (hasLore.value ? 3 : 2));
</script>

<template>
  <template v-if="character && active">
    <div id="char-page">
      <section
        class="char__hero"
        :style="{
          '--faction': memberships[0]?.color,
          '--faction-text': memberships[0]?.colorText,
        }"
      >
        <div class="char__copy l-wrap">
          <!-- No faction or brand segment: a segment must be a page this URL
               truncates to. -->
          <Breadcrumbs
            :crumbs="[
              { label: t('ia.universe.label'), to: to('universe') },
              {
                label: t('characters.hero.crumb'),
                to: to('characters', {}, { query: scopeQuery }),
              },
              { label: name },
            ]"
            :prev="siblings.prev"
            :next="siblings.next"
            :position="siblings.position"
            compact-hops
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

          <p class="char__quote">“{{ active.flavour }}”</p>

          <dl class="char__facts">
            <div>
              <dt><MonoLabel tone="muted" as="span">{{ t('character.statHp') }}</MonoLabel></dt>
              <dd class="char__fact-value">{{ character.hp }}</dd>
            </div>
            <div class="char__facts-brands">
              <dt><MonoLabel tone="muted" as="span">{{ t('character.brandsLabel') }}</MonoLabel></dt>
              <dd class="char__brand-list">
                <BaseLink
                  v-for="brand in playedBrands"
                  :key="brand.id"
                  :to="to('brand', { brandId: brand.id })"
                  class="char__brand"
                >
                  <BrandMark
                    :icon="brand.icon"
                    :name="brand.name"
                    :color="factionById(brand.factionId ?? '')?.color"
                    :size="26"
                  />
                  {{ brand.name }}
                </BaseLink>
              </dd>
            </div>
          </dl>

          <div class="char__card-row">
            <button
              type="button"
              class="char__card-thumb"
              :aria-label="`${t('character.seeCardLarge')}: ${active.name}`"
              @click="openCharacterCard()"
            >
              <CardFace
                :art="active.cardArt"
                :placeholder="t('character.cardSlot')"
                :lines="cardLines"
              />
            </button>
            <div>
              <MonoLabel tone="accent">{{ t('character.cardKicker') }}</MonoLabel>
              <p class="char__card-cta">
                <button type="button" class="char__linkish" @click="openCharacterCard()">
                  {{ t('character.seeCardLarge') }} →
                </button>
              </p>
            </div>
          </div>
        </div>

        <div class="char__art">
          <div class="char__art-frame">
            <ArtFrame
              :art="active.art"
              :placeholder="t('character.artPlaceholder')"
              eager
            />
          </div>
          <div class="char__art-foot">
            <MonoLabel tone="muted">{{ t('character.artBy') }} {{ active.art.artist || t('character.artistSlot') }}</MonoLabel>
            <div v-if="printings.length > 1" class="char__printings">
              <MonoLabel tone="faint" as="span">{{ t('character.printings') }}</MonoLabel>
              <div role="group" :aria-label="t('character.printings')" class="char__printing-chips">
                <button
                  v-for="printing in printings"
                  :key="printing.id"
                  type="button"
                  class="char__printing"
                  :aria-pressed="printing.id === active.id"
                  @click="printingId = printing.id"
                >
                  {{ printing.label }}
                </button>
              </div>
            </div>
          </div>
          <MonoLabel v-if="active.isReflavour" tone="accent" class="char__printed-as">
            {{ t('character.printedAs') }} {{ active.name }}
          </MonoLabel>
        </div>
      </section>

      <section id="cards" tabindex="-1" class="l-band l-band--line-top">
        <div class="l-wrap">
          <SectionMarker
            id="cards"
            :index="1"
            :total="sectionTotal"
            :heading="t('character.poolTitle')"
          />
          <div class="char__pool-head">
            <p class="char__pool-note">{{ t('character.poolNote') }}</p>
            <div class="char__customize">
              <UiButton :to="to('soon', {}, { hash: '#stack-builder' })">
                {{ t('character.customize') }} →
              </UiButton>
              <MonoLabel tone="muted">{{ t('character.stackLabel') }}</MonoLabel>
            </div>
          </div>

          <CardPool :groups="groups" :selected-id="selected?.id ?? null" @select="pick">
            <template v-if="roomy" #panel>
              <button
                type="button"
                class="char__panel-card"
                :aria-label="`${t('character.enlarge')}: ${detailName}`"
                @click="zoomOpen = true"
              >
                <ArtFrame
                  :art="detailArt ?? null"
                  ratio="63 / 88"
                  :placeholder="t('character.cardSlot')"
                  radius="m"
                  fit="contain"
                />
              </button>
              <MonoLabel :tone="selected ? 'muted' : 'accent'" class="char__panel-kicker">
                {{ detailKicker }}
              </MonoLabel>
              <h3 class="char__panel-name">{{ detailName }}</h3>

              <div v-if="!selected" class="char__face">
                <button
                  type="button"
                  class="char__face-btn"
                  :aria-pressed="face === 'card'"
                  @click="face = 'card'"
                >
                  {{ t('character.faceCard') }}
                </button>
                <button
                  type="button"
                  class="char__face-btn"
                  :aria-pressed="face === 'art'"
                  @click="face = 'art'"
                >
                  {{ t('character.faceArt') }}
                </button>
              </div>

              <p class="char__panel-link">
                <BaseLink v-if="selected" :to="to('cards', {}, { query: galleryQuery })">
                  {{ t('character.openInGallery') }} →
                </BaseLink>
                <BaseLink v-else :to="to('cards', {}, { hash: '#anatomy' })">
                  {{ t('character.cardAnatomy') }} →
                </BaseLink>
              </p>

              <p v-if="selected" class="char__panel-link">
                <button type="button" class="char__linkish" @click="selected = null">
                  ← {{ t('character.backToCard') }}
                </button>
              </p>
            </template>

            <template #foot>
              <BaseLink :to="to('cards', {}, { query: galleryQuery })" class="char__pool-exit">
                {{ t('character.galleryExit') }} →
              </BaseLink>
            </template>
          </CardPool>
        </div>
      </section>

      <section v-if="hasLore" id="lore" tabindex="-1" class="l-band l-band--line-top">
        <div class="l-wrap">
          <SectionMarker
            id="lore"
            :index="2"
            :total="sectionTotal"
            :heading="t('character.loreTitle')"
          />
          <MarkdownBlock :slug="`universe/characters/${characterId}`" measure />
          <p v-if="memberships[0]" class="char__lore-exit">
            <BaseLink :to="to('faction', { factionId: memberships[0].id })">
              {{ t('character.moreFrom') }} {{ memberships[0].name }} →
            </BaseLink>
          </p>
        </div>
      </section>

      <section id="stories" tabindex="-1" class="l-band l-band--alt l-band--line-top">
        <div class="l-wrap">
          <SectionMarker
            id="stories"
            :index="sectionTotal"
            :total="sectionTotal"
            :heading="t('character.appearsIn')"
          />
          <div v-if="appearsIn.length" class="l-grid l-grid--wide">
            <ContentCard
              v-for="entry in appearsIn"
              :key="entry.story.id"
              :to="to('story', {}, { hash: `#ch-${String(entry.chapter?.number ?? 1).padStart(2, '0')}` })"
              :kicker="`${t('home.chapter.label')} ${String(entry.chapter?.number ?? 1).padStart(2, '0')}`"
              :title="entry.story.title"
              :placeholder="t('character.chapterArtPlaceholder')"
            />
          </div>
          <div v-else class="char__no-stories">
            <p>{{ t('character.noStoriesBody') }}</p>
            <p class="char__panel-link">
              <BaseLink :link="outbound('discord')">
                {{ t('character.noStoriesDiscord') }} →
              </BaseLink>
            </p>
            <p class="char__panel-link">
              <BaseLink :to="to('story', {}, { hash: '#chapters' })">
                {{ t('character.readChapters') }} →
              </BaseLink>
            </p>
          </div>
        </div>
      </section>
    </div>

    <CardZoom
      :open="zoomOpen"
      :kicker="detailKicker"
      :name="detailName ?? ''"
      :art="detailArt ?? active.cardArt"
      :placeholder="t('character.cardSlot')"
      :rows="zoomRows"
      :errata-line="t('character.noErrata')"
      @close="zoomOpen = false"
    >
      <template v-if="!selected" #face>
        <div class="char__face">
          <button
            type="button"
            class="char__face-btn"
            :aria-pressed="face === 'card'"
            @click="face = 'card'"
          >
            {{ t('character.faceCard') }}
          </button>
          <button
            type="button"
            class="char__face-btn"
            :aria-pressed="face === 'art'"
            @click="face = 'art'"
          >
            {{ t('character.faceArt') }}
          </button>
        </div>
      </template>
      <template #links>
        <p class="char__panel-link">
          <BaseLink v-if="selected" :to="to('cards', {}, { query: galleryQuery })">
            {{ t('character.openInGallery') }} →
          </BaseLink>
          <BaseLink v-else :to="to('cards', {}, { hash: '#anatomy' })">
            {{ t('character.cardAnatomy') }} →
          </BaseLink>
        </p>
      </template>
    </CardZoom>
  </template>

  <section v-else class="l-band">
    <div class="l-wrap l-wrap--reading">
      <EmptyState :title="t('character.missingTitle')" :body="t('character.missingBody')" />
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
  flex: 1.1 1 440px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-block: calc(var(--nav-height) + var(--space-8)) var(--band-y);
}

.char__art {
  flex: 1 1 400px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-self: stretch;
  border-left: 2px solid var(--faction);
}

.char__art-frame {
  flex: 1 1 auto;
  min-height: 0;
}

@media (max-width: 899px) {
  .char__art {
    border-left: 0;
    border-bottom: 2px solid var(--faction);
  }

  .char__art-frame {
    max-height: 62vh;
  }
}

.char__art-frame > .c-art {
  height: 100%;
}

.char__art-foot {
  flex: 0 0 auto;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-5);
  align-items: center;
  justify-content: space-between;
  padding: 14px var(--gutter) var(--space-4);
}

.char__printings {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}

.char__printing-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.char__printing {
  min-height: 40px;
  padding-inline: 14px;
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-ink-soft);
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  letter-spacing: 0.1em;
  cursor: pointer;
  white-space: nowrap;
}

.char__printing[aria-pressed='true'] {
  border-color: rgba(var(--rgb-accent), 0.55);
  background: var(--color-accent-wash);
  color: var(--color-ink);
}

.char__printed-as {
  padding: 0 var(--gutter) var(--space-4);
}

.char__epithet {
  margin-top: var(--space-6);
  font-size: var(--size-body-l);
  letter-spacing: 0.04em;
  color: var(--faction-text);
}

.char__name {
  margin-top: var(--space-2);
  font-size: clamp(2rem, 6.4vw, 4rem);
  line-height: 1;
}

.char__emblems {
  margin-top: var(--space-5);
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.char__emblem {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 44px;
  padding-inline: var(--space-4);
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

.char__quote {
  margin-top: 22px;
  max-width: 44ch;
  font-size: clamp(1.0625rem, 2.2vw, 1.3125rem);
  line-height: 1.55;
  font-style: italic;
  color: var(--color-ink-muted);
}

.char__facts {
  margin-top: var(--space-6);
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-line);
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 18px var(--space-8);
}

.char__facts-brands {
  flex: 1 1 240px;
  min-width: 0;
}

.char__fact-value {
  margin: 7px 0 0;
  font-size: 1.125rem;
  font-weight: 500;
}

.char__brand-list {
  margin: 7px 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.char__brand {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 38px;
  padding: 0 var(--space-3) 0 var(--space-2);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-pill);
  font-size: var(--size-m);
  color: var(--color-ink);
  white-space: nowrap;
}

.char__card-row {
  margin-top: var(--space-6);
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-line);
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.char__card-thumb {
  flex: 0 0 auto;
  width: 72px;
  padding: 0;
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-s);
  overflow: hidden;
  background: transparent;
  cursor: zoom-in;
}

.char__card-cta {
  margin-top: var(--space-2);
}

.char__linkish {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-accent-text);
  font-family: var(--font-body);
  font-size: var(--size-m);
  font-weight: 500;
  text-align: left;
  cursor: pointer;
}

.char__pool-head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4) var(--space-8);
  align-items: flex-start;
  justify-content: space-between;
}

.char__pool-note {
  max-width: 62ch;
  font-size: var(--size-body);
  line-height: 1.65;
  color: var(--color-ink-soft);
}

.char__customize {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
}

.char__panel-card {
  display: block;
  width: 100%;
  padding: 0;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-m);
  overflow: hidden;
  background: var(--color-surface);
  cursor: zoom-in;
}

.char__panel-kicker {
  margin-top: 14px;
}

.char__panel-name {
  margin-top: var(--space-1);
  font-family: var(--font-body);
  font-size: 1.25rem;
  font-weight: 500;
  letter-spacing: normal;
}

.char__face {
  margin-top: 14px;
  display: flex;
  max-width: 300px;
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-pill);
  overflow: hidden;
}

.char__face-btn {
  flex: 1 1 0;
  min-width: 0;
  min-height: 44px;
  padding-inline: var(--space-3);
  border: 0;
  background: transparent;
  color: var(--color-ink-soft);
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
}

.char__face-btn + .char__face-btn {
  border-left: 1px solid var(--color-line-strong);
}

.char__face-btn[aria-pressed='true'] {
  background: var(--color-accent-wash);
  color: var(--color-ink);
}

.char__panel-link {
  margin-top: var(--space-4);
  font-size: var(--size-m);
  font-weight: 500;
}

.char__pool-exit,
.char__lore-exit {
  font-size: var(--size-body);
  font-weight: 500;
}

.char__lore-exit {
  margin-top: var(--space-6);
}

.char__no-stories {
  max-width: 60ch;
  font-size: var(--size-body-l);
  line-height: 1.7;
  color: var(--color-ink-soft);
}
</style>
