import { NextRequest } from 'next/server';
import { TTSClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { text, girlfriendType } = await request.json();
    
    // 验证必要参数
    if (!text) {
      return new Response(JSON.stringify({ error: 'Missing required parameter: text' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 提取请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 创建 TTS 客户端
    const config = new Config();
    const client = new TTSClient(config, customHeaders);

    // 根据女友类型选择合适的语音
    const speaker = selectVoiceByGirlfriendType(girlfriendType);

    // 合成语音
    const response = await client.synthesize({
      uid: 'user-' + Date.now(),
      text: text,
      speaker: speaker,
      audioFormat: 'mp3',
      sampleRate: 24000,
      speechRate: 10, // 稍微快一点的语速
      loudnessRate: 5,
    });

    // 返回语音 URL
    return new Response(JSON.stringify({ 
      audioUri: response.audioUri,
      audioSize: response.audioSize,
      success: true 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('TTS API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// 根据女友类型选择合适的语音
function selectVoiceByGirlfriendType(girlfriendType?: string): string {
  const voiceMap: Record<string, string> = {
    gentle: 'zh_female_xiaohe_uranus_bigtts', // 温柔型 - 小禾（通用女声）
    tsundere: 'saturn_zh_female_tiaopigongzhu_tob', // 傲娇型 - 俏皮公主
    mature: 'zh_female_vv_uranus_bigtts', // 御姐型 - Vivi（中英双语，成熟）
    lively: 'saturn_zh_female_keainvsheng_tob', // 活泼型 - 可爱女生
    mysterious: 'zh_female_mizai_saturn_bigtts', // 神秘型 - 迷猜
  };

  return voiceMap[girlfriendType || 'gentle'] || 'zh_female_xiaohe_uranus_bigtts';
}
