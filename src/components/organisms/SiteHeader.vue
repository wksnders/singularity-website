<script setup lang="ts">
/**
 * The site bar. Transparent over a hero, solid past 80px, retracts on
 * scroll-down. Four of the five sections carry a mega panel; News is flat.
 * Faction dots inside the Universe panel are the ONLY faction colour in chrome.
 */
import MegaPanel from './MegaPanel.vue';
import PlayNowMenu from './PlayNowMenu.vue';
import { t } from '@/content';
import { primaryNav } from '@/site/ia';
import { to } from '@/site/links';
import { useChrome } from '@/composables/useChrome';

const { wide, scrolled, navHidden, megaOpen, menuOpen, openMega, toggleMega, closeMega, toggleMenu } =
  useChrome();
</script>

<template>
  <header
    class="c-nav"
    :class="{ 'is-solid': scrolled, 'is-hidden': navHidden, 'is-mega': megaOpen !== null }"
    @mouseleave="closeMega()"
  >
    <div class="c-nav__bar l-wrap">
      <RouterLink :to="to('home')" class="c-nav__brand">
        <span class="c-nav__mark" aria-hidden="true" />
        <span class="c-nav__wordmark">
          SINGULARITY<span class="c-nav__wordmark-suffix">.EXE</span>
        </span>
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
      <PlayNowMenu />

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
  backdrop-filter: blur(14px);
  transform: translateY(0);
  transition:
    background var(--dur-2) var(--ease-out),
    border-color var(--dur-2) var(--ease-linear),
    transform var(--dur-3) var(--ease-out);
}

.c-nav.is-solid {
  background: rgba(var(--rgb-bg), 0.88);
  border-bottom-color: var(--color-line);
}

/* Otherwise this doubles with the open panel's own border-top. */
.c-nav.is-mega {
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

.c-nav__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
  color: var(--color-ink);
}

.c-nav__brand:hover {
  text-decoration: none;
  color: var(--color-ink);
}

.c-nav__mark {
  width: 14px;
  height: 14px;
  border-radius: var(--radius-pill);
  background: var(--color-accent);
  box-shadow: 0 0 14px 2px rgba(var(--rgb-accent), 0.75);
}

.c-nav__wordmark {
  font-family: var(--font-display);
  font-size: var(--size-m);
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.c-nav__wordmark-suffix {
  color: rgba(var(--rgb-ink), 0.5);
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
</style>
