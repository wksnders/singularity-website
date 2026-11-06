<script setup lang="ts">
import { computed, useId } from 'vue';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import BaseLink from '@/components/atoms/BaseLink.vue';
import DiscordMark from '@/components/atoms/DiscordMark.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import NewsletterForm from '@/components/organisms/NewsletterForm.vue';
import { t } from '@/content';
import { communityPhoto, creators, type Creator } from '@/data/community';
import { isHidden, outbound, pictureSources, to } from '@/site/links';
import type { ResolvedLink } from '@/site/links';

const creatorLink = (c: Creator): ResolvedLink => (c.href ? { href: c.href, external: true } : outbound('youtube'));

/* Array.from, not word[0], so a character outside the BMP is never split in half. */
function initials(name: string): string {
  const words = name.normalize('NFC').replace(/[^\p{L}\p{M}\s]/gu, '').split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((word) => Array.from(word)[0]).join('');
  return (letters || Array.from(name.trim())[0] || '').toUpperCase();
}

const creditsId = useId();

const photo = computed(() => ({ src: communityPhoto, alt: t('home.community.photoAlt') }));
</script>

<template>
  <section id="community" class="c-community" aria-labelledby="community-title">
    <div class="c-community__strip">
      <div class="l-wrap c-community__roll">
        <MonoLabel :id="creditsId" tone="accent">{{ t('home.community.credits') }}</MonoLabel>
        <!-- Explicit roles: display: contents drops list semantics in some browsers. -->
        <ul role="list" class="c-community__creators" :aria-labelledby="creditsId">
          <li v-for="c in creators" :key="c.id" role="listitem" class="c-community__credit">
            <BaseLink :link="creatorLink(c)" class="c-community__creator">
              <span class="c-community__ini" aria-hidden="true">{{ initials(c.name) }}</span>
              <span class="c-community__who">
                <span class="c-community__name">{{ c.name }}</span>
                <span class="c-community__kind">{{ t(`home.community.kind.${c.kind}`) }}</span>
              </span>
            </BaseLink>
          </li>
        </ul>
      </div>
      <BaseLink v-if="!isHidden(to('news'))" :to="to('news')" class="c-community__coverage">
        {{ t('home.community.coverage') }} <span aria-hidden="true">→</span>
      </BaseLink>
    </div>

    <div class="c-community__scene">
      <div class="c-community__photo">
        <ArtFrame :art="photo" ratio="auto" :placeholder="t('home.community.photoPlaceholder')" :sources="pictureSources(communityPhoto)" sizes="100vw" />
        <span class="c-community__caption" aria-hidden="true">{{ t('home.community.photoCaption') }}</span>
      </div>

      <div class="c-community__plate">
        <div class="l-wrap c-community__plate-in">
          <div class="c-community__talk">
            <h2 id="community-title" class="c-community__title">
              <DiscordMark :size="34" />
              <span>{{ t('home.community.title') }}</span>
            </h2>
            <p class="c-community__body">{{ t('home.community.body') }}</p>
            <div class="c-community__act">
              <BaseLink :link="outbound('discord')" class="c-community__join">
                <DiscordMark :size="20" tone="black" />{{ t('home.community.cta') }}
              </BaseLink>
            </div>
          </div>
          <NewsletterForm class="c-community__inbox" />
        </div>
      </div>
    </div>
  </section>
</template>

<style>
.c-community {
  /* .l-wrap's content edge (layout.css): change with its max-width and padding. */
  --edge: max(var(--gutter), (100% - var(--width-content)) / 2 + var(--gutter));
  /* In rem, so the tab grows with the link it holds. */
  --hang-w: 9.375rem;
  --hang-h: 2.25rem;

  padding-top: clamp(40px, 6vw, 64px);
  background: var(--color-bg);
}

.c-community__strip {
  --shape: polygon(0 0, 100% 0, 100% calc(100% - var(--hang-h)), calc(var(--hang-w) + var(--hang-h)) calc(100% - var(--hang-h)), var(--hang-w) 100%, 0 100%);

  position: relative;
  z-index: 2;
  isolation: isolate;
}

.c-community__strip::before,
.c-community__strip::after {
  content: '';
  position: absolute;
  inset: 0;
  clip-path: var(--shape);
}

.c-community__strip::before {
  z-index: -2;
  bottom: -1.5px;
  background: rgba(var(--rgb-accent-text), 0.5);
}

.c-community__strip::after {
  z-index: -1;
  background: linear-gradient(180deg, var(--color-plate-top), var(--color-plate));
}

.c-community__roll {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1) 26px;
  padding-top: 18px;
  padding-bottom: calc(var(--hang-h) + 14px);
}

.c-community__creators {
  display: contents;
}

.c-community__credit {
  display: contents;
}

.c-community__creator {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  color: var(--color-ink);
  text-decoration: none;
}

.c-community__creator:hover {
  color: var(--color-ink-bright);
}

.c-community__ini {
  --chamfer: polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px);

  position: relative;
  isolation: isolate;
  flex: 0 0 32px;
  height: 32px;
  display: grid;
  place-items: center;
  font-family: var(--font-label);
  font-weight: 600;
  font-size: var(--size-label-2xs);
  color: var(--color-accent-text);
}

.c-community__ini::before,
.c-community__ini::after {
  content: '';
  position: absolute;
  z-index: -1;
  clip-path: var(--chamfer);
}

.c-community__ini::before {
  inset: 0;
  background: rgba(var(--rgb-accent-text), 0.4);
}

.c-community__ini::after {
  inset: 1px;
  background: var(--color-surface-sunk);
}

.c-community__who {
  display: flex;
  flex-direction: column;
}

.c-community__name {
  font-size: var(--size-body-s);
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
}

.c-community__kind {
  font-family: var(--font-label);
  font-weight: 600;
  font-size: var(--size-label-2xs);
  letter-spacing: var(--track-label);
  text-transform: uppercase;
  color: rgba(var(--rgb-ink), 0.66);
}

/* Its box is the strip's tab: keep its side in step with the strip's `--shape`. */
.c-community__coverage {
  position: absolute;
  left: 0;
  bottom: 0;
  width: var(--hang-w);
  height: var(--hang-h);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-size: var(--size-m);
  font-weight: 600;
  white-space: nowrap;
  color: var(--color-ink);
  text-decoration: none;
}

.c-community__coverage span {
  color: var(--color-accent-text);
}

.c-community__coverage:hover {
  color: var(--color-ink-bright);
}

/* Inset: on phones the link touches the screen edge, which clips an outer ring. */
.c-community__coverage:focus-visible {
  outline-offset: -2px;
  box-shadow: inset 0 0 0 4px var(--color-accent);
}

.c-community__photo {
  position: relative;
  height: min(66.667vw, 520px);
  margin-top: calc(-1 * var(--hang-h));
}

.c-community__photo > .c-art {
  position: absolute;
  inset: 0;
}

.c-community__caption {
  position: absolute;
  z-index: 1;
  right: var(--space-4);
  top: calc(var(--hang-h) + var(--space-2));
  font-family: var(--font-label);
  font-weight: 600;
  font-size: var(--size-label-2xs);
  letter-spacing: var(--track-label);
  text-transform: uppercase;
  color: rgba(var(--rgb-ink), 0.75);
  pointer-events: none;
}

.c-community__plate {
  --shape: polygon(0 0, calc(100% - 48px) 0, 100% 48px, 100% 100%, 0 100%);

  position: relative;
  isolation: isolate;
  margin-top: -40px;
}

.c-community__plate::before,
.c-community__plate::after {
  content: '';
  position: absolute;
  inset: 0;
  clip-path: var(--shape);
}

.c-community__plate::before {
  z-index: -2;
  top: -1.5px;
  background: rgba(var(--rgb-accent-text), 0.5);
}

.c-community__plate::after {
  z-index: -1;
  background: linear-gradient(180deg, var(--color-plate), var(--color-plate-deep));
}

.c-community__plate-in {
  padding-top: 52px;
  padding-bottom: var(--space-10);
}

.c-community__talk {
  max-width: 640px;
}

.c-community__title {
  display: flex;
  align-items: center;
  gap: 14px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.706rem;
  line-height: 1.08;
}

.c-community__body {
  max-width: 40ch;
  margin-top: var(--space-3);
  font-size: var(--size-body-l);
  line-height: 1.55;
  color: rgba(var(--rgb-ink), 0.88);
}

.c-community__act {
  margin-top: 22px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3) 18px;
}

/* Same filter list at rest and on hover (WebKit's stale-filter bug). */
.c-community__join {
  position: relative;
  isolation: isolate;
  width: 100%;
  min-height: 50px;
  padding: 0 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-weight: 600;
  white-space: nowrap;
  color: var(--color-bg);
  text-decoration: none;
  filter: brightness(1);
}

.c-community__join::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: var(--color-ink);
  clip-path: polygon(16px 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 16px 100%, 0 50%);
}

.c-community__join:hover {
  color: var(--color-bg);
  filter: brightness(1.08);
}

.c-community__inbox {
  margin-top: var(--space-7);
}

@media (min-width: 960px) {
  .c-community {
    --hang-w: 12.5rem;
    --hang-h: 2.75rem;
  }

  .c-community__strip {
    --shape: polygon(
      0 0,
      100% 0,
      100% calc(100% - var(--hang-h)),
      calc(100% - var(--edge) + var(--hang-h)) calc(100% - var(--hang-h)),
      calc(100% - var(--edge)) 100%,
      calc(100% - var(--edge) - var(--hang-w)) 100%,
      calc(100% - var(--edge) - var(--hang-w) - var(--hang-h)) calc(100% - var(--hang-h)),
      0 calc(100% - var(--hang-h))
    );
  }

  .c-community__roll {
    padding-top: 26px;
    padding-bottom: calc(var(--hang-h) + 22px);
  }

  .c-community__coverage {
    left: auto;
    right: var(--edge);
  }

  .c-community__scene {
    position: relative;
    isolation: isolate;
    min-height: 560px;
    margin-top: calc(-1 * var(--hang-h));
  }

  /* The photo must keep faces out of its left side: the Discord text sits on this scrim. */
  .c-community__photo::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      linear-gradient(to bottom, var(--color-bg) 0%, rgba(var(--rgb-bg), 0) 26%),
      linear-gradient(to top, var(--color-bg) 0%, rgba(var(--rgb-bg), 0) 30%),
      linear-gradient(90deg, rgba(var(--rgb-bg), 0.9) 0%, rgba(var(--rgb-bg), 0.62) 38%, rgba(var(--rgb-bg), 0) 70%);
  }

  .c-community__photo {
    position: absolute;
    inset: 0;
    z-index: -2;
    height: auto;
    margin-top: 0;
  }

  .c-community__caption {
    top: auto;
    right: var(--edge);
    bottom: 14px;
  }

  .c-community__photo .c-art__empty {
    padding-left: 50%;
  }

  .c-community__plate {
    position: static;
    isolation: auto;
    margin-top: 0;
  }

  .c-community__plate::before,
  .c-community__plate::after {
    content: none;
  }

  /* Keep the inbox in the grid: pinned absolutely, larger text pushes it out of the band. */
  .c-community__plate-in {
    min-height: 560px;
    padding-top: 104px;
    padding-bottom: var(--space-16);
    display: grid;
    grid-template-columns: minmax(0, 440px) 350px;
    justify-content: space-between;
    align-items: center;
    column-gap: 50px;
  }

  .c-community__talk {
    max-width: none;
  }

  .c-community__title {
    font-size: clamp(1.838rem, 2.73vw, 2.231rem);
  }

  .c-community__join {
    width: auto;
  }

  .c-community__inbox.c-newsletter {
    --shape: polygon(0 var(--tab-h), calc(100% - var(--tab-w) - var(--tab-h)) var(--tab-h), calc(100% - var(--tab-w)) 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%);
    --glow-at: 0% 100%;

    align-self: end;
    margin-top: 0;
    margin-bottom: calc(var(--space-10) - var(--space-16));
  }

  .c-community__inbox .c-newsletter__tab {
    left: auto;
    right: var(--space-5);
  }
}
</style>
