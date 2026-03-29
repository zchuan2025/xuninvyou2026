'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Sun,
  MoreHorizontal,
  User,
  History
} from 'lucide-react';
import { 
  GameState, 
  Message, 
  GIRLFRIEND_TYPES, 
  AFFECTION_LEVELS,
  AffectionLevel,
  Conversation 
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
  const [showSidebar, setShowSidebar] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 保存会话到列表的辅助函数
  const saveConversation = (updatedState: GameState) => {
    const conversationId = localStorage.getItem('currentConversationId');
    if (conversationId) {
      // 更新现有会话
      const savedConversations = localStorage.getItem('conversations');
      if (savedConversations) {
        const conversations = JSON.parse(savedConversations) as Conversation[];
        const index = conversations.findIndex(c => c.id === conversationId);
        if (index !== -1) {
          conversations[index].gameState = updatedState;
          conversations[index].updatedAt = Date.now();
          localStorage.setItem('conversations', JSON.stringify(conversations));
        }
      }
    }
    // 同时保存单个gameState以保持兼容性
    localStorage.setItem('gameState', JSON.stringify(updatedState));
  };

  // 加载游戏状态
  useEffect(() => {
    const savedState = localStorage.getItem('gameState');
    if (!savedState) {
      router.push('/');
      return;
    }
    const state = JSON.parse(savedState) as GameState;
    setGameState(state);
    
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

    const aiMessageId = `ai-${Date.now()}`;
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, aiMessage]);

    try {
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

      const isPositive = isPositiveInteraction(userMessage.content);
      const affectionChange = calculateAffectionChange(
        userMessage.content,
        gameState.affectionScore,
        isPositive
      );
      const newAffectionScore = Math.max(-20, Math.min(100, gameState.affectionScore + affectionChange));
      const newAffectionLevel = updateAffectionLevel(newAffectionScore);
      const detectedPreference = analyzeUserPreference(userMessage.content);
      const newUserPreferences = detectedPreference 
        ? [...new Set([...gameState.userPreferences, detectedPreference])]
        : gameState.userPreferences;
      const newPersonality = adjustPersonalityByPreference(
        gameState.personality,
        newUserPreferences,
        detectedPreference
      );

      const newConversationTurns = gameState.conversationTurns + 1;
      
      // 检查是否需要自动发送照片
      let shouldAutoSendPhoto = false;
      let nextPhotoTurn = gameState.nextPhotoTurn || 3;
      
      if (newConversationTurns >= nextPhotoTurn && newAffectionLevel !== 'stranger' && newAffectionLevel !== 'acquaintance') {
        shouldAutoSendPhoto = true;
        // 设置下一次发照片的时间（3-5轮后）
        nextPhotoTurn = newConversationTurns + Math.floor(Math.random() * 3) + 3;
      }

      const updatedState = {
        ...gameState,
        messages: [...gameState.messages, userMessage, {
          ...aiMessage,
          content: accumulatedContent
        }],
        conversationTurns: newConversationTurns,
        lastActiveTime: Date.now(),
        affectionScore: newAffectionScore,
        affectionLevel: newAffectionLevel,
        personality: newPersonality,
        userPreferences: newUserPreferences,
        nextPhotoTurn: nextPhotoTurn,
      };

      saveConversation(updatedState);

      // 如果需要自动发送照片
      if (shouldAutoSendPhoto) {
        setTimeout(() => {
          handleAutoSendPhoto(updatedState);
        }, 1000);
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, content: '抱歉，我遇到了一些问题，请稍后再试...' }
            : msg
        )
      );
    }
  };

  const handleAutoSendPhoto = async (currentState: GameState) => {
    try {
      // 根据好感度等级生成不同场景的自拍或生活照
      let scenePrompt = '';
      switch (currentState.affectionLevel) {
        case 'friend':
          scenePrompt = 'casual selfie photo, taking photo of herself, smiling naturally, daily life scene, natural lighting, holding phone selfie style';
          break;
        case 'close':
          scenePrompt = 'intimate daily life photo, cozy indoor setting, candid moment, soft natural light, relaxed pose, warm atmosphere';
          break;
        case 'lover':
          scenePrompt = 'romantic selfie, loving gaze, gentle smile, intimate moment, warm lighting, natural beauty, wearing comfortable casual clothes';
          break;
        default:
          scenePrompt = 'simple daily life photo, natural standing pose, smiling, bright natural lighting, casual everyday setting';
      }

      const response = await fetch('/api/generate-photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: scenePrompt,
          referenceImage: currentState.girlfriendPhoto,
          gameState: currentState,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const photoMessage: Message = {
          id: `photo-${Date.now()}`,
          role: 'assistant',
          content: `给你看看我刚才拍的自拍吧～\n\n![照片](${data.imageUrl})`,
          timestamp: Date.now(),
        };

        setMessages(prev => [...prev, photoMessage]);

        const updatedState = {
          ...currentState,
          messages: [...currentState.messages, photoMessage],
          unlockedPhotos: [...currentState.unlockedPhotos, data.imageUrl],
          lastActiveTime: Date.now(),
        };

        saveConversation(updatedState);
      }
    } catch (error) {
      console.error('Failed to auto send photo:', error);
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

    if (gameState.affectionLevel === 'stranger' || gameState.affectionLevel === 'acquaintance') {
      alert('好感度还不够高，多聊聊天解锁照片功能吧！\n\n当前好感度: ' + gameState.affectionScore + '\n需要达到朋友等级（好感度≥40）才能生成照片。');
      return;
    }

    setIsGeneratingPhoto(true);

    try {
      let scenePrompt = '';
      switch (gameState.affectionLevel) {
        case 'friend':
          scenePrompt = 'casual selfie photo, taking photo of herself, smiling naturally, daily life scene, natural lighting, holding phone selfie style';
          break;
        case 'close':
          scenePrompt = 'intimate daily life photo, cozy indoor setting, candid moment, soft natural light, relaxed pose, warm atmosphere';
          break;
        case 'lover':
          scenePrompt = 'romantic selfie, loving gaze, gentle smile, intimate moment, warm lighting, natural beauty, wearing comfortable casual clothes';
          break;
        default:
          scenePrompt = 'simple daily life photo, natural standing pose, smiling, bright natural lighting, casual everyday setting';
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
        const photoMessage: Message = {
          id: `photo-${Date.now()}`,
          role: 'assistant',
          content: `给你看看我刚才拍的自拍吧～\n\n![照片](${data.imageUrl})`,
          timestamp: Date.now(),
        };

        setMessages(prev => [...prev, photoMessage]);

        const updatedState = {
          ...gameState,
          messages: [...gameState.messages, photoMessage],
          unlockedPhotos: [...gameState.unlockedPhotos, data.imageUrl],
          lastActiveTime: Date.now(),
        };

        saveConversation(updatedState);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-rose-100 to-purple-100 dark:from-pink-950/30 dark:via-rose-950/30 dark:to-purple-950/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-pink-700 dark:text-pink-300">加载中...</p>
        </div>
      </div>
    );
  }

  const personality = GIRLFRIEND_TYPES[gameState.girlfriendType];
  const affectionLevel = AFFECTION_LEVELS[gameState.affectionLevel];

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-900 text-gray-100' 
        : 'bg-gradient-to-br from-pink-100 via-rose-100 to-purple-100'
    }`}>
      {/* 微信风格顶部导航栏 */}
      <div className={`flex items-center justify-between px-4 py-3 ${
        isDarkMode 
          ? 'bg-gray-800 border-b border-gray-700' 
          : 'bg-gradient-to-r from-pink-500 to-rose-500'
      }`}>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.push('/')}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="p-0 h-auto hover:bg-white/20"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={gameState.girlfriendPhoto} alt={gameState.girlfriendName} />
                <AvatarFallback className="bg-pink-200 text-pink-700">
                  {gameState.girlfriendName.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </Button>
            <div>
              <h3 className="font-semibold text-white">{gameState.girlfriendName}</h3>
              <p className="text-xs text-white/80">{personality.name}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHistory(true)}
            className="text-white hover:bg-white/20"
            title="查看历史记录"
          >
            <History className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSidebar(!showSidebar)}
            className="text-white hover:bg-white/20"
            title="好友信息"
          >
            <User className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="text-white hover:bg-white/20"
            title="切换主题"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 主聊天区域 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 消息列表 - 微信风格 */}
          <ScrollArea className="flex-1 px-4 py-4">
            <div className="space-y-4 max-w-3xl mx-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <Button
                      variant="ghost"
                      className="p-0 h-10 w-10 flex-shrink-0 mr-3 hover:bg-white/10"
                      onClick={() => setShowSidebar(!showSidebar)}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={gameState.girlfriendPhoto} />
                        <AvatarFallback className="bg-pink-200 text-pink-700 text-sm">
                          {gameState.girlfriendName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  )}
                  <div className={`max-w-[70%] ${message.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                    <div
                      className={`px-4 py-3 shadow-sm ${
                        message.role === 'user'
                          ? 'bg-[#95EC69] text-black rounded-tr-sm'
                          : message.role === 'system'
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-800 rounded-sm'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm'
                      }`}
                    >
                      {/* 消息内容渲染 */}
                      {message.role === 'assistant' && message.content.includes('![') ? (
                        // 检测是否包含图片Markdown并渲染
                        <div className="text-sm leading-relaxed">
                          {(() => {
                            const parts = message.content.split(/!\[([^\]]*)\]\(([^)]+)\)/g);
                            return parts.map((part, index) => {
                              if (index % 3 === 1) {
                                // 图片alt文本
                                return null;
                              } else if (index % 3 === 2) {
                                // 图片URL
                                return (
                                  <div key={index} className="mt-2 mb-2">
                                    <img 
                                      src={part} 
                                      alt="私密照片" 
                                      className="max-w-full rounded-lg shadow-md"
                                      loading="lazy"
                                    />
                                  </div>
                                );
                              } else if (part) {
                                // 普通文本
                                return (
                                  <p key={index} className="whitespace-pre-wrap">
                                    {part}
                                  </p>
                                );
                              }
                              return null;
                            });
                          })()}
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
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
                          <Volume2 className="w-3 h-3 text-gray-400" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <Avatar className="w-10 h-10 flex-shrink-0 ml-3">
                      <AvatarFallback className="bg-blue-500 text-white text-sm">
                        <User className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* 输入区域 - 微信风格 */}
          <div className={`p-3 border-t ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="max-w-3xl mx-auto flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleGeneratePhoto}
                disabled={isGeneratingPhoto}
                className="flex-shrink-0"
              >
                <Camera className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </Button>
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
                className="flex-shrink-0 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* 侧边栏 - 可折叠 */}
        {showSidebar && (
          <div className={`w-80 flex-shrink-0 border-l ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          } overflow-y-auto`}>
            <div className="p-4 space-y-6">
              {/* 女友信息 */}
              <div className="text-center">
                <Avatar className="w-24 h-24 mx-auto mb-3 border-4 border-pink-300 dark:border-pink-700">
                  <AvatarImage src={gameState.girlfriendPhoto} alt={gameState.girlfriendName} />
                  <AvatarFallback className="bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900 dark:to-purple-900 text-2xl">
                    {gameState.girlfriendName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-semibold">{gameState.girlfriendName}</h3>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge variant="secondary">{gameState.girlfriendAge}岁</Badge>
                  <Badge className="bg-gradient-to-r from-pink-500 to-purple-500">
                    {personality.name}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* 好感度 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                    <span className="font-semibold">好感度</span>
                  </div>
                  <Badge variant="outline">{affectionLevel.name}</Badge>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-2xl font-bold ${
                    gameState.affectionScore >= 60 ? 'text-pink-500' :
                    gameState.affectionScore >= 0 ? 'text-blue-500' : 'text-red-500'
                  }`}>
                    {gameState.affectionScore}
                  </span>
                  <span className="text-xs text-muted-foreground">/ 100</span>
                </div>
                <Progress 
                  value={((gameState.affectionScore + 20) / 120) * 100}
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
                  <div className="text-xs text-muted-foreground">私密照片</div>
                </div>
              </div>

              <Separator />

              {/* 私密照片解锁说明 */}
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                  <ImageIcon className="w-4 h-4 text-purple-500" />
                  如何解锁私密照片
                </h4>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-pink-500">•</span>
                    <span>初始赠送2张照片</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-500">•</span>
                    <span>每3-5轮对话会自动发送一张自拍或生活照</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-500">•</span>
                    <span>达到"朋友"等级(好感度≥40)可手动点击相机按钮生成</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-500">•</span>
                    <span>好感度越高，照片越亲密浪漫</span>
                  </li>
                </ul>
              </div>

              <Separator />

              {/* 最近对话摘要 */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  最近对话
                </h4>
                <div className="space-y-2">
                  {messages.slice(-3).reverse().filter(m => m.role !== 'system').map((msg) => (
                    <div key={msg.id} className={`p-2 rounded text-xs ${
                      msg.role === 'user' 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-right' 
                        : 'bg-pink-50 dark:bg-pink-900/20'
                    }`}>
                      <div className="font-semibold mb-1">
                        {msg.role === 'user' ? '我' : gameState.girlfriendName}
                      </div>
                      <div className="text-muted-foreground line-clamp-2">
                        {msg.content}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 历史记录对话框 */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-pink-500" />
              聊天历史记录
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="w-8 h-8 flex-shrink-0 mr-2">
                      <AvatarImage src={gameState?.girlfriendPhoto} />
                      <AvatarFallback className="bg-pink-200 text-pink-700 text-xs">
                        {gameState?.girlfriendName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[80%] ${message.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                    <div
                      className={`px-3 py-2 shadow-sm ${
                        message.role === 'user'
                          ? 'bg-[#95EC69] text-black rounded-tr-sm'
                          : message.role === 'system'
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-800 rounded-sm'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm'
                      }`}
                    >
                      {/* 消息内容渲染 */}
                      {message.role === 'assistant' && message.content.includes('![') ? (
                        // 检测是否包含图片Markdown并渲染
                        <div className="text-sm leading-relaxed">
                          {(() => {
                            const parts = message.content.split(/!\[([^\]]*)\]\(([^)]+)\)/g);
                            return parts.map((part, index) => {
                              if (index % 3 === 1) {
                                // 图片alt文本
                                return null;
                              } else if (index % 3 === 2) {
                                // 图片URL
                                return (
                                  <div key={index} className="mt-2 mb-2">
                                    <img 
                                      src={part} 
                                      alt="私密照片" 
                                      className="max-w-full rounded-lg shadow-md"
                                      loading="lazy"
                                    />
                                  </div>
                                );
                              } else if (part) {
                                // 普通文本
                                return (
                                  <p key={index} className="whitespace-pre-wrap">
                                    {part}
                                  </p>
                                );
                              }
                              return null;
                            });
                          })()}
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(message.timestamp).toLocaleString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <Avatar className="w-8 h-8 flex-shrink-0 ml-2">
                      <AvatarFallback className="bg-blue-500 text-white text-xs">
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
