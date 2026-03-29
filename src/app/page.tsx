'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, ArrowRight, Sparkles, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-100 to-purple-100 dark:from-pink-950/30 dark:via-rose-950/30 dark:to-purple-950/30 flex items-center justify-center p-8">
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
            {/* 主按钮 */}
            <Button
              onClick={() => router.push('/conversations')}
              size="lg"
              className="w-full h-16 text-lg bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 gap-3 shadow-lg"
            >
              <Sparkles className="w-6 h-6" />
              开启你的专属浪漫之旅
              <ArrowRight className="w-6 h-6" />
            </Button>

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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
