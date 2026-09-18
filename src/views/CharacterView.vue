<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import BaseLink from '@/components/atoms/BaseLink.vue';
import BrandMark from '@/components/atoms/BrandMark.vue';
import FaceToggle from '@/components/atoms/FaceToggle.vue';
import FactionDot from '@/components/atoms/FactionDot.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import Breadcrumbs from '@/components/molecules/Breadcrumbs.vue';
import CardFace from '@/components/molecules/CardFace.vue';
import CardText from '@/components/molecules/CardText.vue';
import ContentCard from '@/components/molecules/ContentCard.vue';
import EmptyState from '@/components/molecules/EmptyState.vue';
import MarkdownBlock from '@/components/molecules/MarkdownBlock.vue';
import MissingCardNote from '@/components/molecules/MissingCardNote.vue';
import SectionMarker from '@/components/molecules/SectionMarker.vue';
import CardPool from '@/components/organisms/CardPool.vue';
import type { PoolCard, PoolGroup } from '@/components/organisms/CardPool.vue';
import CardDetail from '@/components/organisms/CardDetail.vue';
import StackBuilder, { slotButtonId } from '@/components/organisms/StackBuilder.vue';
import type { StackSlot } from '@/components/organisms/StackBuilder.vue';
import { useCardParam } from '@/composables/useCardParam';
import { useDocumentTitle } from '@/composables/useDocumentTitle';
import { useMediaQuery } from '@/composables/useMediaQuery';
import { useStack } from '@/composables/useStack';
import type { StackChange } from '@/composables/useStack';
import { useZoomUpgrade } from '@/composables/useZoomUpgrade';
import { docHtml, getDoc, metaString, t } from '@/content';
import { cardBySlug } from '@/site/cards';
import { seedsFor, SLOT_KEYS, STACK_SIZE } from '@/data/starterStacks';
import type { StackSeed } from '@/data/starterStacks';
import {
  brandById,
  chapters,
  characterById,
  characters,
  factionById,
  printingsOf,
  programBySlug,
  programsOfBrand,
  resolvePrinting,
  stories,
} from '@/data/universe';
import { environmentSources, pictureSources, outbound, to } from '@/site/links';

const props = defineProps<{ characterId: string }>();

/* The 320px panel and the pool's 420px flex basis stop fitting side by side near 820px, and this clears that with room to spare because a media query counts the scrollbar on some engines and not others. */
const roomy = useMediaQuery('(min-width: 880px)');

const zoomed = useZoomUpgrade();

const character = computed(() => characterById(props.characterId));
const doc = computed(() => getDoc(`universe/characters/${props.characterId}`));
const hasLore = computed(() => Boolean(docHtml(doc.value)));

const epithet = computed(() => metaString(doc.value, 'epithet', character.value?.epithet ?? ''));

const loreTeaser = computed(() => {
  const body = doc.value?.body ?? '';
  const first = body
    /* Docs are CRLF: normalise line endings before splitting paragraphs. */
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .find((block) => block && !block.startsWith('#') && !block.startsWith('>'));
  if (!first) return '';
  return first
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
});

const memberships = computed(() =>
  character.value && Array.isArray(character.value.factionIds)
    ? character.value.factionIds
        .map((id) => factionById(id))
        .filter((f): f is NonNullable<ReturnType<typeof factionById>> => Boolean(f))
    : [],
);

/* A ?faction= id in the URL is honoured only when this character belongs to that faction. */
const route = useRoute();
const scopedFaction = computed(() => {
  const id = route.query.faction;
  if (typeof id !== 'string') return null;
  return memberships.value.some((faction) => faction.id === id) ? id : null;
});

const scopeQuery = computed(() =>
  scopedFaction.value ? { faction: scopedFaction.value } : undefined,
);

/* ONE printing selector, and it is the URL: a second local ref would let the hero's chips and the zoom's disagree. */
const cardParam = useCardParam({ isKnown: (slug) => Boolean(cardBySlug(slug)) });
const printingId = computed(() => cardParam.printing.value ?? 'standard');

function choosePrinting(id: string): void {
  cardParam.setPrinting(id);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
}

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

const poolLabel = computed(() => {
  const scoped = scopedFaction.value ? factionById(scopedFaction.value) : null;
  return scoped ? scoped.name : t('character.castLabel');
});

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
    position: { label: poolLabel.value, index: index + 1, total: pool.length },
  };
});

const playedBrands = computed(() => {
  const c = character.value;
  if (!c) return [];
  return [...c.brandIds, ...(c.personalBrandId ? [c.personalBrandId] : [])]
    .map((id) => brandById(id))
    .filter((b): b is NonNullable<ReturnType<typeof brandById>> => Boolean(b));
});

const brandJumpNames = computed(() => playedBrands.value.map((b) => b.name).join(' · '));

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
        slug: program.slug,
        name: program.name,
        brandId: brand.id,
        brandName: brand.name,
        cardArt: program.cardArt,
      })),
    };
  }),
);

/* `?brand=` takes a comma-separated list, and the split in `matchesFacet` must stay in step or this link lands on an empty gallery. */
const galleryQuery = computed(() => ({ brand: poolBrands.value.map((b) => b.id).join(',') }));

const poolPrograms = computed(() => poolBrands.value.flatMap((brand) => programsOfBrand(brand.id)));

const seeds = computed(() => seedsFor(props.characterId));

const {
  programs: stackPrograms,
  count: stackCount,
  dropped: stackDropped,
  seedId: stackSeedId,
  armed,
  fromLink: stackFromLink,
  has: inStack,
  arm,
  chooseInto,
  clearSlot,
  load: loadStack,
  clear: clearStack,
} = useStack({
  characterId: () => props.characterId,
  pool: () => poolPrograms.value,
  seeds: () => seeds.value,
});

const building = ref(false);
const say = ref('');

watch(
  stackFromLink,
  (linked) => {
    if (!linked) return;
    building.value = true;
    arm();
  },
  { immediate: true },
);

const slotLabel = (index: number) => t(`character.slots.${SLOT_KEYS[index]}`);

const stackSlots = computed<StackSlot[]>(() =>
  SLOT_KEYS.map((key, index) => ({
    key,
    index,
    label: slotLabel(index),
    program: stackPrograms.value[index] ?? null,
    armed: armed.value === index,
  })),
);

/* One pick can fill one slot and empty another; this is the only place either is announced. */
function announce(change: StackChange | null): void {
  if (!change) return;
  const n = stackCount.value;
  const total = STACK_SIZE;
  switch (change.kind) {
    case 'added':
      say.value = t(
        change.from === undefined ? 'character.sayAdded' : 'character.sayMoved',
        {
          name: change.program.name,
          slot: slotLabel(change.slot).toLowerCase(),
          from: change.from === undefined ? '' : slotLabel(change.from).toLowerCase(),
          n,
          total,
        },
      );
      break;
    case 'replaced':
      say.value = t(
        change.from === undefined ? 'character.sayReplaced' : 'character.sayMovedOver',
        {
          name: change.program.name,
          gone: change.gone.name,
          slot: slotLabel(change.slot).toLowerCase(),
          from: change.from === undefined ? '' : slotLabel(change.from).toLowerCase(),
          n,
          total,
        },
      );
      break;
    case 'removed':
      say.value = t('character.sayRemoved', {
        name: change.program.name,
        slot: slotLabel(change.slot).toLowerCase(),
        n,
        total,
      });
      break;
    case 'loaded':
      say.value = t('character.sayLoaded', {
        deck: change.seed.deckName,
        programs: stackPrograms.value
          .filter((program): program is NonNullable<typeof program> => Boolean(program))
          .map((program) => program.name)
          .join(', '),
      });
      break;
    case 'cleared':
      say.value = t('character.sayCleared', { total });
      break;
  }
}

function toggleBuilding(): void {
  building.value = !building.value;
  say.value = '';
  if (!building.value) {
    arm(null);
    return;
  }

  selected.value = null;
  arm();
  void nextTick(() => document.getElementById('stack')?.focus({ preventScroll: true }));
}

function choose(id: string): void {
  announce(chooseInto(id));
}

/* The pressed remove button sits inside the subtree this clears, so focus must be restored here. */
function clear(index: number): void {
  announce(clearSlot(index));
  void nextTick(() =>
    document.getElementById(slotButtonId(index))?.focus({ preventScroll: true }),
  );
}

function loadSeed(seed: StackSeed): void {
  announce(loadStack(seed));
}

const selected = ref<PoolCard | null>(null);
const face = ref<'card' | 'art'>('card');
const zoomedRow = computed(() =>
  cardParam.slug.value ? cardBySlug(cardParam.slug.value) : null,
);

function pick(card: PoolCard): void {
  if (building.value) {
    choose(card.slug);
    return;
  }
  selected.value = card;
  const program = programBySlug(card.slug);
  /* The panel is off screen below the breakpoint, so a tap opens the dialog instead. */
  if (!roomy.value && program) openCard(program.slug);
}

const zoomFace = ref<'card' | 'art'>('card');

/* A bare `{ hash }` resolves with an empty query, which would drop `?printing=`, `?faction=`, `?card=` and `?stack=`. */
const hashOnly = (hash: string) => ({ hash, query: route.query });

function openCard(slug: string, open: 'card' | 'art' = 'card'): void {
  zoomFace.value = open;
  cardParam.openCard(slug);
}

function openCharacterCard(open: 'card' | 'art' = 'card'): void {
  selected.value = null;
  openCard(props.characterId, open);
}

const selectedProgram = computed(() =>
  selected.value ? programBySlug(selected.value.slug) : null,
);

const detailArt = computed(() => {
  const subject = selectedProgram.value ?? active.value;
  return face.value === 'art' ? subject?.sceneArt : subject?.cardArt;
});

const detailName = computed(() => (selected.value ? selected.value.name : active.value?.name));

/* Artist credit is per art surface, never shared between them. */
const artistOf = (art?: { artist?: string | null } | null) =>
  art?.artist || t('character.artistSlot');

const panelProgram = computed(() =>
  building.value
    ? armed.value !== null
      ? (stackPrograms.value[armed.value] ?? null)
      : null
    : selectedProgram.value,
);

const panelHasCard = computed(() => !building.value || panelProgram.value !== null);

const panelArt = computed(() =>
  building.value ? (panelProgram.value?.cardArt ?? null) : (detailArt.value ?? null),
);

/* Only the character's card is captioned: a program's name is printed on the face above it. */
const panelName = computed(() =>
  !building.value && !panelProgram.value ? detailName.value : '',
);

const panelKicker = computed(() => {
  if (building.value && !panelProgram.value) {
    const slot = armed.value === null ? '' : slotLabel(armed.value);
    return t('character.panelOfTheStack', { slot });
  }
  return `${t('character.artBy')} ${artistOf(panelArt.value)}`;
});

/* The name is not rendered for a program, so the control has to carry it. */
const panelZoomLabel = computed(
  () => `${t('character.enlarge')}: ${panelProgram.value?.name ?? name.value}`,
);

/* "Replacing what is there" is a lie on an empty slot. */
const fillingNote = computed(() => {
  if (armed.value === null) return '';
  const slot = slotLabel(armed.value).toLowerCase();
  return panelProgram.value
    ? t('character.fillingNoteFull', { slot })
    : t('character.fillingNote', { slot });
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
          <!-- Breadcrumb segments must be pages this URL truncates to; faction and brand are not. -->
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

          <div class="char__copy-main">
            <p class="char__epithet">{{ epithet }}</p>
            <h1 class="char__name">{{ name }}</h1>

            <div v-if="character.factionIds === 'any'" class="char__emblems">
              <span class="char__emblem">
                <FactionDot :color="null" :size="9" />
                {{ t('universe.anyFaction') }}
              </span>
            </div>

            <p class="char__quote">“{{ active.flavour }}”</p>

            <dl class="char__facts">
              <div>
                <dt><MonoLabel tone="muted" as="span">{{ t('character.statHp') }}</MonoLabel></dt>
                <dd class="char__hp">{{ character.hp }}</dd>
              </div>
              <div class="char__facts-ability">
                <dt>
                  <MonoLabel tone="muted" as="span">{{ t('character.statAbility') }}</MonoLabel>
                </dt>
                <dd class="char__ability">
                  <span class="char__ability-name">{{ active.abilityName }}</span>
                  <CardText :text="character.abilityText" class="char__ability-text" />
                </dd>
              </div>
            </dl>

            <BaseLink v-if="playedBrands.length" :to="hashOnly('#pool')" class="char__brand-jump">
              <span class="l-sr-only">{{ t('character.brandJumpLabel') }}</span>
              <span class="char__brand-marks" aria-hidden="true">
                <BrandMark
                  v-for="brand in playedBrands"
                  :key="brand.id"
                  :icon="brand.icon"
                  :name="brand.name"
                  :color="factionById(brand.factionId ?? '')?.color"
                  :size="26"
                />
              </span>
              {{ brandJumpNames }}<span aria-hidden="true">↓</span>
            </BaseLink>

            <div v-if="loreTeaser" class="char__hero-foot">
              <p class="char__lore-teaser">{{ loreTeaser }}</p>
              <BaseLink v-if="hasLore" :to="hashOnly('#lore')" class="char__lore-link">
                {{ t('character.readTheirStory') }} <span aria-hidden="true">↓</span>
              </BaseLink>
            </div>
          </div>
        </div>

        <div class="char__art">
          <!-- Pointer-only by design: the same card is reachable from the panel and the own-card tile. -->
          <div class="char__art-frame" @click="openCharacterCard('art')">
            <ArtFrame
              :art="active.sceneArt"
              :placeholder="t('character.sceneSlot')"
              :sources="pictureSources(active.sceneArt.src)"
              :sizes="zoomed ? '2560px' : '(max-width: 899px) 100vw, 48vw'"
              eager
            />
          </div>
          <div class="char__art-foot">
            <MonoLabel tone="muted">{{ t('character.artBy') }} {{ artistOf(active.sceneArt) }}</MonoLabel>
            <div v-if="printings.length > 1" class="char__printings">
              <MonoLabel tone="faint" as="span">{{ t('character.printings') }}</MonoLabel>
              <div role="group" :aria-label="t('character.printings')" class="char__printing-chips">
                <button
                  v-for="printing in printings"
                  :key="printing.id"
                  type="button"
                  class="char__printing"
                  :aria-pressed="printing.id === active.id"
                  @click="choosePrinting(printing.id)"
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

      <div v-if="memberships.length" class="char__factions l-wrap">
        <BaseLink
          v-for="faction in memberships"
          :key="faction.id"
          :to="to('faction', { factionId: faction.id })"
          class="char__faction"
          :style="{ '--faction': faction.color, '--faction-text': faction.colorText }"
        >
          <ArtFrame
            v-if="faction.environment"
            :art="faction.environment"
            :sources="environmentSources(faction.id)"
            ratio="auto"
            sizes="(max-width: 899px) 100vw, 550px"
            class="char__faction-art"
          />
          <span class="char__faction-scrim" aria-hidden="true"></span>
          <span class="char__faction-body">
            <MonoLabel tone="muted" as="span">{{ t('character.moreFrom') }}</MonoLabel>
            <span class="char__faction-name">{{ faction.name }}</span>
          </span>
          <span class="char__faction-go" aria-hidden="true">→</span>
        </BaseLink>
      </div>

      <section id="cards" tabindex="-1" class="l-band">
        <div class="l-wrap">
          <MissingCardNote :slug="cardParam.missing.value" @dismiss="cardParam.dismissMissing()" />
          <div class="char__band-head">
            <SectionMarker
              id="cards"
              :index="1"
              :total="sectionTotal"
              :heading="building ? t('character.buildTitle') : t('character.poolTitle')"
            />
            <UiButton
              class="char__customize"
              :aria-expanded="building"
              aria-controls="stack"
              @click="toggleBuilding()"
            >
              {{ building ? t('character.customizeDone') : t('character.customize') }}
              <span aria-hidden="true">{{ building ? '×' : '→' }}</span>
            </UiButton>
          </div>

          <p v-if="building" class="char__pool-note">
            {{ t('character.buildNote', { name }) }}
            <BaseLink :to="to('learn', {}, { hash: '#paths' })">
              {{ t('character.buildRulesExit') }} →
            </BaseLink>
          </p>
          <p v-else class="char__pool-note">{{ t('character.poolNote', { name }) }}</p>

          <div v-if="!roomy && !building" class="char__own-card">
            <CardFace
              sizes="210px"
              :art="active.cardArt"
              :placeholder="t('character.cardSlot')"
              :action-label="`${t('character.seeCardLarge')}: ${active.name}`"
              @select="openCharacterCard()"
            >
              <template #overlay>
                <span class="char__zoom-badge" aria-hidden="true">
                  {{ t('character.enlarge') }}
                </span>
              </template>
            </CardFace>
          </div>

          <StackBuilder
            v-show="building"
            :slots="stackSlots"
            :count="stackCount"
            :seeds="seeds"
            :seed-id="stackSeedId"
            :dropped="stackDropped"
            :say="say"
            @choose="arm"
            @remove="clear"
            @load="loadSeed"
            @clear="announce(clearStack())"
          >
            <template #owner>
              <CardFace
                sizes="210px"
                :art="active.cardArt"
                :placeholder="t('character.cardSlot')"
                :action-label="`${t('character.seeCardLarge')}: ${active.name}`"
                @select="openCharacterCard()"
              >
                <template #overlay>
                  <span class="char__zoom-badge" aria-hidden="true">
                    {{ t('character.enlarge') }}
                  </span>
                </template>
              </CardFace>
            </template>
          </StackBuilder>

          <CardPool :groups="groups" :selected-id="selected?.slug ?? null" @select="pick">
            <template v-if="roomy" #panel>
              <button
                v-if="panelHasCard"
                type="button"
                class="char__panel-card"
                :aria-label="panelZoomLabel"
                @click="
                  panelProgram ? openCard(panelProgram.slug) : openCharacterCard()
                "
              >
                <ArtFrame
                  :art="panelArt ?? null"
                  ratio="63 / 88"
                  :placeholder="t('character.cardSlot')"
                  radius="m"
                  fit="contain"
                  :sources="pictureSources(panelArt?.src ?? null)"
                  sizes="320px"
                />
                <span class="char__zoom-badge" aria-hidden="true">
                  {{ t('character.enlarge') }}
                </span>
              </button>
              <div v-else class="char__panel-empty">
                <MonoLabel tone="accent" as="p">{{ t('character.panelEmpty') }}</MonoLabel>
              </div>

              <MonoLabel :tone="building ? 'accent' : 'muted'" class="char__panel-kicker">
                {{ panelKicker }}
              </MonoLabel>
              <h3 v-if="panelName" class="char__panel-name">{{ panelName }}</h3>

              <FaceToggle v-if="!building" v-model="face" />

              <template v-else>
                <MonoLabel tone="faint" as="p" class="char__filling-label">
                  {{ t('character.filling') }}
                </MonoLabel>
                <div
                  class="char__filling"
                  role="group"
                  :aria-label="t('character.fillingAria')"
                >
                  <button
                    v-for="slot in stackSlots"
                    :key="slot.key"
                    type="button"
                    class="char__filling-slot"
                    :aria-pressed="slot.armed"
                    :aria-label="t('character.fillingSlotAria', { slot: slot.label.toLowerCase() })"
                    @click="arm(slot.index)"
                  >
                    {{ slot.label }}
                  </button>
                </div>
                <p class="char__panel-hint">{{ fillingNote }}</p>
              </template>

              <p v-if="!building && !selected" class="char__panel-link">
                <BaseLink :to="to('cards', {}, { hash: '#anatomy' })">
                  {{ t('character.cardAnatomy') }} →
                </BaseLink>
              </p>

              <template v-if="!building && selected">
                <p class="char__panel-link">
                  <BaseLink :to="to('cards', {}, { query: galleryQuery })">
                    {{ t('character.openInGallery') }} →
                  </BaseLink>
                </p>
                <p class="char__panel-link">
                  <button type="button" class="char__linkish" @click="selected = null">
                    ← {{ t('character.backToCard', { name }) }}
                  </button>
                </p>
              </template>
            </template>

            <template v-if="building" #card="{ card }">
              <MonoLabel v-if="inStack(card.slug)" tone="accent" class="char__pick">
                {{ t('character.poolInStack') }}
              </MonoLabel>
            </template>

            <template #foot>
              <div class="char__pool-foot">
                <p class="char__squad-note">{{ t('character.squadNote') }}</p>
                <span class="char__pool-exits">
                  <BaseLink :to="to('learn', {}, { hash: '#paths' })" class="char__pool-exit">
                    {{ t('character.squadExit') }} →
                  </BaseLink>
                  <BaseLink :to="to('cards', {}, { query: galleryQuery })" class="char__pool-exit">
                    {{ t('character.galleryExit') }} →
                  </BaseLink>
                </span>
              </div>
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

    <CardDetail
      :open="cardParam.open.value"
      :row="zoomedRow"
      :printing="cardParam.printing.value"
      :open-face="zoomFace"
      @close="cardParam.close()"
      @printing="cardParam.setPrinting($event)"
    />
  </template>

  <section v-else class="l-band">
    <div class="l-wrap l-wrap--reading">
      <EmptyState :title="t('character.missingTitle')" :body="t('character.missingBody')" />
    </div>
  </section>
</template>

<style>
.char__brand-jump {
  margin-top: var(--space-5);
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  min-height: 44px;
  padding: var(--space-2) var(--space-4) var(--space-2) var(--space-3);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-m);
  background: rgba(var(--rgb-ink), 0.03);
  color: var(--color-ink);
  font-size: var(--size-field);
  font-weight: 500;
}

.char__brand-jump:hover {
  border-color: var(--color-accent);
  text-decoration: none;
}

.char__brand-marks {
  display: inline-flex;
  align-items: center;
}

/* The marks are white on transparency, so each needs an opaque plate to occlude the one behind it. */
.char__brand-marks > * {
  background: var(--color-bg);
  border-radius: 50%;
  padding: 3px;
  box-sizing: content-box;
}

.char__brand-marks > * + * {
  margin-left: -8px;
}

.char__hero-foot {
  position: relative;
  margin-top: var(--space-6);
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-line-strong);
}

.char__lore-teaser {
  max-width: 56ch;
  font-size: var(--size-body);
  line-height: 1.7;
  color: var(--color-ink-muted);
  /* Fixed distance, not a percentage: these teasers run 200 to 540 characters, and a proportional fade erases half a short one. */
  -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 4.5em), transparent 100%);
  mask-image: linear-gradient(to bottom, #000 calc(100% - 4.5em), transparent 100%);
}

.char__lore-link {
  position: absolute;
  left: 0;
  bottom: -6px;
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding-right: var(--space-4);
  font-size: var(--size-field);
  font-weight: 500;
  white-space: nowrap;
  color: var(--color-ink);
}

.char__lore-link:hover {
  color: var(--color-accent-text);
}

.char__factions {
  margin-top: clamp(28px, 4vw, 40px);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-3);
}

.char__faction {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-4);
  min-height: 92px;
  padding: var(--space-4) var(--space-5);
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-left: 3px solid var(--faction);
  border-radius: var(--radius-m);
  background: var(--color-surface);
  color: var(--color-ink);
}

.char__faction:hover {
  border-color: var(--faction);
  text-decoration: none;
}

.char__faction-art {
  position: absolute;
  inset: 0;
}

.char__faction-scrim {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, var(--color-bg) 6%, rgba(var(--rgb-bg), 0.55) 62%, transparent),
    rgba(var(--rgb-bg), 0.62);
}

.char__faction-body {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.char__faction-name {
  font-size: var(--size-field);
  font-weight: 500;
  color: var(--faction-text);
}

.char__faction-go {
  position: relative;
  margin-left: auto;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-pill);
  color: var(--color-ink-soft);
}

.char__band-head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-6);
  align-items: center;
  justify-content: space-between;
}

.char__customize {
  flex: 0 0 auto;
}

.char__panel-empty {
  aspect-ratio: 63 / 88;
  display: grid;
  place-items: center;
  padding: var(--space-5);
  border: 1px dashed rgba(var(--rgb-accent), 0.4);
  border-radius: var(--radius-m);
  background: rgba(var(--rgb-accent), 0.05);
  text-align: center;
}

.char__panel-hint {
  margin-top: var(--space-2);
  font-size: var(--size-m);
  line-height: 1.55;
  color: var(--color-ink-muted);
}

.char__filling-label {
  margin-top: var(--space-4);
}

.char__filling {
  margin-top: var(--space-2);
  display: flex;
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-pill);
  overflow: hidden;
}

.char__filling-slot {
  flex: 1 1 0;
  min-width: 0;
  min-height: 44px;
  padding-inline: 10px;
  border: 0;
  border-left: 1px solid var(--color-line-strong);
  background: transparent;
  color: var(--color-ink-soft);
  font-family: var(--font-mono);
  font-size: var(--size-mono-xs);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  white-space: nowrap;
}

.char__filling-slot:first-child {
  border-left: 0;
}

.char__filling-slot[aria-pressed='true'] {
  background: rgba(var(--rgb-accent), 0.2);
  color: var(--color-ink);
}

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
  padding-block: calc(var(--nav-height) + var(--space-8)) var(--band-y);
}

.char__copy-main {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
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
  cursor: zoom-in;
  flex: 1 1 auto;
  min-height: 0;
}

@media (max-width: 899px) {
  .char__art {
    border-left: 0;
    border-bottom: 2px solid var(--faction);
  }

 
  .char__art-frame {
    aspect-ratio: 4 / 5;
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
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-pill);
  font-size: var(--size-m);
  color: var(--color-ink);
  white-space: nowrap;
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


.char__facts-ability {
  flex: 1 1 280px;
  min-width: 0;
}

.char__ability {
  margin: 7px 0 0;
}

.char__ability-name {
  display: block;
  font-size: var(--size-body-l);
  font-weight: 500;
}

.char__ability-text {
  display: block;
  margin-top: var(--space-2);
  max-width: 46ch;
  font-size: var(--size-body);
  line-height: 1.6;
  color: var(--color-ink-muted);
  /* A printed keyword sits on its own line, and the card face splits on the same newline. */
  white-space: pre-line;
}

.char__hp {
  margin: 7px 0 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.25em;
  aspect-ratio: 1;
  padding: 0 0.3em;
  border: 2px solid var(--color-ink);
  border-radius: var(--radius-pill);
  font-size: 1.125rem;
  font-weight: 500;
  line-height: 1;
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

.char__pool-note {
  max-width: 62ch;
  font-size: var(--size-body);
  line-height: 1.65;
  color: var(--color-ink-soft);
}

.char__own-card {
  margin-top: var(--space-6);
  max-width: 210px;
}

.char__panel-card {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-m);
  overflow: hidden;
  background: var(--color-surface);
  cursor: zoom-in;
  transition: border-color var(--dur-2) var(--ease-out);
}

.char__panel-card:hover,
.char__panel-card:focus-visible {
  border-color: rgba(var(--rgb-accent), 0.55);
}

.char__zoom-badge {
  position: absolute;
  right: var(--space-2);
  bottom: var(--space-2);
  padding: 4px 8px;
  border-radius: var(--radius-s);
  background: rgba(var(--rgb-bg), 0.8);
  font-family: var(--font-mono);
  font-size: var(--size-mono-xs);
  letter-spacing: var(--track-mono);
  text-transform: uppercase;
  color: var(--color-accent-text);
}

button:hover > .char__zoom-badge,
button:focus-visible > .char__zoom-badge {
  color: var(--color-ink-bright);
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

.char__panel-link {
  margin-top: var(--space-4);
  font-size: var(--size-m);
  font-weight: 500;
}

.char__pool-exit {
  font-size: var(--size-body);
  font-weight: 500;
  white-space: nowrap;
}

.char__pool-foot {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-6);
  align-items: center;
  justify-content: space-between;
}

.char__squad-note {
  max-width: 52ch;
  font-size: var(--size-m);
  line-height: 1.6;
  color: var(--color-ink-soft);
}

.char__pick {
  margin-top: 6px;
}

.char__pool-exits {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-6);
  align-items: center;
}

.char__no-stories {
  max-width: 60ch;
  font-size: var(--size-body-l);
  line-height: 1.7;
  color: var(--color-ink-soft);
}
</style>
