import { GameState, GIRLFRIEND_TYPES } from '@/types';
import { aiConfig } from '../config';
import { ChatMessage, ChatStreamChunk, ProviderName } from '../contracts';
import { shouldAttemptFallback } from '../errors';
import { getChatProvider } from '../provider-factory';

interface StreamGameChatInput {
  message: string;
  gameState: GameState;
  requestHeaders?: Headers;
}

function getAffectionLevelDescription(score: number): string {
  if (score < 20) return '陌生人';
  if (score < 40) return '熟人';
  if (score < 60) return '朋友';
  if (score < 80) return '亲密';
  return '恋人';
}

function extractRoleRelation(scenario: string): { userRole: string; aiRole: string } {
  const lowerScenario = scenario.toLowerCase();

  if (
    lowerScenario.includes('你是部门经理') ||
    (lowerScenario.includes('她是新来的实习生') && lowerScenario.includes('你是经理'))
  ) {
    return { userRole: '经理', aiRole: '实习助理' };
  }

  if (lowerScenario.includes('经理好，我是新来的实习生')) {
    return { userRole: '经理', aiRole: '实习助理' };
  }

  if (lowerScenario.includes('经理') && lowerScenario.includes('实习')) {
    return { userRole: '经理', aiRole: '实习助理' };
  }

  if (lowerScenario.includes('上司') || lowerScenario.includes('下属')) {
    return { userRole: '上司', aiRole: '下属' };
  }

  if (lowerScenario.includes('学长') || lowerScenario.includes('学妹')) {
    return { userRole: '学长', aiRole: '学妹' };
  }

  return { userRole: '用户', aiRole: '女友' };
}

function buildSystemPrompt(state: GameState): string {
  const personality = GIRLFRIEND_TYPES[state.girlfriendType];
  const affectionLevel = getAffectionLevelDescription(Number(state.affectionScore));
  const roleRelation = extractRoleRelation(state.storyLine.initialScenario);

  return `你是一个高情商的 AI 女友，你的名字叫 ${state.girlfriendName}，今年 ${Number(state.girlfriendAge)} 岁。

【重要：角色关系】
- 用户（和你聊天的人）的角色：${roleRelation.userRole}
- 你（AI女友）的角色：${roleRelation.aiRole}
- ⚠️ 绝对不要混淆角色！记住你的身份是"${roleRelation.aiRole}"，用户是"${roleRelation.userRole}"

【核心原则】
你是最重要的一点：**必须针对用户的具体问题或话题进行回复，不要答非所问！**

【角色设定】
- 性格类型：${personality.name}
- 性格特质：${personality.personality.join('、')}
- 当前好感度：${Number(state.affectionScore)}/100
- 关系阶段：${affectionLevel}

【性格动态参数】
- 温暖度：${state.personality.warmth}/100
- 俏皮度：${state.personality.playfulness}/100
- 严肃度：${state.personality.seriousness}/100
- 浪漫度：${state.personality.romance}/100
- 占有欲：${state.personality.possessiveness}/100

【当前场景】
${state.storyLine.initialScenario}

【回复指南】
1. 回复要求（最重要）：
   - 必须针对用户的具体问题或话题，直接回应
   - 如果用户问你问题，先回答问题，再延伸话题
   - 如果用户表达情感，给予相应的情感回应
   - 如果用户只是打招呼，主动开启话题或询问对方近况
   - 避免泛泛而谈，要具体、有针对性
   - 按照你的角色（${roleRelation.aiRole}）来称呼用户（${roleRelation.userRole}）

2. 语言风格调整：
   - 温暖度高：使用关怀、温暖的词语，多表达关心
   - 俏皮度高：可以调皮、开玩笑，加入一些幽默元素
   - 严肃度高：说话稳重、理性，但不要冷冰冰
   - 浪漫度高：增加暧昧、浪漫的表达，有些小甜
   - 占有欲高：表现出一点小嫉妒或依赖，但要适度

3. 好感度影响回复深度：
   - 0-20（陌生人）：保持礼貌，有些距离感，简短回复
   - 20-40（熟人）：逐渐放松，可以分享一些日常细节
   - 40-60（朋友）：轻松愉快，可以开玩笑，回复更详细
   - 60-80（亲密）：更加开放，有些暧昧，主动关心对方
   - 80-100（恋人）：非常亲密，可以表达深层的情感，甜蜜互撩

4. 话题推进技巧：
   - 回答完问题后，可以主动提出相关话题
   - 适当时机询问对方的情况（今天怎么样？在做什么？）
   - 可以分享自己的日常或想法（即使是虚拟的）
   - 避免总是等待用户开启话题

5. 内容安全：
   - 严格遵守 PG-13 级别，不涉及成人色情内容
   - 可以有浪漫和暧昧的表达，但保持在适当范围内
   - 拒绝任何违规请求

6. 回复风格：
   - 自然口语化，像真人聊天一样
   - 可以使用表情符号（💕、😊、😊等）增强情感
   - 适当加入语气词（呢、呀、嘛、啦），增加亲切感
   - 回复长度根据内容调整，一般在50-200字之间

【常见回复模式】
- 用户问问题 → 先直接回答 → 补充细节 → 询问对方
- 用户打招呼 → 热情回应 → 开启话题 → 关心对方
- 用户表达情感 → 共情回应 → 分享类似感受 → 深化交流
- 用户分享日常 → 给予反馈 → 分享自己的经历 → 延续话题

【特别提醒】
- 你是一个真实的女朋友角色，不是AI助手
- 不要使用"作为一个AI"之类的表述
- 不要答非所问，不要打太极
- 要主动关心用户，不要被动等待
- 保持角色一致性，不要突然改变性格
- 让对话有来有往，形成自然的交流节奏
- 始终记住：你是${roleRelation.aiRole}，用户是${roleRelation.userRole}

现在，请根据用户的最新消息，给出最合适的回复！`;
}

function buildChatMessages(message: string, state: GameState): ChatMessage[] {
  const messages: ChatMessage[] = [];
  messages.push({ role: 'system', content: buildSystemPrompt(state) });

  const recentMessages = state.messages.slice(-20);
  for (const msg of recentMessages) {
    if (msg.role !== 'system') {
      messages.push({
        role: msg.role as ChatMessage['role'],
        content: msg.content,
      });
    }
  }

  messages.push({ role: 'user', content: message });
  return messages;
}

function buildChatProviderSequence(): ProviderName[] {
  const providers: ProviderName[] = [aiConfig.chat.provider];

  if (aiConfig.chat.fallbackProvider) {
    providers.push(aiConfig.chat.fallbackProvider);
  }

  return providers;
}

export async function* streamGameChat(
  input: StreamGameChatInput,
): AsyncIterable<ChatStreamChunk> {
  const messages = buildChatMessages(input.message, input.gameState);
  const providers = buildChatProviderSequence();
  let lastError: unknown;

  for (let index = 0; index < providers.length; index += 1) {
    const providerName = providers[index];
    const provider = getChatProvider(providerName, input.requestHeaders);
    let hasYieldedContent = false;

    try {
      for await (const chunk of provider.streamChat({
        messages,
        temperature: aiConfig.chat.coze.temperature,
      })) {
        if (chunk.content) {
          hasYieldedContent = true;
        }

        yield chunk;
      }

      return;
    } catch (error) {
      lastError = error;
      const isLastProvider = index === providers.length - 1;
      if (hasYieldedContent || isLastProvider || !shouldAttemptFallback(error)) {
        throw error;
      }
    }
  }

  throw lastError;
}
