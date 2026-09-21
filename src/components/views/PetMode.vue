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
        class="flex shrink-0 items-center justify-center bg-transparent transition-all duration-100"
        :style="{ width: 'var(--avatar-width)', height: 'var(--avatar-height)' }"
      >
        <GameRolesStage
          :action-file="petActions.actionFile.value"
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
  </div>
</template>

<script setup lang="ts">
  import { eventQueue } from "@/core/events/event-queue";
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
  import { CLICK_REACTIONS, DOUBLE_CLICK_REACTIONS } from "@/components/pet/pet-actions";

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
  const audioFinished = ref(true);
  const characterSpeaking = ref(false);
  const petActions = usePetActions(
    () => gameStore.currentStatus === "input" && !characterSpeaking.value
  );

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
  let musicActionTimer: number | null = null;

  const isBackgroundMusicPlaying = computed(
    () =>
      Boolean(uiStore.currentBackgroundMusic) &&
      uiStore.currentBackgroundMusic !== "None" &&
      !uiStore.bgMusicPaused &&
      !uiStore.bgMusicStoped
  );

  const clearMusicActionTimer = () => {
    if (musicActionTimer !== null) {
      window.clearTimeout(musicActionTimer);
      musicActionTimer = null;
    }
  };

  const scheduleHeadphonesAction = (delayMs = 1800) => {
    clearMusicActionTimer();
    if (!isBackgroundMusicPlaying.value) return;

    musicActionTimer = window.setTimeout(() => {
      musicActionTimer = null;
      if (!isBackgroundMusicPlaying.value) return;

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
    isBackgroundMusicPlaying,
    (playing) => {
      if (playing) {
        scheduleHeadphonesAction();
      } else {
        clearMusicActionTimer();
        if (petActions.currentActionId.value === "headphones") {
          petActions.finishAction("headphones");
        }
      }
    },
    { immediate: true }
  );

  // 一轮听歌动作结束或被互动打断后，音乐仍在播放则稍后再次出现。
  watch(
    () => petActions.currentActionId.value,
    (actionId) => {
      if (actionId === null && isBackgroundMusicPlaying.value && musicActionTimer === null) {
        scheduleHeadphonesAction(45_000 + Math.random() * 30_000);
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
    clearMusicActionTimer();

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

  const advanceDialogue = () => {
    manualTriggerContinue();
    eventQueue.continue();
    resetInteraction();
  };

  const handleAvatarClick = () => {
    petActions.noteInteraction();
    if (avatarClickTimer !== null) window.clearTimeout(avatarClickTimer);
    // 等待双击判定，避免一次双击连续触发两次“鼓脸抗议”。
    avatarClickTimer = window.setTimeout(() => {
      avatarClickTimer = null;
      petActions.playRandomAction(CLICK_REACTIONS);
      advanceDialogue();
    }, 260);
  };

  const handleAvatarDoubleClick = () => {
    if (avatarClickTimer !== null) {
      window.clearTimeout(avatarClickTimer);
      avatarClickTimer = null;
    }
    petActions.noteInteraction();
    petActions.playRandomAction(DOUBLE_CLICK_REACTIONS, true);
  };

  const handleAvatarDragStart = () => {
    if (avatarClickTimer !== null) {
      window.clearTimeout(avatarClickTimer);
      avatarClickTimer = null;
    }
    petActions.noteInteraction();

    // 角色正在说话时只移动窗口，不替换当前对话情绪立绘，也不触碰音频播放器。
    if (characterSpeaking.value) {
      dragVisualActionActive = false;
      return;
    }

    dragVisualActionActive = petActions.playAction("dragPanic", true);
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

    // 正式说话时让对话情绪立绘接管。即使此刻仍在拖动，也保持该立绘到松手。
    if (petActions.currentActionId.value !== null) {
      petActions.finishAction();
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
</style>
