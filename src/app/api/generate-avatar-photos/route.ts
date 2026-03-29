import { NextRequest } from 'next/server';
import { ImageGenerationClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { personalityType } = await request.json();
    
    // 验证必要参数
    if (!personalityType) {
      return new Response(JSON.stringify({ error: 'Missing required parameter: personalityType' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 提取请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 创建图像生成客户端
    const config = new Config();
    const client = new ImageGenerationClient(config, customHeaders);

    // 根据性格类型生成不同的照片描述
    const prompts = getPromptsByPersonality(personalityType);

    // 生成3张照片
    const photos: string[] = [];
    
    for (let i = 0; i < Math.min(prompts.length, 3); i++) {
      try {
        const response = await client.generate({
          prompt: prompts[i],
          size: '2K',
          watermark: false,
          responseFormat: 'url',
        });

        const helper = client.getResponseHelper(response);

        if (helper.success && helper.imageUrls.length > 0) {
          photos.push(helper.imageUrls[0]);
        }
      } catch (error) {
        console.error(`Failed to generate photo ${i + 1}:`, error);
      }
    }

    // 返回生成的照片 URL
    return new Response(JSON.stringify({ 
      photos: photos,
      success: true 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Avatar photos generation API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// 根据性格类型获取照片描述
function getPromptsByPersonality(personalityType: string): string[] {
  const promptsMap: Record<string, string[]> = {
    gentle: [
      'A beautiful young Asian woman with gentle smile, soft features, warm and kind expression, natural lighting, portrait photography',
      'A lovely young woman with kind eyes, gentle demeanor, wearing casual soft-colored clothes, bright and warm atmosphere',
      'A sweet young woman with caring expression, soft flowing hair, gentle smile, natural beauty, portrait style',
      'A tender young woman with warm personality, kind smile, soft facial features, natural lighting',
      'A gentle young woman with compassionate eyes, soft smile, wearing light pastel colors, warm and inviting'
    ],
    tsundere: [
      'A beautiful young Asian woman with slightly proud expression, confident pose, stylish outfit, fashionable look',
      'A cute young woman with playful expression, stylish hair, trendy clothes, confident attitude',
      'An attractive young woman with confident smile, fashion-forward style, modern aesthetic',
      'A stylish young woman with sassy expression, cool outfit, confident and playful',
      'A fashionable young woman with trendy look, confident posture, stylish appearance'
    ],
    mature: [
      'An elegant mature Asian woman with sophisticated expression, professional attire, poised and confident',
      'A refined young woman with elegant demeanor, wearing professional outfit, intelligent and composed',
      'A graceful young woman with sophisticated style, elegant features, confident and poised',
      'A classy young woman with refined appearance, professional look, elegant and tasteful',
      'An elegant young woman with sophisticated expression, wearing business attire, confident and intelligent'
    ],
    lively: [
      'A cheerful young Asian woman with bright smile, energetic expression, colorful outfit, vibrant and fun',
      'A happy young woman with joyful expression, bright and lively, wearing colorful clothes',
      'An energetic young woman with big smile, bubbly personality, bright and colorful style',
      'A fun-loving young woman with cheerful expression, vibrant clothes, happy and energetic',
      'A lively young woman with bright smile, colorful outfit, joyful and playful'
    ],
    mysterious: [
      'A mysterious young Asian woman with enigmatic expression, elegant and sophisticated, atmospheric lighting',
      'A beautiful young woman with mysterious aura, subtle smile, elegant and intriguing',
      'An intriguing young woman with mysterious expression, elegant features, sophisticated style',
      'A captivating young woman with mysterious demeanor, elegant and alluring',
      'An enigmatic young woman with subtle expression, elegant and sophisticated, atmospheric'
    ]
  };

  return promptsMap[personalityType] || promptsMap['gentle'];
}
