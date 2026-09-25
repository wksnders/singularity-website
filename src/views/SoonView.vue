<script setup lang="ts">
// Also the not-found route (`meta.notFound`).
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import BaseLink from '@/components/atoms/BaseLink.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import SecondaryHero from '@/components/organisms/SecondaryHero.vue';
import { t } from '@/content';
import { NOT_FOUND, soonDestination } from '@/site/soon';
import { resolveLink, to } from '@/site/links';

const route = useRoute();
const destination = computed(() => (route.meta.notFound ? NOT_FOUND : soonDestination(route.hash)));
const kicker = computed(() => t(`soon.kicker.${destination.value.kind}`));

const title = computed(() => t(`soon.d.${destination.value.id}.title`));
const body = computed(() => t(`soon.d.${destination.value.id}.body`));
</script>

<template>
  <SecondaryHero glow="80% 60% at 30% 0%">
    <MonoLabel tone="accent">
      {{ kicker }}
    </MonoLabel>
    <h1 class="soon__title">{{ title }}</h1>
    <p class="l-lede l-lede--narrow soon__body">{{ body }}</p>
  </SecondaryHero>

  <section class="l-band">
    <div class="l-wrap l-wrap--reading">
      <MonoLabel tone="faint">{{ t('soon.alsoTitle') }}</MonoLabel>
      <ul class="soon__also">
        <li v-for="item in destination.also" :key="item.key">
          <BaseLink :link="resolveLink(item)">{{ t(item.key) }}</BaseLink>
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
