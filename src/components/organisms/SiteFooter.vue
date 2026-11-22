<script setup lang="ts">
// The footer is the sitemap of record: every section and every deep-linkable in-page anchor must be listed in footerColumns.
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BaseLink from '@/components/atoms/BaseLink.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import { t } from '@/content';
import { glideToTop } from '@/site/glide';
import { footerColumns, socialKeys } from '@/site/ia';
import { asset, logoSrcset, outbound, resolveLink, to } from '@/site/links';
import { scaledSizes } from '@/site/pageScale';
import { game } from '@/data/universe';

const route = useRoute();
const router = useRouter();

const home = computed(() => to('home'));
const atHome = computed(() => router.resolve(home.value).path === route.path);

const thisYear = new Date().getFullYear();
const rights = computed(() =>
  t('footer.rights', {
    years: thisYear > game.copyrightFrom ? `${game.copyrightFrom}–${thisYear}` : `${game.copyrightFrom}`,
    owner: game.studioLegalName,
    game: game.name,
  }),
);

function toTop(event: MouseEvent): void {
  if (!atHome.value) return;
  event.preventDefault();
  void glideToTop().then((arrived) => {
    if (arrived) document.getElementById('main')?.focus({ preventScroll: true });
  });
}
</script>

<template>
  <footer class="c-footer">
    <div class="l-wrap">
      <div class="c-footer__map l-grid l-grid--narrow">
        <div v-for="column in footerColumns" :key="column.key">
          <MonoLabel tone="faint">{{ t(`ia.${column.key}.label`) }}</MonoLabel>
          <div class="c-footer__links">
            <BaseLink v-for="item in column.items" :key="item.key" :link="resolveLink(item)">
              {{ t(`ia.${item.key}.label`) }}
            </BaseLink>
          </div>
        </div>
      </div>

      <div class="c-footer__rule">
        <div class="l-row">
          <BaseLink v-for="key in socialKeys" :key="key" :link="outbound(key)" class="c-footer__social">
            {{ t(`chrome.social.${key}`) }}
          </BaseLink>
        </div>
      </div>
      <RouterLink
        :to="home"
        class="c-footer__signoff-link"
        :aria-label="atHome ? t('chrome.backToTop') : undefined"
        @click="toTop"
      >
        <picture>
          <source
            type="image/webp"
            :srcset="logoSrcset('singularity-logo-exe-center', 'webp')"
            :sizes="scaledSizes('(max-width: 360px) 84vw, 300px')"
          />
          <img
            class="c-footer__signoff"
            :src="asset('/logo/singularity-logo-exe-center.png')"
            :srcset="logoSrcset('singularity-logo-exe-center', 'png')"
            :sizes="scaledSizes('(max-width: 360px) 84vw, 300px')"
            :alt="t('chrome.logoAlt')"
            width="720"
            height="254"
            loading="lazy"
            decoding="async"
          />
        </picture>
      </RouterLink>

      <div class="c-footer__legal">
        <p class="c-footer__rights">{{ rights }}</p>
        <span>{{ t('footer.publishedBy') }} {{ game.publisher }}</span>
      </div>
    </div>
  </footer>
</template>

<style>
.c-footer {
  border-top: 1px solid var(--color-line);
  background: var(--color-bg);
  padding-block: clamp(3rem, 7vw, 4.5rem);
}

.c-footer__map {
  gap: var(--space-8);
}

.c-footer__links {
  margin-top: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  font-size: var(--size-m);
}

.c-footer__rule {
  margin-top: var(--space-9);
  padding-top: var(--space-6);
  border-top: 1px solid rgba(var(--rgb-ink), 0.08);
}

.c-footer__social {
  display: inline-flex;
  align-items: center;
  min-height: 3rem;
  padding-inline: var(--space-4);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-pill);
  font-family: var(--font-label);
  font-weight: 500;
  font-size: var(--size-label-s);
  letter-spacing: var(--track-label-tight);
  color: var(--color-ink-muted);
  white-space: nowrap;
}

.c-footer__signoff-link {
  display: block;
  width: min(100%, 18.75rem);
  margin-top: var(--space-8);
}

.c-footer__signoff {
  display: block;
  width: 100%;
  height: auto;
}

.c-footer__rights {
  flex-basis: 100%;
  max-width: 60rem;
  line-height: 1.6;
}

.c-footer__legal {
  margin-top: var(--space-6);
  padding-top: var(--space-6);
  border-top: 1px solid rgba(var(--rgb-ink), 0.08);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-7);
  align-items: center;
  font-size: var(--size-s);
  color: var(--color-ink-faint);
}
</style>
