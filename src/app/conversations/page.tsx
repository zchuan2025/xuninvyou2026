'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Heart, 
  MessageCircle, 
  Plus, 
  Trash2, 
  Clock,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Conversation } from '@/types';

export default function ConversationsPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // 加载会话列表
  useEffect(() => {
    const savedConversations = localStorage.getItem('conversations');
    if (savedConversations) {
      const parsed = JSON.parse(savedConversations) as Conversation[];
      // 按更新时间排序
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
  };

  // 打开会话
  const handleOpenConversation = (conversation: Conversation) => {
    localStorage.setItem('gameState', JSON.stringify(conversation.gameState));
    localStorage.setItem('currentConversationId', conversation.id);
    router.push('/game');
  };

  // 创建新会话
  const handleCreateNew = () => {
    localStorage.removeItem('gameState');
    localStorage.removeItem('currentConversationId');
    router.push('/setup');
  };

  // 过滤会话
  const filteredConversations = conversations.filter(conv =>
    conv.gameState.girlfriendName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-100 to-purple-100 dark:from-pink-950/30 dark:via-rose-950/30 dark:to-purple-950/30 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* 头部 */}
        <Card className="shadow-2xl border-pink-200 dark:border-pink-800 mb-6">
          <CardHeader className="text-center pb-6 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 rounded-t-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Heart className="w-8 h-8 text-white fill-white animate-pulse" />
              <CardTitle className="text-3xl font-bold text-white">
                Digital Romance
              </CardTitle>
              <Heart className="w-8 h-8 text-white fill-white animate-pulse" />
            </div>
            <CardDescription className="text-base text-white/90">
              我的浪漫互动记录 💕
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="搜索女友名字..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-pink-200 dark:border-pink-800 rounded-lg focus:outline-none focus:border-pink-500 dark:focus:border-pink-500 bg-white dark:bg-gray-900"
                />
              </div>
              <Button
                onClick={handleCreateNew}
                className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 gap-2 px-6 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                新建女友
              </Button>
            </div>

            {/* 会话列表 */}
            {filteredConversations.length === 0 ? (
              <div className="text-center py-16">
                {searchQuery ? (
                  <div>
                    <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-lg">没有找到匹配的会话</p>
                  </div>
                ) : (
                  <div>
                    <Sparkles className="w-16 h-16 text-pink-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">还没有创建任何会话</p>
                    <Button
                      onClick={handleCreateNew}
                      className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      创建第一个女友
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredConversations.map((conversation) => {
                  const state = conversation.gameState;
                  const lastMessage = state.messages[state.messages.length - 1];
                  return (
                    <Card
                      key={conversation.id}
                      className="cursor-pointer hover:shadow-xl transition-all border-pink-200 dark:border-pink-800 hover:border-pink-400 dark:hover:border-pink-600 group"
                      onClick={() => handleOpenConversation(conversation)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-14 h-14 border-2 border-pink-300 dark:border-pink-700">
                              <AvatarImage src={state.girlfriendPhoto} alt={state.girlfriendName} />
                              <AvatarFallback className="bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900 dark:to-purple-900 text-lg">
                                {state.girlfriendName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg truncate">{state.girlfriendName}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  {state.girlfriendAge}岁
                                </span>
                                <span className="text-xs text-pink-600 dark:text-pink-400">
                                  {state.affectionLevel}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => handleDeleteConversation(conversation.id, e)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {lastMessage && lastMessage.content && (
                            <div className="p-2 bg-pink-50 dark:bg-pink-950/20 rounded-lg">
                              <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                                {lastMessage.content}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatTime(conversation.updatedAt)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>{state.conversationTurns}轮</span>
                              <span>•</span>
                              <span>{state.unlockedPhotos.length}张照片</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
