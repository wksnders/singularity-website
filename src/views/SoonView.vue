<script setup lang="ts">
/**
 * /soon — reached by every link whose destination is not built or not live.
 * It says which of the two it is, and always names what IS open on the same
 * subject. A reader can hit this page several times in one visit; it must
 * never be the same shrug twice.
 */
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import SecondaryHero from '@/components/organisms/SecondaryHero.vue';
import { t } from '@/content';
import { soonDestination } from '@/site/soon';
import { to } from '@/site/links';

const route = useRoute();
const destination = computed(() => soonDestination(route.hash));

const title = computed(() => t(`soon.d.${destination.value.id}.title`));
const body = computed(() => t(`soon.d.${destination.value.id}.body`));
</script>

<template>
  <SecondaryHero glow="80% 60% at 30% 0%">
    <MonoLabel tone="accent">
      {{ destination.kind === 'page' ? t('soon.kicker.page') : t('soon.kicker.link') }}
    </MonoLabel>
    <h1 class="soon__title">{{ title }}</h1>
    <p class="soon__body">{{ body }}</p>
  </SecondaryHero>

  <section class="l-band">
    <div class="l-wrap l-wrap--reading">
      <MonoLabel tone="faint">{{ t('soon.alsoTitle') }}</MonoLabel>
      <ul class="soon__also">
        <li v-for="item in destination.also" :key="item.key">
          <RouterLink :to="item.to">{{ t(item.key) }}</RouterLink>
        </li>
      </ul>
      <UiButton :to="to('home')" class="soon__back">{{ t('soon.back') }}</UiButton>
    </div>
  </section>
</template>

<style>
.soon__title {
  margin-top: var(--space-4);
  font-size: var(--size-h2);
}

.soon__body {
  margin-top: var(--space-5);
  max-width: 56ch;
  font-size: var(--size-body-l);
  line-height: 1.6;
  color: var(--color-ink-soft);
}

.soon__also {
  margin-top: var(--space-4);
  display: grid;
  gap: var(--space-3);
  list-style: none;
  font-size: var(--size-body-l);
}

.soon__back {
  margin-top: var(--space-8);
}
</style>
