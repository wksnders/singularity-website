import { computed } from 'vue';
import { docHtml, getDoc, metaString } from '@/content';

export function useEntityDoc(slug: () => string) {
  const doc = computed(() => getDoc(slug()));
  const html = computed(() => docHtml(doc.value));
  const has = computed(() => Boolean(html.value));

  /* Returns a plain string, so call it inside a computed: that is what keeps it following `slug`. */
  const meta = (key: string, fallback = '') => metaString(doc.value, key, fallback);

  return { doc, html, has, meta };
}
