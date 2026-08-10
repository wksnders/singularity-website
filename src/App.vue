<script setup lang="ts">
import SkipLink from '@/components/organisms/SkipLink.vue';
import SiteHeader from '@/components/organisms/SiteHeader.vue';
import MobileMenu from '@/components/organisms/MobileMenu.vue';
import SiteFooter from '@/components/organisms/SiteFooter.vue';
</script>

<template>
  <SkipLink />
  <SiteHeader />
  <MobileMenu />
  <main id="main" tabindex="-1">
    <RouterView />
  </main>
  <SiteFooter />
</template>

<style>
main:focus {
  outline: none;
}
</style>
