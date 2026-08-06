<script setup>
import { computed, ref } from 'vue';
import { Minus, Plus, X } from '@lucide/vue';
import { cn } from '@/lib/utils';
import AlertDialog from './ui/AlertDialog.vue';

const props = defineProps({
  entry: { type: Object, required: true }
});

const emit = defineEmits(['step', 'delete']);

const showDelete = ref(false);

const weight = computed(() => props.entry.strength);

const label = computed(() =>
  weight.value === 1
    ? '1.0'
    : weight.value > 1
      ? `+${(weight.value - 1).toFixed(1)}`
      : `-${(1 - weight.value).toFixed(1)}`
);

const weightClass = computed(() =>
  cn(
    'h-5 min-w-8 items-center rounded px-1.5 font-mono text-[11px] font-medium',
    weight.value > 1
      ? 'bg-primary/15 text-primary'
      : weight.value < 1
        ? 'bg-destructive/12 text-destructive'
        : 'bg-secondary text-muted-foreground'
  )
);

function stepUp() {
  emit('step', 1);
}

function stepDown() {
  emit('step', -1);
}

function onContextStep(event) {
  event.preventDefault();
  stepDown();
}

function onDeleteClick(event) {
  if (event.shiftKey) {
    emit('delete');
  } else {
    showDelete.value = true;
  }
}
</script>

<template>
  <div
    class="group flex items-center gap-1.5 rounded-md border border-border bg-background py-1 pl-1.5 pr-1 transition-all duration-150 hover:border-primary/40 hover:bg-muted/30 hover:shadow-sm"
  >
    <button
      type="button"
      :aria-label="`Increase ${entry.name}`"
      title="Click: boost"
      class="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-[0.97]"
      @click="stepUp"
    >
      <Plus class="h-3.5 w-3.5" />
    </button>
    <button
      type="button"
      :aria-label="`Step ${entry.name} (boost left-click, reduce right-click)`"
      class="min-w-0 flex-1 truncate rounded px-1 py-0.5 text-left font-mono text-sm leading-none hover:bg-muted/60 active:scale-[0.99]"
      @click="stepUp"
      @contextmenu="onContextStep"
    >
      {{ entry.name }}
    </button>
    <span :class="cn(weightClass, 'flex')">{{ label }}</span>
    <button
      type="button"
      :aria-label="`Decrease ${entry.name}`"
      class="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-[0.97]"
      @click="stepDown"
    >
      <Minus class="h-3.5 w-3.5" />
    </button>
    <button
      type="button"
      :aria-label="`Remove ${entry.name}`"
      :title="`Remove ${entry.name} (Shift-click: skip confirmation)`"
      class="shrink-0 rounded p-1 text-muted-foreground/60 opacity-70 transition-all duration-150 hover:bg-destructive/10 hover:text-destructive active:scale-[0.97] group-hover:opacity-100"
      @click="onDeleteClick"
    >
      <X class="h-3.5 w-3.5" />
    </button>
  </div>

  <AlertDialog
    :open="showDelete"
    title="Remove this tag?"
    :description="`${entry.name} will be dropped from the list.`"
    confirm-label="Remove"
    @update:open="showDelete = $event"
    @confirm="emit('delete')"
  />
</template>
