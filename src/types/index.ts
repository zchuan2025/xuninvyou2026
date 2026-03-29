// 女友性格类型
export type GirlfriendType = 
  | 'gentle'      // 温柔
  | 'tsundere'    // 傲娇
  | 'mature'      // 御姐
  | 'lively'      // 活泼
  | 'mysterious'; // 神秘

// 女友类型配置
export const GIRLFRIEND_TYPES: Record<GirlfriendType, {
  name: string;
  description: string;
  personality: string[];
  defaultNames: string[];
}> = {
  gentle: {
    name: '温柔型',
    description: '体贴入微，善解人意，给人温暖的感觉',
    personality: ['温柔体贴', '细心周到', '善解人意', '温暖治愈'],
    defaultNames: ['小柔', '婉儿', '雨萱', '婉婷', '若曦']
  },
  tsundere: {
    name: '傲娇型',
    description: '表面高傲，内心柔软，偶尔会展现出可爱的一面',
    personality: ['口是心非', '可爱反差', '独立自信', '内心柔软'],
    defaultNames: ['小傲', '雪儿', '傲娇', '紫萱', '雨婷']
  },
  mature: {
    name: '御姐型',
    description: '成熟稳重，处事干练，给人一种可靠的感觉',
    personality: ['成熟稳重', '知性优雅', '独立自信', '干练果断'],
    defaultNames: ['雅琴', '若兰', '雅静', '婉柔', '知秋']
  },
  lively: {
    name: '活泼型',
    description: '热情开朗，充满活力，给人带来快乐',
    personality: ['热情开朗', '活泼好动', '幽默风趣', '积极乐观'],
    defaultNames: ['小乐', '欣欣', '悦悦', '开心', '俏俏']
  },
  mysterious: {
    name: '神秘型',
    description: '深邃内敛，充满神秘感，让人想要探索',
    personality: ['深邃内敛', '神秘高冷', '智慧深沉', '独特魅力'],
    defaultNames: ['幽兰', '梦瑶', '紫月', '清幽', '神秘']
  }
};

// 故事线类型
export interface StoryLine {
  id: string;
  name: string;
  description: string;
  initialScenario: string;
}

// 预定义故事线
export const STORY_LINES: StoryLine[] = [
  {
    id: 'bankruptcy',
    name: '破产同居',
    description: '你因生意失败破产，不得不与她合租狭小的公寓',
    initialScenario: '在一个雨夜，你搬进了一间狭小的合租公寓。她在门口等你，手里拿着备用钥匙...'
  },
  {
    id: 'apocalypse',
    name: '末日相依',
    description: '丧尸病毒爆发，世界陷入末日，你们在废弃城市中相互扶持',
    initialScenario: '街道上满是废墟，远处传来嘶吼声。你们躲在一栋废弃大楼的顶层，这里暂时安全...'
  },
  {
    id: 'workplace',
    name: '职场上下级',
    description: '你是部门经理，她是新来的实习生，在工作中擦出火花',
    initialScenario: '周一的早晨，她抱着文件走进办公室，有些紧张地站在你面前："经理好，我是新来的实习生..."'
  },
  {
    id: 'highschool',
    name: '校园重逢',
    description: '高中暗恋对象在多年后意外重逢',
    initialScenario: '在同学聚会上，你看到了那个曾经让你心跳加速的女孩。她笑着向你走来："好久不见啊，"她叫出了你的名字...'
  },
  {
    id: 'cafe',
    name: '咖啡店邂逅',
    description: '你是常客，她是新来的咖啡师，每次点咖啡时都有微妙的眼神交流',
    initialScenario: '推开咖啡店的门，风铃响起。吧台后站着一位新的咖啡师，她抬头对你微笑："欢迎光临，想喝点什么？"'
  },
  {
    id: 'library',
    name: '图书馆偶遇',
    description: '你们是同一个图书馆的常客，因为争夺同一本书而相识',
    initialScenario: '你伸手去拿书架上的那本书，恰好另一只手也伸了过来。你们同时抬头，四目相对...'
  },
  {
    id: 'neighbor',
    name: '邻居关系',
    description: '你是新搬来的邻居，她主动来打招呼，从此开始了一段邻里间的缘分',
    initialScenario: '你正忙着搬家，门铃响了。她站在门口，手里提着一盒点心："我是住在对面的，欢迎搬来..."'
  },
  {
    id: 'online',
    name: '网恋奔现',
    description: '在网上认识了半年，终于决定线下见面',
    initialScenario: '你在约定的咖啡馆等待，心跳加速。门铃响起，一个熟悉的身影走进来，是你一直在网聊的那个女孩...'
  },
  {
    id: 'rescue',
    name: '意外救援',
    description: '你在意外中救了她，她为了报答你，开始接近你',
    initialScenario: '那晚雨很大，你看到她在路边瑟瑟发抖。你停下车，询问是否需要帮助。她抬起头，眼中充满感激...'
  },
  {
    id: 'contract',
    name: '契约恋人',
    description: '为了各自的目的，你们签订了一份契约恋爱的协议',
    initialScenario: '她将一份文件放在桌上，认真地看着你："这是契约，期限三个月，期间我们要假装成恋人..."'
  }
];

// 好感度等级
export type AffectionLevel = 
  | 'enemy'       // 敌对 (-20-0)
  | 'stranger'    // 陌生人 (0-20)
  | 'acquaintance' // 熟人 (20-40)
  | 'friend'      // 朋友 (40-60)
  | 'close'       // 亲密 (60-80)
  | 'lover';      // 恋人 (80-100)

export const AFFECTION_LEVELS: Record<AffectionLevel, { min: number; max: number; name: string; description: string }> = {
  enemy: { min: -20, max: 0, name: '敌对', description: '关系紧张，需要好好沟通' },
  stranger: { min: 0, max: 20, name: '陌生人', description: '刚认识不久，关系还很疏远' },
  acquaintance: { min: 20, max: 40, name: '熟人', description: '开始熟悉，但还没有太多交集' },
  friend: { min: 40, max: 60, name: '朋友', description: '可以正常交流，分享日常' },
  close: { min: 60, max: 80, name: '亲密', description: '可以分享更多个人话题，有些暧昧' },
  lover: { min: 80, max: 100, name: '恋人', description: '非常亲密，可以分享最私密的想法' }
};

// 用户偏好标签
export type UserPreference = 'domineering' | 'humorous' | 'gentle' | 'romantic' | 'pragmatic';

export const USER_PREFERENCES: Record<UserPreference, string> = {
  domineering: '霸道',
  humorous: '幽默',
  gentle: '温柔',
  romantic: '浪漫',
  pragmatic: '务实'
};

// 性格动态调整参数
export interface PersonalityAxis {
  // 性格维度：0-100
  warmth: number;        // 温暖度
  playfulness: number;   // 俏皮度
  seriousness: number;   // 严肃度
  romance: number;       // 浪漫度
  possessiveness: number; // 占有欲
}

// 对话消息类型
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  emotion?: string; // 消息情绪标签
}

// 会话类型（用于保存多个女友互动记录）
export interface Conversation {
  id: string;
  createdAt: number;
  updatedAt: number;
  gameState: GameState;
}

// 游戏状态
export interface GameState {
  // 女友信息
  girlfriendType: GirlfriendType;
  girlfriendName: string;
  girlfriendAge: number;
  girlfriendPhoto: string; // Base64 或 URL
  
  // 故事线
  storyLine: StoryLine;
  
  // 关系状态
  affectionScore: number; // 0-100
  affectionLevel: AffectionLevel;
  
  // 性格参数
  personality: PersonalityAxis;
  
  // 用户偏好
  userPreferences: UserPreference[];
  
  // 对话历史
  messages: Message[];
  
  // 会话统计
  conversationTurns: number;
  lastActiveTime: number;
  
  // 解锁内容
  unlockedPhotos: string[];
  nextPhotoTurn: number; // 下一次自动发照片的轮次
  
  // 系统状态
  isGameStarted: boolean;
  lastGeneratedImage?: string;
}

// 初始游戏状态
export const createInitialGameState = (): Omit<GameState, 'girlfriendType' | 'girlfriendName' | 'girlfriendAge' | 'girlfriendPhoto' | 'storyLine'> => ({
  affectionScore: 0,
  affectionLevel: 'stranger',
  personality: {
    warmth: 50,
    playfulness: 50,
    seriousness: 50,
    romance: 50,
    possessiveness: 50
  },
  userPreferences: [],
  messages: [],
  conversationTurns: 0,
  lastActiveTime: Date.now(),
  unlockedPhotos: ['initial-1', 'initial-2'], // 初始解锁2张照片
  nextPhotoTurn: Math.floor(Math.random() * 8) + 3, // 3-10轮随机
  isGameStarted: false
});

// 图片生成请求
export interface ImageGenerationRequest {
  prompt: string;
  referenceImage?: string; // 参考图片
  style?: string; // 风格描述
}

// TTS 语音请求
export interface TTSRequest {
  text: string;
  voice?: string; // 语音风格
}

// API 响应类型
export interface ChatResponse {
  content: string;
  emotion?: string;
  shouldGenerateImage?: boolean;
  imagePrompt?: string;
  personalityUpdate?: Partial<PersonalityAxis>;
}

export interface ImageGenerationResponse {
  imageUrl: string;
}

export interface TTSResponse {
  audioUrl: string;
}
