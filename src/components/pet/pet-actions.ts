export type PetActionId =
  | "yawn"
  | "edgeSit"
  | "deskSleep"
  | "peek"
  | "knock"
  | "pillowSleep"
  | "breakReminder"
  | "clickProtest"
  | "dragPanic"
  | "sleepMask"
  | "cookie"
  | "blanket"
  | "headphones";

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
    durationMs: 5200,
    priority: 30,
  },
};

export const DAY_IDLE_ACTIONS: PetActionId[] = ["yawn", "edgeSit", "peek", "cookie", "headphones"];

export const NIGHT_IDLE_ACTIONS: PetActionId[] = [
  "yawn",
  "deskSleep",
  "pillowSleep",
  "sleepMask",
  "blanket",
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
