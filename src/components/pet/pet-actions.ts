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

export const PET_ACTION_PREVIEW_EVENT = "pet-action-preview-request";
export const PET_ACTION_AUDIT_REQUEST_EVENT = "pet-action-audit-request";
export const PET_ACTION_AUDIT_RESULT_EVENT = "pet-action-audit-result";
export const SLEEPY_MITA_BUNDLED_FOLDER = "瞌睡米塔LingChat角色包";

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

export interface PetInteractionLine {
  /** 显示在桌宠气泡中的中文字幕。 */
  text: string;
  /** 交给本地 Ling-v2 合成的日语台词。 */
  voiceText: string;
}

export interface PetActionPreviewPayload {
  actionId: PetActionId;
}

export interface PetActionAuditRequest {
  requestId: string;
}

export interface PetActionAssetCheck {
  actionId: PetActionId;
  file: string;
  available: boolean;
  source: "active-role" | "bundled-fallback" | "missing";
  error?: string;
}

export interface PetActionAuditResult {
  requestId: string;
  characterName: string;
  characterFolder: string;
  baseAvatarAvailable: boolean;
  checks: PetActionAssetCheck[];
  error?: string;
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

export const PET_ACTION_IDS = Object.keys(PET_ACTIONS) as PetActionId[];

/**
 * 点击互动使用的本地台词。它们不进入 AI 对话队列，也不会产生 API 请求；
 * 没有配置台词的空闲、状态动作会保持安静。
 */
export const PET_ACTION_LINES: Partial<Record<PetActionId, readonly PetInteractionLine[]>> = {
  knock: [
    { text: "喂，看这里。别让我敲第二次。", voiceText: "ねえ、こっち見て。二回も叩かせないでよ。" },
    {
      text: "只是确认你还没在屏幕前睡着，别想多了。",
      voiceText: "まだ寝てないか確認しただけ。勘違いしないで。",
    },
  ],
  clickProtest: [
    {
      text: "戳够了吗？再戳我要收费了。",
      voiceText: "もう満足？これ以上つつくなら料金を取るから。",
    },
    {
      text: "我不是桌面快捷方式，别一直点！",
      voiceText: "私はデスクトップのショートカットじゃないの。何度も押さないで！",
    },
    {
      text: "你手指很闲吗？要不要我给你安排点工作？",
      voiceText: "指が暇なの？仕事を用意してあげようか？",
    },
  ],
  sideEye: [
    {
      text: "手放规矩点……我可都看见了。",
      voiceText: "手はおとなしくして……ちゃんと見えてるんだから。",
    },
    {
      text: "又来？你对我的眼罩到底有什么意见？",
      voiceText: "また？私のアイマスクに何か文句でもあるの？",
    },
    {
      text: "哼，这次先记账，下次一起算。",
      voiceText: "ふん、今回は貸しにしておく。次にまとめて返してもらうから。",
    },
  ],
  handsOnHips: [
    { text: "你是不是把我当成按钮了？", voiceText: "私をボタンだと思ってるの？" },
    {
      text: "胆子不小嘛，居然敢随便戳我。",
      voiceText: "いい度胸ね。よくも勝手につついたわね。",
    },
    {
      text: "给你三秒钟解释。算了，你肯定编不出来。",
      voiceText: "三秒だけ言い訳を聞いてあげる。まあ、どうせ思いつかないでしょうけど。",
    },
  ],
  shyTurn: [
    { text: "离、离这么近干什么……", voiceText: "ち、近すぎるんだけど……" },
    {
      text: "我才没有脸红，是屏幕颜色的问题！",
      voiceText: "赤くなんてない！画面の色のせいだから！",
    },
    { text: "别盯着看……很没礼貌的。", voiceText: "じっと見ないで……失礼でしょ。" },
  ],
  happyWave: [
    { text: "哼，我只是顺手打个招呼。", voiceText: "ふん、ついでに挨拶しただけ。" },
    { text: "看见你了，不用再点啦。", voiceText: "ちゃんと見えてるから、もう押さなくていいよ。" },
    {
      text: "今天也勉强陪你一会儿吧。",
      voiceText: "今日も仕方ないから、少しだけ付き合ってあげる。",
    },
  ],
  hairTouchGentle: [
    {
      text: "轻一点……发型乱了你负责。",
      voiceText: "優しくして……髪が乱れたら、あなたのせいだからね。",
    },
    { text: "只、只准摸一下，听见没有？", voiceText: "い、一回だけだからね。わかった？" },
    { text: "手感怎么样？不许回答！", voiceText: "触り心地はどう？……答えなくていい！" },
  ],
  hairTouchAnnoyed: [
    { text: "都说了会乱！你是故意的吧？", voiceText: "乱れるって言ったでしょ！わざとやってるの？" },
    {
      text: "再揉我头发，我就把你桌面图标全藏起来。",
      voiceText: "また髪をぐしゃぐしゃにしたら、デスクトップのアイコンを全部隠すから。",
    },
    {
      text: "停手！眼罩都快被你碰歪了！",
      voiceText: "やめて！アイマスクまでずれちゃうでしょ！",
    },
  ],
  dragPanic: [
    {
      text: "等等！移动之前先打个招呼啊！",
      voiceText: "ちょっと！動かすなら先に声をかけてよ！",
    },
    {
      text: "慢一点，我可不是窗口快递！",
      voiceText: "ゆっくりして。私はウィンドウ便じゃないんだから！",
    },
  ],
};

export function pickPetActionLine(
  actionId: PetActionId,
  previous: string,
  random = Math.random
): PetInteractionLine | null {
  const candidates = PET_ACTION_LINES[actionId] ?? [];
  if (candidates.length === 0) return null;
  const pool =
    candidates.length > 1 ? candidates.filter((line) => line.text !== previous) : candidates;
  const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
  return pool[Math.max(0, index)] ?? candidates[0] ?? null;
}

export function isPetActionId(value: unknown): value is PetActionId {
  return typeof value === "string" && value in PET_ACTIONS;
}

/**
 * 瞌睡米塔使用统一的 2:3 透明画布。脸部只占头部中央的一小块，头发则围绕
 * 脸部向两侧延伸；胸口、肩膀和手臂都应归入身体区。
 */
export function getPetHitZoneFromPoint(x: number, y: number): PetHitZone {
  const normalizedX = Math.min(1, Math.max(0, x));
  const normalizedY = Math.min(1, Math.max(0, y));

  if (normalizedX >= 0.4 && normalizedX <= 0.6 && normalizedY >= 0.08 && normalizedY <= 0.2) {
    return "face";
  }
  if (normalizedX >= 0.27 && normalizedX <= 0.73 && normalizedY >= 0.015 && normalizedY <= 0.3) {
    return "hair";
  }
  return "body";
}

export const CLICK_REACTIONS_BY_ZONE: Record<PetHitZone, PetActionId[]> = {
  face: ["shyTurn", "sideEye"],
  hair: ["hairTouchGentle"],
  body: ["handsOnHips", "clickProtest"],
};

export const REPEATED_CLICK_REACTIONS_BY_ZONE: Record<PetHitZone, PetActionId[]> = {
  face: ["sideEye", "shyTurn"],
  hair: ["sideEye"],
  body: ["clickProtest", "handsOnHips"],
};

export const RAPID_CLICK_REACTIONS_BY_ZONE: Record<PetHitZone, PetActionId[]> = {
  face: ["clickProtest", "sideEye"],
  hair: ["hairTouchAnnoyed"],
  body: ["clickProtest", "handsOnHips"],
};

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
