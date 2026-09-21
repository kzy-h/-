<template>
  <div
    class="group relative flex h-full w-full items-center justify-center"
    @click="handleAvatarClick"
    @dblclick="handleAvatarDoubleClick"
  >
    <!-- 缩放与尺寸控制层 (无位移) -->
    <div class="relative h-full w-full">
      <!-- 1. 右上角信息铭牌 -->
      <div
        class="pointer-events-none absolute top-1 -right-4 z-50 flex translate-x-4 flex-col
          items-start opacity-0 transition-all duration-400 ease-out group-hover:translate-x-0
          group-hover:opacity-100"
      >
        <div
          class="rounded-tl-md rounded-br-md bg-cyan-500 px-2 py-0.5 text-[10px] font-black
            tracking-wider text-white italic shadow-sm"
        >
          {{ role.roleName }}
        </div>
        <div
          class="pl-1 text-xs font-bold tracking-widest text-cyan-700 uppercase drop-shadow-sm
            dark:text-cyan-300"
        >
          {{ role.roleSubTitle }}
        </div>
      </div>

      <!-- 5. 全身透明立绘。桌宠模式不再使用圆形头像框与 object-cover 裁切。 -->
      <!--
        data-tauri-drag-region="false" 是刻意的：Tauri 注入的 drag.js 对「裸属性」要求
        事件目标就是标注元素本身（el === composedPath[0]），而下面的头像图片容器铺满整个框，
        事件目标永远是子元素，官方路径其实从未触发过；"false" 让 drag.js 显式跳过，避免它与
        下面的 startWindowDrag 形成双路径。这里同时把 CSS app-region 设为 no-drag，
        Windows 才能稳定收到 click / dblclick，再由阈值逻辑区分点击和拖动。
      -->
      <div
        class="relative z-10 flex h-full w-full cursor-grab items-end justify-center
          overflow-visible bg-transparent active:cursor-grabbing"
        data-tauri-drag-region="false"
        @mousedown="startWindowDrag"
        @dragstart.prevent
      >
        <!-- 立绘容器 -->
        <div
          :class="['z-10 h-full w-full overflow-visible', containerClasses]"
          @animationend="handleAnimationEnd"
        >
          <div class="pet-pose h-full w-full origin-bottom" :style="avatarStyles">
            <div
              v-if="live2dFailed && !targetAvatarUrl"
              class="flex h-full w-full items-center justify-center text-xs text-white/60"
            >
              {{ $t("game.avatar.live2dUnavailable") }}
            </div>
            <ImageCrossFade
              v-show="!live2dActive"
              ref="imageFadeRef"
              class="pet-float h-full w-full drop-shadow-[0_12px_10px_rgba(0,0,0,0.28)]"
              :src="targetAvatarUrl"
              position="center bottom"
              object-fit="contain"
            />
          </div>
        </div>

        <audio ref="bubbleAudio"></audio>
      </div>

      <!-- 6. 气泡表情 -->
      <div
        :class="[
          `pointer-events-none absolute top-[-2%] left-[-2%] z-73 h-full w-full origin-bottom-left
          bg-contain bg-no-repeat transition-all duration-300`,
          bubbleClasses,
        ]"
        :style="bubbleStyles"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, nextTick, onUnmounted, toRefs } from "vue";
  import { invoke } from "@tauri-apps/api/core";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import ImageCrossFade from "@/components/ui/ImageAcrossFade.vue";
  import type { GameRole } from "@/stores/modules/game/state";
  import { useGameStore } from "@/stores/modules/game";
  import { EMOTION_CONFIG, EMOTION_CONFIG_EMO } from "@/controllers/emotion/config";
  import { useUIStore } from "@/stores/modules/ui/ui";
  import "./avatar-animation.css";
  import { toAvatarUrl } from "@/utils/avatarUrl";

  const props = defineProps<{
    role: GameRole;
    live2dActive?: boolean;
    live2dFailed?: boolean;
    actionFile?: string;
  }>();
  const { role } = toRefs(props);

  const emit = defineEmits<{
    "avatar-click": [];
    "avatar-double-click": [];
    "drag-start": [];
    "drag-end": [];
    "action-unavailable": [file: string];
  }>();
  const bubbleAudio = ref<HTMLAudioElement | null>(null);
  const imageFadeRef = ref<InstanceType<typeof ImageCrossFade> | null>(null);
  const uiStore = useUIStore();
  const gameStore = useGameStore();

  // ─── 窗口拖曳 ────────────────────────────────────────────────
  // macOS 的 WKWebView 不支持 -webkit-app-region: drag，桌宠窗口因此完全拖不动。
  // 这里手动接管：按下后位移超过阈值才进入原生窗口拖曳，未超过则保持为普通点击
  // （头像的 click 仍会派发，"点击头像推进对话"不受影响）。
  const DRAG_THRESHOLD_PX = 4;
  const DRAG_BUTTON_POLL_MS = 45;
  const DRAG_SAFETY_TIMEOUT_MS = 30_000;

  let suppressClickUntil = 0;
  let dragActive = false;
  let dragReleasePollId: number | null = null;
  let dragSafetyTimeoutId: number | null = null;

  const clearDragTracking = () => {
    if (dragReleasePollId !== null) {
      window.clearTimeout(dragReleasePollId);
      dragReleasePollId = null;
    }
    if (dragSafetyTimeoutId !== null) {
      window.clearTimeout(dragSafetyTimeoutId);
      dragSafetyTimeoutId = null;
    }
  };

  const finishWindowDrag = () => {
    if (!dragActive) return;
    dragActive = false;
    clearDragTracking();
    suppressClickUntil = Date.now() + 300;
    emit("drag-end");
  };

  const pollPrimaryMouseButton = async () => {
    if (!dragActive) return;
    try {
      const isDown = await invoke<boolean | null>("primary_mouse_button_down");
      if (isDown === false) {
        finishWindowDrag();
        return;
      }
      // null 表示当前平台不提供系统级按键状态，改由 startDragging Promise 收尾。
      if (isDown === null) return;
    } catch (error) {
      console.warn("读取鼠标按键状态失败，将使用原生拖动完成时机", error);
      return;
    }

    dragReleasePollId = window.setTimeout(pollPrimaryMouseButton, DRAG_BUTTON_POLL_MS);
  };

  const startWindowDrag = (e: MouseEvent) => {
    if (e.button !== 0) return;

    // 抑制文本选中与 <img> 的原生拖曳：原生 image drag 一旦启动，mousemove 就断流，
    // 阈值永远达不到，拖曳会在整个头像区域间歇性失效。preventDefault 不影响后续 click 派发。
    e.preventDefault();

    const startX = e.screenX;
    const startY = e.screenY;

    const cleanup = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", cleanup);
    };

    const onMove = async (moveEvent: MouseEvent) => {
      if (
        Math.abs(moveEvent.screenX - startX) < DRAG_THRESHOLD_PX &&
        Math.abs(moveEvent.screenY - startY) < DRAG_THRESHOLD_PX
      ) {
        return;
      }
      // 交给系统接管后 webview 收不到后续鼠标事件，先摘监听器再启动拖曳
      cleanup();
      suppressClickUntil = Date.now() + 300;
      dragActive = true;
      emit("drag-start");
      void pollPrimaryMouseButton();
      dragSafetyTimeoutId = window.setTimeout(finishWindowDrag, DRAG_SAFETY_TIMEOUT_MS);
      try {
        await getCurrentWindow().startDragging();
        // 有的平台在鼠标松开后才 resolve；Windows 若立即 resolve，则由上面的
        // 系统按键轮询继续守住动作，直到真正检测到松手。
        const isDown = await invoke<boolean | null>("primary_mouse_button_down").catch(() => null);
        if (isDown !== true) finishWindowDrag();
      } catch (error) {
        console.error("启动窗口拖动失败", error);
        finishWindowDrag();
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", cleanup);
  };

  onUnmounted(() => {
    dragActive = false;
    clearDragTracking();
  });

  const activeAnimationClass = ref("normal");
  const isBubbleVisible = ref(false);
  const currentBubbleImageUrl = ref("");
  const currentBubbleClass = ref("");

  let bubbleTimeoutId: number | null = null;
  let latestEmotionId = 0;

  const containerClasses = computed(() => ({
    [activeAnimationClass.value]: true,
    "opacity-100": role.value.show,
    "opacity-0": !role.value.show,
  }));

  const avatarStyles = computed(() => ({
    transform: `scale(${role.value.scaleP}) translate(${role.value.offsetXP}px, ${role.value.offsetYP}px)`,
  }));

  const bubbleClasses = computed(() => ({
    "opacity-100": isBubbleVisible.value,
    "opacity-0": !isBubbleVisible.value,
    [currentBubbleClass.value]: isBubbleVisible.value && currentBubbleClass.value,
  }));

  const bubbleStyles = computed(() => ({
    backgroundImage: `url(${currentBubbleImageUrl.value})`,
  }));

  const handleAvatarClick = () => {
    if (Date.now() < suppressClickUntil) return;
    emit("avatar-click");
  };

  const handleAvatarDoubleClick = () => {
    if (Date.now() < suppressClickUntil) return;
    emit("avatar-double-click");
  };

  const handleAnimationEnd = () => {
    if (activeAnimationClass.value !== "normal") {
      activeAnimationClass.value = "normal";
    }
  };

  const targetAvatarUrl = ref("");
  let resolveAvatarId = 0;

  async function resolveAvatar() {
    const r = role.value;
    const clothesName = r.clothesName === "默认" || !r.clothesName ? "default" : r.clothesName;
    const emotion = r.emotion;
    const mappedEmotion = EMOTION_CONFIG_EMO[emotion] || "正常";

    const currentId = ++resolveAvatarId;

    if (props.actionFile) {
      try {
        const path = await invoke<string>("get_pet_action_file", {
          characterFolder: r.character_folder,
          actionFile: props.actionFile,
        });
        const avatarUrl = await toAvatarUrl(path);
        if (currentId === resolveAvatarId) {
          targetAvatarUrl.value = avatarUrl;
        }
        return;
      } catch {
        // 旧角色包没有 extra_actions 时静默回退到当前对话情绪。
        emit("action-unavailable", props.actionFile);
      }
    }

    try {
      const path = await invoke<string>("get_avatar_file", {
        characterFolder: r.character_folder,
        emotion: mappedEmotion,
        clothesName,
      });
      const avatarUrl = await toAvatarUrl(path);
      if (currentId === resolveAvatarId) {
        targetAvatarUrl.value = avatarUrl;
      }
    } catch (error) {
      console.error("桌宠立绘加载失败", {
        roleId: r.roleId,
        characterFolder: r.character_folder,
        emotion: mappedEmotion,
        error,
      });
      if (currentId === resolveAvatarId) {
        targetAvatarUrl.value = "";
      }
    }
  }

  watch(
    () => [
      role.value.roleId,
      role.value.emotion,
      role.value.clothesName,
      role.value.character_folder,
      props.actionFile,
    ],
    () => resolveAvatar(),
    { immediate: true }
  );

  watch(
    () => role.value.emotion,
    async (newEmotion) => {
      const currentId = ++latestEmotionId;
      await resolveAvatar();
      await nextTick();
      if (imageFadeRef.value) await imageFadeRef.value.waitForLoad();
      if (currentId !== latestEmotionId) return;

      const config = EMOTION_CONFIG[newEmotion];
      if (!config) return;

      if (config.animation && config.animation !== "none")
        activeAnimationClass.value = config.animation;

      if (config.bubbleImage && config.bubbleImage !== "none") {
        // 修复代码：移除 ?t=... 形式的 cache-buster，避免由于本地重新加载导致的疯狂闪烁
        currentBubbleImageUrl.value = config.bubbleImage;
        currentBubbleClass.value = config.bubbleClass;

        if (bubbleTimeoutId !== null) {
          window.clearTimeout(bubbleTimeoutId);
          bubbleTimeoutId = null;
        }

        if (!isBubbleVisible.value) {
          isBubbleVisible.value = true;
        }

        bubbleTimeoutId = window.setTimeout(() => {
          isBubbleVisible.value = false;
          bubbleTimeoutId = null;
        }, 2000);
      }

      if (config.audio && config.audio !== "none") {
        playBubbleAudio(config.audio);
      }
    },
    { immediate: true }
  );

  // 播放情绪气泡音效（音量跟随「气泡音量」设置，否则恒为满音量）
  const playBubbleAudio = (src: string) => {
    if (!bubbleAudio.value) return;
    bubbleAudio.value.volume = uiStore.bubbleVolume / 100;
    bubbleAudio.value.src = src;
    bubbleAudio.value.load();
    bubbleAudio.value.play().catch((e) => console.error("气泡音效播放失败:", e));
  };

  // 气泡音量设置变化时，对已加载的音效实时生效
  watch(
    () => uiStore.bubbleVolume,
    (v) => {
      if (bubbleAudio.value) bubbleAudio.value.volume = v / 100;
    }
  );

  // 思考中反馈：气泡 + 音效（由 currentStatus 驱动，与 emotion 解耦）
  watch(
    () => gameStore.currentStatus,
    (newStatus) => {
      if (newStatus === "thinking") {
        const config = EMOTION_CONFIG["AI思考"];
        if (config && config.bubbleImage && config.bubbleImage !== "none") {
          currentBubbleImageUrl.value = config.bubbleImage;
          currentBubbleClass.value = config.bubbleClass;

          if (bubbleTimeoutId !== null) {
            window.clearTimeout(bubbleTimeoutId);
            bubbleTimeoutId = null;
          }
          if (!isBubbleVisible.value) {
            isBubbleVisible.value = true;
          }
          bubbleTimeoutId = window.setTimeout(() => {
            isBubbleVisible.value = false;
            bubbleTimeoutId = null;
          }, 2000);
        }
        if (config?.audio && config.audio !== "none") {
          playBubbleAudio(config.audio);
        }
      } else {
        // 离开思考态：隐藏思考气泡、停掉定时器
        isBubbleVisible.value = false;
        if (bubbleTimeoutId !== null) {
          window.clearTimeout(bubbleTimeoutId);
          bubbleTimeoutId = null;
        }
      }
    }
  );
</script>

<style scoped>
  .animate-breathing {
    animation: breathing 4s ease-in-out infinite alternate;
  }

  .pet-float {
    animation: pet-idle-float 4.8s ease-in-out infinite;
    will-change: transform;
  }

  @keyframes pet-idle-float {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-3px);
    }
  }

  .animate-pulse-slow {
    animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes breathing {
    0% {
      transform: scale(1);
    }
    100% {
      transform: scale(1.02);
    }
  }

  @keyframes pulse-slow {
    0%,
    100% {
      opacity: 0.3;
    }
    50% {
      opacity: 1;
    }
  }

  .sweep-glow-ring {
    background: conic-gradient(
      from 0deg,
      transparent 40%,
      rgba(34, 211, 238, 0.1) 70%,
      rgba(34, 211, 238, 0.8) 100%
    );
    -webkit-mask: radial-gradient(transparent 68%, #000 69%);
    mask: radial-gradient(transparent 68%, #000 69%);
    animation: spin 4s linear infinite;
  }

  [data-tauri-drag-region="false"] {
    -webkit-app-region: no-drag;
  }
</style>
