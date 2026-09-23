import { computed, onMounted, onUnmounted, ref } from "vue";
import {
  DAY_IDLE_ACTIONS,
  getTimePeriod,
  isSleepyHour,
  NIGHT_IDLE_ACTIONS,
  PET_ACTIONS,
  pickAction,
  pickWeightedAction,
  TIME_COMPANION_ACTIONS,
  type PetActionFrequency,
  type PetActionId,
  type PetTimePeriod,
  type WeightedPetAction,
} from "@/components/pet/pet-actions";

const IDLE_DELAY_RANGES: Record<PetActionFrequency, [number, number]> = {
  low: [70_000, 120_000],
  normal: [35_000, 70_000],
  high: [18_000, 35_000],
};
const RANDOM_ACTION_COOLDOWN_MS = 10_000;
const IDLE_ACTION_COOLDOWN_MS = 90_000;
const TIME_COMPANION_CHECK_MS = 5 * 60_000;
const TIME_COMPANION_INITIAL_DELAY_MS = 45_000;

export interface PetActionDecision {
  requested: PetActionId | null;
  played: boolean;
  reason: string;
  at: number;
}

interface PetActionOptions {
  canPlayIdle?: () => boolean;
  canPlayTimeCompanion?: () => boolean;
  canResumeAction?: (id: PetActionId) => boolean;
  getIdleFrequency?: () => PetActionFrequency;
}

export function usePetActions(options: PetActionOptions = {}) {
  const canPlayIdle = options.canPlayIdle ?? (() => true);
  const canPlayTimeCompanion = options.canPlayTimeCompanion ?? canPlayIdle;
  const canResumeAction = options.canResumeAction ?? (() => true);
  const getIdleFrequency = options.getIdleFrequency ?? (() => "normal");
  const currentActionId = ref<PetActionId | null>(null);
  const lastActionId = ref<PetActionId | null>(null);
  const lastInteractionAt = ref(Date.now());
  const actionStartedAt = ref(0);
  const actionEndsAt = ref(0);
  const actionRunId = ref(0);
  const lastDecision = ref<PetActionDecision>({
    requested: null,
    played: false,
    reason: "idle",
    at: Date.now(),
  });
  const actionLastPlayedAt = new Map<PetActionId, number>();

  let actionTimer: number | null = null;
  let actionHeld = false;
  let idleTimer: number | null = null;
  let timeCompanionTimer: number | null = null;
  let suspendedActionId: PetActionId | null = null;
  let lastTimeCompanionKey = "";

  const currentAction = computed(() =>
    currentActionId.value ? PET_ACTIONS[currentActionId.value] : null
  );
  const actionFile = computed(() => currentAction.value?.file ?? "");

  function recordDecision(requested: PetActionId | null, played: boolean, reason: string) {
    lastDecision.value = { requested, played, reason, at: Date.now() };
  }

  function reportBlockedAction(reason: string, requested: PetActionId | null = null) {
    recordDecision(requested, false, reason);
  }

  function clearActionTimer() {
    if (actionTimer !== null) {
      window.clearTimeout(actionTimer);
      actionTimer = null;
    }
  }

  function startAction(id: PetActionId, reason: string) {
    const action = PET_ACTIONS[id];
    clearActionTimer();
    actionHeld = false;
    actionRunId.value += 1;
    const runId = actionRunId.value;
    currentActionId.value = id;
    actionStartedAt.value = Date.now();
    actionEndsAt.value = action.durationMs > 0 ? actionStartedAt.value + action.durationMs : 0;
    actionLastPlayedAt.set(id, actionStartedAt.value);
    lastInteractionAt.value = Date.now();
    recordDecision(id, true, reason);

    if (action.durationMs > 0) {
      actionTimer = window.setTimeout(() => finishActionRun(id, runId), action.durationMs);
    }
  }

  function resumeSuspendedAction() {
    const suspended = suspendedActionId;
    suspendedActionId = null;
    if (!suspended || !canResumeAction(suspended)) return false;
    startAction(suspended, "resumed");
    return true;
  }

  function finishAction(expected?: PetActionId, resume = true) {
    if (expected && currentActionId.value !== expected) return;
    clearActionTimer();
    actionHeld = false;
    if (currentActionId.value) lastActionId.value = currentActionId.value;
    currentActionId.value = null;
    actionStartedAt.value = 0;
    actionEndsAt.value = 0;
    if (resume) resumeSuspendedAction();
    else suspendedActionId = null;
  }

  function finishActionRun(id: PetActionId, runId: number, resume = true): boolean {
    if (currentActionId.value !== id || actionRunId.value !== runId) return false;
    finishAction(id, resume);
    return true;
  }

  function holdAction(id: PetActionId, runId: number): boolean {
    if (
      currentActionId.value !== id ||
      actionRunId.value !== runId ||
      PET_ACTIONS[id].durationMs <= 0
    ) {
      return false;
    }
    clearActionTimer();
    actionHeld = true;
    return true;
  }

  function resumeHeldAction(id: PetActionId, runId: number): boolean {
    if (!actionHeld || currentActionId.value !== id || actionRunId.value !== runId) {
      return false;
    }

    actionHeld = false;
    const remainingMs = Math.max(0, actionEndsAt.value - Date.now());
    if (remainingMs === 0) return finishActionRun(id, runId);

    actionTimer = window.setTimeout(() => finishActionRun(id, runId), remainingMs);
    return true;
  }

  function playAction(id: PetActionId, force = false): boolean {
    const next = PET_ACTIONS[id];
    const current = currentAction.value;
    const now = Date.now();

    if (current?.id === id && !force) {
      recordDecision(id, false, "already-playing");
      return false;
    }
    if (current && !current.interruptible) {
      recordDecision(id, false, `blocked-by-${current.id}`);
      return false;
    }
    if (current && current.priority > next.priority) {
      recordDecision(id, false, `lower-priority-than-${current.id}`);
      return false;
    }
    if (!force && current && now - actionStartedAt.value < current.minDurationMs) {
      recordDecision(id, false, `minimum-duration-${current.id}`);
      return false;
    }

    if (current?.resumeAfterInterrupt && current.id !== id && canResumeAction(current.id)) {
      suspendedActionId = current.id;
    } else if (current && current.id !== id) {
      suspendedActionId = null;
    }

    if (current) lastActionId.value = current.id;
    startAction(id, force ? "forced" : "priority-accepted");
    return true;
  }

  function actionsOutsideCooldown(candidates: PetActionId[], fallbackMs: number): PetActionId[] {
    const now = Date.now();
    const available = candidates.filter((id) => {
      const cooldown = PET_ACTIONS[id].cooldownMs || fallbackMs;
      return id !== currentActionId.value && now - (actionLastPlayedAt.get(id) ?? 0) >= cooldown;
    });
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

  function tryTimeCompanionAction() {
    const now = new Date();
    const period: PetTimePeriod = getTimePeriod(now.getHours());
    const dayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${period}`;
    if (
      dayKey !== lastTimeCompanionKey &&
      !currentAction.value &&
      canPlayTimeCompanion() &&
      Date.now() - lastInteractionAt.value >= 20_000
    ) {
      const candidates = TIME_COMPANION_ACTIONS[period];
      if (playRandomAction(candidates, false, IDLE_ACTION_COOLDOWN_MS)) {
        lastTimeCompanionKey = dayKey;
      }
    }
    timeCompanionTimer = window.setTimeout(tryTimeCompanionAction, TIME_COMPANION_CHECK_MS);
  }

  function scheduleTimeCompanionAction() {
    if (timeCompanionTimer !== null) window.clearTimeout(timeCompanionTimer);
    timeCompanionTimer = window.setTimeout(tryTimeCompanionAction, TIME_COMPANION_INITIAL_DELAY_MS);
  }

  const handleBreakReminder = () => playAction("breakReminder", true);

  onMounted(() => {
    window.addEventListener("lingchat:sedentary-reminder", handleBreakReminder);
    scheduleIdleAction();
    scheduleTimeCompanionAction();
  });

  onUnmounted(() => {
    window.removeEventListener("lingchat:sedentary-reminder", handleBreakReminder);
    clearActionTimer();
    if (idleTimer !== null) window.clearTimeout(idleTimer);
    if (timeCompanionTimer !== null) window.clearTimeout(timeCompanionTimer);
  });

  return {
    currentActionId,
    currentAction,
    actionFile,
    actionStartedAt,
    actionEndsAt,
    actionRunId,
    lastDecision,
    reportBlockedAction,
    playAction,
    playRandomAction,
    finishAction,
    finishActionRun,
    holdAction,
    resumeHeldAction,
    noteInteraction,
    refreshIdleSchedule: scheduleIdleAction,
    refreshTimeCompanionSchedule: scheduleTimeCompanionAction,
  };
}

declare global {
  interface WindowEventMap {
    "lingchat:sedentary-reminder": Event;
  }
}
