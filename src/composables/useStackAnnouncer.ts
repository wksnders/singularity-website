/* The sentence a screen reader hears after each change to the stack. One pick can fill one slot and empty another, so every `StackChange` is put into words here and nowhere else — a second place would announce the same change twice. */

import { ref } from 'vue';
import { t } from '@/content';
import { SLOT_KEYS, STACK_SIZE } from '@/data/starterStacks';
import type { StackChange } from '@/composables/useStack';
import type { Program } from '@/data/types';

export const slotLabel = (index: number): string => t(`character.slots.${SLOT_KEYS[index]}`);

export function useStackAnnouncer(stack: {
  /** Read AFTER the change has been applied: the sentence states the new count. */
  count: () => number;
  programs: () => (Program | null)[];
}) {
  const say = ref('');

  const slot = (index: number) => slotLabel(index).toLowerCase();

  /** Takes what a `useStack` action returned; null means nothing changed, and nothing is said. */
  function announce(change: StackChange | null): void {
    if (!change) return;
    const n = stack.count();
    const total = STACK_SIZE;
    switch (change.kind) {
      case 'added':
        say.value = t(change.from === undefined ? 'character.sayAdded' : 'character.sayMoved', {
          name: change.program.name,
          slot: slot(change.slot),
          from: change.from === undefined ? '' : slot(change.from),
          n,
          total,
        });
        break;
      case 'replaced':
        say.value = t(
          change.from === undefined ? 'character.sayReplaced' : 'character.sayMovedOver',
          {
            name: change.program.name,
            gone: change.gone.name,
            slot: slot(change.slot),
            from: change.from === undefined ? '' : slot(change.from),
            n,
            total,
          },
        );
        break;
      case 'removed':
        say.value = t('character.sayRemoved', {
          name: change.program.name,
          slot: slot(change.slot),
          n,
          total,
        });
        break;
      case 'loaded':
        say.value = t('character.sayLoaded', {
          deck: change.seed.deckName,
          programs: stack
            .programs()
            .filter((program): program is Program => Boolean(program))
            .map((program) => program.name)
            .join(', '),
        });
        break;
      case 'cleared':
        say.value = t('character.sayCleared', { total });
        break;
    }
  }

  function hush(): void {
    say.value = '';
  }

  return { say, announce, hush };
}
