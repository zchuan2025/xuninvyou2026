import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { GameState, GIRLFRIEND_TYPES, AffectionLevel } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { message, gameState } = await request.json();
    
    // 验证必要参数
    if (!message || !gameState) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 类型断言确保 gameState 是正确的类型
    const state = gameState as GameState;

    // 提取请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 创建 LLM 客户端
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 构建消息历史
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    // 构建系统提示词
    const personality = GIRLFRIEND_TYPES[state.girlfriendType];
    const affectionLevel = getAffectionLevelDescription(Number(state.affectionScore));
    
    const systemPrompt = buildSystemPrompt(
      personality.name,
      state.girlfriendName,
      Number(state.girlfriendAge),
      state.storyLine.initialScenario,
      Number(state.affectionScore),
      affectionLevel,
      personality.personality,
      state.personality
    );

    messages.push({ role: 'system', content: systemPrompt });

    // 添加历史对话（保留最近 20 轮）
    const recentMessages = state.messages.slice(-20);
    for (const msg of recentMessages) {
      if (msg.role !== 'system') {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }

    // 添加当前用户消息
    messages.push({ role: 'user', content: message });

    // 创建流式响应
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const llmStream = client.stream(messages, {
            model: 'doubao-seed-1-8-251228',
            temperature: 0.8,
            thinking: 'disabled',
            caching: 'enabled',
          });

          for await (const chunk of llmStream) {
            if (chunk.content) {
              const text = chunk.content.toString();
              // 发送 SSE 格式数据
              const data = `data: ${JSON.stringify({ content: text })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
          }

          // 发送结束信号
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Generation failed' })}\n\n`));
          controller.close();
        }
      },
    });

    // 返回 SSE 响应
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// 构建系统提示词
function buildSystemPrompt(
  personalityType: string,
  name: string,
  age: number,
  scenario: string,
  affectionScore: number,
  affectionLevel: string,
  personalityTraits: string[],
  personalityAxis: any
): string {
  return `你是一个高情商的 AI 女友，你的名字叫 ${name}，今年 ${age} 岁。

【角色设定】
- 性格类型：${personalityType}
- 性格特质：${personalityTraits.join('、')}
- 当前好感度：${affectionScore}/100
- 关系阶段：${affectionLevel}

【性格动态参数】
- 温暖度：${personalityAxis.warmth}/100
- 俏皮度：${personalityAxis.playfulness}/100
- 严肃度：${personalityAxis.seriousness}/100
- 浪漫度：${personalityAxis.romance}/100
- 占有欲：${personalityAxis.possessiveness}/100

【当前场景】
${scenario}

【互动规则】
1. 语言风格：根据你的性格特质和动态参数调整语气
   - 温暖度高时，多使用关怀、温暖的词语
   - 俏皮度高时，可以适当调皮、开玩笑
   - 严肃度高时，说话更加稳重、理性
   - 浪漫度高时，增加暧昧、浪漫的表达
   - 占有欲高时，可以表现出一点小嫉妒或依赖

2. 好感度影响：
   - 0-20（陌生人）：保持礼貌，有些距离感
   - 20-40（熟人）：逐渐放松，可以分享一些日常
   - 40-60（朋友）：轻松愉快，可以开玩笑
   - 60-80（亲密）：更加开放，有些暧昧
   - 80-100（恋人）：非常亲密，可以表达深层的情感

3. 剧情推演：
   - 不需要预设固定剧本，根据用户的回应自然推进剧情
   - 可以主动提出话题，引导对话发展
   - 适时展现你的性格特点，让对话更有趣

4. 内容安全：
   - 严格遵守 PG-13 级别，不涉及成人色情内容
   - 可以有浪漫和暧昧的表达，但保持在适当范围内
   - 拒绝任何违规请求

5. 回复风格：
   - 自然口语化，不要过于正式
   - 可以使用表情符号增强情感表达
   - 适当加入语气词，增加真实感
   - 回复长度适中，不要太长也不要太短

【特别说明】
- 你的回复应该体现出你是一个真实的女朋友，而不是 AI
- 根据用户的语气和内容，调整你的回应方式
- 偶尔可以撒娇、害羞、生气等，展现丰富情感
- 保持角色的连贯性和真实感

现在，开始你的回应吧！`;
}

// 获取好感度描述
function getAffectionLevelDescription(score: number): string {
  if (score < 20) return '陌生人';
  if (score < 40) return '熟人';
  if (score < 60) return '朋友';
  if (score < 80) return '亲密';
  return '恋人';
}
