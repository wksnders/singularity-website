<script setup lang="ts">
/**
 * The footer is the sitemap of record: every section, and every deep-linkable
 * in-page anchor, rendered from the same IA array as the nav. It also carries
 * the publisher credits and the reserved slot for the printed rating marks.
 */
import BaseLink from '@/components/atoms/BaseLink.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import TbdValue from '@/components/atoms/TbdValue.vue';
import { t } from '@/content';
import { footerColumns, socialKeys } from '@/site/ia';
import { outbound } from '@/site/links';
import { game } from '@/data/universe';
</script>

<template>
  <footer class="c-footer">
    <div class="l-wrap">
      <div class="c-footer__map l-grid l-grid--narrow">
        <div v-for="column in footerColumns" :key="column.key">
          <MonoLabel tone="faint">{{ t(`ia.${column.key}.label`) }}</MonoLabel>
          <div class="c-footer__links">
            <BaseLink v-for="item in column.items" :key="item.key" :to="item.to">
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

      <div class="c-footer__legal">
        <span>© {{ game.copyrightYear }} {{ game.studio }} · {{ game.studioCity }}</span>
        <span>{{ t('footer.publishedBy') }} {{ game.publisher }}</span>
        <span>{{ t('footer.crossover') }} {{ game.crossoverGame }}</span>
        <TbdValue :value="game.ratingMarks" />
      </div>
    </div>
  </footer>
</template>

<style>
.c-footer {
  border-top: 1px solid var(--color-line);
  background: var(--color-bg);
  padding-block: clamp(48px, 7vw, 72px);
}

.c-footer__map {
  gap: var(--space-8);
}

.c-footer__links {
  margin-top: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  min-height: 48px;
  padding-inline: var(--space-4);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-pill);
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  letter-spacing: 0.1em;
  color: var(--color-ink-muted);
  white-space: nowrap;
}

.c-footer__legal {
  margin-top: var(--space-6);
  padding-top: var(--space-6);
  border-top: 1px solid rgba(var(--rgb-ink), 0.08);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3) 28px;
  align-items: center;
  font-size: var(--size-s);
  color: var(--color-ink-faint);
}
</style>
