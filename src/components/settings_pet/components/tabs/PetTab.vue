<template>
  <article class="flex w-full flex-1 flex-col">
    <header
      class="mb-6 flex items-end justify-between border-b-2 pb-2 transition-colors"
      :class="isDarkMode ? 'border-slate-700' : 'border-slate-100'"
    >
      <div>
        <h2
          class="mb-1 flex items-center gap-2 text-xl font-black tracking-wide transition-colors"
          :class="isDarkMode ? 'text-slate-100' : 'text-slate-800'"
        >
          {{ $t("pet.petTab.title") }}
        </h2>
        <p
          class="text-xs font-medium transition-colors"
          :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'"
        >
          {{ $t("pet.petTab.desc") }}
        </p>
      </div>
      <span
        class="font-mono text-4xl font-bold italic transition-colors select-none"
        :class="isDarkMode ? 'text-slate-700' : 'text-sky-100'"
        >01</span
      >
    </header>

    <div class="mt-4 grid grid-cols-2 gap-4">
      <div
        @click="selectMode('normal')"
        class="relative flex min-h-35 cursor-pointer flex-col overflow-hidden rounded-xl border p-5
          shadow-sm transition-all duration-300 hover:-translate-y-1"
        :class="[
          isDarkMode
            ? 'border-slate-700 hover:border-sky-500 hover:bg-slate-800'
            : 'border-slate-200 hover:border-sky-400 hover:bg-slate-50',
          currentMode === 'normal'
            ? isDarkMode
              ? 'bg-slate-800 ring-2 ring-sky-500'
              : 'bg-sky-50 ring-2 ring-sky-400'
            : isDarkMode
              ? 'bg-slate-800/50'
              : 'bg-white',
        ]"
      >
        <div class="mb-2 flex items-center gap-3">
          <div
            :class="[
              'rounded-lg p-2 transition-colors',
              currentMode === 'normal' || !isDarkMode
                ? 'bg-sky-100/10 text-sky-500'
                : 'bg-slate-800 text-slate-400',
            ]"
          >
            <MessageSquare class="h-5 w-5" />
          </div>
          <h3 class="text-lg font-bold" :class="isDarkMode ? 'text-slate-200' : 'text-slate-800'">
            {{ $t("pet.petTab.modeNormal") }}
          </h3>
        </div>
        <p class="text-xs" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">
          {{ $t("pet.petTab.modeNormalDesc") }}
        </p>
      </div>

      <div
        @click="selectMode('game')"
        class="relative flex min-h-35 cursor-pointer flex-col overflow-hidden rounded-xl border p-5
          shadow-sm transition-all duration-300 hover:-translate-y-1"
        :class="[
          isDarkMode
            ? 'border-slate-700 hover:border-violet-500 hover:bg-slate-800'
            : 'border-slate-200 hover:border-violet-400 hover:bg-slate-50',
          currentMode === 'game'
            ? isDarkMode
              ? 'bg-slate-800 ring-2 ring-violet-500'
              : 'bg-violet-50 ring-2 ring-violet-400'
            : isDarkMode
              ? 'bg-slate-800/50'
              : 'bg-white',
        ]"
      >
        <div class="mb-2 flex items-center gap-3">
          <div
            :class="[
              'rounded-lg p-2 transition-colors',
              currentMode === 'game' || !isDarkMode
                ? 'bg-violet-100/10 text-violet-500'
                : 'bg-slate-800 text-slate-400',
            ]"
          >
            <Gamepad2 class="h-5 w-5" />
          </div>
          <h3 class="text-lg font-bold" :class="isDarkMode ? 'text-slate-200' : 'text-slate-800'">
            {{ $t("pet.petTab.modeGame") }}
          </h3>
        </div>
        <p class="text-xs" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">
          {{ $t("pet.petTab.modeGameDesc") }}
        </p>
      </div>
    </div>

    <div
      class="group relative mt-4 overflow-hidden rounded-xl border p-6 shadow-sm transition-colors
        duration-300"
      :class="isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'"
    >
      <ShieldCheck
        class="absolute -right-4 -bottom-4 h-32 w-32 -rotate-12 opacity-10 transition-all
          duration-300 group-hover:scale-110"
        :class="isDarkMode ? 'text-slate-700' : 'text-slate-200'"
      />

      <div class="relative z-10">
        <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h3
              class="mb-1 flex items-center gap-2 text-lg font-bold"
              :class="isDarkMode ? 'text-slate-200' : 'text-slate-800'"
            >
              <ShieldCheck class="h-5 w-5 text-emerald-500" />
              {{ $t("pet.petTab.assetCheckTitle") }}
            </h3>
            <p class="text-xs" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">
              {{ $t("pet.petTab.assetCheckDesc") }}
            </p>
          </div>
          <button
            type="button"
            :disabled="auditState === 'checking'"
            class="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4
              py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-400
              active:scale-95 disabled:cursor-wait disabled:opacity-60"
            @click="runRolePackAudit"
          >
            <RefreshCw class="h-4 w-4" :class="auditState === 'checking' ? 'animate-spin' : ''" />
            {{
              auditState === "checking"
                ? $t("pet.petTab.assetChecking")
                : $t("pet.petTab.assetCheckButton")
            }}
          </button>
        </div>

        <div
          class="mt-4 rounded-lg border p-3 text-xs"
          :class="isDarkMode ? 'border-slate-700 bg-slate-900/40' : 'border-slate-100 bg-slate-50'"
        >
          <template v-if="auditState === 'done' && auditResult">
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span class="font-bold" :class="isDarkMode ? 'text-slate-200' : 'text-slate-700'">
                {{ auditResult.characterName || $t("pet.petTab.assetUnknownRole") }}
              </span>
              <span :class="auditResult.baseAvatarAvailable ? 'text-emerald-500' : 'text-rose-500'">
                {{
                  auditResult.baseAvatarAvailable
                    ? $t("pet.petTab.baseAvatarOk")
                    : $t("pet.petTab.baseAvatarMissing")
                }}
              </span>
              <span :class="missingActionCount === 0 ? 'text-emerald-500' : 'text-amber-500'">
                {{
                  $t("pet.petTab.assetCheckSummary", {
                    available: availableActionCount,
                    total: auditResult.checks.length,
                  })
                }}
              </span>
            </div>
            <p v-if="fallbackActionCount > 0" class="mt-2 text-sky-500">
              {{ $t("pet.petTab.assetFallbackSummary", { count: fallbackActionCount }) }}
            </p>
            <p v-if="missingActionCount > 0" class="mt-2 text-rose-500">
              {{ $t("pet.petTab.assetMissingList", { files: missingActionFiles.join("、") }) }}
            </p>
          </template>
          <p v-else-if="auditState === 'checking'" class="text-sky-500">
            {{ $t("pet.petTab.assetCheckingHint") }}
          </p>
          <p v-else-if="auditState === 'error'" class="text-rose-500">
            {{ $t("pet.petTab.assetCheckError") }}
          </p>
          <p v-else :class="isDarkMode ? 'text-slate-500' : 'text-slate-400'">
            {{ $t("pet.petTab.assetCheckIdle") }}
          </p>
        </div>

        <div
          class="mt-5 border-t pt-4"
          :class="isDarkMode ? 'border-slate-700' : 'border-slate-100'"
        >
          <div class="mb-3">
            <div
              class="flex items-center gap-2 text-sm font-bold"
              :class="isDarkMode ? 'text-slate-200' : 'text-slate-700'"
            >
              <Play class="h-4 w-4 text-sky-500" />
              {{ $t("pet.petTab.actionPreviewTitle") }}
            </div>
            <p class="mt-1 text-[11px]" :class="isDarkMode ? 'text-slate-500' : 'text-slate-400'">
              {{ $t("pet.petTab.actionPreviewDesc") }}
            </p>
          </div>
          <div class="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
            <button
              v-for="actionId in PET_ACTION_IDS"
              :key="actionId"
              type="button"
              :disabled="isActionMissing(actionId)"
              class="flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs
                font-medium transition-all hover:-translate-y-0.5 active:translate-y-0
                disabled:cursor-not-allowed disabled:opacity-40"
              :class="
                isDarkMode
                  ? 'border-slate-700 bg-slate-900/40 text-slate-300 hover:border-sky-500'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-sky-400'
              "
              @click="previewAction(actionId)"
            >
              <Play class="h-3.5 w-3.5 shrink-0 text-sky-500" />
              <span class="truncate" :title="PET_ACTIONS[actionId].file">
                {{ formatActionLabel(actionId) }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      class="group relative mt-4 overflow-hidden rounded-xl border p-6 shadow-sm transition-colors
        duration-300"
      :class="isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'"
    >
      <SlidersHorizontal
        class="absolute -right-4 -bottom-4 h-32 w-32 -rotate-12 opacity-10 transition-all
          duration-300 group-hover:scale-110"
        :class="isDarkMode ? 'text-slate-700' : 'text-slate-200'"
      />

      <div class="relative z-10">
        <h3
          class="mb-1 flex items-center gap-2 text-lg font-bold"
          :class="isDarkMode ? 'text-slate-200' : 'text-slate-800'"
        >
          <SlidersHorizontal class="h-5 w-5 text-sky-500" />
          {{ $t("pet.petTab.behaviorTitle") }}
        </h3>
        <p class="mb-4 text-xs" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">
          {{ $t("pet.petTab.behaviorDesc") }}
        </p>

        <div class="grid gap-3 md:grid-cols-2">
          <div
            v-for="option in behaviorToggleOptions"
            :key="option.key"
            class="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors"
            :class="
              isDarkMode ? 'border-slate-700 bg-slate-900/40' : 'border-slate-100 bg-slate-50'
            "
          >
            <div>
              <div
                class="text-sm font-bold"
                :class="isDarkMode ? 'text-slate-200' : 'text-slate-700'"
              >
                {{ option.label }}
              </div>
              <div
                class="mt-0.5 text-[11px]"
                :class="isDarkMode ? 'text-slate-500' : 'text-slate-400'"
              >
                {{ option.desc }}
              </div>
            </div>
            <button
              type="button"
              role="switch"
              :aria-checked="behaviorSettings[option.key]"
              class="relative h-6 w-11 shrink-0 rounded-full transition-colors"
              :class="behaviorSettings[option.key] ? 'bg-sky-500' : 'bg-slate-400/50'"
              @click="toggleBehavior(option.key)"
            >
              <span
                class="absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow-sm
                  transition-transform"
                :class="behaviorSettings[option.key] ? 'translate-x-5' : 'translate-x-0'"
              ></span>
            </button>
          </div>
        </div>

        <div
          class="mt-4 flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center
            md:justify-between"
          :class="isDarkMode ? 'border-slate-700' : 'border-slate-100'"
        >
          <div>
            <div
              class="text-sm font-bold"
              :class="isDarkMode ? 'text-slate-200' : 'text-slate-700'"
            >
              {{ $t("pet.petTab.frequencyTitle") }}
            </div>
            <div
              class="mt-0.5 text-[11px]"
              :class="isDarkMode ? 'text-slate-500' : 'text-slate-400'"
            >
              {{ $t("pet.petTab.frequencyDesc") }}
            </div>
          </div>
          <div class="flex gap-2">
            <button
              v-for="option in frequencyOptions"
              :key="option.value"
              type="button"
              class="rounded-lg border px-4 py-2 text-xs font-bold transition-all"
              :class="[
                behaviorSettings.actionFrequency === option.value
                  ? 'border-sky-500 bg-sky-500 text-white shadow-sm'
                  : isDarkMode
                    ? 'border-slate-600 text-slate-400 hover:border-sky-500 hover:text-sky-400'
                    : 'border-slate-200 text-slate-500 hover:border-sky-400 hover:text-sky-500',
              ]"
              @click="setActionFrequency(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      class="group relative mt-4 overflow-hidden rounded-xl border p-6 shadow-sm transition-colors
        duration-300"
      :class="isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'"
    >
      <Ruler
        class="absolute -right-4 -bottom-4 h-32 w-32 -rotate-12 opacity-50 transition-all
          duration-300 group-hover:scale-110"
        :class="isDarkMode ? 'text-slate-700' : 'text-slate-50'"
      />

      <div class="relative z-10">
        <h3
          class="mb-4 flex items-center gap-2 text-lg font-bold"
          :class="isDarkMode ? 'text-slate-200' : 'text-slate-800'"
        >
          <Volume2 class="h-5 w-5 text-sky-500" />
          {{ $t("pet.petTab.scaleTitle") }}
        </h3>
        <div class="mb-6 flex items-end gap-3">
          <div class="text-4xl font-bold tracking-tighter text-sky-500">
            {{ percentLabel }}
          </div>
          <div
            class="mb-1.5 rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase
              transition-colors"
            :class="isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'"
          >
            CURRENT SCALE
          </div>
        </div>

        <div class="relative mt-8 mb-6">
          <input
            type="range"
            :min="PET_SCALE_MIN"
            :max="PET_SCALE_MAX"
            :step="0.01"
            :value="petScale"
            @input="onScaleInput"
            class="custom-slider"
          />
          <div
            class="mt-4 flex justify-between font-mono text-[11px] font-bold transition-colors"
            :class="isDarkMode ? 'text-slate-500' : 'text-slate-400'"
          >
            <span>MIN {{ PET_SCALE_MIN * 100 }}%</span>
            <span
              class="relative pl-2 text-sky-500 before:absolute before:top-1.5 before:left-0
                before:h-1 before:w-1 before:rounded-full before:bg-sky-400 before:content-['']"
              >DEF 100%</span
            >
            <span>MAX {{ PET_SCALE_MAX * 100 }}%</span>
          </div>
        </div>

        <div
          class="mt-6 flex justify-end border-t pt-4 transition-colors"
          :class="isDarkMode ? 'border-slate-700' : 'border-slate-100/80'"
        >
          <button
            type="button"
            @click="$emit('resetScale')"
            class="flex items-center gap-2 rounded-lg bg-sky-500 px-5 py-2 text-[13px] font-bold
              text-white shadow-[0_4px_12px_rgba(56,189,248,0.25)] transition-all hover:bg-sky-400
              hover:shadow-[0_6px_16px_rgba(56,189,248,0.35)] active:scale-95"
          >
            <RotateCcw class="h-4 w-4" />
            {{ $t("pet.petTab.scaleReset") }}
          </button>
        </div>
      </div>
    </div>

    <div
      class="group relative mt-4 overflow-hidden rounded-xl border p-6 shadow-sm transition-colors
        duration-300"
      :class="isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'"
    >
      <Sparkles
        class="absolute -right-4 -bottom-4 h-32 w-32 -rotate-12 opacity-10 transition-all
          duration-300 group-hover:scale-110"
        :class="isDarkMode ? 'text-slate-700' : 'text-slate-300'"
      />

      <div class="relative z-10">
        <h3
          class="mb-4 flex items-center gap-2 text-lg font-bold"
          :class="isDarkMode ? 'text-slate-200' : 'text-slate-800'"
        >
          <Sparkles class="h-5 w-5 text-sky-500" />
          {{ $t("pet.petTab.particleTitle") }}
        </h3>

        <div class="flex gap-3">
          <button
            v-for="opt in particleOptions"
            :key="opt.value"
            @click="selectParticle(opt.value)"
            class="flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm
              font-medium transition-all duration-200"
            :class="[
              currentParticle === opt.value
                ? isDarkMode
                  ? 'border-sky-500 bg-sky-500/20 text-sky-400'
                  : 'border-sky-500 bg-sky-500 text-white shadow-md'
                : isDarkMode
                  ? `border-slate-600 bg-transparent text-slate-400 hover:border-slate-500
                    hover:text-slate-300`
                  : `border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300
                    hover:bg-slate-100`,
            ]"
          >
            <component :is="opt.icon" class="h-4 w-4" v-if="opt.icon" />
            {{ opt.label }}
          </button>
        </div>
      </div>
    </div>

    <div
      class="group relative mt-4 overflow-hidden rounded-xl border p-6 shadow-sm transition-colors
        duration-300"
      :class="isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'"
    >
      <Volume2
        class="absolute -right-4 -bottom-4 h-32 w-32 -rotate-12 opacity-10 transition-all
          duration-300 group-hover:scale-110"
        :class="isDarkMode ? 'text-slate-700' : 'text-slate-200'"
      />

      <div class="relative z-10">
        <h3
          class="mb-4 flex items-center gap-2 text-lg font-bold"
          :class="isDarkMode ? 'text-slate-200' : 'text-slate-800'"
        >
          <Volume2 class="h-5 w-5 text-sky-500" />
          {{ $t("pet.petTab.volumeTitle") }}
        </h3>
        <div class="mb-6 flex items-end gap-3">
          <div class="text-4xl font-bold tracking-tighter text-sky-500">
            {{ volumeLabel }}
          </div>
          <div
            class="mb-1.5 rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase
              transition-colors"
            :class="isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'"
          >
            PET VOLUME
          </div>
        </div>

        <div class="relative mt-8 mb-6">
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            :value="petVolume"
            @input="onVolumeInput"
            class="custom-slider"
          />
          <div
            class="mt-4 flex justify-between font-mono text-[11px] font-bold transition-colors"
            :class="isDarkMode ? 'text-slate-500' : 'text-slate-400'"
          >
            <span>MIN 0%</span>
            <span
              class="relative pl-2 text-sky-500 before:absolute before:top-1.5 before:left-0
                before:h-1 before:w-1 before:rounded-full before:bg-sky-400 before:content-['']"
              >DEF 50%</span
            >
            <span>MAX 100%</span>
          </div>
        </div>

        <div
          class="mt-6 flex justify-end border-t pt-4 transition-colors"
          :class="isDarkMode ? 'border-slate-700' : 'border-slate-100/80'"
        >
          <button
            type="button"
            @click="$emit('resetVolume')"
            class="flex items-center gap-2 rounded-lg bg-sky-500 px-5 py-2 text-[13px] font-bold
              text-white shadow-[0_4px_12px_rgba(56,189,248,0.25)] transition-all hover:bg-sky-400
              hover:shadow-[0_6px_16px_rgba(56,189,248,0.35)] active:scale-95"
          >
            <RotateCcw class="h-4 w-4" />
            {{ $t("pet.petTab.volumeReset") }}
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from "vue";
  import { useI18n } from "vue-i18n";
  import {
    Ruler,
    RotateCcw,
    MessageSquare,
    Gamepad2,
    Sparkles,
    Ban,
    Stars,
    Sun,
    Volume2,
    SlidersHorizontal,
    ShieldCheck,
    RefreshCw,
    Play,
  } from "lucide-vue-next";
  import { useUIStore } from "../../../../stores/modules/ui/ui";
  import type { PetSettings } from "../../../../stores/modules/settings";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import {
    PET_ACTION_AUDIT_REQUEST_EVENT,
    PET_ACTION_AUDIT_RESULT_EVENT,
    PET_ACTION_IDS,
    PET_ACTION_PREVIEW_EVENT,
    PET_ACTIONS,
    type PetActionAuditResult,
    type PetActionId,
  } from "../../../pet/pet-actions";

  const props = defineProps<{
    isDarkMode: boolean;
    petScale: number;
    petVolume: number;
    PET_SCALE_MIN: number;
    PET_SCALE_MAX: number;
    behaviorSettings: PetSettings;
  }>();

  type BooleanBehaviorKey =
    | "clickInteractionEnabled"
    | "idleActionsEnabled"
    | "musicActionsEnabled"
    | "preserveSpeakingPoseWhileDragging"
    | "smoothTransitionsEnabled"
    | "subtleMotionEnabled"
    | "timeCompanionEnabled"
    | "actionDebugEnabled";

  const emit = defineEmits<{
    updateScale: [value: number];
    resetScale: [];
    updateVolume: [value: number];
    resetVolume: [];
    updateBehavior: [key: keyof PetSettings, value: boolean | PetSettings["actionFrequency"]];
  }>();

  const uiStore = useUIStore();
  const { t } = useI18n();
  const appWindow = getCurrentWindow();

  const auditState = ref<"idle" | "checking" | "done" | "error">("idle");
  const auditResult = ref<PetActionAuditResult | null>(null);
  let activeAuditRequestId = "";
  let auditResultUnlisten: (() => void) | null = null;
  let auditTimeoutId: number | null = null;

  const availableActionCount = computed(
    () => auditResult.value?.checks.filter((item) => item.available).length ?? 0
  );
  const missingActionCount = computed(
    () => auditResult.value?.checks.filter((item) => !item.available).length ?? 0
  );
  const fallbackActionCount = computed(
    () => auditResult.value?.checks.filter((item) => item.source === "bundled-fallback").length ?? 0
  );
  const missingActionFiles = computed(
    () => auditResult.value?.checks.filter((item) => !item.available).map((item) => item.file) ?? []
  );

  const clearAuditTimeout = () => {
    if (auditTimeoutId !== null) {
      window.clearTimeout(auditTimeoutId);
      auditTimeoutId = null;
    }
  };

  const runRolePackAudit = async () => {
    clearAuditTimeout();
    auditState.value = "checking";
    auditResult.value = null;
    activeAuditRequestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    await appWindow.emit(PET_ACTION_AUDIT_REQUEST_EVENT, { requestId: activeAuditRequestId });
    auditTimeoutId = window.setTimeout(() => {
      if (auditState.value === "checking") auditState.value = "error";
    }, 8000);
  };

  const previewAction = async (actionId: PetActionId) => {
    await appWindow.emit(PET_ACTION_PREVIEW_EVENT, { actionId });
  };

  const formatActionLabel = (actionId: PetActionId) =>
    PET_ACTIONS[actionId].file.replace(/\.[^.]+$/, "").replace(/^\d+_/, "");

  const isActionMissing = (actionId: PetActionId) =>
    auditState.value === "done" &&
    auditResult.value?.checks.some((item) => item.actionId === actionId && !item.available) ===
      true;

  onMounted(async () => {
    auditResultUnlisten = await appWindow.listen<PetActionAuditResult>(
      PET_ACTION_AUDIT_RESULT_EVENT,
      (event) => {
        if (event.payload?.requestId !== activeAuditRequestId) return;
        clearAuditTimeout();
        auditResult.value = event.payload;
        auditState.value = event.payload.error ? "error" : "done";
      }
    );
    await runRolePackAudit();
  });

  onUnmounted(() => {
    clearAuditTimeout();
    if (auditResultUnlisten) auditResultUnlisten();
  });

  const currentMode = ref("normal");
  const selectMode = (mode: string) => {
    currentMode.value = mode;
    // 空函数，留作后续逻辑实现
  };

  const currentParticle = computed(() => uiStore.currentBackgroundEffect);

  const particleOptions = computed(() => [
    { label: t("pet.petTab.particleNone"), value: "None", icon: Ban },
    { label: t("pet.petTab.particleStarField"), value: "StarField", icon: Stars },
    { label: t("pet.petTab.particleBA"), value: "BA", icon: Sun },
  ]);

  const behaviorToggleOptions = computed<
    Array<{ key: BooleanBehaviorKey; label: string; desc: string }>
  >(() => [
    {
      key: "clickInteractionEnabled",
      label: t("pet.petTab.clickInteraction"),
      desc: t("pet.petTab.clickInteractionDesc"),
    },
    {
      key: "idleActionsEnabled",
      label: t("pet.petTab.idleActions"),
      desc: t("pet.petTab.idleActionsDesc"),
    },
    {
      key: "musicActionsEnabled",
      label: t("pet.petTab.musicActions"),
      desc: t("pet.petTab.musicActionsDesc"),
    },
    {
      key: "preserveSpeakingPoseWhileDragging",
      label: t("pet.petTab.preserveSpeakingPose"),
      desc: t("pet.petTab.preserveSpeakingPoseDesc"),
    },
    {
      key: "smoothTransitionsEnabled",
      label: t("pet.petTab.smoothTransitions"),
      desc: t("pet.petTab.smoothTransitionsDesc"),
    },
    {
      key: "subtleMotionEnabled",
      label: t("pet.petTab.subtleMotion"),
      desc: t("pet.petTab.subtleMotionDesc"),
    },
    {
      key: "timeCompanionEnabled",
      label: t("pet.petTab.timeCompanion"),
      desc: t("pet.petTab.timeCompanionDesc"),
    },
    {
      key: "actionDebugEnabled",
      label: t("pet.petTab.actionDebug"),
      desc: t("pet.petTab.actionDebugDesc"),
    },
  ]);

  const frequencyOptions = computed(() => [
    { label: t("pet.petTab.frequencyLow"), value: "low" as const },
    { label: t("pet.petTab.frequencyNormal"), value: "normal" as const },
    { label: t("pet.petTab.frequencyHigh"), value: "high" as const },
  ]);

  const toggleBehavior = (key: BooleanBehaviorKey) => {
    emit("updateBehavior", key, !props.behaviorSettings[key]);
  };

  const setActionFrequency = (value: PetSettings["actionFrequency"]) => {
    emit("updateBehavior", "actionFrequency", value);
  };

  const selectParticle = async (value: string) => {
    uiStore.setBackgroundEffect(value);
    await appWindow.emit("background-effect-changed", { effect: value });
  };

  const percentLabel = computed(() => {
    return `${Math.round(props.petScale * 100)}%`;
  });

  const volumeLabel = computed(() => {
    return `${Math.round(props.petVolume)}%`;
  });

  const onScaleInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    emit("updateScale", Number(target.value));
  };

  const onVolumeInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    emit("updateVolume", Number(target.value));
  };
</script>

<style scoped>
  /* 自定义滑块轨道与手柄 (BA 科技感风格) */
  .custom-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    background: transparent;
    outline: none;
  }

  .custom-slider::-webkit-slider-runnable-track {
    width: 100%;
    height: 6px;
    cursor: pointer;
    background-color: #e2e8f0; /* slate-200 */
    border-radius: 9999px;
    transition: background-color 0.2s;
  }

  .dark .custom-slider::-webkit-slider-runnable-track {
    background-color: #334155; /* slate-700 */
  }

  .custom-slider:hover::-webkit-slider-runnable-track {
    background-color: #cbd5e1; /* slate-300 */
  }

  .dark .custom-slider:hover::-webkit-slider-runnable-track {
    background-color: #475569; /* slate-600 */
  }

  .custom-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    height: 20px;
    width: 12px;
    border-radius: 4px;
    background-color: #ffffff;
    border: 3px solid #38bdf8; /* sky-400 */
    cursor: pointer;
    margin-top: -7px;
    box-shadow: 0 2px 6px rgba(56, 189, 248, 0.4);
    transition:
      transform 0.1s ease,
      box-shadow 0.1s ease,
      background-color 0.3s ease;
  }

  .dark .custom-slider::-webkit-slider-thumb {
    background-color: #0f172a; /* slate-900 */
    border: 3px solid #0ea5e9; /* sky-500 */
    box-shadow: 0 2px 6px rgba(14, 165, 233, 0.4);
  }

  .custom-slider::-webkit-slider-thumb:active {
    transform: scale(0.85);
    box-shadow: 0 1px 3px rgba(56, 189, 248, 0.5);
    border-color: #0ea5e9; /* sky-500 */
  }

  .dark .custom-slider::-webkit-slider-thumb:active {
    border-color: #38bdf8; /* sky-400 */
  }
</style>
