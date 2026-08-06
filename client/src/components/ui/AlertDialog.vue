<script setup>
import { ref, watch, nextTick } from 'vue';
import { CircleAlert } from '@lucide/vue';
import Button from './Button.vue';

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Remove' },
  cancelLabel: { type: String, default: 'Cancel' }
});

const emit = defineEmits(['confirm', 'update:open']);

const panelRef = ref(null);

watch(
  () => props.open,
  async (open) => {
    if (open) {
      await nextTick();
      panelRef.value?.focus();
    }
  }
);

function close() {
  emit('update:open', false);
}

function onConfirm() {
  emit('confirm');
  close();
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      role="alertdialog"
      aria-modal="true"
      :aria-label="title"
      class="fixed inset-0 z-[60] flex items-center justify-center p-4"
      @keydown.esc="close"
    >
      <div class="animate-fade-in absolute inset-0 bg-black/50 backdrop-blur-sm" @click="close"></div>
      <div
        ref="panelRef"
        tabindex="-1"
        class="animate-scale-in relative w-full max-w-sm rounded-lg border bg-popover p-6 text-popover-foreground shadow-xl outline-none"
      >
        <div class="flex items-start gap-4">
          <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <CircleAlert class="h-5 w-5 text-destructive" />
          </div>
          <div class="min-w-0 flex-1 space-y-1.5">
            <h2 class="text-base font-semibold">{{ title }}</h2>
            <p v-if="description" class="text-sm text-muted-foreground">{{ description }}</p>
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-2">
          <Button variant="outline" size="sm" @click="close">{{ cancelLabel }}</Button>
          <Button variant="destructive" size="sm" @click="onConfirm">{{ confirmLabel }}</Button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
