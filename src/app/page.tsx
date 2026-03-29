'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Heart, 
  MessageCircle, 
  Plus, 
  Trash2, 
  Clock,
  ArrowRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Play
} from 'lucide-react';
import { Conversation } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  // 加载会话列表
  useEffect(() => {
    const savedConversations = localStorage.getItem('conversations');
    if (savedConversations) {
      const parsed = JSON.parse(savedConversations) as Conversation[];
      parsed.sort((a, b) => b.updatedAt - a.updatedAt);
      setConversations(parsed);
    }
  }, []);

  // 删除会话
  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个会话吗？所有对话记录将无法恢复。')) {
      return;
    }

    const updatedConversations = conversations.filter(conv => conv.id !== id);
    setConversations(updatedConversations);
    localStorage.setItem('conversations', JSON.stringify(updatedConversations));
    if (selectedConversation?.id === id) {
      setSelectedConversation(null);
    }
  };

  // 打开会话
  const handleOpenConversation = (conversation: Conversation) => {
    localStorage.setItem('gameState', JSON.stringify(conversation.gameState));
    localStorage.setItem('currentConversationId', conversation.id);
    router.push('/game');
  };

  // 开始创建新女友
  const handleCreateNew = () => {
    router.push('/setup');
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return new Date(timestamp).toLocaleDateString('zh-CN');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-100 to-purple-100 dark:from-pink-950/30 dark:via-rose-950/30 dark:to-purple-950/30 flex">
      {/* 左侧会话历史（可折叠） */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} border-r border-pink-200 dark:border-pink-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-all duration-300 flex flex-col`}>
        {/* 侧边栏头部 */}
        <div className="p-4 border-b border-pink-200 dark:border-pink-800 flex items-center justify-between">
          {!sidebarCollapsed && (
            <h2 className="font-semibold text-pink-700 dark:text-pink-300 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              历史记录
            </h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="ml-auto"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {/* 会话列表 */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {!sidebarCollapsed && (
              <Button
                onClick={handleCreateNew}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 gap-2 mb-4"
              >
                <Plus className="w-4 h-4" />
                新建女友
              </Button>
            )}

            {conversations.length === 0 ? (
              !sidebarCollapsed && (
                <div className="text-center py-8 px-4">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">还没有互动记录</p>
                </div>
              )
            ) : (
              conversations.slice(0, 10).map((conversation) => {
                const state = conversation.gameState;
                const lastMessage = state.messages[state.messages.length - 1];
                return (
                  <Card
                    key={conversation.id}
                    className={`cursor-pointer hover:shadow-md transition-all border-pink-200 dark:border-pink-800 hover:border-pink-400 dark:hover:border-pink-600 ${
                      selectedConversation?.id === conversation.id ? 'border-pink-500 ring-2 ring-pink-200 dark:ring-pink-800' : ''
                    }`}
                    onClick={() => {
                      setSelectedConversation(conversation);
                      handleOpenConversation(conversation);
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <Avatar className={`w-10 h-10 flex-shrink-0 ${sidebarCollapsed ? 'w-8 h-8' : ''}`}>
                          <AvatarImage src={state.girlfriendPhoto} alt={state.girlfriendName} />
                          <AvatarFallback className="bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900 dark:to-purple-900 text-sm">
                            {state.girlfriendName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {!sidebarCollapsed && (
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-sm truncate">{state.girlfriendName}</h4>
                              <span className="text-xs text-pink-600 dark:text-pink-400">{state.affectionLevel}</span>
                            </div>
                            {lastMessage && lastMessage.content && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mb-1">
                                {lastMessage.content}
                              </p>
                            )}
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                              <span>{formatTime(conversation.updatedAt)}</span>
                            </div>
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`opacity-0 hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50 h-6 w-6 flex-shrink-0`}
                          onClick={(e) => handleDeleteConversation(conversation.id, e)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* 右侧主内容区 */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-2xl shadow-2xl border-pink-200 dark:border-pink-800">
          <div className="text-center pb-8 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 rounded-t-lg">
            <div className="pt-12 pb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Heart className="w-12 h-12 text-white fill-white animate-pulse" />
                <h1 className="text-5xl font-bold text-white">
                  Digital Romance
                </h1>
                <Heart className="w-12 h-12 text-white fill-white animate-pulse" />
              </div>
              <p className="text-xl text-white/90 mb-2">
                开启你的专属浪漫之旅 💕
              </p>
              <p className="text-sm text-white/70">
                与AI女友互动，体验自由推演的恋爱故事
              </p>
            </div>
          </div>

          <CardContent className="pt-12 pb-12 px-12">
            <div className="space-y-6">
              {/* 快速开始按钮 */}
              <div className="space-y-3">
                <Button
                  onClick={handleCreateNew}
                  size="lg"
                  className="w-full h-16 text-lg bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 gap-3 shadow-lg"
                >
                  <Sparkles className="w-6 h-6" />
                  创建你的专属女友
                  <ArrowRight className="w-6 h-6" />
                </Button>
              </div>

              {/* 特性说明 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
                <div className="text-center p-4 rounded-xl bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800">
                  <Heart className="w-8 h-8 text-pink-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-pink-700 dark:text-pink-300 mb-2">多性格选择</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    温柔、傲娇、御姐、活泼、神秘
                  </p>
                </div>

                <div className="text-center p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800">
                  <MessageCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-rose-700 dark:text-rose-300 mb-2">自由对话</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    剧情自由推演，发展属于你们的故事
                  </p>
                </div>

                <div className="text-center p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                  <Sparkles className="w-8 h-8 text-purple-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">私密照片</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    自动发送自拍，记录美好时刻
                  </p>
                </div>
              </div>

              {/* 历史记录提示 */}
              {conversations.length > 0 && (
                <div className="pt-8 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    或者继续之前的互动
                  </p>
                  <div className="flex items-center justify-center gap-2 text-pink-600 dark:text-pink-400">
                    <span className="text-sm">查看左侧历史记录</span>
                    <ChevronLeft className="w-4 h-4" />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
