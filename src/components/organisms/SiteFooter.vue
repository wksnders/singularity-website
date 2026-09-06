<script setup lang="ts">
// The footer is the sitemap of record: every section and every deep-linkable in-page anchor must be listed in footerColumns.
import BaseLink from '@/components/atoms/BaseLink.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import { t } from '@/content';
import { footerColumns, socialKeys } from '@/site/ia';
import { asset, outbound, resolveLink } from '@/site/links';
import { game } from '@/data/universe';
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
      <picture>
        <source
          type="image/webp"
          :srcset="`${asset('/logo/singularity-logo-exe-center.webp')} 720w, ${asset('/logo/singularity-logo-exe-center@2x.webp')} 1440w, ${asset('/logo/singularity-logo-exe-center@3x.webp')} 2160w`"
          sizes="(max-width: 360px) 84vw, 300px"
        />
        <img
          class="c-footer__signoff"
          :src="asset('/logo/singularity-logo-exe-center.png')"
          :srcset="`${asset('/logo/singularity-logo-exe-center.png')} 720w, ${asset('/logo/singularity-logo-exe-center@2x.png')} 1440w, ${asset('/logo/singularity-logo-exe-center@3x.png')} 2160w`"
          sizes="(max-width: 360px) 84vw, 300px"
          alt=""
          width="720"
          height="254"
          loading="lazy"
          decoding="async"
        />
      </picture>

      <div class="c-footer__legal">
        <span>© {{ game.copyrightYear }} {{ game.studio }} · {{ game.studioCity }}</span>
        <span>{{ t('footer.publishedBy') }} {{ game.publisher }}</span>
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

.c-footer__signoff {
  display: block;
  width: min(100%, 300px);
  height: auto;
  margin-top: var(--space-8);
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
