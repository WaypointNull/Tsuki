<script setup>
import { watch, onBeforeUnmount } from 'vue';
import { Loader2, SearchX } from '@lucide/vue';
import Button from './ui/Button.vue';

const props = defineProps({
  open: { type: Boolean, default: false },
  position: { type: Object, default: () => ({ x: 0, y: 0 }) },
  query: { type: String, default: '' },
  candidates: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' }
});

const emit = defineEmits(['add', 'replace', 'close']);

function onKeydown(event) {
  if (event.key === 'Escape') emit('close');
}

watch(
  () => props.open,
  (open) => {
    if (open) window.addEventListener('keydown', onKeydown);
    else window.removeEventListener('keydown', onKeydown);
  }
);

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));

function formatPosts(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return Math.round(n / 1000) + 'k';
  return String(n);
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open">
      <div class="fixed inset-0 z-[59]" @click="emit('close')"></div>
      <div
        class="animate-scale-in fixed z-[60] flex max-h-80 w-72 flex-col overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-xl"
        role="dialog"
        aria-label="Tag matches"
        :style="{ left: position.x + 'px', top: position.y + 'px' }"
      >
        <div class="flex items-center gap-2 border-b px-3 py-2">
          <p class="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            Matches for <span class="font-mono text-foreground">{{ query }}</span>
          </p>
          <span v-if="!loading && !error" class="shrink-0 font-mono text-[10px] text-muted-foreground">
            {{ candidates.length }}
          </span>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto p-1.5">
          <div v-if="loading" class="flex items-center justify-center gap-2 px-3 py-6 text-xs text-muted-foreground">
            <Loader2 class="h-3.5 w-3.5 animate-spin" />
            Matching…
          </div>
          <div
            v-else-if="error"
            class="flex flex-col items-center gap-1.5 px-3 py-6 text-center text-xs text-muted-foreground"
          >
            <SearchX class="h-4 w-4" />
            <p>{{ error }}</p>
          </div>
          <div v-else-if="candidates.length === 0" class="px-3 py-6 text-center text-xs text-muted-foreground">
            No matches found.
          </div>
          <div v-else class="flex flex-col gap-0.5">
            <div
              v-for="candidate in candidates"
              :key="candidate.tag"
              class="flex items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/60"
            >
              <span class="min-w-0 flex-1 truncate font-mono text-xs" :title="candidate.tag">{{ candidate.tag }}</span>
              <span class="shrink-0 text-[10px] text-muted-foreground">{{ formatPosts(candidate.postCount) }}</span>
              <Button
                variant="ghost"
                size="sm"
                class="h-6 px-1.5 text-[11px]"
                :aria-label="`Add ${candidate.tag}`"
                title="Add as a new tag"
                @click="emit('add', candidate.tag)"
              >
                Add
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="h-6 px-1.5 text-[11px]"
                :aria-label="`Replace ${query} with ${candidate.tag}`"
                title="Replace this tag"
                @click="emit('replace', candidate.tag)"
              >
                Replace
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
