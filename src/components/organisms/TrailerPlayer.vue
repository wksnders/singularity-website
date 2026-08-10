<script setup lang="ts">
/**
 * Click-to-play video. Never autoplays, never plays on load, captions on.
 * With no video id yet it says so honestly instead of pretending to buffer —
 * the mechanism is what has to exist before launch, not the file.
 */
import { ref } from 'vue';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import { t } from '@/content';

const props = withDefaults(
  defineProps<{
    youTubeId?: string | null;
    title: string;
    placeholder?: string;
    ratio?: string;
  }>(),
  { placeholder: '[ poster frame — 16:9 ]', ratio: '16 / 9' },
);

const playing = ref(false);

/* youtube-nocookie.com, not youtube.com: the privacy-enhanced host sets no
   tracking cookie until playback actually starts. Since the player is
   click-to-play, nobody who merely loads a page with a video on it is tracked
   at all — which is what keeps this side of a consent banner. */
const src = () =>
  `https://www.youtube-nocookie.com/embed/${props.youTubeId}?autoplay=1&cc_load_policy=1`;
</script>

<template>
  <div class="c-video">
    <ArtFrame :ratio="ratio" radius="l" :placeholder="placeholder" />

    <button
      v-if="!playing"
      type="button"
      class="c-video__play"
      :aria-label="`${t('video.play')}: ${title}`"
      @click="playing = true"
    >
      <span class="c-video__disc" aria-hidden="true"><span class="c-video__tri" /></span>
    </button>

    <iframe
      v-else-if="youTubeId"
      class="c-video__frame"
      :src="src()"
      :title="title"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
      allowfullscreen
    />

    <div v-else class="c-video__pending" role="status">
      <div>
        <MonoLabel tone="accent">{{ t('video.pendingKicker') }}</MonoLabel>
        <p class="c-video__pending-text">{{ t('video.pendingBody') }}</p>
        <UiButton variant="secondary" @click="playing = false">
          {{ t('video.backToPoster') }}
        </UiButton>
      </div>
    </div>
  </div>
</template>

<style>
.c-video {
  position: relative;
  border: 1px solid rgba(var(--rgb-ink), 0.12);
  border-radius: var(--radius-l);
  overflow: hidden;
}

.c-video__play {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  border: 0;
  background: linear-gradient(0deg, rgba(var(--rgb-bg), 0.5), rgba(var(--rgb-bg), 0.1));
  cursor: pointer;
}

.c-video__disc {
  width: 72px;
  height: 72px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-pill);
  background: rgba(var(--rgb-accent), 0.92);
  box-shadow: 0 0 40px rgba(var(--rgb-accent), 0.55);
}

.c-video__tri {
  width: 0;
  height: 0;
  margin-left: 5px;
  border-left: 18px solid var(--color-on-accent);
  border-top: 11px solid transparent;
  border-bottom: 11px solid transparent;
}

.c-video__frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  background: var(--color-bg);
}

.c-video__pending {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: var(--space-6);
  text-align: center;
  background: rgba(var(--rgb-bg), 0.94);
}

.c-video__pending-text {
  margin: var(--space-3) auto var(--space-4);
  max-width: 44ch;
  font-size: var(--size-body);
  line-height: 1.6;
  color: var(--color-ink-muted);
}
</style>
