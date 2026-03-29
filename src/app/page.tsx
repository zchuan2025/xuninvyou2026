'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // 重定向到会话列表页面
    router.replace('/conversations');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-rose-100 to-purple-100 dark:from-pink-950/30 dark:via-rose-950/30 dark:to-purple-950/30">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
        <p className="text-pink-700 dark:text-pink-300">加载中...</p>
      </div>
    </div>
  );
}
