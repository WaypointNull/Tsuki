<script setup>
import { onMounted, ref } from 'vue';
import { History, RefreshCw, Loader2 } from '@lucide/vue';
import { getHistory } from '../api.js';
import Button from './ui/Button.vue';

const props = defineProps({
  open: { type: Boolean, default: false }
});

const emit = defineEmits(['close', 'select']);

const records = ref([]);
const loading = ref(false);
const error = ref('');

async function refresh() {
  loading.value = true;
  error.value = '';
  try {
    records.value = (await getHistory()).slice().reverse();
  } catch (err) {
    error.value = err.message || 'Failed to load history.';
  } finally {
    loading.value = false;
  }
}

function formatTime(iso) {
  return new Date(iso).toLocaleString();
}

function tagsPreview(record) {
  const tags = (record.output && record.output.positiveTags) || [];
  return tags.join(', ');
}

function pick(record) {
  emit('select', record);
  emit('close');
}

onMounted(() => {
  if (props.open) {
    refresh();
  }
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      role="dialog"
      aria-modal="true"
      class="fixed inset-0 z-[60] flex items-center justify-center p-4"
      @keydown.esc="emit('close')"
    >
      <div class="animate-fade-in absolute inset-0 bg-black/50 backdrop-blur-sm" @click="emit('close')"></div>
      <div
        class="animate-scale-in relative z-10 flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-xl"
      >
        <div class="flex items-center gap-2 border-b px-4 py-3">
          <History class="h-4 w-4 text-primary" />
          <h2 class="text-base font-semibold">Tag lists</h2>
          <p class="text-xs text-muted-foreground">Pick one to import. Saving keeps it in the same folder.</p>
          <Button variant="outline" size="sm" class="ml-auto" @click="refresh" :disabled="loading">
            <RefreshCw v-if="!loading" />
            <Loader2 v-else class="animate-spin" />
            Refresh
          </Button>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto p-4">
          <div v-if="loading" class="py-10 text-center text-sm text-muted-foreground">Loading tag lists...</div>
          <div v-else-if="error" class="py-10 text-center text-sm text-destructive">{{ error }}</div>
          <div v-else-if="!records.length" class="py-10 text-center text-sm text-muted-foreground">
            No tag lists yet.
          </div>
          <button
            v-for="record in records"
            :key="record.id"
            class="mb-2 block w-full rounded-md border border-border bg-background p-3 text-left transition-colors hover:border-ring/50"
            @click="pick(record)"
          >
            <p class="truncate text-sm font-medium">
              {{ (record.input && record.input.naturalLanguage) || 'Untitled' }}
            </p>
            <p v-if="tagsPreview(record)" class="mt-1 truncate text-xs text-muted-foreground">
              {{ tagsPreview(record) }}
            </p>
            <p class="mt-1 text-xs text-muted-foreground/70">{{ formatTime(record.createdAt) }}</p>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
