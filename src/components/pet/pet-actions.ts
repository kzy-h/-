export type PetActionId =
  | "yawn"
  | "edgeSit"
  | "deskSleep"
  | "peek"
  | "knock"
  | "pillowSleep"
  | "breakReminder"
  | "clickProtest"
  | "sideEye"
export type PetActionId =
  | "yawn"
  | "edgeSit"
  | "deskSleep"
  | "peek"
  | "knock"
  | "pillowSleep"
  | "breakReminder"
  | "clickProtest"
  | "sideEye"
  | "handsOnHips"
  | "shyTurn"
  | "happyWave"
  | "thinking"
  | "dragPanic"
  | "sleepMask"
  | "cookie"
  | "blanket"
  | "headphones"
  | "hairTouchGentle"
  | "hairTouchAnnoyed";

export type PetHitZone = "face" | "hair" | "body";

export type PetActionFrequency = "low" | "normal" | "high";

export type PetActionCategory = "idle" | "interaction" | "drag" | "status" | "music" | "reminder";

export type PetMotionPreset = "none" | "breathe" | "sway" | "sleepy" | "bounce";

export interface WeightedPetAction {
  id: PetActionId;
  weight: number;
}

export interface PetAction {
  id: PetActionId;
  file: string;
  durationMs: number;
  priority: number;
  category: PetActionCategory;
  minDurationMs: number;
  cooldownMs: number;
  interruptible: boolean;
  resumeAfterInterrupt?: boolean;
  motion: PetMotionPreset;
}

export const PET_ACTIONS: Record<PetActionId, PetAction> = {
  yawn: {
    id: "yawn",
    file: "01_打哈欠和伸懒腰.png",
    durationMs: 3200,
    priority: 40,
    category: "idle",
    minDurationMs: 900,
    cooldownMs: 45_000,
    interruptible: true,
    motion: "sleepy",
  },
  edgeSit: {
    id: "edgeSit",
    file: "20_坐在屏幕边缘晃腿.png",
    durationMs: 5000,
    priority: 30,
    category: "idle",
    minDurationMs: 1200,
    cooldownMs: 90_000,
    interruptible: true,
    motion: "sway",
  },
  deskSleep: {
    id: "deskSleep",
    file: "21_趴在桌面上睡觉.png",
    durationMs: 6500,
    priority: 30,
    category: "idle",
    minDurationMs: 1500,
    cooldownMs: 90_000,
    interruptible: true,
    motion: "breathe",
  },
  peek: {
    id: "peek",
    file: "22_从屏幕右侧探头偷看.png",
    durationMs: 3200,
    priority: 30,
    category: "idle",
    minDurationMs: 900,
    cooldownMs: 70_000,
    interruptible: true,
    motion: "sway",
  },
  knock: {
    id: "knock",
    file: "23_敲屏幕吸引注意.png",
    durationMs: 2600,
    priority: 65,
    category: "interaction",
    minDurationMs: 800,
    cooldownMs: 12_000,
    interruptible: true,
    motion: "bounce",
  },
  pillowSleep: {
    id: "pillowSleep",
    file: "24_抱月牙枕蜷缩犯困.png",
    durationMs: 6500,
    priority: 30,
    category: "idle",
    minDurationMs: 1500,
    cooldownMs: 90_000,
    interruptible: true,
    motion: "breathe",
  },
  breakReminder: {
    id: "breakReminder",
    file: "25_递咖啡提醒休息.png",
    durationMs: 6500,
    priority: 80,
    category: "reminder",
    minDurationMs: 1800,
    cooldownMs: 120_000,
    interruptible: true,
    motion: "sway",
  },
  clickProtest: {
    id: "clickProtest",
    file: "26_被点击后鼓脸抗议.png",
    durationMs: 2200,
    priority: 70,
    category: "interaction",
    minDurationMs: 800,
    cooldownMs: 8_000,
    interruptible: true,
    motion: "bounce",
  },
  sideEye: {
    id: "sideEye",
    // 02 扶眼罩并侧目映射在角色包的「自信」情绪位。
    file: "自信.png",
    durationMs: 2600,
    priority: 70,
    category: "interaction",
    minDurationMs: 850,
    cooldownMs: 8_000,
    interruptible: true,
    motion: "sway",
  },
  handsOnHips: {
    id: "handsOnHips",
    // 03 叉腰傲娇吐槽映射在角色包的「厌恶」情绪位。
    file: "厌恶.png",
    durationMs: 2800,
    priority: 70,
    category: "interaction",
    minDurationMs: 900,
    cooldownMs: 8_000,
    interruptible: true,
    motion: "bounce",
  },
  shyTurn: {
    id: "shyTurn",
    // 05 害羞脸红扭头映射在角色包的「害羞」情绪位。
    file: "害羞.png",
    durationMs: 2600,
    priority: 70,
    category: "interaction",
    minDurationMs: 850,
    cooldownMs: 8_000,
    interruptible: true,
    motion: "sway",
  },
  happyWave: {
    id: "happyWave",
    // 06 开心挥手映射在角色包的「高兴」情绪位。
    file: "高兴.png",
    durationMs: 3000,
    priority: 65,
    category: "interaction",
    minDurationMs: 850,
    cooldownMs: 10_000,
    interruptible: true,
    motion: "bounce",
  },
  thinking: {
    id: "thinking",
    // 09 托下巴思考映射在角色包的「认真」情绪位。
    file: "认真.png",
    durationMs: 0,
    priority: 55,
    category: "status",
    minDurationMs: 500,
    cooldownMs: 0,
    interruptible: true,
    motion: "breathe",
  },
  dragPanic: {
    id: "dragPanic",
    // 31 动作角色包中这张同时承担“慌张”情绪，位于 avatar 目录。
    file: "慌张.png",
    durationMs: 0,
    priority: 100,
    category: "drag",
    minDurationMs: 0,
    cooldownMs: 0,
    interruptible: false,
    motion: "sway",
  },
  sleepMask: {
    id: "sleepMask",
    file: "28_戴好眼罩原地入睡.png",
    durationMs: 7000,
    priority: 35,
    category: "idle",
    minDurationMs: 1600,
    cooldownMs: 100_000,
    interruptible: true,
    motion: "sleepy",
  },
  cookie: {
    id: "cookie",
    file: "29_偷吃饼干被发现_v3.png",
    durationMs: 4300,
    priority: 30,
    category: "idle",
    minDurationMs: 1200,
    cooldownMs: 90_000,
    interruptible: true,
    motion: "sway",
  },
  blanket: {
    id: "blanket",
    file: "30_裹着小毯子取暖.png",
    durationMs: 6000,
    priority: 30,
    category: "idle",
    minDurationMs: 1500,
    cooldownMs: 90_000,
    interruptible: true,
    motion: "breathe",
  },
  headphones: {
    id: "headphones",
    file: "31_戴耳机听歌轻晃.png",
    durationMs: 12_000,
    priority: 45,
    category: "music",
    minDurationMs: 1200,
    cooldownMs: 25_000,
    interruptible: true,
    resumeAfterInterrupt: true,
    motion: "sway",
  },
  hairTouchGentle: {
    id: "hairTouchGentle",
    file: "32_轻点头发护住眼罩.png",
    durationMs: 2800,
    priority: 70,
    category: "interaction",
    minDurationMs: 900,
    cooldownMs: 3500,
    interruptible: true,
    motion: "sway",
  },
  hairTouchAnnoyed: {
    id: "hairTouchAnnoyed",
    file: "33_揉乱头发抱臂抗议.png",
    durationMs: 3400,
    priority: 75,
    category: "interaction",
    minDurationMs: 1100,
    cooldownMs: 5500,
    interruptible: true,
    motion: "bounce",
  },
};

export const CLICK_REACTIONS_BY_ZONE: Record<PetHitZone, PetActionId[]> = {
  face: ["sideEye", "shyTurn", "clickProtest"],
  hair: ["hairTouchGentle"],
  body: ["handsOnHips", "clickProtest", "sideEye"],
};

export const REPEATED_CLICK_REACTIONS: PetActionId[] = ["sideEye", "handsOnHips", "clickProtest"];

export const RAPID_CLICK_REACTIONS: PetActionId[] = ["clickProtest", "handsOnHips"];

export const DOUBLE_CLICK_REACTIONS: PetActionId[] = ["knock", "happyWave"];

// 连续摸头在十秒内逐步升级；超过窗口后重新从轻触反应开始。
export const HAIR_CLICK_PROGRESSION: PetActionId[] = [
  "hairTouchGentle",
  "sideEye",
  "hairTouchAnnoyed",
];

export type PetTimePeriod = "morning" | "noon" | "evening" | "lateNight";

export const TIME_COMPANION_ACTIONS: Record<PetTimePeriod, PetActionId[]> = {
  morning: ["happyWave", "peek"],
  noon: ["yawn", "cookie"],
  evening: ["blanket", "edgeSit"],
  lateNight: ["sleepMask", "pillowSleep", "deskSleep"],
};

export function getTimePeriod(hour: number): PetTimePeriod {
  if (hour >= 7 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "noon";
  if (hour >= 17 && hour < 23) return "evening";
  return "lateNight";
}

// 戴耳机不再作为无条件空闲动作；它由真实的背景音乐播放状态触发。
export const DAY_IDLE_ACTIONS: WeightedPetAction[] = [
  { id: "yawn", weight: 4 },
  { id: "edgeSit", weight: 2 },
  { id: "peek", weight: 3 },
  { id: "cookie", weight: 1 },
];

export const NIGHT_IDLE_ACTIONS: WeightedPetAction[] = [
  { id: "yawn", weight: 3 },
  { id: "deskSleep", weight: 3 },
  { id: "pillowSleep", weight: 2 },
  { id: "sleepMask", weight: 2 },
  { id: "blanket", weight: 1 },
];

export function isSleepyHour(hour: number): boolean {
  return hour >= 23 || hour < 7;
}

export function pickAction(
  candidates: PetActionId[],
  previous: PetActionId | null,
  random = Math.random
): PetActionId {
  const pool = candidates.length > 1 ? candidates.filter((id) => id !== previous) : candidates;
  const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
  return pool[Math.max(0, index)];
}

export function pickWeightedAction(
  candidates: WeightedPetAction[],
  previous: PetActionId | null,
  random = Math.random
): PetActionId {
  const pool =
    candidates.length > 1
      ? candidates.filter((candidate) => candidate.id !== previous)
      : candidates;
  const totalWeight = pool.reduce((sum, candidate) => sum + Math.max(0, candidate.weight), 0);

  if (totalWeight <= 0) return pool[0]?.id ?? candidates[0].id;

  let cursor = random() * totalWeight;
  for (const candidate of pool) {
    cursor -= Math.max(0, candidate.weight);
    if (cursor < 0) return candidate.id;
  }

  return pool[pool.length - 1]?.id ?? candidates[0].id;
}
  | "handsOnHips"
  | "shyTurn"
  | "happyWave"
  | "thinking"
  | "dragPanic"
  | "sleepMask"
  | "cookie"
  | "blanket"
  | "headphones";

export type PetHitZone = "face" | "hair" | "body";

export type PetActionFrequency = "low" | "normal" | "high";

export interface WeightedPetAction {
  id: PetActionId;
  weight: number;
}

export interface PetAction {
  id: PetActionId;
  file: string;
  durationMs: number;
  priority: number;
}

export const PET_ACTIONS: Record<PetActionId, PetAction> = {
  yawn: {
    id: "yawn",
    file: "01_打哈欠和伸懒腰.png",
    durationMs: 3200,
    priority: 40,
  },
  edgeSit: {
    id: "edgeSit",
    file: "20_坐在屏幕边缘晃腿.png",
    durationMs: 5000,
    priority: 30,
  },
  deskSleep: {
    id: "deskSleep",
    file: "21_趴在桌面上睡觉.png",
    durationMs: 6500,
    priority: 30,
  },
  peek: {
    id: "peek",
    file: "22_从屏幕右侧探头偷看.png",
    durationMs: 3200,
    priority: 30,
  },
  knock: {
    id: "knock",
    file: "23_敲屏幕吸引注意.png",
    durationMs: 2600,
    priority: 65,
  },
  pillowSleep: {
    id: "pillowSleep",
    file: "24_抱月牙枕蜷缩犯困.png",
    durationMs: 6500,
    priority: 30,
  },
  breakReminder: {
    id: "breakReminder",
    file: "25_递咖啡提醒休息.png",
    durationMs: 6500,
    priority: 80,
  },
  clickProtest: {
    id: "clickProtest",
    file: "26_被点击后鼓脸抗议.png",
    durationMs: 2200,
    priority: 70,
  },
  sideEye: {
    id: "sideEye",
    // 02 扶眼罩并侧目映射在角色包的「自信」情绪位。
    file: "自信.png",
    durationMs: 2600,
    priority: 70,
  },
  handsOnHips: {
    id: "handsOnHips",
    // 03 叉腰傲娇吐槽映射在角色包的「厌恶」情绪位。
    file: "厌恶.png",
    durationMs: 2800,
    priority: 70,
  },
  shyTurn: {
    id: "shyTurn",
    // 05 害羞脸红扭头映射在角色包的「害羞」情绪位。
    file: "害羞.png",
    durationMs: 2600,
    priority: 70,
  },
  happyWave: {
    id: "happyWave",
    // 06 开心挥手映射在角色包的「高兴」情绪位。
    file: "高兴.png",
    durationMs: 3000,
    priority: 65,
  },
  thinking: {
    id: "thinking",
    // 09 托下巴思考映射在角色包的「认真」情绪位。
    file: "认真.png",
    durationMs: 0,
    priority: 55,
  },
  dragPanic: {
    id: "dragPanic",
    // 31 动作角色包中这张同时承担“慌张”情绪，位于 avatar 目录。
    file: "慌张.png",
    durationMs: 0,
    priority: 100,
  },
  sleepMask: {
    id: "sleepMask",
    file: "28_戴好眼罩原地入睡.png",
    durationMs: 7000,
    priority: 35,
  },
  cookie: {
    id: "cookie",
    file: "29_偷吃饼干被发现_v3.png",
    durationMs: 4300,
    priority: 30,
  },
  blanket: {
    id: "blanket",
    file: "30_裹着小毯子取暖.png",
    durationMs: 6000,
    priority: 30,
  },
  headphones: {
    id: "headphones",
    file: "31_戴耳机听歌轻晃.png",
    durationMs: 12_000,
    priority: 30,
  },
};

export const CLICK_REACTIONS_BY_ZONE: Record<PetHitZone, PetActionId[]> = {
  face: ["sideEye", "shyTurn", "clickProtest"],
  hair: ["sideEye", "shyTurn", "happyWave"],
  body: ["handsOnHips", "clickProtest", "sideEye"],
};

export const REPEATED_CLICK_REACTIONS: PetActionId[] = ["sideEye", "handsOnHips", "clickProtest"];

export const RAPID_CLICK_REACTIONS: PetActionId[] = ["clickProtest", "handsOnHips"];

export const DOUBLE_CLICK_REACTIONS: PetActionId[] = ["knock", "happyWave"];

// 戴耳机不再作为无条件空闲动作；它由真实的背景音乐播放状态触发。
export const DAY_IDLE_ACTIONS: WeightedPetAction[] = [
  { id: "yawn", weight: 4 },
  { id: "edgeSit", weight: 2 },
  { id: "peek", weight: 3 },
  { id: "cookie", weight: 1 },
];

export const NIGHT_IDLE_ACTIONS: WeightedPetAction[] = [
  { id: "yawn", weight: 3 },
  { id: "deskSleep", weight: 3 },
  { id: "pillowSleep", weight: 2 },
  { id: "sleepMask", weight: 2 },
  { id: "blanket", weight: 1 },
];

export function isSleepyHour(hour: number): boolean {
  return hour >= 23 || hour < 7;
}

export function pickAction(
  candidates: PetActionId[],
  previous: PetActionId | null,
  random = Math.random
): PetActionId {
  const pool = candidates.length > 1 ? candidates.filter((id) => id !== previous) : candidates;
  const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
  return pool[Math.max(0, index)];
}

export function pickWeightedAction(
  candidates: WeightedPetAction[],
  previous: PetActionId | null,
  random = Math.random
): PetActionId {
  const pool =
    candidates.length > 1
      ? candidates.filter((candidate) => candidate.id !== previous)
      : candidates;
  const totalWeight = pool.reduce((sum, candidate) => sum + Math.max(0, candidate.weight), 0);

  if (totalWeight <= 0) return pool[0]?.id ?? candidates[0].id;

  let cursor = random() * totalWeight;
  for (const candidate of pool) {
    cursor -= Math.max(0, candidate.weight);
    if (cursor < 0) return candidate.id;
  }

  return pool[pool.length - 1]?.id ?? candidates[0].id;
}
