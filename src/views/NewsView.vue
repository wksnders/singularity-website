<script setup lang="ts">
/** News is one band and is deliberately exempt from the section index; posts are markdown under content/ with front matter carrying title, date, category and lead. */
import { computed } from 'vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import ContentCard from '@/components/molecules/ContentCard.vue';
import EmptyState from '@/components/molecules/EmptyState.vue';
import FilterBar from '@/components/molecules/FilterBar.vue';
import SecondaryHero from '@/components/organisms/SecondaryHero.vue';
import { getDocs, metaString, t } from '@/content';
import { newsCategories } from '@/data/universe';
import { useQueryFilter } from '@/composables/useQueryFilter';
import { soon } from '@/site/links';
import type { Doc } from '@/content';
import type { FilterOption } from '@/site/filters';

const category = useQueryFilter('category');

const filterOptions = computed<FilterOption[]>(() =>
  newsCategories.map((c) => ({ id: c.id, label: c.name })),
);

/** Posts dated after today are hidden: this is scheduling, not secrecy, since every content/ markdown file ships in the bundle regardless, and dates compare as local-day YYYY-MM-DD strings. */
const today = new Date();
const todayKey = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, '0'),
  String(today.getDate()).padStart(2, '0'),
].join('-');

const all = computed(() =>
  getDocs('news/')
    .filter((post) => String(post.meta.date ?? '') <= todayKey)
    .sort((a, b) => String(b.meta.date ?? '').localeCompare(String(a.meta.date ?? ''))),
);

const categoryOf = (post: Doc) => metaString(post, 'category').toLowerCase();

const shown = computed(() => {
  const active = category.value.value;
  if (!active) return all.value;
  return all.value.filter((post) => categoryOf(post).startsWith(active.slice(0, 6)));
});

const lead = computed(() => shown.value.find((post) => post.meta.lead === true) ?? shown.value[0] ?? null);
const others = computed(() => shown.value.filter((post) => post !== lead.value));

function group(post: Doc): 'thisMonth' | 'earlier' {
  const date = new Date(String(post.meta.date ?? ''));
  const now = new Date();
  const sameMonth =
    date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  return sameMonth ? 'thisMonth' : 'earlier';
}

const groupedOthers = computed(() => {
  const groups: { key: 'thisMonth' | 'earlier'; posts: Doc[] }[] = [
    { key: 'thisMonth', posts: [] },
    { key: 'earlier', posts: [] },
  ];
  for (const post of others.value) {
    groups.find((g) => g.key === group(post))!.posts.push(post);
  }
  return groups.filter((g) => g.posts.length);
});

const kicker = (post: Doc) =>
  `${metaString(post, 'category')} · ${metaString(post, 'date', t('home.news.dateTbd'))}`;
</script>

<template>
  <SecondaryHero glow="75% 65% at 68% 0%" :note="t('news.hero.pending')">
    <h1 class="news__title">{{ t('news.hero.title') }}</h1>
    <p class="news__lede">{{ t('news.hero.lede') }}</p>
  </SecondaryHero>

  <section class="l-band">
    <div class="l-wrap">
      <h2 class="news__h2">{{ t('news.latest') }}</h2>

      <FilterBar
        class="news__gap"
        :options="filterOptions"
        :active="category.value.value"
        :count="shown.length"
        :count-label="t('news.count')"
        :all-label="t('filters.all')"
        @toggle="category.toggle($event)"
        @clear="category.set(null)"
      />

      <ContentCard
        v-if="lead"
        class="news__lead news__gap"
        :to="soon('#news-post')"
        :kicker="kicker(lead)"
        :title="metaString(lead, 'title')"
        :body="metaString(lead, 'summary', t('news.summaryPlaceholder'))"
        :placeholder="t('news.leadArtPlaceholder')"
        ratio="21 / 9"
      />

      <template v-if="groupedOthers.length">
        <div v-for="bucket in groupedOthers" :key="bucket.key" class="news__group">

          <h3 v-if="!category.value.value" class="news__group-title">
            {{ t(`news.groups.${bucket.key}`) }}
          </h3>
          <div class="l-grid l-grid--wide news__gap">
            <ContentCard
              v-for="post in bucket.posts"
              :key="post.slug"
              :to="soon('#news-post')"
              :kicker="kicker(post)"
              :title="metaString(post, 'title')"
              :body="metaString(post, 'summary', t('news.summaryPlaceholder'))"
              :placeholder="t('news.artPlaceholder')"
            />
          </div>
        </div>
      </template>

      <EmptyState
        v-if="!shown.length"
        class="news__gap"
        variant="noResults"
        :kicker="t('filters.noResults')"
        :title="t('news.emptyTitle')"
        :body="t('news.emptyBody')"
        :action-label="t('filters.clear')"
        @action="category.set(null)"
      />

      <div class="news__foot">
        <MonoLabel tone="faint">{{ t('news.allPublished') }}</MonoLabel>
        <UiButton variant="quiet" :to="soon('#news-archive')">{{ t('news.archive') }}</UiButton>
      </div>
    </div>
  </section>
</template>

<style>
.news__title {
  margin-top: var(--space-5);
  font-size: clamp(1.875rem, 5.6vw, 3.5rem);
}

.news__lede {
  margin-top: var(--space-4);
  max-width: 56ch;
  font-size: var(--size-body-l);
  line-height: 1.6;
  color: var(--color-ink-soft);
}

.news__h2 {
  font-size: var(--size-h2);
}

.news__gap {
  margin-top: var(--space-6);
}

.news__group {
  margin-top: var(--space-8);
}

.news__group-title {
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  font-weight: 400;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-ink-faint);
}

.news__foot {
  margin-top: var(--space-8);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-6);
  align-items: center;
  justify-content: space-between;
}
</style>
