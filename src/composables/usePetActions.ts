import { computed, onMounted, onUnmounted, ref } from "vue";
import {
  DAY_IDLE_ACTIONS,
  isSleepyHour,
  NIGHT_IDLE_ACTIONS,
  PET_ACTIONS,
  pickAction,
  type PetActionId,
} from "@/components/pet/pet-actions";

const IDLE_DELAY_MIN_MS = 35_000;
const IDLE_DELAY_MAX_MS = 70_000;

export function usePetActions(canPlayIdle: () => boolean = () => true) {
  const currentActionId = ref<PetActionId | null>(null);
  const lastActionId = ref<PetActionId | null>(null);
  const lastInteractionAt = ref(Date.now());

  let actionTimer: number | null = null;
  let idleTimer: number | null = null;

  const currentAction = computed(() =>
    currentActionId.value ? PET_ACTIONS[currentActionId.value] : null
  );
  const actionFile = computed(() => currentAction.value?.file ?? "");

  function clearActionTimer() {
    if (actionTimer !== null) {
      window.clearTimeout(actionTimer);
      actionTimer = null;
    }
  }

  function finishAction(expected?: PetActionId) {
    if (expected && currentActionId.value !== expected) return;
    clearActionTimer();
    if (currentActionId.value) lastActionId.value = currentActionId.value;
    currentActionId.value = null;
  }

  function playAction(id: PetActionId, force = false): boolean {
    const next = PET_ACTIONS[id];
    const current = currentAction.value;
    if (!force && current && current.priority > next.priority) return false;

    clearActionTimer();
    currentActionId.value = id;
    lastInteractionAt.value = Date.now();

    if (next.durationMs > 0) {
      actionTimer = window.setTimeout(() => finishAction(id), next.durationMs);
    }
    return true;
  }

  function playRandomAction(candidates: PetActionId[], force = false): boolean {
    if (candidates.length === 0) return false;
    return playAction(pickAction(candidates, lastActionId.value), force);
  }

  function noteInteraction() {
    lastInteractionAt.value = Date.now();
  }

  function scheduleIdleAction() {
    if (idleTimer !== null) window.clearTimeout(idleTimer);
    const delay = IDLE_DELAY_MIN_MS + Math.random() * (IDLE_DELAY_MAX_MS - IDLE_DELAY_MIN_MS);
    idleTimer = window.setTimeout(() => {
      const quietLongEnough = Date.now() - lastInteractionAt.value >= IDLE_DELAY_MIN_MS;
      if (!currentAction.value && quietLongEnough && canPlayIdle()) {
        const pool = isSleepyHour(new Date().getHours()) ? NIGHT_IDLE_ACTIONS : DAY_IDLE_ACTIONS;
        playAction(pickAction(pool, lastActionId.value));
      }
      scheduleIdleAction();
    }, delay);
  }

  const handleBreakReminder = () => playAction("breakReminder", true);

  onMounted(() => {
    window.addEventListener("lingchat:sedentary-reminder", handleBreakReminder);
    scheduleIdleAction();
  });

  onUnmounted(() => {
    window.removeEventListener("lingchat:sedentary-reminder", handleBreakReminder);
    clearActionTimer();
    if (idleTimer !== null) window.clearTimeout(idleTimer);
  });

  return {
    currentActionId,
    currentAction,
    actionFile,
    playAction,
    playRandomAction,
    finishAction,
    noteInteraction,
  };
}

declare global {
  interface WindowEventMap {
    "lingchat:sedentary-reminder": Event;
  }
}
