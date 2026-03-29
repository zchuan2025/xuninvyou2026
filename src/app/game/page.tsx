'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Heart, 
  MessageSquare, 
  Image as ImageIcon, 
  Volume2, 
  Settings, 
  ArrowLeft,
  Sparkles,
  Camera,
  Send,
  Moon,
  Sun
} from 'lucide-react';
import { 
  GameState, 
  Message, 
  GIRLFRIEND_TYPES, 
  AFFECTION_LEVELS,
  AffectionLevel 
} from '@/types';
import { 
  calculateAffectionChange, 
  updateAffectionLevel, 
  analyzeUserPreference,
  adjustPersonalityByPreference,
  isPositiveInteraction
} from '@/lib/affection';

export default function GamePage() {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isGeneratingPhoto, setIsGeneratingPhoto] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 加载游戏状态
  useEffect(() => {
    const savedState = localStorage.getItem('gameState');
    if (!savedState) {
      router.push('/');
      return;
    }
    const state = JSON.parse(savedState) as GameState;
    setGameState(state);
    
    // 初始化消息
    if (state.messages.length === 0) {
      const initialMessage: Message = {
        id: 'initial',
        role: 'system',
        content: state.storyLine.initialScenario,
        timestamp: Date.now()
      };
      setMessages([initialMessage]);
    } else {
      setMessages(state.messages);
    }
  }, [router]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !gameState) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    // 创建 AI 消息占位符
    const aiMessageId = `ai-${Date.now()}`;
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, aiMessage]);

    try {
      // 调用后端 API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          gameState: gameState,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                break;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  accumulatedContent += parsed.content;
                  // 实时更新消息内容
                  setMessages(prev => 
                    prev.map(msg => 
                      msg.id === aiMessageId 
                        ? { ...msg, content: accumulatedContent }
                        : msg
                    )
                  );
                }
              } catch (e) {
                console.error('Failed to parse SSE data:', e);
              }
            }
          }
        }
      }

      // 更新游戏状态
      // 计算好感度变化
      const isPositive = isPositiveInteraction(userMessage.content);
      const affectionChange = calculateAffectionChange(
        userMessage.content,
        gameState.affectionScore,
        isPositive
      );
      const newAffectionScore = Math.max(0, Math.min(100, gameState.affectionScore + affectionChange));
      
      // 更新好感度等级
      const newAffectionLevel = updateAffectionLevel(newAffectionScore);
      
      // 分析用户偏好
      const detectedPreference = analyzeUserPreference(userMessage.content);
      const newUserPreferences = detectedPreference 
        ? [...new Set([...gameState.userPreferences, detectedPreference])]
        : gameState.userPreferences;
      
      // 调整性格参数
      const newPersonality = adjustPersonalityByPreference(
        gameState.personality,
        newUserPreferences,
        detectedPreference
      );

      const updatedState = {
        ...gameState,
        messages: [...gameState.messages, userMessage, {
          ...aiMessage,
          content: accumulatedContent
        }],
        conversationTurns: gameState.conversationTurns + 1,
        lastActiveTime: Date.now(),
        affectionScore: newAffectionScore,
        affectionLevel: newAffectionLevel,
        personality: newPersonality,
        userPreferences: newUserPreferences,
      };

      setGameState(updatedState);
      localStorage.setItem('gameState', JSON.stringify(updatedState));

    } catch (error) {
      console.error('Failed to send message:', error);
      // 更新消息为错误状态
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, content: '抱歉，我遇到了一些问题，请稍后再试...' }
            : msg
        )
      );
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoicePlay = async (messageId: string) => {
    if (!gameState) return;

    const message = messages.find(m => m.id === messageId);
    if (!message || message.role !== 'assistant') return;

    // 如果正在播放，停止播放
    if (isPlaying) {
      const audio = document.getElementById('audio-player') as HTMLAudioElement;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setIsPlaying(false);
      return;
    }

    try {
      // 调用 TTS API
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message.content,
          girlfriendType: gameState.girlfriendType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 播放音频
        const audio = new Audio(data.audioUri);
        audio.id = 'audio-player';
        
        audio.onplay = () => setIsPlaying(true);
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          setIsPlaying(false);
          alert('语音播放失败');
        };

        await audio.play();
      } else {
        alert('语音合成失败');
      }
    } catch (error) {
      console.error('Failed to play voice:', error);
      alert('语音播放失败');
    }
  };

  const handleGeneratePhoto = async () => {
    if (!gameState || isGeneratingPhoto) return;

    // 好感度检查
    if (gameState.affectionLevel === 'stranger' || gameState.affectionLevel === 'acquaintance') {
      alert('好感度还不够高，多聊聊天解锁照片功能吧！');
      return;
    }

    setIsGeneratingPhoto(true);

    try {
      // 根据好感度等级生成不同场景的提示词
      let scenePrompt = '';
      switch (gameState.affectionLevel) {
        case 'friend':
          scenePrompt = 'taking a selfie in a casual setting, smiling naturally';
          break;
        case 'close':
          scenePrompt = 'in a romantic indoor setting, soft lighting, intimate atmosphere';
          break;
        case 'lover':
          scenePrompt = 'in a warm and loving pose, gentle smile, romantic lighting, wearing elegant clothes';
          break;
        default:
          scenePrompt = 'standing naturally, smiling';
      }

      const response = await fetch('/api/generate-photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: scenePrompt,
          referenceImage: gameState.girlfriendPhoto,
          gameState: gameState,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 添加照片到消息列表
        const photoMessage: Message = {
          id: `photo-${Date.now()}`,
          role: 'assistant',
          content: `这是 ${gameState.girlfriendName} 发来的照片！\n\n![照片](${data.imageUrl})`,
          timestamp: Date.now(),
        };

        setMessages(prev => [...prev, photoMessage]);

        // 更新游戏状态，添加解锁的照片
        const updatedState = {
          ...gameState,
          messages: [...gameState.messages, photoMessage],
          unlockedPhotos: [...gameState.unlockedPhotos, data.imageUrl],
          lastActiveTime: Date.now(),
        };

        setGameState(updatedState);
        localStorage.setItem('gameState', JSON.stringify(updatedState));
      } else {
        alert('照片生成失败，请稍后再试');
      }
    } catch (error) {
      console.error('Failed to generate photo:', error);
      alert('照片生成失败，请稍后再试');
    } finally {
      setIsGeneratingPhoto(false);
    }
  };

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  const personality = GIRLFRIEND_TYPES[gameState.girlfriendType];
  const affectionLevel = AFFECTION_LEVELS[gameState.affectionLevel];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-900 text-gray-100' 
        : 'bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50'
    }`}>
      <div className="container mx-auto p-4 h-screen flex flex-col max-w-7xl">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* 左侧：女友信息面板 */}
          <Card className={`w-80 flex-shrink-0 ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : ''
          }`}>
            <CardHeader className="text-center pb-4">
              <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-pink-300 dark:border-pink-700">
                <AvatarImage src={gameState.girlfriendPhoto} alt={gameState.girlfriendName} />
                <AvatarFallback className="bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900 dark:to-purple-900 text-2xl">
                  {gameState.girlfriendName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">{gameState.girlfriendName}</CardTitle>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge variant="secondary">{gameState.girlfriendAge}岁</Badge>
                <Badge className="bg-gradient-to-r from-pink-500 to-purple-500">
                  {personality.name}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 好感度 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                    <span className="font-semibold">好感度</span>
                  </div>
                  <Badge variant="outline">{affectionLevel.name}</Badge>
                </div>
                <Progress 
                  value={gameState.affectionScore} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {affectionLevel.description}
                </p>
              </div>

              <Separator />

              {/* 性格标签 */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  性格特质
                </h4>
                <div className="flex flex-wrap gap-2">
                  {personality.personality.map((trait) => (
                    <Badge 
                      key={trait}
                      variant="outline"
                      className="text-xs"
                    >
                      {trait}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* 故事线 */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  当前故事
                </h4>
                <p className="text-sm text-muted-foreground">
                  {gameState.storyLine.name}
                </p>
              </div>

              <Separator />

              {/* 统计信息 */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-pink-500">
                    {gameState.conversationTurns}
                  </div>
                  <div className="text-xs text-muted-foreground">对话轮次</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-500">
                    {gameState.unlockedPhotos.length}
                  </div>
                  <div className="text-xs text-muted-foreground">解锁照片</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 右侧：聊天区域 */}
          <Card className={`flex-1 flex flex-col ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : ''
          }`}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  聊天对话
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleGeneratePhoto}
                  className="gap-2"
                >
                  <Camera className="w-4 h-4" />
                  生成照片
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col overflow-hidden p-4">
              {/* 消息列表 */}
              <ScrollArea className="flex-1 pr-4 mb-4">
                <div ref={scrollRef} className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                            : message.role === 'system'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-800'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={gameState.girlfriendPhoto} />
                              <AvatarFallback className="text-xs">
                                {gameState.girlfriendName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-semibold">
                              {gameState.girlfriendName}
                            </span>
                          </div>
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                        <div className="flex items-center justify-between mt-2 gap-2">
                          <span className="text-xs opacity-70">
                            {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {message.role === 'assistant' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 hover:bg-white/10"
                              onClick={() => handleVoicePlay(message.id)}
                            >
                              <Volume2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* 输入区域 */}
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`和 ${gameState.girlfriendName} 聊点什么...`}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
