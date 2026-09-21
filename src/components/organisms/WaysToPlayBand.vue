<script setup lang="ts">
/* The co-op pattern is allowed only while neither half carries artwork: add art to either and the pattern comes out. */
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import { t } from '@/content';
import { game, modes } from '@/data/universe';
import { to } from '@/site/links';
import { patternUrl } from '@/site/patterns';

const formats = modes.filter((mode) => mode.id !== 'incursions');

const PIPS = 4;
function filledPips(range: string): number {
  const low = Number.parseInt(range, 10);
  return Number.isFinite(low) ? Math.min(Math.max(low, 1), PIPS) : 1;
}

const patternStyle = {
  '--ways-pattern': `url(${patternUrl('incursions-feature')})`,
};
</script>

<template>
  <section id="ways-to-play" class="c-ways" aria-labelledby="ways-to-play-title">
    <!-- Visually hidden but load-bearing: it is the parent the two h3 halves need in the heading outline. -->
    <h2 id="ways-to-play-title" class="l-sr-only">{{ t('home.waysToPlay.title') }}</h2>

    <div class="c-ways__grid">
      <div class="c-ways__half c-ways__half--lit">
        <div class="c-ways__layer c-ways__rules" aria-hidden="true"></div>
        <div class="c-ways__layer c-ways__glow c-ways__glow--ice" aria-hidden="true"></div>

        <div class="c-ways__copy">
          <p class="c-ways__meta">
            <span class="c-ways__pips" aria-hidden="true">
              <span
                v-for="pip in PIPS"
                :key="pip"
                class="c-ways__pip"
                :class="{ 'c-ways__pip--on': pip <= filledPips(game.competitivePlayers) }"
              ></span>
            </span>
            <span>
              {{ game.competitivePlayers }} {{ t('home.waysToPlay.competitive.players') }}
              <span class="c-ways__meta-note">· {{ t('home.waysToPlay.competitive.length') }}</span>
            </span>
          </p>
          <!-- Sized by the design, not by its level. -->
          <h3 class="c-ways__h">{{ t('home.waysToPlay.competitive.title') }}</h3>
          <p class="c-ways__lead">{{ t('home.waysToPlay.competitive.lead') }}</p>
          <p class="c-ways__support">{{ t('home.waysToPlay.competitive.support') }}</p>
          <ul class="c-ways__formats">
            <li v-for="format in formats" :key="format.id" class="c-ways__format">
              {{ format.name }}
            </li>
          </ul>
          <UiButton
            class="c-ways__cta c-ways__cta--ice"
            :to="to('learn', {}, { hash: '#modes' })"
          >
            {{ t('home.waysToPlay.competitive.cta') }}
          </UiButton>
          <MonoLabel size="xs" class="c-ways__box">
            {{ t('home.waysToPlay.competitive.box') }}
          </MonoLabel>
        </div>
      </div>

      <div class="c-ways__half c-ways__half--unlit">
        <div class="c-ways__layer c-ways__pattern" :style="patternStyle" aria-hidden="true"></div>
        <div class="c-ways__layer c-ways__glow c-ways__glow--rose" aria-hidden="true"></div>

        <div class="c-ways__copy">
          <p class="c-ways__meta">
            <span class="c-ways__pips" aria-hidden="true">
              <span
                v-for="pip in PIPS"
                :key="pip"
                class="c-ways__pip"
                :class="{ 'c-ways__pip--on': pip <= filledPips(game.incursionsPlayers) }"
              ></span>
            </span>
            <span>
              {{ game.incursionsPlayers }} {{ t('home.waysToPlay.coop.players') }}
              <span class="c-ways__meta-note">· {{ t('home.waysToPlay.coop.length') }}</span>
            </span>
          </p>
          <h3 class="c-ways__h">{{ t('home.waysToPlay.coop.title') }}</h3>
          <p class="c-ways__lead">{{ t('home.waysToPlay.coop.lead') }}</p>
          <!-- home.waysToPlay.coop.support counts the bosses in words: keep it in step with rogueAIs in src/data/universe.ts. -->
          <p class="c-ways__support">{{ t('home.waysToPlay.coop.support') }}</p>
          <UiButton class="c-ways__cta c-ways__cta--rose" :to="to('incursions')">
            {{ t('home.waysToPlay.coop.cta') }}
          </UiButton>
          <MonoLabel size="xs" class="c-ways__box">
            {{ t('home.waysToPlay.coop.box') }}
          </MonoLabel>
        </div>
      </div>
    </div>
  </section>
</template>

<style>
.c-ways {
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid var(--color-line);
  background: var(--color-bg-alt);

  /* The l-wrap gutter, recomputed from the viewport because the band itself is full-bleed. */
  --ways-gutter: max(var(--gutter), (100vw - var(--width-content)) / 2);
  /* Pull equals cut depth, or a hairline of page background shows through the seam. */
  --ways-seam: 44px;
}

.c-ways__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: stretch;
}

.c-ways__half {
  position: relative;
  /* Not position alone: the pattern layer sits at z-index -1 and escapes to the page root without a stacking context of its own. */
  isolation: isolate;
}

.c-ways__half--lit {
  padding: clamp(40px, 8vw, 56px) var(--gutter) clamp(40px, 7vw, 52px);
  background: var(--color-bg-alt);

  --ways-key: var(--color-accent-text);
}

/* Darker than --color-bg on purpose, so the unlit half reads as unlit against the page. */
.c-ways__half--unlit {
  margin-top: calc(var(--ways-seam) * -1);
  padding: clamp(56px, 10vw, 72px) var(--gutter) clamp(48px, 8vw, 60px);
  background: #050509;
  clip-path: polygon(0 var(--ways-seam), 100% 0, 100% 100%, 0 100%);
  box-shadow: inset 40px 0 80px -40px rgba(0, 0, 0, 0.9);

  --ways-key: var(--color-threat-text);
}

/* Any narrower and the wedge runs into the competitive copy, which its 42ch cap cannot pad away. */
@media (min-width: 1100px) {
  .c-ways {
    --ways-seam: 76px;
  }

  .c-ways__grid {
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  }

  .c-ways__half--lit {
    padding: clamp(64px, 7vw, 88px) clamp(36px, 4vw, 56px) clamp(64px, 7vw, 88px)
      var(--ways-gutter);
  }

  .c-ways__half--unlit {
    margin: 0 0 0 calc(var(--ways-seam) * -1);
    padding: clamp(64px, 7vw, 88px) var(--ways-gutter) clamp(68px, 8vw, 92px)
      clamp(104px, 10vw, 128px);
    clip-path: polygon(var(--ways-seam) 0, 100% 0, 100% 100%, 0 100%);
  }

}

.c-ways__layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.c-ways__rules {
  background:
    repeating-linear-gradient(90deg, rgba(var(--rgb-ink), 0.055) 0 1px, transparent 1px 64px),
    repeating-linear-gradient(0deg, rgba(var(--rgb-ink), 0.055) 0 1px, transparent 1px 64px);
}

.c-ways__glow--ice {
  background: radial-gradient(
    64% 58% at 26% 4%,
    rgba(var(--rgb-accent), 0.26),
    rgba(var(--rgb-bg), 0) 68%
  );
}

.c-ways__glow--rose {
  background: radial-gradient(
    70% 60% at 76% 82%,
    rgba(var(--rgb-threat), 0.34),
    rgba(var(--rgb-bg), 0) 68%
  );
}

/* The art is black ink on transparency, so it only works as a mask: the tint is the background. */
.c-ways__pattern {
  z-index: -1;
  background: var(--color-threat-text);
  /* Under-text strength while stacked, where the copy spans the whole half. */
  opacity: 0.12;
  mask-image: var(--ways-pattern),
    linear-gradient(250deg, #000 10%, rgba(0, 0, 0, 0.5) 52%, transparent 86%);
  mask-size: cover, cover;
  mask-position: right center, center;
  mask-repeat: no-repeat, no-repeat;
  mask-composite: intersect;
  -webkit-mask-image: var(--ways-pattern),
    linear-gradient(250deg, #000 10%, rgba(0, 0, 0, 0.5) 52%, transparent 86%);
  -webkit-mask-size: cover, cover;
  -webkit-mask-position: right center, center;
  -webkit-mask-repeat: no-repeat, no-repeat;
  /* A different keyword from the standard `intersect`, not a prefix of it. */
  -webkit-mask-composite: source-in;
}

@media (min-width: 1100px) {
  .c-ways__pattern {
    opacity: 0.28;
  }
}

.c-ways__copy {
  position: relative;
  max-width: 42ch;
}

.c-ways__half--unlit .c-ways__copy {
  max-width: 40ch;
}

.c-ways__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  font-family: var(--font-mono);
  font-size: var(--size-body);
  font-weight: 500;
  letter-spacing: var(--track-mono-tight);
  text-transform: uppercase;
  color: var(--ways-key);
}

.c-ways__meta-note {
  font-size: var(--size-m);
  color: var(--color-ink-soft);
}

.c-ways__pips {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.c-ways__pip {
  width: 11px;
  height: 11px;
  border: 2px solid var(--ways-key);
  border-radius: var(--radius-pill);
  opacity: 0.55;
}

.c-ways__pip--on {
  border-color: transparent;
  background: var(--ways-key);
  opacity: 1;
}

.c-ways__h {
  margin-top: var(--space-4);
  font-size: clamp(1.875rem, 5.2vw, 3rem);
  line-height: 1.02;
}

.c-ways__lead {
  margin-top: var(--space-5);
  max-width: 24ch;
  font-size: clamp(1.125rem, 2.6vw, 1.375rem);
  line-height: 1.45;
  letter-spacing: -0.01em;
  color: var(--color-ink);
}

.c-ways__support {
  margin-top: var(--space-4);
  max-width: 36ch;
  font-size: var(--size-body);
  line-height: 1.72;
  color: var(--color-ink-soft);
}

.c-ways__formats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: var(--space-6) 0 0;
  padding: 0;
  list-style: none;
}

.c-ways__format {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding-inline: var(--space-4);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-s);
  font-size: var(--size-m);
  color: var(--color-ink-muted);
  white-space: nowrap;
}

.c-ways__cta {
  margin-top: var(--space-7);
}

/* Never the filled accent pill, which is the page's buy button; two classes so this holds whichever of this and UiButton's CSS loads first. */
.c-btn.c-ways__cta--ice {
  border-color: rgba(var(--rgb-accent), 0.55);
  background: rgba(var(--rgb-accent), 0.12);
  color: var(--color-ink);
  font-weight: 700;
}

.c-btn.c-ways__cta--ice:hover {
  background: rgba(var(--rgb-accent), 0.22);
}

.c-btn.c-ways__cta--rose {
  border-color: rgba(var(--rgb-threat), 0.8);
  background: rgba(var(--rgb-threat), 0.2);
  color: var(--color-ink);
  font-weight: 700;
}

.c-btn.c-ways__cta--rose:hover {
  background: rgba(var(--rgb-threat), 0.32);
}

.c-ways__box {
  margin-top: var(--space-6);
}
</style>
