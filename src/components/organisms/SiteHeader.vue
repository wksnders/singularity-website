<script setup lang="ts">
/**
 * The site bar. Faction dots inside the Universe panel are the ONLY faction
 * colour anywhere in chrome.
 */
import MegaPanel from './MegaPanel.vue';
import BaseLink from '@/components/atoms/BaseLink.vue';
import SiteMark from '@/components/atoms/SiteMark.vue';
import { t } from '@/content';
import { primaryNav } from '@/site/ia';
import { outbound, to } from '@/site/links';
import { useChrome } from '@/composables/useChrome';
import { useRoute } from 'vue-router';
import { computed } from 'vue';

const {
  wide,
  scrolled,
  pastHeroLogo,
  navHidden,
  megaOpen,
  menuOpen,
  openMega,
  toggleMega,
  closeMega,
  toggleMenu,
} = useChrome();

const route = useRoute();

/* Home opens on the full lockup, so the fill and the mark share one moment:
   both wait for it to scroll away. Every other page has nothing to clear. */
const onHome = computed(() => route.name === 'home');
const solid = computed(() => (onHome.value ? pastHeroLogo.value : scrolled.value));
const markHidden = computed(() => onHome.value && !solid.value);
</script>

<template>
  <header
    class="c-nav"
    :class="{
      'is-solid': solid || megaOpen !== null,
      'is-hidden': navHidden,
      'is-mega': megaOpen !== null,
    }"
    @mouseleave="closeMega()"
  >
    <div class="c-nav__bar l-wrap">
      <RouterLink :to="to('home')" class="c-nav__brand" :class="{ 'is-quiet': markHidden }">
        <SiteMark />
      </RouterLink>

      <nav v-if="wide" class="c-nav__links" :aria-label="t('chrome.mainNav')">
        <span
          v-for="section in primaryNav"
          :key="section.key"
          class="c-nav__item"
          @mouseenter="section.mega ? openMega(section.key) : closeMega()"
        >
          <RouterLink :to="section.to" class="c-nav__link">
            {{ t(`ia.${section.key}.label`) }}
          </RouterLink>
          <button
            v-if="section.mega"
            type="button"
            class="c-nav__chevron"
            :data-mega-trigger="section.key"
            :aria-controls="`mega-${section.key}`"
            :aria-expanded="megaOpen === section.key"
            :aria-label="t(`ia.${section.key}.label`) + ' ' + t('chrome.sections')"
            @click="toggleMega(section.key)"
          >
            ▾
          </button>

          <!-- Two constraints on this spot: the panel follows its own trigger,
               and it exists while closed for `aria-controls` to resolve. -->
          <MegaPanel
            v-if="section.mega"
            v-show="megaOpen === section.key"
            :id="`mega-${section.key}`"
            :section="section"
          />
        </span>
      </nav>

      <div class="c-nav__spacer" />
      <BaseLink :link="outbound('buy')" class="c-nav__buy">
        {{ wide ? t('chrome.buy') : t('chrome.buyShort') }}
      </BaseLink>

      <button
        v-if="!wide"
        type="button"
        class="c-nav__burger"
        :aria-label="t('chrome.menu')"
        :aria-expanded="menuOpen"
        @click="toggleMenu()"
      >
        <span class="c-nav__burger-bars" aria-hidden="true" />
      </button>
    </div>
  </header>
</template>

<style>
.c-nav {
  position: fixed;
  inset: 0 0 auto;
  z-index: 50;
  border-bottom: 1px solid transparent;
  background: transparent;
  transform: translateY(0);
  transition:
    background var(--dur-2) var(--ease-out),
    border-color var(--dur-2) var(--ease-linear),
    backdrop-filter var(--dur-2) var(--ease-out),
    transform var(--dur-3) var(--ease-out);
}

.c-nav.is-solid {
  background: rgba(var(--rgb-bg), 0.88);
  border-bottom-color: var(--color-line);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.c-nav:not(.is-solid)::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: linear-gradient(to bottom, rgba(var(--rgb-bg), 0.55), transparent);
}

/* Fill and blur track MegaPanel's: the bar sits directly on the open panel
   and any difference reads as a seam. The border doubles with the panel's
   own border-top. */
.c-nav.is-mega {
  background: rgba(var(--rgb-surface), 0.97);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-bottom-color: transparent;
}

.c-nav.is-hidden {
  transform: translateY(-100%);
}

.c-nav__bar {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  height: var(--nav-height);
}

.c-nav__brand:hover {
  text-decoration: none;
  color: var(--color-ink);
}

.c-nav__brand.is-quiet {
  opacity: 0;
  pointer-events: none;
}

.c-nav__links {
  display: flex;
  flex: 1 1 auto;
  gap: var(--space-1);
  align-items: center;
  justify-content: center;
}

.c-nav__item {
  display: flex;
  align-items: center;
  border-radius: var(--radius-s);
}

.c-nav__link {
  padding: 10px 12px;
  font-size: var(--size-m);
  font-weight: 500;
  color: var(--color-ink-muted);
  border-radius: var(--radius-s);
}

.c-nav__link:hover,
.c-nav__link.router-link-active {
  background: rgba(var(--rgb-ink), 0.07);
  color: var(--color-ink);
  text-decoration: none;
}

.c-nav__item:has(.c-nav__chevron) .c-nav__link {
  padding-right: var(--space-1);
}

.c-nav__chevron {
  width: 44px;
  height: 44px;
  margin-left: -14px;
  display: grid;
  place-items: center;
  border: 0;
  background: transparent;
  color: var(--color-ink-muted);
  font-size: var(--size-s);
  line-height: 1;
  cursor: pointer;
}

.c-nav__buy {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding-inline: 18px;
  border-radius: var(--radius-pill);
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-size: var(--size-m);
  font-weight: 700;
  white-space: nowrap;
  box-shadow: var(--glow-accent);
}

.c-nav__buy:hover {
  color: var(--color-on-accent);
  text-decoration: none;
}

.c-nav__spacer {
  flex: 1 1 auto;
}

.c-nav__burger {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border: 1px solid rgba(var(--rgb-ink), 0.16);
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
}

.c-nav__burger-bars {
  display: block;
  width: 18px;
  height: 1.5px;
  background: var(--color-ink);
  box-shadow:
    0 6px 0 var(--color-ink),
    0 -6px 0 var(--color-ink);
}
.c-nav__brand {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  color: var(--color-ink);
  transition: opacity var(--dur-2) var(--ease-out);
}

@media (max-width: 899px) {
  .c-nav__bar {
    gap: var(--space-3);
  }

  .c-nav__brand {
    flex: 0 1 auto;
    min-width: 0;
  }


  .c-nav__buy {
    padding-inline: var(--space-3);
  }
}

@media (max-width: 400px) {
  .c-nav__bar {
    gap: var(--space-2);
  }
}
</style>
