<script setup lang="ts">
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import BaseLink from '@/components/atoms/BaseLink.vue';
import FactionDot from '@/components/atoms/FactionDot.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import { t } from '@/content';
import { factions } from '@/data/universe';
import { pad } from '@/site/format';
import { environmentSources, to } from '@/site/links';

const count = factions.length;
/* Each slice is about 1/count of the band from 960px; the extra 2vw covers the overlap at the seams. */
const sizes = `(min-width: 960px) ${Math.ceil(100 / count) + 2}vw, 100vw`;
</script>

<template>
  <section class="c-factions" aria-labelledby="factions-title">
    <div class="c-factions__head">
      <div class="c-factions__tab">
        <MonoLabel tone="accent">{{ t('home.factions.kicker') }}</MonoLabel>
        <h2 id="factions-title" class="c-factions__title">{{ t('home.factions.title') }}</h2>
      </div>
    </div>

    <ul class="c-factions__list" role="list">
      <li
        v-for="(faction, i) in factions"
        :key="faction.id"
        role="listitem"
        class="c-factions__item"
        :style="{
          '--faction': faction.color,
          '--faction-text': faction.colorText,
          '--faction-glow': `${faction.color}61`,
          '--faction-glow-strong': `${faction.color}80`,
          '--i': i,
          '--n': count,
        }"
      >
        <BaseLink :to="to('faction', { factionId: faction.id })" class="c-factions__slice">
          <span class="c-factions__art" aria-hidden="true">
            <ArtFrame
              :art="faction.environment"
              ratio="auto"
              placeholder=""
              :sources="faction.environment ? environmentSources(faction.id) : []"
              :sizes="sizes"
            />
            <span class="c-factions__glow" aria-hidden="true"></span>
          </span>
          <span class="c-factions__text">
            <span class="c-factions__num">{{ t('home.factions.number', { n: pad(i + 1) }) }}</span>
            <h3 class="c-factions__name">
              <FactionDot :color="faction.color" :size="8" />
              {{ faction.name }}
            </h3>
            <span class="c-factions__tag">{{ faction.tagline }}</span>
          </span>
        </BaseLink>
      </li>
    </ul>

    <div class="c-factions__foot">
      <div class="c-factions__foot-in">
        <BaseLink :to="to('universe')" class="c-factions__more">
          {{ t('home.factions.link') }} <span aria-hidden="true">→</span>
        </BaseLink>
      </div>
    </div>
  </section>
</template>

<style>

.c-factions {
  container-type: inline-size;
  position: relative;
  overflow: hidden;
  background: var(--color-bg);
}

.c-factions__head {
  padding: clamp(48px, 9vw, 64px) var(--gutter) 20px;
}

.c-factions__title {
  margin-top: var(--space-3);
  font-size: var(--size-h2);
  line-height: 1;
  text-wrap: balance;
}

.c-factions__list {
  display: flex;
  flex-direction: column;
  padding-top: 20px;
}

.c-factions__item {
  margin-top: -20px;
}

/* The slice's own background is the faction colour; the art is inset over it, so the 4px left uncovered is the lit edge. */
.c-factions__slice {
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: flex-end;
  min-height: 170px;
  padding: 44px 96px 32px var(--gutter);
  overflow: hidden;
  clip-path: polygon(0 0, 100% 20px, 100% 100%, 0 calc(100% - 20px));
  background: var(--faction);
  color: var(--color-ink);
  text-decoration: none;
}

.c-factions__slice:hover {
  color: var(--color-ink);
  text-decoration: none;
}

/* clip-path cuts off an outer focus ring, so focus is drawn inside the shape. */
.c-factions__slice:focus-visible {
  outline: none;
  box-shadow: none;
}

.c-factions__slice:focus-visible .c-factions__text {
  outline: 2px solid var(--color-accent);
  outline-offset: 6px;
  border-radius: 2px;
}

.c-factions__art {
  position: absolute;
  inset: 0;
  overflow: hidden;
  clip-path: polygon(0 4px, 100% 24px, 100% 100%, 0 100%);
  background: var(--color-bg);
}

.c-factions__art > .c-art {
  position: absolute;
  inset: 0;
  height: 100%;
}

.c-factions__glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    to right,
    rgba(var(--rgb-bg), 0.9) 0%,
    rgba(var(--rgb-bg), 0.6) 42%,
    var(--faction-glow) 70%,
    transparent 96%
  );
}

.c-factions__text {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  pointer-events: none;
}

.c-factions__num {
  font-family: var(--font-label);
  font-size: var(--size-label-xs);
  font-weight: 600;
  letter-spacing: var(--track-label);
  text-transform: uppercase;
  color: var(--faction-text);
}

.c-factions__name {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-faction);
  font-size: 1.125rem;
  font-weight: 400;
  letter-spacing: normal;
  line-height: 1.05;
  overflow-wrap: anywhere;
  color: var(--faction-text);
}

.c-factions__name .c-dot {
  display: none;
}

.c-factions__tag {
  font-size: var(--size-s);
  line-height: 1.4;
  color: rgba(var(--rgb-ink), 0.88);
}

.c-factions__foot {
  padding: var(--space-6) var(--gutter) 56px;
}

.c-factions__more {
  font-weight: 600;
  color: var(--color-accent);
}

@media (min-width: 960px) {
  /* --tilt-d is how far the band's edges rise across its width: one slope shared by the clip, the tab and the link. */
  .c-factions {
    --tilt: 3.4deg;
  }

  .c-factions > * {
    --tilt-d: calc(100cqw * tan(var(--tilt)));
    --edge: max(var(--gutter), (100cqw - var(--width-content)) / 2 + var(--gutter));
    --band-h: 400px;
  }

  .c-factions__head {
    padding: calc(56px + var(--tilt-d)) 0 0;
  }

  .c-factions__tab {
    position: relative;
    z-index: 2;
    width: max-content;
    max-width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: 20px 72px 18px var(--edge);
    background: var(--color-bg);
    clip-path: polygon(0 0, calc(100% - 40px) 0, 100% 100%, 0 100%);
    transform: rotate(calc(-1 * var(--tilt)));
    transform-origin: 0 100%;
  }

  .c-factions__title {
    margin-top: 0;
    white-space: nowrap;
  }

  .c-factions__list {
    position: relative;
    z-index: 1;
    flex-direction: row;
    height: calc(var(--band-h) + var(--tilt-d));
    margin-top: calc(-1 * var(--tilt-d) - 30px);
    padding-top: 0;
    clip-path: polygon(0 var(--tilt-d), 100% 0, 100% var(--band-h), 0 100%);
  }

  /* Each slice overlaps the one before by its 40px slant less a 3px seam; the end slices start 20px narrower so the visible art is equal. */
  .c-factions__item {
    flex: 1 1 20px;
    min-width: 0;
    margin-top: 0;
    margin-left: -37px;
  }

  .c-factions__item:first-child {
    flex-basis: 0;
    margin-left: 0;
  }

  .c-factions__item:last-child {
    flex-basis: 0;
  }

  .c-factions__slice {
    display: block;
    height: 100%;
    min-height: 0;
    padding: 0;
    clip-path: polygon(40px 0, 100% 0, calc(100% - 40px) 100%, 0 100%);
  }

  .c-factions__item:first-child .c-factions__slice {
    clip-path: polygon(0 0, 100% 0, calc(100% - 40px) 100%, 0 100%);
  }

  .c-factions__item:last-child .c-factions__slice {
    clip-path: polygon(40px 0, 100% 0, 100% 100%, 0 100%);
  }

  .c-factions__art {
    clip-path: polygon(44px 0, 100% 0, calc(100% - 40px) 100%, 4px 100%);
  }

  .c-factions__item:first-child .c-factions__art {
    clip-path: polygon(0 0, 100% 0, calc(100% - 40px) 100%, 0 100%);
  }

  .c-factions__item:last-child .c-factions__art {
    clip-path: polygon(44px 0, 100% 0, 100% 100%, 4px 100%);
  }

  .c-factions__glow {
    background:
      linear-gradient(to top, rgba(var(--rgb-bg), 0.92) 0%, rgba(var(--rgb-bg), 0.55) 38%, transparent 66%),
      radial-gradient(130% 60% at 45% 100%, var(--faction-glow-strong), transparent 72%);
  }

  /* The text climbs with the band's bottom edge, so every slice keeps the same air under its name. */
  .c-factions__text {
    position: absolute;
    left: 24px;
    right: 52px;
    bottom: calc(28px + var(--tilt-d) * (var(--i) / var(--n) + 0.22));
    gap: 6px;
  }

  .c-factions__item:last-child .c-factions__text {
    right: 24px;
  }

  .c-factions__num {
    display: none;
  }

  .c-factions__name {
    font-size: 1.375rem;
  }

  .c-factions__name .c-dot {
    display: inline-block;
  }

  .c-factions__tag {
    font-size: var(--size-body-s);
  }

  /* The band's bottom edge is lower where the link starts than at the screen's right edge, by --edge times the slope. */
  .c-factions__foot {
    padding: 0 var(--edge) 64px;
    margin-top: calc(18px - var(--tilt-d) + var(--edge) * tan(var(--tilt)));
  }

  .c-factions__more {
    white-space: nowrap;
  }

  .c-factions__foot-in {
    display: flex;
    justify-content: flex-end;
    transform: rotate(calc(-1 * var(--tilt)));
    transform-origin: 100% 0;
  }
}
</style>
