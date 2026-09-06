import { nextTick } from 'vue';
import {
  createRouter,
  createWebHistory,
  START_LOCATION,
  type RouteRecordRaw,
} from 'vue-router';
import { LOCALE_ROUTE_PATTERN, setLocale } from '@/i18n/locales';
import { t } from '@/content';

/* Locale prefix appears only once a code is added to LOCALES; public anchors and query params never change either way. */
const prefix = LOCALE_ROUTE_PATTERN ? `/:locale(${LOCALE_ROUTE_PATTERN})?` : '';
const path = (segment: string) => (segment ? `${prefix}/${segment}` : `${prefix}/`);

const routes: RouteRecordRaw[] = [
  {
    path: path(''),
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { titleKey: 'meta.home' },
  },
  {
    path: path('universe'),
    name: 'universe',
    component: () => import('@/views/UniverseView.vue'),
    meta: { titleKey: 'meta.universe' },
  },
  {
    path: path('universe/factions/:factionId'),
    name: 'faction',
    component: () => import('@/views/FactionView.vue'),
    props: true,
  },
  {
    path: path('universe/brands'),
    name: 'brands',
    component: () => import('@/views/BrandsView.vue'),
    meta: { titleKey: 'meta.brands' },
  },
  {
    path: path('universe/brands/:brandId'),
    name: 'brand',
    component: () => import('@/views/BrandView.vue'),
    props: true,
  },
  {
    path: path('universe/characters'),
    name: 'characters',
    component: () => import('@/views/CharactersView.vue'),
    meta: { titleKey: 'meta.characters' },
  },
  {
    path: path('universe/characters/:characterId'),
    name: 'character',
    component: () => import('@/views/CharacterView.vue'),
    props: true,
  },
  {
    path: path('universe/cards'),
    name: 'cards',
    component: () => import('@/views/CardsView.vue'),
    meta: { titleKey: 'meta.cards' },
  },
  {
    path: path('universe/incursions'),
    name: 'incursions',
    component: () => import('@/views/IncursionsView.vue'),
    meta: { titleKey: 'meta.incursions' },
  },
  {
    path: path('universe/incursions/:aiId'),
    name: 'incursion',
    component: () => import('@/views/IncursionView.vue'),
    props: true,
  },
  {
    path: path('universe/universal'),
    name: 'universal',
    component: () => import('@/views/UniversalView.vue'),
    meta: { titleKey: 'meta.universal' },
  },
  {
    path: path('story'),
    name: 'story',
    component: () => import('@/views/StoryView.vue'),
    meta: { titleKey: 'meta.story' },
  },
  {
    path: path('learn'),
    name: 'learn',
    component: () => import('@/views/LearnView.vue'),
    meta: { titleKey: 'meta.learn' },
  },
  {
    path: path('learn/rules'),
    name: 'rules',
    component: () => import('@/views/RulesView.vue'),
    meta: { titleKey: 'meta.rules' },
  },
  {
    path: path('learn/faq'),
    name: 'faq',
    component: () => import('@/views/FaqView.vue'),
    meta: { titleKey: 'meta.faq' },
  },
  {
    path: path('news'),
    name: 'news',
    component: () => import('@/views/NewsView.vue'),
    meta: { titleKey: 'meta.news' },
  },
  {
    path: path('community'),
    name: 'community',
    component: () => import('@/views/CommunityView.vue'),
    meta: { titleKey: 'meta.community' },
  },
  {
    path: path('soon'),
    name: 'soon',
    component: () => import('@/views/SoonView.vue'),
    meta: { titleKey: 'meta.soon' },
  },
  {
    path: `${prefix}/:pathMatch(.*)*`,
    name: 'not-found',
    component: () => import('@/views/SoonView.vue'),
    meta: { titleKey: 'meta.soon' },
  },
];

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(target, from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (target.path === from.path && target.hash === from.hash) return false;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (target.hash) {
      return { el: target.hash, behavior: reduced ? 'auto' : 'smooth' };
    }
    return { top: 0 };
  },
});

router.beforeEach((target) => {
  setLocale(target.params.locale);
});

router.afterEach(async (target, from) => {
  const key = target.meta.titleKey;
  document.title = typeof key === 'string' ? t(key) : 'Singularity.exe';

  /* Move focus to <main> (tabindex="-1") so keyboard and screen-reader users land on the new page, except on cold load, on a hash target (scrollBehavior owns those), and on a same-path change, where useQueryFilter's router.replace would steal focus mid-keystroke. */
  if (from === START_LOCATION) return;
  if (target.hash) return;
  if (target.path === from.path) return;

  await nextTick();
  /* preventScroll: scrollBehavior has already decided where the page sits. */
  document.getElementById('main')?.focus({ preventScroll: true });
});
