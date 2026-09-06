<script lang="ts">
/** Exported so the character view can restore focus to a slot's button by id after clearing. */
export const slotButtonId = (index: number) => `slot-btn-${index}`;
</script>

<script setup lang="ts">

import { onBeforeUnmount, ref } from 'vue';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import { t } from '@/content';
import { STACK_SIZE } from '@/data/starterStacks';
import type { StackSeed } from '@/data/starterStacks';
import type { Program } from '@/data/types';
import { pictureSources } from '@/site/links';

export interface StackSlot {
  key: string;
  index: number;
  label: string;
  program: Program | null;
  armed: boolean;
}

defineProps<{
  slots: StackSlot[];
  count: number;
  seeds: StackSeed[];
  seedId: string | null;
  dropped: number;
  say: string;
}>();

const emit = defineEmits<{
  choose: [index: number];
  remove: [index: number];
  load: [seed: StackSeed];
  clear: [];
}>();



const copied = ref(false);
let revert: ReturnType<typeof setTimeout> | undefined;

/* A stack's only memory is its address, so copying the link is the save. */
function copyLink(): void {
  const url = new URL(window.location.href);
  url.hash = 'stack';
  if (!navigator.clipboard) return;
  void navigator.clipboard.writeText(url.toString()).then(() => {
    copied.value = true;
    clearTimeout(revert);
    revert = setTimeout(() => (copied.value = false), 2400);
  });
}

onBeforeUnmount(() => clearTimeout(revert));
</script>

<template>
  <div id="stack" tabindex="-1" class="c-stack">
    <div class="c-stack__credit">
      <div class="c-stack__seeds">
        <MonoLabel v-if="seeds.length" tone="faint" as="p" class="c-stack__seeds-label">
          {{ t('character.seedGroupLabel') }}
        </MonoLabel>
        <div
          v-if="seeds.length"
          role="group"
          :aria-label="t('character.seedGroupAria')"
          class="c-stack__seed-chips"
        >
          <button
            v-for="seed in seeds"
            :key="seed.deckId"
            type="button"
            class="c-stack__seed"
            :aria-current="seed.deckId === seedId ? 'true' : undefined"
            @click="emit('load', seed)"
          >
            {{ seed.deckName }}
            <MonoLabel tone="muted" as="span">
              {{ seed.kind === 'starter' ? t('character.seedInBox') : t('character.seedInBook') }}
            </MonoLabel>
          </button>
        </div>
        <button v-if="count" type="button" class="c-stack__clear" @click="emit('clear')">
          {{ t('character.stackClear') }}
        </button>
      </div>
      <MonoLabel tone="muted" as="p" class="c-stack__count">
        {{ t('character.stackCount', { n: count, total: STACK_SIZE }) }}
      </MonoLabel>
    </div>

    <div class="c-stack__row">
      <div class="c-stack__owner"><slot name="owner" /></div>

      <ol class="c-stack__slots">
        <li
          v-for="slot in slots"
          :key="slot.key"
          class="c-stack__slot"
          :class="{ 'is-filled': Boolean(slot.program), 'is-armed': slot.armed }"
          @click="emit('choose', slot.index)"
        >
          <div class="c-stack__slot-head">
            <p class="c-stack__slot-label">
              {{ slot.label }}
              <span v-if="slot.armed" class="c-stack__armed">
                {{ t('character.slotArmed') }}
              </span>
            </p>
            <button
              v-if="slot.program"
              type="button"
              class="c-stack__remove"
              :aria-label="
                t('character.slotRemove', {
                  name: slot.program.name,
                  slot: slot.label.toLowerCase(),
                })
              "
              @click.stop="emit('remove', slot.index)"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>

          <button
            v-if="slot.program"
            :id="slotButtonId(slot.index)"
            type="button"
            class="c-stack__face"
            :aria-pressed="slot.armed"
            :aria-label="
              t('character.slotChangeAria', {
                slot: slot.label.toLowerCase(),
                name: slot.program.name,
              })
            "
            @click.stop="emit('choose', slot.index)"
          >
            <ArtFrame
              :art="slot.program.cardArt"
              ratio="63 / 88"
              :placeholder="t('pool.cardPlaceholder')"
              radius="s"
              fit="contain"
              :sources="pictureSources(slot.program.cardArt.src)"
              sizes="200px"
            />
          </button>

          <button
            v-else
            :id="slotButtonId(slot.index)"
            type="button"
            class="c-stack__choose"
            :aria-pressed="slot.armed"
            :aria-label="t('character.slotChooseAria', { slot: slot.label.toLowerCase() })"
            @click.stop="emit('choose', slot.index)"
          >
            <span class="c-stack__choose-box" aria-hidden="true">+</span>
            <span class="c-stack__choose-label">{{ t('character.slotChoose') }}</span>
          </button>
        </li>
      </ol>
    </div>

    <p class="c-stack__say" aria-live="polite">{{ say }}</p>

    <p v-if="dropped" class="c-stack__dropped">
      {{
        dropped === 1
          ? t('character.stackDroppedOne')
          : t('character.stackDroppedMany', { n: dropped })
      }}
    </p>

    <div class="c-stack__share">
      <MonoLabel tone="faint" as="p">{{ t('character.stackShareLabel') }}</MonoLabel>
      <div class="c-stack__share-row">
        <button
          type="button"
          class="c-stack__copy"
          aria-describedby="stack-save-note"
          @click="copyLink()"
        >
          {{ copied ? t('character.stackCopied') : t('character.stackCopyLink') }}
        </button>
        <p id="stack-save-note" class="c-stack__note">{{ t('character.stackSaveNote') }}</p>
      </div>
    </div>
  </div>
</template>

<style>
.c-stack {
  position: relative;
  margin-top: var(--space-6);
  scroll-margin-top: var(--scroll-offset);
}

.c-stack__credit {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-5);
  align-items: center;
  justify-content: space-between;
}

.c-stack__seeds {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-3);
  align-items: center;
}

.c-stack__seeds-label {
  white-space: nowrap;
}

.c-stack__seed-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.c-stack__seed {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 44px;
  padding-inline: 14px;
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-ink);
  font-size: var(--size-m);
  cursor: pointer;
  white-space: nowrap;
}

.c-stack__seed[aria-current] {
  border-color: rgba(var(--rgb-accent), 0.6);
  background: rgba(var(--rgb-accent), 0.16);
}

.c-stack__seed:hover {
  border-color: rgba(var(--rgb-accent), 0.6);
}

.c-stack__clear {
  min-width: 44px;
  min-height: 44px;
  padding-inline: 14px;
  border: 0;
  background: transparent;
  color: var(--color-accent-text);
  font-size: var(--size-m);
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}

.c-stack__clear:hover {
  color: var(--color-ink);
}

.c-stack__count {
  white-space: nowrap;
}

.c-stack__row {
  margin-top: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: clamp(10px, 1.6dvw, 20px);
  align-items: stretch;
}

.c-stack__owner {
  flex: 0 0 auto;
  align-self: flex-start;
  width: min(100%, 190px);
  min-width: 0;
  padding: 1px;
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-m);
  background: var(--color-surface);
}

.c-stack__slots {
  flex: 1 1 auto;
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: 1fr;
  gap: clamp(8px, 1.4dvw, 16px);
}

.c-stack__slot {
  min-width: 0;
  padding: var(--space-3);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-m);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  cursor: pointer;
  transition:
    border-color var(--dur-2) var(--ease-out),
    background var(--dur-2) var(--ease-linear);
}

.c-stack__slot.is-filled {
  border-color: rgba(var(--rgb-accent), 0.5);
  background: var(--color-surface-raised);
}

.c-stack__slot.is-armed {
  border-color: var(--color-accent);
  box-shadow: 0 0 22px rgba(var(--rgb-accent), 0.22);
}

.c-stack__slot:not(.is-filled).is-armed {
  background: rgba(var(--rgb-accent), 0.08);
}

.c-stack__slot-head {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  justify-content: space-between;
  min-height: 28px;
}

.c-stack__slot-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 28px;
  font-family: var(--font-mono);
  font-size: var(--size-mono-xs);
  letter-spacing: var(--track-mono);
  text-transform: uppercase;
  color: var(--color-ink-soft);
  white-space: nowrap;
}

.c-stack__armed {
  letter-spacing: 0.14em;
  color: var(--color-accent);
}

.c-stack__remove {
  flex: 0 0 auto;
  margin: -8px -8px -8px 0;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.c-stack__remove > span {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-line-dashed);
  background: var(--color-bg);
  color: var(--color-ink);
  font-size: var(--size-m);
  line-height: 1;
}

.c-stack__remove:hover > span {
  border-color: var(--color-accent);
  color: var(--color-ink-bright);
}

.c-stack__face {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  border-radius: var(--radius-s);
  background: transparent;
  cursor: pointer;
}

.c-stack__choose {
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  gap: var(--space-3);
  align-items: center;
  text-align: left;
}

.c-stack__choose-box {
  flex: 0 0 auto;
  width: 84px;
  aspect-ratio: 63 / 88;
  display: grid;
  place-items: center;
  border: 1px dashed var(--color-line-dashed);
  border-radius: var(--radius-s);
  background: rgba(var(--rgb-ink), 0.02);
  color: var(--color-ink-faint);
  font-size: 1.5rem;
  line-height: 1;
}

.c-stack__choose-label {
  flex: 1 1 auto;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: var(--size-mono-xs);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-ink-soft);
}

.c-stack__choose:hover .c-stack__choose-box {
  border-color: var(--color-accent);
  color: var(--color-ink);
}

.c-stack__say {
  margin-top: var(--space-3);
  min-height: 1.2em;
  font-size: var(--size-s);
  line-height: 1.5;
  color: var(--color-ink-soft);
}

.c-stack__dropped {
  margin-top: var(--space-2);
  max-width: 62ch;
  padding: var(--space-3) var(--space-4);
  border-left: 2px solid rgba(var(--rgb-accent), 0.5);
  background: rgba(var(--rgb-accent), 0.07);
  font-size: var(--size-m);
  line-height: 1.6;
  color: var(--color-ink-muted);
}

.c-stack__share {
  margin-top: var(--space-5);
}

.c-stack__share-row {
  margin-top: var(--space-3);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-5);
  align-items: center;
}

.c-stack__copy {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding-inline: 18px;
  border: 1px solid rgba(var(--rgb-accent), 0.55);
  border-radius: var(--radius-pill);
  background: rgba(var(--rgb-accent), 0.12);
  color: var(--color-ink);
  font-size: var(--size-m);
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}

.c-stack__copy:hover {
  background: rgba(var(--rgb-accent), 0.22);
}

.c-stack__note {
  flex: 1 1 260px;
  min-width: 0;
  max-width: 48ch;
  font-size: var(--size-s);
  line-height: 1.5;
  color: var(--color-ink-soft);
}

@media (min-width: 560px) {
  .c-stack__row {
    flex-direction: row;
  }

  .c-stack__owner {
    width: clamp(150px, 17dvw, 210px);
  }

  .c-stack__slots {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .c-stack__choose {
    flex-direction: column;
    align-items: stretch;
  }

  .c-stack__choose-box {
    width: 100%;
  }
}
</style>
