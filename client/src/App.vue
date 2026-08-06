<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import {
  Check,
  CircleAlert,
  ClipboardPaste,
  Copy,
  FileText,
  Loader2,
  Moon,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Sun
} from '@lucide/vue';
import { getHealth, getCategories, splitText, renderEntries, adjustEntries, pasteText } from './api.js';
import CategoryCard from './components/CategoryCard.vue';
import BuyMeACoffeeIcon from './components/BuyMeACoffeeIcon.vue';
import Button from './components/ui/Button.vue';
import Card from './components/ui/Card.vue';
import CardHeader from './components/ui/CardHeader.vue';
import CardTitle from './components/ui/CardTitle.vue';
import CardDescription from './components/ui/CardDescription.vue';
import CardContent from './components/ui/CardContent.vue';
import Textarea from './components/ui/Textarea.vue';
import Toaster from './components/ui/toast/Toaster.vue';
import { useToast } from './lib/toast.js';

const { toast } = useToast();

const BUY_ME_A_COFFEE_URL = 'https://buymeacoffee.com/waypointnull';

const isDark = ref(true);
const status = ref('checking');
const checking = ref(false);
const weightStep = ref(0.1);
const inputText = ref('');
const entries = ref([]);
const categories = ref([]);
const output = ref('');
const splitting = ref(false);
const copied = ref(false);
let debounceTimer = null;
let copyTimer = null;

const tagCount = computed(() => entries.value.length);
const snippet = computed(() =>
  inputText.value.trim() ? inputText.value.trim().replace(/\s+/g, ' ').slice(0, 120) : ''
);

const groupedRows = computed(() => {
  const buckets = {};
  for (const cat of categories.value) {
    buckets[cat.id] = [];
  }
  for (const entry of entries.value) {
    const cats = entry.categories && entry.categories.length > 0 ? entry.categories : ['misc'];
    for (const catId of cats) {
      if (buckets[catId]) buckets[catId].push(entry);
    }
  }
  return buckets;
});

function toggleTheme() {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle('dark', isDark.value);
  try {
    localStorage.setItem('tsuki-theme', isDark.value ? 'dark' : 'light');
  } catch (e) {}
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function stepStrength(entry, direction) {
  entry.strength = round(entry.strength + direction * weightStep.value);
}

async function refreshHealth() {
  if (checking.value) return;
  checking.value = true;
  status.value = 'checking';
  try {
    const health = await getHealth();
    weightStep.value = (health.defaults && health.defaults.weightStep) || 0.1;
    status.value = 'online';
  } catch (err) {
    status.value = 'offline';
    toast({ variant: 'destructive', title: 'Backend unreachable', description: err.message });
  } finally {
    checking.value = false;
  }
}

async function refresh() {
  const text = inputText.value;
  if (!text.trim()) {
    entries.value = [];
    output.value = '';
    return;
  }
  splitting.value = true;
  try {
    const next = await splitText(text);
    entries.value = next;
    output.value = await renderEntries(next);
    if (next.length === 0) {
      toast({ variant: 'warning', title: 'Nothing to split', description: 'No recognizable tags in that paste.' });
    }
  } catch (err) {
    toast({ variant: 'destructive', title: "Couldn't split that", description: err.message });
  } finally {
    splitting.value = false;
  }
}

function onInput() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => refresh(), 200);
}

function onPaste() {
  pasteText()
    .then((text) => {
      if (!text) return;
      inputText.value = text;
      refresh();
    })
    .catch((err) => {
      toast({
        variant: 'destructive',
        title: 'Paste failed',
        description: err.message || 'Your browser blocked clipboard access.'
      });
    });
}

function onReset() {
  inputText.value = '';
  entries.value = [];
  output.value = '';
  if (debounceTimer) clearTimeout(debounceTimer);
}

async function onStep(entry, direction) {
  stepStrength(entry, direction);
  try {
    output.value = await renderEntries(entries.value);
  } catch (err) {
    toast({ variant: 'destructive', title: 'Render failed', description: err.message });
  }
}

async function onDelete(entry) {
  const index = entries.value.indexOf(entry);
  if (index === -1) return;
  entries.value.splice(index, 1);
  try {
    output.value = await renderEntries(entries.value);
  } catch (err) {
    toast({ variant: 'destructive', title: 'Render failed', description: err.message });
  }
  toast({ variant: 'default', title: 'Removed tag', description: entry.name });
}

function countChanged(before, after) {
  let n = 0;
  for (let i = 0; i < before.length; i++) {
    if (before[i].strength !== after[i].strength) n++;
  }
  return n;
}

async function onCategoryAdjust(categoryId, direction) {
  const before = entries.value;
  if (before.length === 0) return;
  splitting.value = true;
  try {
    const after = await adjustEntries(before, categoryId, direction);
    entries.value = after;
    output.value = await renderEntries(after);
    if (countChanged(before, after) === 0) {
      toast({ variant: 'warning', title: 'Nothing to nudge', description: 'No tags matched that category.' });
    }
  } catch (err) {
    toast({ variant: 'destructive', title: 'Adjust failed', description: err.message });
  } finally {
    splitting.value = false;
  }
}

async function onCopy() {
  if (!output.value) return;
  try {
    await navigator.clipboard.writeText(output.value);
    copied.value = true;
    if (copyTimer) clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      copied.value = false;
    }, 2000);
    toast({ variant: 'success', title: 'Copied to clipboard' });
  } catch (err) {
    toast({
      variant: 'destructive',
      title: 'Copy failed',
      description: err.message || 'Your browser blocked clipboard access.'
    });
  }
}

function openBuyMeACoffee() {
  window.open(BUY_ME_A_COFFEE_URL, '_blank', 'noopener,noreferrer');
}

onMounted(async () => {
  isDark.value = !document.documentElement.classList.contains('dark');
  await refreshHealth();
  if (status.value === 'online') {
    try {
      categories.value = await getCategories();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Categories failed', description: err.message });
    }
  }
});

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer);
  if (copyTimer) clearTimeout(copyTimer);
});
</script>

<template>
  <div class="theme-transition flex min-h-screen flex-col">
    <Button
      variant="outline"
      size="icon"
      class="fixed right-4 top-4 z-50"
      :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      @click="toggleTheme"
    >
      <Sun v-if="isDark" />
      <Moon v-else />
    </Button>

    <main class="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-10 sm:px-6 sm:py-12">
      <section class="mb-8 flex flex-col items-center text-center">
        <div class="relative inline-flex">
          <div
            class="pointer-events-none absolute -inset-10 rounded-full bg-primary/15 blur-3xl"
            aria-hidden="true"
          ></div>
          <img
            src="/Tsuki.png"
            alt="Tsuki logo"
            class="logo-duotone relative h-28 w-28 object-contain drop-shadow-lg"
          />
        </div>
        <p class="mt-5 text-sm text-muted-foreground">Tag Strength Studio</p>
        <div
          class="mt-4 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground"
        >
          <span :class="['status-dot', status]"></span>
          Local · Instant round-trips
        </div>
        <h1 class="mt-5 max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          Paste tag soup.
          <span class="text-primary">Walk away with weighted prompt text.</span>
        </h1>
        <p class="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Split a comma-separated list into individual tags, then nudge each one's strength. Left-click boosts,
          right-click softens, or rebalance a whole category at once.
        </p>
        <div class="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
          <span class="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1.5">
            <Sparkles class="h-3.5 w-3.5 text-primary" />
            Paste · tag soup in
          </span>
          <span class="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1.5">
            <CircleAlert class="h-3.5 w-3.5 text-amber-500" />
            Nudge · per tag or by category
          </span>
          <span class="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1.5">
            <FileText class="h-3.5 w-3.5" />
            Copy · weighted text out
          </span>
        </div>
      </section>

      <Card class="mb-6">
        <CardHeader>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="space-y-1.5">
              <CardTitle class="flex items-center gap-2 text-lg">
                <ClipboardPaste class="h-5 w-5 text-primary" />
                Source
              </CardTitle>
              <CardDescription>
                Weighted syntax is read back and preserved — <code>(tag)</code>, <code>(tag:1.2)</code>,
                <code>[tag]</code>, <code>[tag:0.8]</code>.
              </CardDescription>
            </div>
            <div
              class="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
              :title="`Backend ${status}`"
            >
              <span :class="['status-dot', status]"></span>
              <span>{{ status === 'online' ? 'Online' : status === 'offline' ? 'Offline' : 'Checking…' }}</span>
              <Button
                variant="ghost"
                size="icon"
                class="h-7 w-7"
                :disabled="checking"
                aria-label="Re-check backend"
                title="Re-check backend"
                @click="refreshHealth"
              >
                <RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': checking }" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent class="space-y-3">
          <Textarea
            v-model="inputText"
            :rows="5"
            placeholder="1girl, solo, long_hair, blue_eyes, school_uniform, looking_at_viewer, smile"
            :disabled="splitting"
            @input="onInput"
          />
          <div class="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" @click="onPaste">
              <ClipboardPaste class="h-4 w-4" />
              Paste
            </Button>
            <Button variant="outline" size="sm" :disabled="!inputText" @click="onReset">
              <RotateCcw class="h-4 w-4" />
              Clear
            </Button>
            <Loader2 v-if="splitting" class="ml-1 h-4 w-4 animate-spin text-muted-foreground" aria-label="Splitting" />
            <span class="ml-auto font-mono text-xs text-muted-foreground">{{ tagCount }} tags</span>
          </div>
        </CardContent>
      </Card>

      <div class="mb-6 flex-1">
        <div
          v-if="entries.length === 0"
          class="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 px-4 py-10 text-center"
        >
          <Sparkles class="h-5 w-5 text-muted-foreground" />
          <p class="text-sm font-medium">No tags yet</p>
          <p class="text-xs text-muted-foreground">Paste something above to start nudging.</p>
        </div>
        <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <CategoryCard
            v-for="category in categories"
            :key="category.id"
            :category="category"
            :entries="groupedRows[category.id] || []"
            :disabled="splitting"
            @adjust="onCategoryAdjust"
            @step="onStep"
            @delete="onDelete"
          />
        </div>
        <p class="mx-auto mt-4 max-w-xl text-center text-xs leading-relaxed text-muted-foreground">
          Left-click a tag to boost it, right-click to soften — or use the ± buttons. A card's ± nudges every tag in
          that category together. Hover a tag and click
          <span class="font-mono">×</span> to remove it; hold <span class="font-mono">Shift</span> while clicking to
          skip the confirmation.
        </p>
      </div>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0">
          <div class="space-y-1.5">
            <CardTitle class="text-lg">Raw output</CardTitle>
            <CardDescription>Weighted, balanced, ready to paste.</CardDescription>
          </div>
          <span class="font-mono text-xs text-muted-foreground">{{ output.length }}</span>
        </CardHeader>
        <CardContent class="space-y-3">
          <div
            v-if="!output"
            class="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 px-4 py-10 text-center"
          >
            <FileText class="h-5 w-5 text-muted-foreground" />
            <p class="text-sm font-medium">No output yet</p>
            <p class="text-xs text-muted-foreground">Nudge a tag and the weighted prompt builds here.</p>
          </div>
          <pre v-else class="code-block overflow-auto">{{ output }}</pre>
          <div class="flex items-center justify-end gap-2">
            <Button variant="default" size="sm" :disabled="!output" @click="onCopy">
              <Check v-if="copied" class="h-4 w-4 text-primary" />
              <Copy v-else class="h-4 w-4" />
              {{ copied ? 'Copied' : 'Copy' }}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>

    <footer class="border-t">
      <div class="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:grid-cols-3 sm:items-start sm:px-6">
        <p class="text-xs text-muted-foreground">Tsuki · runs locally · no accounts</p>
        <div class="flex flex-col items-center gap-2">
          <p class="text-xs text-muted-foreground">Tired of having money?</p>
          <Button variant="outline" size="sm" class="gap-2" @click="openBuyMeACoffee">
            <BuyMeACoffeeIcon class="h-4 w-4 text-amber-400" />
            I'll gladly take it!
          </Button>
        </div>
        <div class="flex justify-center sm:justify-end">
          <p class="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Moon class="h-3 w-3 text-primary" />
            Tuned under a full moon
          </p>
        </div>
      </div>
    </footer>

    <Toaster />
  </div>
</template>
