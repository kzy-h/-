import { computed, onMounted, onUnmounted, ref } from "vue";
import {
  DAY_IDLE_ACTIONS,
  isSleepyHour,
  NIGHT_IDLE_ACTIONS,
  PET_ACTIONS,
  pickAction,
  pickWeightedAction,
  type PetActionFrequency,
  type PetActionId,
  type WeightedPetAction,
} from "@/components/pet/pet-actions";

const IDLE_DELAY_RANGES: Record<PetActionFrequency, [number, number]> = {
  low: [70_000, 120_000],
  normal: [35_000, 70_000],
  high: [18_000, 35_000],
};
const RANDOM_ACTION_COOLDOWN_MS = 10_000;
const IDLE_ACTION_COOLDOWN_MS = 90_000;
const MIN_ACTION_SWITCH_MS = 650;

interface PetActionOptions {
  canPlayIdle?: () => boolean;
  getIdleFrequency?: () => PetActionFrequency;
}

export function usePetActions(options: PetActionOptions = {}) {
  const canPlayIdle = options.canPlayIdle ?? (() => true);
  const getIdleFrequency = options.getIdleFrequency ?? (() => "normal");
  const currentActionId = ref<PetActionId | null>(null);
  const lastActionId = ref<PetActionId | null>(null);
  const lastInteractionAt = ref(Date.now());
  const actionLastPlayedAt = new Map<PetActionId, number>();

  let actionTimer: number | null = null;
  let idleTimer: number | null = null;
  let actionStartedAt = 0;

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
    if (!force && current && Date.now() - actionStartedAt < MIN_ACTION_SWITCH_MS) return false;

    clearActionTimer();
    currentActionId.value = id;
    actionStartedAt = Date.now();
    actionLastPlayedAt.set(id, actionStartedAt);
    lastInteractionAt.value = Date.now();

    if (next.durationMs > 0) {
      actionTimer = window.setTimeout(() => finishAction(id), next.durationMs);
    }
    return true;
  }

  function actionsOutsideCooldown(candidates: PetActionId[], cooldownMs: number): PetActionId[] {
    const now = Date.now();
    const available = candidates.filter(
      (id) => id !== currentActionId.value && now - (actionLastPlayedAt.get(id) ?? 0) >= cooldownMs
    );
    if (available.length > 0) return available;

    const withoutCurrentOrLast = candidates.filter(
      (id) => id !== currentActionId.value && id !== lastActionId.value
    );
    return withoutCurrentOrLast.length > 0 ? withoutCurrentOrLast : candidates;
  }

  function playRandomAction(
    candidates: PetActionId[],
    force = false,
    cooldownMs = RANDOM_ACTION_COOLDOWN_MS
  ): boolean {
    if (candidates.length === 0) return false;
    const available = actionsOutsideCooldown(candidates, cooldownMs);
    return playAction(pickAction(available, lastActionId.value), force);
  }

  function noteInteraction() {
    lastInteractionAt.value = Date.now();
    scheduleIdleAction();
  }

  function scheduleIdleAction() {
    if (idleTimer !== null) window.clearTimeout(idleTimer);
    const frequency = getIdleFrequency();
    const [minDelay, maxDelay] = IDLE_DELAY_RANGES[frequency] ?? IDLE_DELAY_RANGES.normal;
    const delay = minDelay + Math.random() * (maxDelay - minDelay);
    idleTimer = window.setTimeout(() => {
      const quietLongEnough = Date.now() - lastInteractionAt.value >= minDelay;
      if (!currentAction.value && quietLongEnough && canPlayIdle()) {
        const pool = isSleepyHour(new Date().getHours()) ? NIGHT_IDLE_ACTIONS : DAY_IDLE_ACTIONS;
        const availableIds = actionsOutsideCooldown(
          pool.map((candidate) => candidate.id),
          IDLE_ACTION_COOLDOWN_MS
        );
        const availableSet = new Set(availableIds);
        const weightedPool: WeightedPetAction[] = pool.filter((candidate) =>
          availableSet.has(candidate.id)
        );
        playAction(pickWeightedAction(weightedPool, lastActionId.value));
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
    refreshIdleSchedule: scheduleIdleAction,
  };
}

declare global {
  interface WindowEventMap {
    "lingchat:sedentary-reminder": Event;
  }
}
