<script setup lang="ts">
/* BAND DECORATION IS NOT A PROP: `l-band--alt`, `--line-top`, `--tight`, a view's own class and an inline `--faction` all arrive as ordinary attributes and land on the <section>. */
import SectionMarker from '@/components/molecules/SectionMarker.vue';

withDefaults(
  defineProps<{
    /** A public URL. Never rename one. */
    id: string;
    heading: string;
    color?: string | null;
    wrap?: 'content' | 'reading';
  }>(),
  { color: null, wrap: 'content' },
);
</script>

<template>
  <section :id="id" tabindex="-1" class="l-band c-band">
    <div class="l-wrap" :class="{ 'l-wrap--reading': wrap === 'reading' }">
      <slot name="before" />
      <div v-if="$slots.actions" class="c-band__head">
        <SectionMarker :section-id="id" :heading="heading" :color="color" />
        <slot name="actions" />
      </div>
      <SectionMarker v-else :section-id="id" :heading="heading" :color="color" />
      <div class="c-band__body">
        <slot />
      </div>
    </div>
  </section>
</template>

<style>
.c-band__head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-6);
  align-items: center;
  justify-content: space-between;
}

/* `:where()` keeps this at zero specificity, so it is only ever the default: any child's own margin wins, whichever chunk its CSS arrived in. Flow layout on purpose — flex or grid would stretch a bare button child and stop margins collapsing. */
:where(.c-band__body) > * + * {
  margin-top: var(--space-6);
}

.c-band__body > .c-bandfoot {
  margin-top: var(--space-8);
}
</style>
