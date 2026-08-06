<script setup>
import { computed } from 'vue';
import { Minus, Plus } from '@lucide/vue';
import LoRARow from './LoRARow.vue';
import Button from './ui/Button.vue';
import ScrollArea from './ui/ScrollArea.vue';

const props = defineProps({
  category: { type: Object, required: true },
  entries: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false }
});

const emit = defineEmits(['adjust', 'step', 'delete']);

const count = computed(() => props.entries.length);
</script>

<template>
  <div class="flex h-full flex-col rounded-lg border bg-card text-card-foreground shadow-sm">
    <div class="flex items-center justify-between gap-2 border-b px-4 py-3">
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold">{{ category.label }}</span>
        <span class="rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">{{ count }}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          class="h-7 px-2"
          :disabled="disabled || entries.length === 0"
          :aria-label="`Decrease all ${category.label} tags`"
          @click="emit('adjust', category.id, -1)"
        >
          <Minus class="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          class="h-7 px-2"
          :disabled="disabled || entries.length === 0"
          :aria-label="`Increase all ${category.label} tags`"
          @click="emit('adjust', category.id, 1)"
        >
          <Plus class="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
    <ScrollArea class="min-h-0 flex-1 overflow-y-auto p-2">
      <div
        v-if="entries.length === 0"
        class="flex flex-col items-center justify-center gap-1.5 rounded-md border border-dashed bg-muted/30 px-3 py-6 text-center"
      >
        <p class="text-xs text-muted-foreground">No tags here.</p>
      </div>
      <div v-else class="flex flex-col gap-1.5">
        <LoRARow
          v-for="(entry, index) in entries"
          :key="`${entry.name}-${index}`"
          :entry="entry"
          @step="(dir) => emit('step', entry, dir)"
          @delete="emit('delete', entry)"
        />
      </div>
    </ScrollArea>
  </div>
</template>
