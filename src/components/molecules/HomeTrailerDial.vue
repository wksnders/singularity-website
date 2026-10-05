<script setup lang="ts">
/* Hidden from assistive tech and the tab order: each card's own label already names its character and stack. */
import { ref } from 'vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import { t } from '@/content';
import { asset } from '@/site/links';
import type { Side } from '@/site/castWires';

const props = defineProps<{
  /** Deg both dials turn: they move as a linked pair. */
  turn: number;
  /** The open card's dial hue and text colour; null at rest. */
  hue: number | null;
  tone: string | null;
  /** The open card's id, or null at rest. */
  open: string | null;
  /** Every card's caption: all are laid out, so the row is always as tall as the longest. */
  captions: { id: string; name: string; deck: string | null }[];
  hint: string;
  /** Paints the plate's spine art; until then it is plain. */
  spine: boolean;
}>();

const emit = defineEmits<{ fire: [side: Side] }>();

/** The dial art is red: at rest it turns to ice. */
const ICE = { hue: 228, sat: 0.35, bright: 1.15 };
const TINT = { sat: 0.9, bright: 1.25 };

const left = ref<HTMLElement | null>(null);
const right = ref<HTMLElement | null>(null);
const plate = ref<HTMLElement | null>(null);
defineExpose({ left, right, plate });

const filterVars = () =>
  props.hue === null
    ? { '--dial-hue': `${ICE.hue}deg`, '--dial-sat': ICE.sat, '--dial-bright': ICE.bright }
    : { '--dial-hue': `${props.hue}deg`, '--dial-sat': TINT.sat, '--dial-bright': TINT.bright };

const line = ref<InstanceType<typeof MonoLabel> | null>(null);
</script>

<template>
  <div
    class="c-home-dial"
    :class="{ 'is-open': !!open }"
    :style="{ '--turn': `${turn.toFixed(1)}deg`, '--dial-tone': tone ?? undefined, ...filterVars() }"
    aria-hidden="true"
  >
    <span ref="left" class="c-home-dial__knob" @click="emit('fire', 'l')">
      <img :src="asset('/trailer/dial-200.webp')" alt="" width="200" height="200" loading="lazy" decoding="async" />
    </span>
    <div ref="plate" class="c-home-dial__plate" :style="spine ? { '--spine': `url(${asset('/trailer/spine-h-443.webp')})` } : undefined">
      <MonoLabel ref="line" class="c-home-dial__line">
        <span class="c-home-dial__say" :class="{ 'is-on': !open }">{{ hint }}</span>
        <span v-for="c in captions" :key="c.id" class="c-home-dial__say" :class="{ 'is-on': c.id === open }">
          <span class="c-home-dial__name">{{ c.name }}</span>
          <span v-if="c.deck" class="c-home-dial__deck">{{ t('home.zero.stacks.openSep') }}{{ c.deck }}</span>
        </span>
      </MonoLabel>
    </div>
    <span ref="right" class="c-home-dial__knob" @click="emit('fire', 'r')">
      <img :src="asset('/trailer/dial-200.webp')" alt="" width="200" height="200" loading="lazy" decoding="async" />
    </span>
  </div>
</template>

<style>
/* Every caption is laid out (only the open one shows), so opening a stack moves neither the plate nor the page below. `--lines` is the default the script may raise. */
.c-home-dial {
  --lines: 3;
  --line: calc(1.4 * var(--size-mono-s));
  --line-pad: 4px;
  --dial: max(60px, calc(var(--lines) * var(--line) + 2 * var(--line-pad)));

  position: relative;
  min-height: var(--dial);
  z-index: var(--z-raised);
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(100%, 560px);
  margin: 0 auto;
}

.c-home-dial__knob {
  position: relative;
  z-index: var(--z-raised);
  flex: none;
  width: var(--dial);
  height: var(--dial);
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transform: rotate(var(--turn));
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.6),
    0 0 12px rgba(var(--rgb-accent), 0.14);
  transition:
    transform var(--dur-3) var(--ease-out),
    box-shadow var(--dur-3) var(--ease-linear);
}

.c-home-dial.is-open .c-home-dial__knob {
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.6),
    0 0 12px color-mix(in srgb, var(--dial-tone, var(--color-accent)) 33%, transparent);
}

/* Same filter functions in every state, or WebKit keeps a stale filter. */
.c-home-dial__knob img {
  display: block;
  width: 100%;
  height: 100%;
  filter: hue-rotate(var(--dial-hue)) saturate(var(--dial-sat)) brightness(var(--dial-bright));
}

.c-home-dial__plate {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0 -16px;
  background:
    linear-gradient(rgba(var(--rgb-bg), 0.5), rgba(var(--rgb-bg), 0.5)),
    var(--spine, none) center / auto 100% repeat-x;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
}

.c-home-dial__line {
  display: grid;
  align-items: center;
  min-height: 36px;
  margin: 0;
  padding: var(--line-pad) 20px;
  line-height: var(--line);
  text-align: center;
  text-shadow:
    0 1px 3px var(--color-bg),
    0 0 8px var(--color-bg);
}

.c-home-dial__name {
  color: var(--dial-tone, var(--color-accent));
}

.c-home-dial__deck {
  color: var(--color-accent);
}

.c-home-dial__say {
  grid-area: 1 / 1;
  visibility: hidden;
}

.c-home-dial__say.is-on {
  visibility: visible;
}

/* Small phones: the caption steps down a size and the dials grow to hold its longest wording. */
@media (max-width: 389px) {
  .c-home-dial {
    --lines: 4;
    --line: calc(1.4 * var(--size-mono-xs));
  }

  .c-home-dial__line {
    padding-inline: 14px;
    font-size: var(--size-mono-xs);
  }
}

@media (max-width: 339px) {
  .c-home-dial {
    --lines: 5;
  }

  .c-home-dial__line {
    padding-inline: 10px;
    letter-spacing: var(--track-mono-tight);
  }
}

/* HomeHero's SIDE_QUERY. */
@media (min-width: 47.5em), (orientation: landscape) and (min-width: 34em) {
  .c-home-dial {
    --lines: 2;
  }

  .c-home-dial__line {
    padding-inline: 30px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .c-home-dial__knob {
    transition: box-shadow var(--dur-3) var(--ease-linear) !important;
  }
}
</style>
