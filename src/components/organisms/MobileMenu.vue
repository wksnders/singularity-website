<script setup lang="ts">

import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';
import BaseLink from '@/components/atoms/BaseLink.vue';
import FactionDot from '@/components/atoms/FactionDot.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import SiteMark from '@/components/atoms/SiteMark.vue';
import { t } from '@/content';
import { factions } from '@/data/universe';
import { mobileShortcuts, primaryNav, socialKeys } from '@/site/ia';
import type { IaItem, IaSection, ShortcutIcon } from '@/site/ia';
import { outbound, resolveLink, to } from '@/site/links';
import { useChrome } from '@/composables/useChrome';
import { useModal } from '@/composables/useModal';

const { menuOpen, toggleMenu } = useChrome();

const closeButton = ref<HTMLElement | null>(null);

function close(): void {
  menuOpen.value = false;
}

const { dialog } = useModal({
  open: () => menuOpen.value,
  close,
  initialFocus: () => closeButton.value,
});

/* Back-button navigation doesn't call toggleMenu(), so the sheet must close on route change. */
const route = useRoute();
const router = useRouter();
watch(
  () => route.fullPath,
  () => {
    if (menuOpen.value) close();
  },
);

const socials = socialKeys.filter((key) => key !== 'discord');

const ICONS: Record<ShortcutIcon, string[]> = {
  learn: ['M5 4h13v16H7a2 2 0 0 1-2-2z', 'M5 18a2 2 0 0 1 2-2h11'],
  cards: ['M11 4.5a6.5 6.5 0 1 1 0 13a6.5 6.5 0 1 1 0-13z', 'M20 20l-4-4'],
  print: ['M7 9V3h10v6', 'M5 9h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z', 'M7 14h10v7H7z'],
  chat: ['M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-5 4v-4H6a2 2 0 0 1-2-2z'],
};

const label = (item: IaItem) => t(`ia.${item.key}.${item.mobileLabel ? 'mobileLabel' : 'label'}`);
const note = (item: IaItem) => (item.note ? t(`ia.${item.key}.note`) : '');

const trim = (path: string) => (path.length > 1 ? path.replace(/\/+$/, '') : path);
const within = (path: string, base: string) => path === base || path.startsWith(`${base}/`);

function place(target: RouteLocationRaw | undefined): { path: string; hash: string } | null {
  if (!target) return null;
  try {
    const resolved = router.resolve(target);
    return { path: trim(resolved.path), hash: resolved.hash };
  } catch {
    return null;
  }
}

const here = computed(() => trim(route.path));

const currentSection = computed<IaSection | null>(
  () =>
    primaryNav.find((section) => {
      const at = place(section.to);
      return Boolean(at && at.path !== '/' && within(here.value, at.path));
    }) ?? null,
);

const overviewId = (section: IaSection) => `${section.key}:overview`;
const factionId = (id: string) => `faction:${id}`;

/* Best match wins: page and anchor, then page, then a page inside it, then the section's own page. */
const currentRow = computed<string | null>(() => {
  const section = currentSection.value;
  if (!section) return null;
  const rows: { id: string; target?: RouteLocationRaw; overview?: boolean }[] = [
    { id: overviewId(section), target: section.to, overview: true },
    ...(section.mobileFactions
      ? factions.map((faction) => ({ id: factionId(faction.id), target: to('faction', { factionId: faction.id }) }))
      : []),
    ...(section.mobile ?? []).map((item) => ({ id: item.key, target: item.to })),
  ];
  let best: string | null = null;
  let bestScore = 0;
  for (const row of rows) {
    const at = place(row.target);
    if (!at) continue;
    let score = 0;
    if (at.hash) score = here.value === at.path && route.hash === at.hash ? 4 : 0;
    else if (here.value === at.path) score = row.overview ? 1.5 : 3;
    else if (!row.overview && within(here.value, at.path)) score = 1;
    if (score > bestScore) {
      best = row.id;
      bestScore = score;
    }
  }
  return best;
});

const ariaCurrent = (id: string) => (currentRow.value === id ? 'page' : undefined);

const openSection = ref<string | null>(null);

watch(
  menuOpen,
  (isOpen) => {
    if (!isOpen) return;
    const section = currentSection.value;
    openSection.value = section?.mobile ? section.key : null;
  },
  { immediate: true },
);

function toggleSection(key: string): void {
  openSection.value = openSection.value === key ? null : key;
}
</script>

<template>
  <!-- TELEPORTED so the sheet is a direct child of <body>: useModal inerts every body child except the dialog, and inside #app the sheet would be inert with it. -->
  <Teleport to="body">
    <Transition name="c-sheet">
      <div
        v-if="menuOpen"
        ref="dialog"
        class="c-sheet"
        role="dialog"
        aria-modal="true"
        :aria-label="t('chrome.menu')"
      >
        <!-- Mirrors the page header: Buy, then Close in the menu button's place. -->
        <div class="c-sheet__head">
          <RouterLink :to="to('home')" class="c-sheet__brand" @click="close()">
            <SiteMark />
          </RouterLink>
          <span class="c-sheet__spacer" />
          <BaseLink :link="outbound('buy')" class="c-sheet__buy" @click="close()">
            {{ t('chrome.buy') }}
          </BaseLink>
          <button
            ref="closeButton"
            type="button"
            class="c-sheet__close"
            :aria-label="t('chrome.close')"
            @click="toggleMenu()"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <nav class="c-sheet__nav" :aria-label="t('chrome.siteNav')">
          <template v-if="mobileShortcuts.length">
            <MonoLabel class="c-sheet__label">{{ t('chrome.menuShortcuts') }}</MonoLabel>
            <div class="c-sheet__tiles">
              <!-- aria-current="false": RouterLink ignores the hash, so on /learn it would mark the /learn#paths tile current. -->
              <BaseLink
                v-for="item in mobileShortcuts"
                :key="item.key"
                :link="resolveLink(item)"
                class="c-sheet__tile"
                aria-current="false"
                @click="close()"
              >
                <span class="c-sheet__tile-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path v-for="d in ICONS[item.icon]" :key="d" :d="d" /></svg>
                </span>
                <span class="c-sheet__tile-text">
                  <span class="c-sheet__tile-title">{{ t(`ia.${item.key}.label`) }}</span>
                  <span class="c-sheet__tile-note">{{ t(`ia.${item.key}.note`) }}</span>
                </span>
              </BaseLink>
            </div>
          </template>

          <MonoLabel class="c-sheet__label">{{ t('chrome.menuExplore') }}</MonoLabel>

          <div v-for="section in primaryNav" :key="section.key" class="c-sheet__section">
            <template v-if="section.mobile">
              <button
                type="button"
                class="c-sheet__row"
                :class="{ 'is-current': currentSection?.key === section.key }"
                :aria-expanded="openSection === section.key"
                :aria-controls="`sheet-${section.key}`"
                @click="toggleSection(section.key)"
              >
                <span class="c-sheet__row-text">
                  <span class="c-sheet__row-title">{{ t(`ia.${section.key}.label`) }}</span>
                  <span class="c-sheet__row-blurb">{{ t(`ia.${section.key}.blurb`) }}</span>
                </span>
                <span class="c-sheet__row-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
                </span>
              </button>

              <!-- Stays mounted so `aria-controls` resolves; `visibility` drops the closed panel's links from the tab order. -->
              <div
                :id="`sheet-${section.key}`"
                class="c-sheet__panel"
                :class="{ 'is-open': openSection === section.key }"
              >
                <div class="c-sheet__panel-clip">
                  <div class="c-sheet__panel-inner">
                    <RouterLink
                      :to="section.to"
                      class="c-sheet__overview"
                      :class="{ 'is-current': currentRow === overviewId(section) }"
                      :aria-current="ariaCurrent(overviewId(section))"
                      @click="close()"
                    >
                      {{ t('chrome.overview', { section: t(`ia.${section.key}.label`) }) }}
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                    </RouterLink>

                    <template v-if="section.mobileFactions">
                      <MonoLabel class="c-sheet__label c-sheet__label--inset">
                        {{ t('ia.universe.factions.label') }}
                      </MonoLabel>
                      <div class="c-sheet__factions">
                        <RouterLink
                          v-for="faction in factions"
                          :key="faction.id"
                          :to="to('faction', { factionId: faction.id })"
                          class="c-sheet__faction"
                          :class="{ 'is-current': currentRow === factionId(faction.id) }"
                          :aria-current="ariaCurrent(factionId(faction.id))"
                          @click="close()"
                        >
                          <FactionDot :color="faction.color" :size="10" />
                          {{ faction.name }}
                        </RouterLink>
                      </div>
                    </template>

                    <BaseLink
                      v-for="item in section.mobile"
                      :key="item.key"
                      :link="resolveLink(item)"
                      class="c-sheet__link"
                      :class="{ 'is-current': currentRow === item.key }"
                      :aria-current="ariaCurrent(item.key)"
                      @click="close()"
                    >
                      <span>{{ label(item) }}</span>
                      <span v-if="currentRow === item.key" class="c-sheet__here">{{ t('chrome.youAreHere') }}</span>
                      <span v-else-if="note(item)" class="c-sheet__note">{{ note(item) }}</span>
                    </BaseLink>
                  </div>
                </div>
              </div>
            </template>

            <RouterLink
              v-else
              :to="section.to"
              class="c-sheet__row"
              :class="{ 'is-current': currentSection?.key === section.key }"
              :aria-current="currentSection?.key === section.key ? 'page' : undefined"
              @click="close()"
            >
              <span class="c-sheet__row-text">
                <span class="c-sheet__row-title">{{ t(`ia.${section.key}.label`) }}</span>
                <span class="c-sheet__row-blurb">{{ t(`ia.${section.key}.blurb`) }}</span>
              </span>
              <span class="c-sheet__row-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </span>
            </RouterLink>
          </div>

          <div class="c-sheet__socials">
            <BaseLink v-for="key in socials" :key="key" :link="outbound(key)" class="c-sheet__social">
              {{ t(`chrome.social.${key}`) }}
            </BaseLink>
          </div>
        </nav>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.c-sheet {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  flex-direction: column;
  background: rgba(var(--rgb-bg), 0.94);
  backdrop-filter: blur(1.375rem);
  -webkit-backdrop-filter: blur(1.375rem);
  overflow-y: auto;
  overscroll-behavior: contain;
}

.c-sheet-enter-active,
.c-sheet-leave-active {
  transition:
    opacity var(--dur-2) var(--ease-out),
    transform var(--dur-2) var(--ease-out);
}

.c-sheet-enter-from,
.c-sheet-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}

.c-sheet svg {
  width: 1.125rem;
  height: 1.125rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex: 0 0 auto;
}

.c-sheet__head {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 0 0 auto;
  height: var(--nav-height);
  padding-inline: var(--gutter);
  border-bottom: 1px solid var(--color-line);
  background: rgba(var(--rgb-bg), 0.96);
}

.c-sheet__brand {
  display: flex;
  align-items: center;
  flex: 0 1 auto;
  min-width: 0;
  color: var(--color-ink);
}

.c-sheet__spacer {
  flex: 1 1 auto;
}

.c-sheet__buy {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  padding-inline: var(--space-4);
  border-radius: var(--radius-pill);
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-size: var(--size-m);
  font-weight: 700;
  white-space: nowrap;
  box-shadow: var(--glow-accent);
}

.c-sheet__buy:hover {
  color: var(--color-on-accent);
  text-decoration: none;
}

.c-sheet__close {
  width: 2.75rem;
  height: 2.75rem;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border: 1px solid rgba(var(--rgb-ink), 0.16);
  border-radius: 0.625rem;
  background: transparent;
  color: var(--color-ink);
  cursor: pointer;
}

.c-sheet__nav {
  display: flex;
  flex-direction: column;
  padding: var(--space-4) var(--gutter) var(--space-6);
}

/* Two-class selector: chrome loads in the entry chunk alongside .c-mono, so it cannot rely on order. */
.c-sheet .c-sheet__label {
  margin: 0 0 var(--space-2);
  color: var(--color-ink-soft);
  font-size: var(--size-label-xs);
  letter-spacing: 0.12em;
}

.c-sheet .c-sheet__label--inset {
  margin: var(--space-2) var(--space-3) var(--space-2);
}

.c-sheet__tiles {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2);
  margin-bottom: var(--space-5);
}

.c-sheet__tile {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-height: 3.75rem;
  padding: var(--space-2) 0.625rem;
  border: 1px solid rgba(var(--rgb-ink), 0.12);
  border-radius: var(--radius-m);
  background: var(--color-surface);
  color: var(--color-ink);
}

.c-sheet__tile:hover {
  background: var(--color-surface-raised);
  text-decoration: none;
}

.c-sheet__tile-icon {
  width: 2.125rem;
  height: 2.125rem;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: var(--radius-pill);
  background: rgba(var(--rgb-accent), 0.12);
  color: var(--color-accent);
}

.c-sheet__tile-icon svg {
  stroke-width: 1.8;
}

.c-sheet__tile-text {
  min-width: 0;
}

.c-sheet__tile-title {
  display: block;
  font-weight: 600;
  font-size: var(--size-body-s);
  line-height: 1.15;
}

.c-sheet__tile-note {
  display: block;
  margin-top: 0.125rem;
  font-size: var(--size-xs);
  color: var(--color-ink-muted);
}

.c-sheet__row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 4rem;
  padding: var(--space-2) var(--space-1);
  border: 0;
  border-bottom: 1px solid var(--color-line);
  background: transparent;
  color: var(--color-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.c-sheet__row:hover {
  text-decoration: none;
  color: var(--color-ink);
}

.c-sheet__row-text {
  flex: 1 1 auto;
  min-width: 0;
}

.c-sheet__row-title {
  display: block;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.5625rem;
  line-height: 1.05;
}

.c-sheet__row.is-current .c-sheet__row-title {
  color: var(--color-accent);
}

.c-sheet__row-blurb {
  display: block;
  margin-top: 0.125rem;
  font-size: var(--size-s);
  color: var(--color-ink-muted);
}

.c-sheet__row-icon {
  width: 2.375rem;
  height: 2.375rem;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-pill);
  transition: transform var(--dur-2) var(--ease-out);
}

.c-sheet__row[aria-expanded='true'] .c-sheet__row-icon {
  transform: rotate(180deg);
}

.c-sheet__panel {
  display: grid;
  grid-template-rows: 0fr;
  visibility: hidden;
  transition:
    grid-template-rows var(--dur-3) var(--ease-out),
    visibility 0s linear var(--dur-3);
}

.c-sheet__panel.is-open {
  grid-template-rows: 1fr;
  visibility: visible;
  transition:
    grid-template-rows var(--dur-3) var(--ease-out),
    visibility 0s linear 0s;
}

.c-sheet__panel-clip {
  min-height: 0;
  overflow: hidden;
}

.c-sheet__panel-inner {
  display: flex;
  flex-direction: column;
  margin: var(--space-1) 0 var(--space-3);
  padding: 0.375rem;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-m);
  background: var(--color-surface);
}

.c-sheet__overview,
.c-sheet__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  min-height: 2.875rem;
  padding-inline: var(--space-3);
  border-radius: 0.625rem;
  font-size: var(--size-body);
}

.c-sheet__overview {
  font-weight: 600;
  color: var(--color-accent);
}

.c-sheet__link {
  font-weight: 500;
  color: var(--color-ink);
}

.c-sheet__overview:hover,
.c-sheet__link:hover,
.c-sheet__faction:hover {
  background: rgba(var(--rgb-ink), 0.06);
  text-decoration: none;
}

.c-sheet__overview.is-current,
.c-sheet__link.is-current,
.c-sheet__faction.is-current {
  background: rgba(var(--rgb-accent), 0.12);
  color: var(--color-ink-bright);
  font-weight: 700;
}

.c-sheet__note {
  font-size: var(--size-s);
  font-weight: 400;
  color: var(--color-ink-soft);
  text-align: right;
}

.c-sheet__here {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-family: var(--font-label);
  font-weight: 600;
  font-size: var(--size-label-xs);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-accent-text);
  white-space: nowrap;
}

.c-sheet__here::before {
  content: '';
  width: 0.4375rem;
  height: 0.4375rem;
  border-radius: var(--radius-pill);
  background: var(--color-accent);
}

.c-sheet__factions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.375rem;
  padding: 0 0.375rem 0.375rem;
}

.c-sheet__faction {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-height: 2.75rem;
  padding-inline: var(--space-3);
  border-radius: 0.625rem;
  background: rgba(var(--rgb-ink), 0.04);
  color: var(--color-ink);
  font-size: var(--size-body-s);
  font-weight: 500;
  line-height: 1.15;
}

.c-sheet__socials {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  column-gap: var(--space-5);
  margin-top: var(--space-4);
}

.c-sheet__social {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  font-family: var(--font-label);
  font-weight: 500;
  font-size: var(--size-label-s);
  letter-spacing: var(--track-label-tight);
  color: var(--color-ink-muted);
  white-space: nowrap;
}

.c-sheet__social:hover {
  color: var(--color-ink);
  text-decoration: none;
}
</style>
