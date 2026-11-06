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
/* From 960px each slice crops a painting scaled to the band's full height, which is wider than the slice; keep in step with --band-h. */
const sizes = '(min-width: 960px) 1950px, 100vw';
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

    <!-- IncursionsBand tucks its ground under this foot: its margin-top and padding-top are measured against the foot's height and padding. -->
    <div class="c-factions__foot">
      <div class="c-factions__rail">
        <span class="c-factions__rail-line" aria-hidden="true"></span>
        <span class="c-factions__rail-plate" aria-hidden="true"></span>
        <span class="c-factions__rail-step" aria-hidden="true"></span>
        <span class="c-factions__rail-lit" aria-hidden="true"></span>
        <BaseLink :to="to('universe')" class="c-factions__more">
          {{ t('home.factions.link') }} <span aria-hidden="true">→</span>
        </BaseLink>
      </div>
    </div>
  </section>
</template>

<style>

/* Transparent and above the next band, so IncursionsBand's ground shows under the rail's slanted foot. */
.c-factions {
  container-type: inline-size;
  position: relative;
  z-index: var(--z-raised);
  overflow: hidden;
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
  padding-bottom: 56px;
}

/* Hangs from the last row's bottom edge, which drops 20px across the band. */
.c-factions__rail {
  position: relative;
  z-index: 2;
  height: 46px;
  margin-top: -21px;
  transform: rotate(atan2(20px, 100cqw));
  transform-origin: 0 0;
}

.c-factions__rail-line,
.c-factions__rail-plate,
.c-factions__rail-step,
.c-factions__rail-lit {
  position: absolute;
  pointer-events: none;
}

/* The fill sits 1.5px horizontally inside every edge of the line's shape, so the line reads as an outline. */
.c-factions__rail-line {
  inset: 0;
  background: rgba(var(--rgb-accent-text), 0.5);
  clip-path: polygon(0 0, 100% 0, 100% 24px, 270px 24px, 248px 100%, 0 100%);
}

.c-factions__rail-plate {
  inset: 2px 0 1.5px;
  background: var(--color-hardware);
  clip-path: polygon(0 0, 100% 0, 100% 20.5px, 270px 20.5px, 248px 100%, 0 100%);
}

.c-factions__rail-step {
  display: none;
}

/* Must follow the fills in the markup, so the lit edge covers the hardware too. */
.c-factions__rail-lit {
  inset: 2px 0 auto;
  height: 30px;
  background: linear-gradient(to bottom, rgba(var(--rgb-accent-text), 0.12), rgba(var(--rgb-accent-text), 0));
}

.c-factions__more {
  position: absolute;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  column-gap: 0.25em;
  width: 248px;
  height: 44px;
  padding-left: var(--gutter);
  font-size: var(--size-body);
  font-weight: 600;
  white-space: nowrap;
  color: var(--color-accent);
}

.c-factions__more:hover {
  color: var(--color-ink-bright);
}

/* Inset: an outer ring is cut off by the band's overflow and the screen edge. */
.c-factions__more:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px var(--color-accent);
}

@media (min-width: 960px) {
  /* --tilt-d is how far the band's edges rise across its width: one slope shared by the clip, the tab and the foot. */
  .c-factions {
    --tilt: 3.4deg;
  }

  .c-factions > * {
    --tilt-d: calc(100cqw * tan(var(--tilt)));
    --edge: max(var(--gutter), (100cqw - var(--width-content)) / 2 + var(--gutter));
    --band-h: 620px;
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

  .c-factions__foot {
    padding-bottom: 72px;
  }

  /* Pivots on the band's bottom-right corner, so its top edge is the band's bottom edge. */
  .c-factions__rail {
    height: 68px;
    margin-top: calc(-1 * var(--tilt-d) - 1px);
    transform: rotate(calc(-1 * var(--tilt)));
    transform-origin: 100% 0;
  }

  /* Left of IncursionsBand's spine column (--edge + 480px to + 552px) the pieces are placed from the left edge; the link's tab from the right. */
  .c-factions__rail-line {
    clip-path: polygon(
      0 0,
      100% 0,
      100% 24px,
      calc(100% - var(--edge)) 24px,
      calc(100% - var(--edge) - 44px) 100%,
      calc(100% - var(--edge) - 288px) 100%,
      calc(100% - var(--edge) - 332px) 24px,
      calc(var(--edge) + 552px) 24px,
      calc(var(--edge) + 552px) 2px,
      0 2px
    );
  }

  .c-factions__rail-plate {
    clip-path: polygon(
      calc(var(--edge) + 553.5px) 0,
      100% 0,
      100% 21px,
      calc(100% - var(--edge) - 1.5px) 21px,
      calc(100% - var(--edge) - 45.5px) 100%,
      calc(100% - var(--edge) - 286.5px) 100%,
      calc(100% - var(--edge) - 330.5px) 21px,
      calc(var(--edge) + 553.5px) 21px
    );
  }

  .c-factions__more {
    right: calc(var(--edge) + 44px);
    left: auto;
    justify-content: center;
    width: 244px;
    padding-left: 0;
  }
}

/* Room for the stepped tab left of the spine; narrower, the plate starts flush at the spine instead. */
@media (min-width: 1024px) {
  .c-factions__rail-line {
    clip-path: polygon(
      0 0,
      100% 0,
      100% 24px,
      calc(100% - var(--edge)) 24px,
      calc(100% - var(--edge) - 44px) 100%,
      calc(100% - var(--edge) - 288px) 100%,
      calc(100% - var(--edge) - 332px) 24px,
      calc(var(--edge) + 594px) 24px,
      calc(var(--edge) + 572px) 2px,
      calc(var(--edge) + 460px) 2px,
      calc(var(--edge) + 433px) 26px,
      calc(var(--edge) + 317.5px) 26px,
      calc(var(--edge) + 306.75px) 14px,
      calc(var(--edge) + 218.75px) 14px,
      calc(var(--edge) + 208px) 2px,
      0 2px
    );
  }

  .c-factions__rail-plate {
    clip-path: polygon(
      calc(var(--edge) + 574px) 0,
      100% 0,
      100% 21px,
      calc(100% - var(--edge) - 1.5px) 21px,
      calc(100% - var(--edge) - 45.5px) 100%,
      calc(100% - var(--edge) - 286.5px) 100%,
      calc(100% - var(--edge) - 330.5px) 21px,
      calc(var(--edge) + 595px) 21px
    );
  }

  /* The 45° cuts are pre-skewed for --tilt; recompute them if --tilt changes. */
  .c-factions__rail-step {
    display: block;
    top: 2px;
    left: calc(var(--edge) + 209.5px);
    width: 249px;
    height: 22.5px;
    background: var(--color-hardware);
    clip-path: polygon(0 0, 249px 0, 223.7px 22.5px, 108.2px 22.5px, 97.4px 10.5px, 9.4px 10.5px);
  }
}
</style>
