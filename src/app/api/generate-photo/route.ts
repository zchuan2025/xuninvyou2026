import { NextRequest } from 'next/server';
import { ImageGenerationClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { prompt, referenceImage, gameState } = await request.json();
    
    // 验证必要参数
    if (!prompt || !referenceImage) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 提取请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 创建图像生成客户端
    const config = new Config();
    const client = new ImageGenerationClient(config, customHeaders);

    // 构建提示词（结合参考图和场景）
    const enhancedPrompt = `A realistic photo of a beautiful woman, ${prompt}. The photo should maintain the same facial features and identity as the reference image. High quality, natural lighting, realistic style.`;

    // 生成图片（图生图模式）
    const response = await client.generate({
      prompt: enhancedPrompt,
      image: referenceImage, // 传入参考图 URL
      size: '2K',
      watermark: false,
      responseFormat: 'url',
    });

    const helper = client.getResponseHelper(response);

    if (!helper.success) {
      console.error('Image generation failed:', helper.errorMessages);
      return new Response(JSON.stringify({ error: helper.errorMessages.join(', ') }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 返回生成的图片 URL
    return new Response(JSON.stringify({ 
      imageUrl: helper.imageUrls[0],
      success: true 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Photo generation API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
