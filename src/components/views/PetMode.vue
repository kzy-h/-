<template>
  <div
    id="pet-app"
    :style="appStyleVars"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    class="relative flex h-(--app-height) w-(--app-width) flex-col items-center justify-start
      overflow-hidden bg-transparent transition-none select-none"
  >
    <!-- DialogueBox 区域 -->
    <div
      class="flex w-full shrink-0 flex-col justify-end bg-transparent transition-none"
      :style="{ height: 'var(--dialog-h)' }"
    >
      <PetNotification />
      <Transition name="pet-interaction-bubble">
        <div
          v-if="interactionText && !isDialogueActive"
          aria-live="polite"
          class="pointer-events-none mx-auto mb-1 w-[85%] rounded-[calc(20px*var(--pet-ui-scale,1))]
            border border-fuchsia-200/15 bg-neutral-950/60 px-[calc(18px*var(--pet-ui-scale,1))]
            py-[calc(8px*var(--pet-ui-scale,1))] text-[calc(15px*var(--pet-ui-scale,1))]
            leading-snug font-medium text-white shadow-lg backdrop-blur-xl backdrop-saturate-200
            [text-shadow:0_0_3px_rgba(0,0,0,0.9),0_1px_4px_rgba(0,0,0,0.5)]"
        >
          <div
            class="mb-0.5 text-[calc(12px*var(--pet-ui-scale,1))] font-semibold tracking-wider
              text-fuchsia-300 italic"
          >
            瞌睡米塔
          </div>
          {{ interactionText }}
        </div>
      </Transition>
      <div class="mt-1 flex items-end justify-center">
        <DialogueBox
          ref="gameDialogRef"
          @player-continued="manualTriggerContinue"
          @dialog-proceed="resetInteraction"
        />
      </div>
    </div>

    <!-- Avatar 区域 -->
    <DragArea :isDragging="isDragging">
      <div
        ref="avatarContainer"
        class="relative flex shrink-0 items-center justify-center bg-transparent transition-all
          duration-100"
        :style="{ width: 'var(--avatar-width)', height: 'var(--avatar-height)' }"
      >
        <GameRolesStage
          :action-file="petActions.actionFile.value"
          :action-motion="petActions.currentAction.value?.motion"
          :smooth-transitions-enabled="smoothTransitionsEnabled"
          :subtle-motion-enabled="subtleMotionEnabled"
          @avatar-click="handleAvatarClick"
          @avatar-double-click="handleAvatarDoubleClick"
          @drag-start="handleAvatarDragStart"
          @drag-end="handleAvatarDragEnd"
          @action-unavailable="handleActionUnavailable"
          @open-settings="handleOpenSettings"
          @switch-auto-mode="handleSwitchAutoMode"
          @exit-pet-mode="handleExitPetMode"
          @audio-ended="handleAudioFinished"
          @audio-started="handleAudioStarted"
        />
        <div
          v-if="actionDebugEnabled"
          class="pointer-events-none absolute top-1 right-1 z-80 max-w-[190px] rounded-md border
            border-cyan-300/35 bg-slate-950/80 px-2 py-1 font-mono text-[9px] leading-4
            text-cyan-100 shadow-lg backdrop-blur"
        >
          <div>zone: {{ lastHitZone ?? "-" }} · clicks: {{ debugClickCount }}</div>
          <div>
            action: {{ petActions.currentActionId.value ?? "idle" }} · p{{
              petActions.currentAction.value?.priority ?? 0
            }}
          </div>
          <div>
            decision: {{ petActions.lastDecision.value.played ? "play" : "skip" }} ·
            {{ petActions.lastDecision.value.reason }}
          </div>
        </div>
      </div>
    </DragArea>

    <!-- ChatInput 区域 -->
    <div
      ref="chatContainer"
      class="flex w-full shrink-0 items-start justify-center bg-transparent transition-none"
      :style="{ height: 'var(--chat-h)' }"
    >
      <ChatInput ref="ChatInputRef" :visible="showChatInput" @message-sent="handleMessageSent" />
    </div>

    <audio
      ref="interactionAudio"
      class="hidden"
      @ended="handleInteractionVoiceEnded"
      @error="handleInteractionVoiceError"
    ></audio>
  </div>
</template>

<script setup lang="ts">
  import * as TtsLocal from "@/api/services/tts/tts-local";
  import { setVoicePlaying } from "@/composables/useAsrInput";
  import { useGameStore } from "@/stores/modules/game";
  import { useSettingsStore } from "@/stores/modules/settings";
  import { useUIStore } from "@/stores/modules/ui/ui";
  import { invoke } from "@tauri-apps/api/core";
  import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { computed, onMounted, onUnmounted, ref, watch } from "vue";
  import { useI18n } from "vue-i18n";
  import { useRouter } from "vue-router";
  import { useFileDrop } from "../pet/useFileDrop";
  import { usePetActions } from "@/composables/usePetActions";
  import {
    readCachedInteractionVoice,
    writeCachedInteractionVoice,
  } from "@/components/pet/pet-interaction-voice";
  import {
    CLICK_REACTIONS_BY_ZONE,
    DOUBLE_CLICK_REACTIONS,
    HAIR_CLICK_PROGRESSION,
    isPetActionId,
    PET_ACTION_AUDIT_REQUEST_EVENT,
    PET_ACTION_AUDIT_RESULT_EVENT,
    PET_ACTION_IDS,
    PET_ACTION_PREVIEW_EVENT,
    PET_ACTIONS,
    pickPetActionLine,
    RAPID_CLICK_REACTIONS_BY_ZONE,
    REPEATED_CLICK_REACTIONS_BY_ZONE,
    SLEEPY_MITA_BUNDLED_FOLDER,
    type PetActionAssetCheck,
    type PetActionAuditRequest,
    type PetActionAuditResult,
    type PetActionFrequency,
    type PetActionId,
    type PetHitZone,
    type PetActionPreviewPayload,
    type PetInteractionLine,
  } from "@/components/pet/pet-actions";

  import ChatInput from "../pet/ChatInput.vue";
  import DialogueBox from "../pet/DialogueBox.vue";
  import DragArea from "../pet/DragArea.vue";
  import GameRolesStage from "../pet/GameRolesStage.vue";
  import PetNotification from "../pet/PetNotification.vue";
  import {
    BASE_AVATAR_HEIGHT,
    BASE_AVATAR_WIDTH,
    CHAT_BASE_H,
    DIALOG_MAX_BASE,
  } from "../pet/constants";

  const { t } = useI18n();
  const router = useRouter();
  const gameStore = useGameStore();
  const settingsStore = useSettingsStore();
  const uiStore = useUIStore();

  const showChatInput = ref(false);
  const { isDragging, hasFile } = useFileDrop();

  const avatarContainer = ref<HTMLElement | null>(null);
  const chatContainer = ref<HTMLElement | null>(null);
  const gameDialogRef = ref<InstanceType<typeof DialogueBox> | null>(null);
  const ChatInputRef = ref<InstanceType<typeof ChatInput> | null>(null);
  const interactionAudio = ref<HTMLAudioElement | null>(null);
  const audioFinished = ref(true);
  const characterSpeaking = ref(false);
  const interactionText = ref("");
  const isDialogueActive = computed(
    () => gameStore.currentStatus === "responding" && gameStore.currentLine.trim() !== ""
  );
  const clickInteractionsEnabled = computed(
    () => settingsStore.pet?.clickInteractionEnabled !== false
  );
  const interactionVoiceEnabled = computed(
    () => settingsStore.pet?.interactionVoiceEnabled !== false
  );
  const idleActionsEnabled = computed(() => settingsStore.pet?.idleActionsEnabled !== false);
  const musicActionsEnabled = computed(() => settingsStore.pet?.musicActionsEnabled !== false);
  const preserveSpeakingPoseWhileDragging = computed(
    () => settingsStore.pet?.preserveSpeakingPoseWhileDragging !== false
  );
  const smoothTransitionsEnabled = computed(
    () => settingsStore.pet?.smoothTransitionsEnabled !== false
  );
  const subtleMotionEnabled = computed(() => settingsStore.pet?.subtleMotionEnabled !== false);
  const timeCompanionEnabled = computed(() => settingsStore.pet?.timeCompanionEnabled !== false);
  const actionDebugEnabled = computed(() => settingsStore.pet?.actionDebugEnabled === true);
  const actionFrequency = computed<PetActionFrequency>(
    () => settingsStore.pet?.actionFrequency ?? "normal"
  );
  const petActions = usePetActions({
    canPlayIdle: () =>
      idleActionsEnabled.value && gameStore.currentStatus === "input" && !characterSpeaking.value,
    canPlayTimeCompanion: () =>
      timeCompanionEnabled.value &&
      idleActionsEnabled.value &&
      gameStore.currentStatus === "input" &&
      !characterSpeaking.value,
    canResumeAction: (id) =>
      id !== "headphones" ||
      (Boolean(uiStore.currentBackgroundMusic) &&
        uiStore.currentBackgroundMusic !== "None" &&
        !uiStore.bgMusicPaused &&
        !uiStore.bgMusicStoped &&
        musicActionsEnabled.value),
    getIdleFrequency: () => actionFrequency.value,
  });

  const appStyleVars = computed(() => {
    const scale = settingsStore.pet?.scale || 1.0;
    const layout = calcWindowLayout(scale);
    return {
      "--pet-ui-scale": scale.toString(),
      "--app-width": `${layout.width}px`,
      "--app-height": `${layout.height}px`,
      "--avatar-width": `${Math.round(BASE_AVATAR_WIDTH * scale)}px`,
      "--avatar-height": `${Math.round(BASE_AVATAR_HEIGHT * scale)}px`,
      "--chat-h": `${Math.round(CHAT_BASE_H * scale)}px`,
      "--dialog-h": `${Math.round(DIALOG_MAX_BASE * scale)}px`,
    };
  });

  const calcWindowLayout = (scale: number): { width: number; height: number } => {
    const avatarWidth = Math.round(BASE_AVATAR_WIDTH * scale);
    const avatarHeight = Math.round(BASE_AVATAR_HEIGHT * scale);
    const chatH = Math.round(CHAT_BASE_H * scale);
    const dialogH = Math.round(DIALOG_MAX_BASE * scale);
    return { width: avatarWidth, height: avatarHeight + dialogH + chatH };
  };

  const applyWindowLayout = async () => {
    try {
      const scale = settingsStore.pet?.scale || 1.0;
      await invoke("set_pet_mode", { enable: true, scale });
    } catch (error) {
      console.error("调整窗口布局失败:", error);
    }
  };

  let hitTestInterval: number | undefined;
  let scaleUnlisten: (() => void) | null = null;
  let effectUnlisten: (() => void) | null = null;
  let volumeUnlisten: (() => void) | null = null;
  let dialogHistoryUnlisten: (() => void) | null = null;
  let behaviorSettingsUnlisten: (() => void) | null = null;
  let actionPreviewUnlisten: (() => void) | null = null;
  let actionAuditUnlisten: (() => void) | null = null;
  let musicActionTimer: number | null = null;
  let interactionTextTimer: number | null = null;
  let previousInteractionLine = "";
  let interactionVoiceRequest = 0;
  let interactionVoiceActive = false;
  let interactionVoiceUrl = "";
  let interactionVoiceRetryAfter = 0;
  let interactionVoiceReleaseTimer: number | null = null;
  let interactionVoiceWatchdogTimer: number | null = null;
  let interactionVoicePresentation: {
    actionId: PetActionId;
    actionRunId: number;
    lineText: string;
    requestId: number;
  } | null = null;
  const interactionVoiceMemoryCache = new Map<string, ArrayBuffer>();
  const interactionVoiceRequests = new Map<string, Promise<ArrayBuffer>>();

  const INTERACTION_VOICE_ID = "ling-v2";
  const INTERACTION_VOICE_LENGTH_SCALE = 1.1;
  const INTERACTION_VOICE_SDP_RATIO = 0.2;

  const toAudioBuffer = (bytes: Uint8Array | ArrayBuffer | number[]): ArrayBuffer => {
    if (bytes instanceof ArrayBuffer) return bytes;
    if (ArrayBuffer.isView(bytes)) {
      return bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength
      ) as ArrayBuffer;
    }
    return new Uint8Array(bytes).buffer;
  };

  const getInteractionVoiceCacheKey = (voiceText: string) =>
    [
      "v1",
      INTERACTION_VOICE_ID,
      "speaker-0",
      "style-0",
      INTERACTION_VOICE_LENGTH_SCALE,
      INTERACTION_VOICE_SDP_RATIO,
      voiceText,
    ].join(":");

  const getInteractionVoiceAudio = async (voiceText: string): Promise<ArrayBuffer> => {
    const key = getInteractionVoiceCacheKey(voiceText);
    const memoryCached = interactionVoiceMemoryCache.get(key);
    if (memoryCached) return memoryCached;

    const pending = interactionVoiceRequests.get(key);
    if (pending) return pending;

    const request = (async () => {
      const persisted = await readCachedInteractionVoice(key);
      if (persisted) {
        interactionVoiceMemoryCache.set(key, persisted);
        return persisted;
      }

      const bytes = await TtsLocal.synthesizePreview({
        text: voiceText,
        voiceId: INTERACTION_VOICE_ID,
        lengthScale: INTERACTION_VOICE_LENGTH_SCALE,
        sdpRatio: INTERACTION_VOICE_SDP_RATIO,
      });
      const audio = toAudioBuffer(bytes as Uint8Array | ArrayBuffer | number[]);
      interactionVoiceMemoryCache.set(key, audio);
      void writeCachedInteractionVoice(key, audio);
      return audio;
    })();

    interactionVoiceRequests.set(key, request);
    try {
      return await request;
    } finally {
      interactionVoiceRequests.delete(key);
    }
  };

  const releaseInteractionVoiceUrl = () => {
    if (!interactionVoiceUrl) return;
    URL.revokeObjectURL(interactionVoiceUrl);
    interactionVoiceUrl = "";
  };

  const clearInteractionTextTimer = () => {
    if (interactionTextTimer !== null) {
      window.clearTimeout(interactionTextTimer);
      interactionTextTimer = null;
    }
  };

  const scheduleInteractionTextClear = (delayMs: number) => {
    clearInteractionTextTimer();
    interactionTextTimer = window.setTimeout(clearInteractionText, delayMs);
  };

  const clearInteractionVoiceTimers = () => {
    if (interactionVoiceReleaseTimer !== null) {
      window.clearTimeout(interactionVoiceReleaseTimer);
      interactionVoiceReleaseTimer = null;
    }
    if (interactionVoiceWatchdogTimer !== null) {
      window.clearTimeout(interactionVoiceWatchdogTimer);
      interactionVoiceWatchdogTimer = null;
    }
  };

  const releaseInteractionPresentation = (mode: "finish" | "resume") => {
    const presentation = interactionVoicePresentation;
    interactionVoicePresentation = null;
    clearInteractionVoiceTimers();
    if (!presentation) return;

    if (mode === "finish") {
      petActions.finishActionRun(presentation.actionId, presentation.actionRunId);
      if (interactionText.value === presentation.lineText) clearInteractionText();
      return;
    }

    const remainingMs = Math.max(0, petActions.actionEndsAt.value - Date.now());
    petActions.resumeHeldAction(presentation.actionId, presentation.actionRunId);
    if (interactionText.value === presentation.lineText) {
      scheduleInteractionTextClear(Math.max(300, remainingMs));
    }
  };

  const stopInteractionVoice = (presentationMode: "finish" | "resume" = "resume") => {
    interactionVoiceRequest += 1;
    const wasActive = interactionVoiceActive;
    interactionVoiceActive = false;

    if (interactionAudio.value) {
      interactionAudio.value.pause();
      interactionAudio.value.removeAttribute("src");
      interactionAudio.value.load();
    }
    releaseInteractionVoiceUrl();
    releaseInteractionPresentation(presentationMode);

    // 正式 AI 语音可能已经接管全局 ASR 锁，此时不能把它误解锁。
    if (wasActive && !characterSpeaking.value) setVoicePlaying(false);
  };

  const handleInteractionVoiceEnded = () => {
    if (!interactionVoiceActive) return;
    interactionVoiceActive = false;
    interactionAudio.value?.removeAttribute("src");
    interactionAudio.value?.load();
    releaseInteractionVoiceUrl();
    if (!characterSpeaking.value) setVoicePlaying(false);

    if (interactionVoiceWatchdogTimer !== null) {
      window.clearTimeout(interactionVoiceWatchdogTimer);
      interactionVoiceWatchdogTimer = null;
    }
    interactionVoiceReleaseTimer = window.setTimeout(() => {
      interactionVoiceReleaseTimer = null;
      releaseInteractionPresentation("finish");
    }, 200);
  };

  const handleInteractionVoiceError = () => {
    if (!interactionVoiceActive) return;
    interactionVoiceRetryAfter = Date.now() + 30_000;
    stopInteractionVoice();
    console.warn("桌宠互动语音播放失败，已保留动作与字幕");
  };

  const playInteractionVoice = async (
    line: PetInteractionLine,
    actionId: PetActionId,
    actionRunId: number
  ) => {
    stopInteractionVoice();
    if (
      !interactionVoiceEnabled.value ||
      isDialogueActive.value ||
      characterSpeaking.value ||
      Date.now() < interactionVoiceRetryAfter
    ) {
      return;
    }

    const requestId = interactionVoiceRequest;
    if (!petActions.holdAction(actionId, actionRunId)) return;
    clearInteractionTextTimer();
    interactionVoicePresentation = { actionId, actionRunId, lineText: line.text, requestId };
    interactionVoiceWatchdogTimer = window.setTimeout(() => {
      if (interactionVoicePresentation?.requestId !== requestId) return;
      console.warn("桌宠互动语音等待超时，已恢复默认动作时长");
      stopInteractionVoice("resume");
    }, 30_000);

    try {
      const audio = await getInteractionVoiceAudio(line.voiceText);
      if (
        requestId !== interactionVoiceRequest ||
        !interactionVoiceEnabled.value ||
        isDialogueActive.value ||
        characterSpeaking.value ||
        interactionText.value !== line.text ||
        !interactionAudio.value
      ) {
        if (requestId === interactionVoiceRequest) releaseInteractionPresentation("resume");
        return;
      }

      interactionVoiceUrl = URL.createObjectURL(new Blob([audio], { type: "audio/wav" }));
      interactionAudio.value.src = interactionVoiceUrl;
      interactionAudio.value.volume = uiStore.characterVolume / 100;
      interactionAudio.value.load();
      interactionVoiceActive = true;
      setVoicePlaying(true);
      await interactionAudio.value.play();
    } catch (error) {
      if (requestId !== interactionVoiceRequest) return;
      interactionVoiceRetryAfter = Date.now() + 30_000;
      stopInteractionVoice();
      console.warn("桌宠互动语音暂时不可用，已保留动作与字幕:", error);
    }
  };

  const clearInteractionText = () => {
    clearInteractionTextTimer();
    interactionText.value = "";
  };

  const showInteractionLine = (actionId: PetActionId) => {
    if (isDialogueActive.value || characterSpeaking.value) return;
    const line = pickPetActionLine(actionId, previousInteractionLine);
    if (!line) return;

    clearInteractionText();
    previousInteractionLine = line.text;
    interactionText.value = line.text;
    const actionDuration = PET_ACTIONS[actionId].durationMs || 2800;
    const displayDuration = Math.max(2200, Math.min(actionDuration, 4200));
    scheduleInteractionTextClear(displayDuration);
    void playInteractionVoice(line, actionId, petActions.actionRunId.value);
  };

  const playInteractiveAction = (actionId: PetActionId, force = false): boolean => {
    const played = petActions.playAction(actionId, force);
    if (played) showInteractionLine(actionId);
    return played;
  };

  const playRandomInteractiveAction = (candidates: PetActionId[], force = false): boolean => {
    const played = petActions.playRandomAction(candidates, force);
    const actionId = petActions.currentActionId.value;
    if (played && actionId) showInteractionLine(actionId);
    return played;
  };

  const isBackgroundMusicPlaying = computed(
    () =>
      Boolean(uiStore.currentBackgroundMusic) &&
      uiStore.currentBackgroundMusic !== "None" &&
      !uiStore.bgMusicPaused &&
      !uiStore.bgMusicStoped
  );
  const canShowMusicAction = computed(
    () => isBackgroundMusicPlaying.value && musicActionsEnabled.value
  );

  const clearMusicActionTimer = () => {
    if (musicActionTimer !== null) {
      window.clearTimeout(musicActionTimer);
      musicActionTimer = null;
    }
  };

  const getMusicRepeatDelay = () => {
    if (actionFrequency.value === "low") return 75_000 + Math.random() * 45_000;
    if (actionFrequency.value === "high") return 25_000 + Math.random() * 20_000;
    return 45_000 + Math.random() * 30_000;
  };

  const scheduleHeadphonesAction = (delayMs = 1800) => {
    clearMusicActionTimer();
    if (!canShowMusicAction.value) return;

    musicActionTimer = window.setTimeout(() => {
      musicActionTimer = null;
      if (!canShowMusicAction.value) return;

      const canListenNow =
        !characterSpeaking.value &&
        gameStore.currentStatus === "input" &&
        petActions.currentActionId.value === null;
      if (!canListenNow) {
        scheduleHeadphonesAction(2500);
        return;
      }

      petActions.playAction("headphones");
    }, delayMs);
  };

  onMounted(async () => {
    const appWindow = getCurrentWindow();

    scaleUnlisten = await appWindow.listen<{ scale: number }>("pet-scale-changed", (event) => {
      const scale = Number(event.payload?.scale);
      if (!Number.isNaN(scale)) {
        settingsStore.pet.scale = scale;
        void applyWindowLayout();
      }
    });

    effectUnlisten = await appWindow.listen<{ effect: string }>(
      "background-effect-changed",
      (event) => {
        const effect = event.payload?.effect;
        if (effect) {
          uiStore.setBackgroundEffect(effect);
        }
      }
    );

    volumeUnlisten = await appWindow.listen<{ volume: number }>("pet-volume-changed", (event) => {
      const volume = Number(event.payload?.volume);
      if (!Number.isNaN(volume)) {
        settingsStore.updateAudio({ characterVolume: volume });
      }
    });

    behaviorSettingsUnlisten = await appWindow.listen<Partial<typeof settingsStore.pet>>(
      "pet-behavior-settings-changed",
      (event) => {
        settingsStore.pet = { ...settingsStore.pet, ...event.payload };
        petActions.refreshIdleSchedule();
      }
    );

    actionPreviewUnlisten = await appWindow.listen<PetActionPreviewPayload>(
      PET_ACTION_PREVIEW_EVENT,
      (event) => {
        const actionId = event.payload?.actionId;
        if (!isPetActionId(actionId)) return;
        petActions.noteInteraction();
        if (characterSpeaking.value) {
          petActions.reportBlockedAction("speaking-pose-priority", actionId);
          return;
        }
        playInteractiveAction(actionId, true);
      }
    );

    actionAuditUnlisten = await appWindow.listen<PetActionAuditRequest>(
      PET_ACTION_AUDIT_REQUEST_EVENT,
      async (event) => {
        const requestId = event.payload?.requestId;
        if (!requestId) return;
        const role = gameStore.presentRolesList[0];
        if (!role) {
          const result: PetActionAuditResult = {
            requestId,
            characterName: "",
            characterFolder: "",
            baseAvatarAvailable: false,
            checks: [],
            error: "no-active-role",
          };
          await appWindow.emit(PET_ACTION_AUDIT_RESULT_EVENT, result);
          return;
        }

        let baseAvatarAvailable = false;
        try {
          await invoke<string>("get_avatar_file", {
            characterFolder: role.character_folder,
            emotion: "正常",
            clothesName: "default",
          });
          baseAvatarAvailable = true;
        } catch {
          baseAvatarAvailable = false;
        }

        const checks = await Promise.all(
          PET_ACTION_IDS.map(async (actionId): Promise<PetActionAssetCheck> => {
            const file = PET_ACTIONS[actionId].file;
            try {
              const path = await invoke<string>("get_pet_action_file", {
                characterFolder: role.character_folder,
                actionFile: file,
              });
              const usedFallback =
                role.character_folder !== SLEEPY_MITA_BUNDLED_FOLDER &&
                path.includes(SLEEPY_MITA_BUNDLED_FOLDER);
              return {
                actionId,
                file,
                available: true,
                source: usedFallback ? "bundled-fallback" : "active-role",
              };
            } catch (error) {
              return {
                actionId,
                file,
                available: false,
                source: "missing",
                error: String(error),
              };
            }
          })
        );

        const result: PetActionAuditResult = {
          requestId,
          characterName: role.roleName,
          characterFolder: role.character_folder,
          baseAvatarAvailable,
          checks,
        };
        await appWindow.emit(PET_ACTION_AUDIT_RESULT_EVENT, result);
      }
    );

    // 响应设置窗口的初始历史数据请求
    dialogHistoryUnlisten = await appWindow.listen("request-dialog-history", () => {
      appWindow.emit("dialog-history-changed", {
        dialogHistory: JSON.parse(JSON.stringify(gameStore.dialogHistory)),
      });
    });

    // 设置透明背景的 body 属性样式（额外防护）
    document.body.style.backgroundColor = "transparent";
    document.documentElement.style.backgroundColor = "transparent";

    // 1. 初始化窗口为桌宠尺寸
    await applyWindowLayout();

    // 2. 启动 100ms 一次的 solid bounds 测试
    hitTestInterval = window.setInterval(() => {
      const rects = [];

      // 如果对话气泡正在显示，则加入 solid region（用气泡元素精确 rect，避免包住整个对话框）
      if (
        gameDialogRef.value?.bubbleRef &&
        gameStore.currentStatus === "responding" &&
        gameStore.currentLine.trim() !== ""
      ) {
        const r = gameDialogRef.value.bubbleRef.getBoundingClientRect();
        if (r.height > 0) {
          rects.push({ x: r.x, y: r.y, width: r.width, height: r.height });
        }
      }

      // 头像圆环常驻 solid region 触发拖拽和交互
      if (avatarContainer.value) {
        const r = avatarContainer.value.getBoundingClientRect();
        rects.push({ x: r.x, y: r.y, width: r.width, height: r.height });
      }

      // 输入框显示时，加入 solid region
      if (chatContainer.value && showChatInput.value) {
        const r = chatContainer.value.getBoundingClientRect();
        // 输入框稍微拓宽，保证极小尺寸下的鼠标判定连贯性
        rects.push({
          x: r.x - 20,
          y: r.y - 20,
          width: r.width + 40,
          height: r.height + 40,
        });
      }

      invoke("update_solid_regions", { rects }).catch(console.error);
    }, 100);
  });

  watch(
    () => settingsStore.pet?.scale,
    () => {
      void applyWindowLayout();
    }
  );

  // 日程、待办等应用内提醒出现时，让角色主动敲屏幕；久坐提醒有自己的递咖啡动作。
  watch(
    () => uiStore.notification.isVisible,
    (visible, wasVisible) => {
      if (visible && !wasVisible) petActions.playAction("knock");
    }
  );

  // “戴耳机听歌”只跟随真实的背景音乐状态，不再作为无音乐时的随机空闲动作。
  watch(
    canShowMusicAction,
    (playing) => {
      if (playing) {
        scheduleHeadphonesAction();
      } else {
        clearMusicActionTimer();
        if (petActions.currentActionId.value === "headphones") {
          petActions.finishAction("headphones", false);
        }
      }
    },
    { immediate: true }
  );

  // 一轮听歌动作结束或被互动打断后，音乐仍在播放则稍后再次出现。
  watch(
    () => petActions.currentActionId.value,
    (actionId) => {
      if (actionId === null && canShowMusicAction.value && musicActionTimer === null) {
        scheduleHeadphonesAction(getMusicRepeatDelay());
      }
    }
  );

  // AI 思考期间使用“托下巴思考”，进入正式说话后由角色对话情绪接管。
  watch(
    () => gameStore.currentStatus,
    (status, previousStatus) => {
      if (status === "thinking" && !characterSpeaking.value) {
        petActions.playAction("thinking");
      } else if (previousStatus === "thinking" && petActions.currentActionId.value === "thinking") {
        petActions.finishAction("thinking");
      }
    }
  );

  // 正式 AI 对话永远优先于本地互动台词，避免两个气泡相互遮挡。
  watch(isDialogueActive, (active) => {
    if (active) {
      clearInteractionText();
      stopInteractionVoice("finish");
    }
  });

  watch(interactionVoiceEnabled, (enabled) => {
    if (!enabled) stopInteractionVoice();
  });

  watch(
    () => uiStore.characterVolume,
    (volume) => {
      if (interactionAudio.value) interactionAudio.value.volume = volume / 100;
    }
  );

  // 监听 dialogHistory 变化，推送给设置窗口
  watch(
    () => gameStore.dialogHistory.length,
    () => {
      const appWindow = getCurrentWindow();
      appWindow.emit("dialog-history-changed", {
        dialogHistory: JSON.parse(JSON.stringify(gameStore.dialogHistory)),
      });
    }
  );

  onUnmounted(() => {
    // 恢复默认背景色
    document.body.style.backgroundColor = "";
    document.documentElement.style.backgroundColor = "";

    if (scaleUnlisten) scaleUnlisten();
    if (effectUnlisten) effectUnlisten();
    if (volumeUnlisten) volumeUnlisten();
    if (dialogHistoryUnlisten) dialogHistoryUnlisten();
    if (behaviorSettingsUnlisten) behaviorSettingsUnlisten();
    if (actionPreviewUnlisten) actionPreviewUnlisten();
    if (actionAuditUnlisten) actionAuditUnlisten();
    clearMusicActionTimer();
    clearInteractionText();
    stopInteractionVoice("finish");

    if (hitTestInterval !== undefined) {
      window.clearInterval(hitTestInterval);
    }
    if (avatarClickTimer !== null) {
      window.clearTimeout(avatarClickTimer);
      avatarClickTimer = null;
    }
  });

  const handleMessageSent = (message: string) => {
    gameStore.appendGameMessage({
      type: "message",
      displayName: gameStore.userName,
      content: message,
    });
  };

  const handleMouseEnter = () => {
    showChatInput.value = true;
  };

  const handleMouseLeave = () => {
    if (ChatInputRef.value?.isTyping()) {
      showChatInput.value = true;
      return;
    } else {
      showChatInput.value = false;
    }
  };

  let avatarClickTimer: number | null = null;
  let dragVisualActionActive = false;
  let consecutiveClickCount = 0;
  let lastSingleClickAt = 0;
  let lastSingleClickZone: PetHitZone | null = null;
  let consecutiveHairClickCount = 0;
  let lastHairClickAt = 0;
  const lastHitZone = ref<PetHitZone | null>(null);
  const debugClickCount = ref(0);

  const REPEATED_CLICK_WINDOW_MS = 3_500;
  const HAIR_CLICK_WINDOW_MS = 10_000;

  watch([idleActionsEnabled, actionFrequency, timeCompanionEnabled], () => {
    petActions.refreshIdleSchedule();
    petActions.refreshTimeCompanionSchedule();
    if (canShowMusicAction.value && musicActionTimer !== null) {
      scheduleHeadphonesAction(getMusicRepeatDelay());
    }
  });

  watch(clickInteractionsEnabled, (enabled) => {
    if (!enabled) {
      consecutiveClickCount = 0;
      lastSingleClickAt = 0;
      lastSingleClickZone = null;
      consecutiveHairClickCount = 0;
      lastHairClickAt = 0;
      debugClickCount.value = 0;
    }
  });

  const handleAvatarClick = (zone: PetHitZone) => {
    lastHitZone.value = zone;
    petActions.noteInteraction();
    if (avatarClickTimer !== null) window.clearTimeout(avatarClickTimer);
    // 等待双击判定，避免一次双击连续触发两次“鼓脸抗议”。
    avatarClickTimer = window.setTimeout(() => {
      avatarClickTimer = null;
      if (clickInteractionsEnabled.value && characterSpeaking.value) {
        petActions.reportBlockedAction("speaking-pose-priority");
      } else if (clickInteractionsEnabled.value) {
        const now = Date.now();
        consecutiveClickCount =
          lastSingleClickZone === zone && now - lastSingleClickAt <= REPEATED_CLICK_WINDOW_MS
            ? consecutiveClickCount + 1
            : 1;
        lastSingleClickAt = now;
        lastSingleClickZone = zone;
        debugClickCount.value = consecutiveClickCount;

        if (zone === "hair") {
          consecutiveHairClickCount =
            now - lastHairClickAt <= HAIR_CLICK_WINDOW_MS ? consecutiveHairClickCount + 1 : 1;
          lastHairClickAt = now;
          const progressionIndex = Math.min(
            consecutiveHairClickCount - 1,
            HAIR_CLICK_PROGRESSION.length - 1
          );
          playInteractiveAction(HAIR_CLICK_PROGRESSION[progressionIndex], true);
        } else {
          consecutiveHairClickCount = 0;
          lastHairClickAt = 0;
          const candidates =
            consecutiveClickCount >= 3
              ? RAPID_CLICK_REACTIONS_BY_ZONE[zone]
              : consecutiveClickCount === 2
                ? REPEATED_CLICK_REACTIONS_BY_ZONE[zone]
                : CLICK_REACTIONS_BY_ZONE[zone];
          playRandomInteractiveAction(candidates, consecutiveClickCount >= 2);
        }
      }
    }, 260);
  };

  const handleAvatarDoubleClick = (zone: PetHitZone) => {
    lastHitZone.value = zone;
    if (avatarClickTimer !== null) {
      window.clearTimeout(avatarClickTimer);
      avatarClickTimer = null;
    }
    petActions.noteInteraction();
    if (clickInteractionsEnabled.value && characterSpeaking.value) {
      petActions.reportBlockedAction("speaking-pose-priority");
    } else if (clickInteractionsEnabled.value) {
      playRandomInteractiveAction(DOUBLE_CLICK_REACTIONS, true);
    }
  };

  const handleAvatarDragStart = () => {
    if (avatarClickTimer !== null) {
      window.clearTimeout(avatarClickTimer);
      avatarClickTimer = null;
    }
    petActions.noteInteraction();

    // 角色正在说话时只移动窗口，不替换当前对话情绪立绘，也不触碰音频播放器。
    if (characterSpeaking.value && preserveSpeakingPoseWhileDragging.value) {
      dragVisualActionActive = false;
      return;
    }

    dragVisualActionActive = playInteractiveAction("dragPanic", true);
  };

  const handleAvatarDragEnd = () => {
    if (dragVisualActionActive) {
      petActions.finishAction("dragPanic");
      dragVisualActionActive = false;
    }
    petActions.noteInteraction();

    if (
      gameStore.currentStatus === "thinking" &&
      !characterSpeaking.value &&
      petActions.currentActionId.value === null
    ) {
      petActions.playAction("thinking");
    }
  };

  const handleActionUnavailable = (file: string) => {
    if (petActions.currentAction.value?.file === file) {
      petActions.finishAction();
    }
  };

  const handleOpenSettings = async () => {
    try {
      const existing = await WebviewWindow.getByLabel("settings");
      if (existing) {
        await existing.setFocus();
        return;
      }

      const webview = new WebviewWindow("settings", {
        url: "/second",
        title: t("views.petMode.settingsWindowTitle"),
        width: 1200,
        height: 800,
        resizable: true,
        shadow: false,
        decorations: false,
        transparent: true,
        alwaysOnTop: false,
      });

      webview.once("tauri://created", () => {
        console.log("桌宠轻量设置窗口创建成功");
      });

      webview.once("tauri://error", (e) => {
        console.error("创建桌宠轻量设置窗口失败:", e);
      });
    } catch (error) {
      console.error("打开设置窗口时出错:", error);
    }
  };

  // 自动打字/对话逻辑
  let timerId: any = null;
  const isContinueTriggered = ref(false);

  const resetInteraction = () => {
    isContinueTriggered.value = false;
    audioFinished.value = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const tryAutoAdvance = () => {
    if (!uiStore.autoMode) return;
    if (isContinueTriggered.value) return;
    if (gameStore.currentStatus !== "responding") return;

    const typing = gameDialogRef.value?.isTyping ?? false;
    if (typing || !audioFinished.value) return;

    if (timerId) clearTimeout(timerId);
    timerId = setTimeout(() => {
      if (gameDialogRef.value) {
        const needWait = gameDialogRef.value.continueDialog(false);
        if (needWait) {
          tryAutoAdvance();
        }
      }
    }, settingsStore.autoAdvanceDelay);
  };

  const handleAudioStarted = () => {
    audioFinished.value = false;
    characterSpeaking.value = true;
    stopInteractionVoice("finish");

    // 正式说话时让对话情绪立绘接管。即使此刻仍在拖动，也保持该立绘到松手。
    if (petActions.currentActionId.value !== null) {
      petActions.finishAction(undefined, false);
    }
    dragVisualActionActive = false;
  };

  const handleAudioFinished = () => {
    audioFinished.value = true;
    characterSpeaking.value = false;
    tryAutoAdvance();
  };

  watch(
    () => gameDialogRef.value?.isTyping,
    (typing) => {
      if (typing === false) {
        tryAutoAdvance();
      }
    }
  );

  const manualTriggerContinue = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    if (!isContinueTriggered.value) {
      isContinueTriggered.value = true;
    }
  };

  const handleSwitchAutoMode = () => {
    uiStore.autoMode = !uiStore.autoMode;
  };

  const handleExitPetMode = async () => {
    // 关闭设置窗口（如果打开的话）
    try {
      const settingsWindow = await WebviewWindow.getByLabel("settings");
      if (settingsWindow) {
        await settingsWindow.close();
      }
    } catch {
      // 窗口不存在，忽略
    }

    // 退出时清除 solid region，防止残留
    await invoke("update_solid_regions", { rects: [] });
    // 1. 关闭桌宠窗口特性，恢复 1500x800 的正常主窗口
    await invoke("set_pet_mode", { enable: false });
    // 2. 路由导航回聊天主页面
    router.push("/chat");
  };
</script>

<style scoped>
  #pet-app {
    position: relative;
    width: 100vw;
    height: 100dvh;
    overflow: hidden;
  }

  .pet-interaction-bubble-enter-active,
  .pet-interaction-bubble-leave-active {
    transition:
      opacity 0.18s ease,
      transform 0.18s ease;
  }

  .pet-interaction-bubble-enter-from,
  .pet-interaction-bubble-leave-to {
    opacity: 0;
    transform: translateY(6px) scale(0.98);
  }
</style>
