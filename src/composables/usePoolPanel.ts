/* The reading panel beside the pool has two jobs on one surface: browsing (the chosen program, else the character's own card) and building (whatever sits in the armed slot, else an invitation to fill it). Every value it shows forks on that, so read its state from here only. */

import { computed } from 'vue';
import { t } from '@/content';
import { slotLabel } from '@/composables/useStackAnnouncer';
import type { Art, Program } from '@/data/types';

export function usePoolPanel(source: {
  building: () => boolean;
  armed: () => number | null;
  stackPrograms: () => (Program | null)[];
  /** The program chosen while browsing, or null for the character's own card. */
  selectedProgram: () => Program | null;
  /** While browsing: the chosen FACE of the chosen subject, so it may be a scene and not a card. */
  browseArt: () => Art | null;
  characterName: () => string;
  /** The printed name of what the panel shows while browsing. */
  browseName: () => string;
  artistOf: (art: Art | null) => string;
}) {
  const program = computed(() => {
    if (!source.building()) return source.selectedProgram();
    const slot = source.armed();
    return slot === null ? null : (source.stackPrograms()[slot] ?? null);
  });

  /** False only for an empty armed slot, which shows the invitation instead of a card. */
  const hasCard = computed(() => !source.building() || program.value !== null);

  const art = computed<Art | null>(() =>
    source.building() ? (program.value?.cardArt ?? null) : source.browseArt(),
  );

  /* Only the character's card is captioned: a program's name is printed on the face above it. */
  const name = computed(() => (!source.building() && !program.value ? source.browseName() : ''));

  const kicker = computed(() => {
    if (source.building() && !program.value) {
      const slot = source.armed();
      return t('character.panelOfTheStack', { slot: slot === null ? '' : slotLabel(slot) });
    }
    return `${t('character.artBy')} ${source.artistOf(art.value)}`;
  });

  /* The name is not rendered for a program, so the control has to carry it. */
  const zoomLabel = computed(
    () => `${t('character.enlarge')}: ${program.value?.name ?? source.characterName()}`,
  );

  /* "Replacing what is there" is a lie on an empty slot. */
  const fillingNote = computed(() => {
    const slot = source.armed();
    if (slot === null) return '';
    return t(program.value ? 'character.fillingNoteFull' : 'character.fillingNote', {
      slot: slotLabel(slot).toLowerCase(),
    });
  });

  return { program, hasCard, art, name, kicker, zoomLabel, fillingNote };
}
