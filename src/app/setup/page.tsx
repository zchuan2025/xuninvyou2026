'use client';

import { useEffect, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { 
  Heart, 
  MessageCircle, 
  Image as ImageIcon, 
  Sparkles, 
  ArrowRight, 
  Upload, 
  Camera,
  Check,
  X,
  ArrowLeft
} from 'lucide-react';
import { 
  GirlfriendType, 
  GIRLFRIEND_TYPES, 
  StoryLine, 
  STORY_LINES, 
  GameState, 
  createInitialGameState 
} from '@/types';

const TYPE_CARD_STYLES: Record<
  GirlfriendType,
  {
    gradient: string;
    spotlight: string;
    aura: string;
    chip: string;
    badge: string;
  }
> = {
  gentle: {
    gradient:
      'from-rose-200/70 via-white/45 to-fuchsia-200/65 dark:from-rose-400/20 dark:via-white/5 dark:to-fuchsia-400/20',
    spotlight: 'rgba(251, 113, 133, 0.18)',
    aura: 'bg-rose-300/35 dark:bg-rose-400/20',
    chip: 'bg-rose-100/90 text-rose-700 dark:bg-rose-950/60 dark:text-rose-200',
    badge: 'bg-rose-500/12 text-rose-700 dark:text-rose-200',
  },
  tsundere: {
    gradient:
      'from-orange-200/70 via-white/35 to-pink-200/70 dark:from-orange-400/20 dark:via-white/5 dark:to-pink-400/20',
    spotlight: 'rgba(251, 146, 60, 0.18)',
    aura: 'bg-orange-300/35 dark:bg-orange-400/20',
    chip: 'bg-orange-100/90 text-orange-700 dark:bg-orange-950/60 dark:text-orange-200',
    badge: 'bg-orange-500/12 text-orange-700 dark:text-orange-200',
  },
  mature: {
    gradient:
      'from-violet-200/70 via-white/30 to-indigo-200/70 dark:from-violet-400/22 dark:via-white/5 dark:to-indigo-400/22',
    spotlight: 'rgba(167, 139, 250, 0.2)',
    aura: 'bg-violet-300/35 dark:bg-violet-400/20',
    chip: 'bg-violet-100/90 text-violet-700 dark:bg-violet-950/60 dark:text-violet-200',
    badge: 'bg-violet-500/12 text-violet-700 dark:text-violet-200',
  },
  lively: {
    gradient:
      'from-amber-200/75 via-white/35 to-yellow-200/70 dark:from-amber-400/22 dark:via-white/5 dark:to-yellow-400/20',
    spotlight: 'rgba(250, 204, 21, 0.18)',
    aura: 'bg-amber-300/35 dark:bg-amber-400/20',
    chip: 'bg-amber-100/90 text-amber-700 dark:bg-amber-950/60 dark:text-amber-200',
    badge: 'bg-amber-500/12 text-amber-700 dark:text-amber-200',
  },
  mysterious: {
    gradient:
      'from-cyan-200/65 via-white/30 to-fuchsia-200/70 dark:from-cyan-400/18 dark:via-white/5 dark:to-fuchsia-400/18',
    spotlight: 'rgba(34, 211, 238, 0.18)',
    aura: 'bg-cyan-300/30 dark:bg-cyan-400/18',
    chip: 'bg-cyan-100/90 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-200',
    badge: 'bg-cyan-500/12 text-cyan-700 dark:text-cyan-200',
  },
};

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);

    return () => {
      mediaQuery.removeEventListener('change', updatePreference);
    };
  }, []);

  return prefersReducedMotion;
}

function GirlfriendTypeCard({
  type,
  selected,
  typeData,
}: {
  type: GirlfriendType;
  selected: boolean;
  typeData: (typeof GIRLFRIEND_TYPES)[GirlfriendType];
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({
    rotateX: 0,
    rotateY: 0,
    spotlightX: 50,
    spotlightY: 50,
  });
  const shouldReduceMotion = usePrefersReducedMotion();
  const cardStyle = TYPE_CARD_STYLES[type];

  const handleMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const x = (event.clientX - rect.left - width / 2) / (width / 2);
    const y = (event.clientY - rect.top - height / 2) / (height / 2);

    setTilt({
      rotateX: Number((-y * 5).toFixed(2)),
      rotateY: Number((x * 5).toFixed(2)),
      spotlightX: Math.round(((event.clientX - rect.left) / width) * 100),
      spotlightY: Math.round(((event.clientY - rect.top) / height) * 100),
    });
  };

  const resetTilt = () => {
    setTilt({
      rotateX: 0,
      rotateY: 0,
      spotlightX: 50,
      spotlightY: 50,
    });
    setIsHovered(false);
  };

  const transformStyle: CSSProperties = shouldReduceMotion
    ? {}
    : {
        transform: `perspective(1100px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) translateY(${
          selected || isHovered ? -6 : 0
        }px) scale(${selected ? 1.015 : isHovered ? 1.005 : 1})`,
        transformStyle: 'preserve-3d',
        transition: isHovered
          ? 'transform 120ms linear'
          : 'transform 360ms cubic-bezier(0.22, 1, 0.36, 1)',
      };

  return (
    <div style={{ perspective: '1100px' }}>
      <div
        className="group relative"
        style={transformStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={resetTilt}
        onMouseMove={handleMouseMove}
      >
        <div
          className={`relative overflow-hidden rounded-3xl border transition-all duration-500 ${
            selected
              ? 'border-pink-400/80 bg-white/95 shadow-[0_18px_45px_-20px_rgba(244,114,182,0.65)] dark:border-pink-500/60 dark:bg-gray-950/85'
              : 'border-pink-200/80 bg-white/85 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.28)] dark:border-pink-900/70 dark:bg-gray-950/65'
          }`}
        >
          <div
            className={`absolute inset-0 bg-gradient-to-br ${cardStyle.gradient} transition-opacity duration-500 ${
              selected || isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          />
          <div
            className={`absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl transition-opacity duration-500 ${
              cardStyle.aura
            } ${selected || isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          />
          <div
            className="absolute inset-0 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle at ${tilt.spotlightX}% ${tilt.spotlightY}%, ${cardStyle.spotlight}, transparent 42%)`,
              opacity: shouldReduceMotion ? 0.18 : selected || isHovered ? 1 : 0,
            }}
          />
          <GlowingEffect
            blur={0}
            borderWidth={selected ? 2 : 1}
            className={selected ? 'opacity-100' : 'opacity-80'}
            disabled={false}
            inactiveZone={0.18}
            movementDuration={0.7}
            proximity={92}
            spread={34}
          />

          <div
            className={`absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 ${
              selected
                ? 'border-pink-400/80 bg-pink-500 text-white shadow-lg shadow-pink-500/30'
                : 'border-white/60 bg-white/55 text-pink-500 opacity-0 backdrop-blur-md group-hover:opacity-100 dark:border-white/10 dark:bg-white/5'
            }`}
          >
            {selected ? <Check className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          </div>

          <RadioGroupItem value={type} id={type} className="sr-only" />

          <Label htmlFor={type} className="relative z-10 block cursor-pointer p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div
                  className={`mb-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] backdrop-blur-sm ${cardStyle.badge}`}
                >
                  Romance Persona
                </div>
                <h4
                  className={`text-lg font-semibold tracking-tight transition-transform duration-300 ${
                    selected || isHovered ? 'translate-x-0.5' : ''
                  } text-pink-700 dark:text-pink-200`}
                >
                  {typeData.name}
                </h4>
              </div>
            </div>

            <p className="mb-4 text-sm leading-6 text-gray-600 dark:text-gray-300">
              {typeData.description}
            </p>

            <div className="mb-4 flex flex-wrap gap-1.5">
              {typeData.personality.map((trait, index) => (
                <span
                  key={trait}
                  className={`rounded-full px-2.5 py-1 text-xs transition-all duration-300 ${cardStyle.chip} ${
                    selected || isHovered ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-80'
                  }`}
                  style={{ transitionDelay: `${index * 45}ms` }}
                >
                  {trait}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="truncate">默认名字：{typeData.defaultNames.slice(0, 2).join(' · ')}</span>
              <span
                className={`shrink-0 rounded-full px-2 py-1 font-medium transition-colors ${
                  selected
                    ? 'bg-pink-500/12 text-pink-700 dark:text-pink-200'
                    : 'bg-black/5 text-gray-500 dark:bg-white/5 dark:text-gray-400'
                }`}
              >
                {selected ? '已选择' : '点击选择'}
              </span>
            </div>
          </Label>
        </div>
      </div>
    </div>
  );
}

export default function SetupPage() {
  const router = useRouter();
  
  // 步骤状态（0: 性格选择, 1: 照片选择, 2: 故事线选择）
  const [currentPhase, setCurrentPhase] = useState(0);
  
  // 女友信息
  const [selectedType, setSelectedType] = useState<GirlfriendType>('gentle');
  const [girlfriendName, setGirlfriendName] = useState('');
  const [girlfriendAge, setGirlfriendAge] = useState<number>(22);
  const [girlfriendPhoto, setGirlfriendPhoto] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isGeneratingPhotos, setIsGeneratingPhotos] = useState(false);
  const [generatedPhotos, setGeneratedPhotos] = useState<string[]>([]);
  
  // 故事线
  const [selectedStoryLine, setSelectedStoryLine] = useState<StoryLine>(STORY_LINES[0]);

  // 处理名字选择
  const personality = GIRLFRIEND_TYPES[selectedType];
  const handleNameChange = (value: string) => {
    setGirlfriendName(value);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setGirlfriendPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGeneratePhotos = async () => {
    setIsGeneratingPhotos(true);
    setGeneratedPhotos([]);
    
    try {
      const response = await fetch('/api/generate-avatar-photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalityType: selectedType,
        }),
      });

      const data = await response.json();

      if (data.success && data.photos) {
        setGeneratedPhotos(data.photos);
      }
    } catch (error) {
      console.error('Failed to generate photos:', error);
      alert('照片生成失败，请稍后再试');
    } finally {
      setIsGeneratingPhotos(false);
    }
  };

  const handleSelectGeneratedPhoto = (photoUrl: string) => {
    setGirlfriendPhoto(photoUrl);
    setPhotoFile(null);
  };

  const handleStartGame = () => {
    if (!girlfriendName.trim()) {
      alert('请输入女友名字');
      return;
    }
    
    if (!girlfriendPhoto) {
      alert('请选择女友照片');
      return;
    }

    const gameState: GameState = {
      ...createInitialGameState(),
      girlfriendType: selectedType,
      girlfriendName: girlfriendName.trim(),
      girlfriendAge,
      girlfriendPhoto,
      storyLine: selectedStoryLine,
      isGameStarted: true,
    };

    // 创建新会话
    const conversationId = `conv-${Date.now()}`;
    const newConversation = {
      id: conversationId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      gameState
    };

    // 保存会话到列表
    const savedConversations = localStorage.getItem('conversations');
    const conversations = savedConversations ? JSON.parse(savedConversations) : [];
    conversations.push(newConversation);
    localStorage.setItem('conversations', JSON.stringify(conversations));

    // 设置当前会话
    localStorage.setItem('gameState', JSON.stringify(gameState));
    localStorage.setItem('currentConversationId', conversationId);

    router.push('/game');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-100 to-purple-100 dark:from-pink-950/30 dark:via-rose-950/30 dark:to-purple-950/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-2xl border-pink-200 dark:border-pink-800">
        <CardHeader className="relative text-center pb-6 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 rounded-t-lg">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/conversations')}
            className="absolute left-4 top-4 text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="w-8 h-8 text-white fill-white animate-pulse" />
            <CardTitle className="text-3xl font-bold text-white">
              Digital Romance
            </CardTitle>
            <Heart className="w-8 h-8 text-white fill-white animate-pulse" />
          </div>
          <CardDescription className="text-base text-white/90">
            开启你的专属浪漫之旅 💕
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {/* 阶段 0: 选择女友类型和名字 */}
          {currentPhase === 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-pink-700 dark:text-pink-300">
                  <Sparkles className="w-5 h-5" />
                  选择她的性格
                </h3>
                <RadioGroup 
                  value={selectedType} 
                  onValueChange={(value) => {
                    setSelectedType(value as GirlfriendType);
                    // 切换性格时重置名字和照片
                    setGirlfriendName('');
                    setGirlfriendPhoto('');
                    setGeneratedPhotos([]);
                  }}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
                >
                  {(Object.keys(GIRLFRIEND_TYPES) as GirlfriendType[]).map((type) => {
                    const typeData = GIRLFRIEND_TYPES[type];
                    return (
                      <GirlfriendTypeCard
                        key={type}
                        selected={selectedType === type}
                        type={type}
                        typeData={typeData}
                      />
                    );
                  })}
                </RadioGroup>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-pink-700 dark:text-pink-300 font-semibold">她的名字</Label>
                  <Select value={girlfriendName} onValueChange={handleNameChange}>
                    <SelectTrigger id="name" className="text-lg">
                      <SelectValue placeholder="选择或输入名字" />
                    </SelectTrigger>
                    <SelectContent>
                      {personality.defaultNames.map((name) => (
                        <SelectItem key={name} value={name} className="text-lg">
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-pink-700 dark:text-pink-300 font-semibold">年龄: {girlfriendAge}岁</Label>
                  <Input
                    id="age"
                    type="range"
                    min="18"
                    max="35"
                    value={girlfriendAge}
                    onChange={(e) => setGirlfriendAge(Number(e.target.value))}
                    className="w-full h-2"
                  />
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>18岁</span>
                    <span>35岁</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => setCurrentPhase(1)} 
                  size="lg" 
                  className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 gap-2 px-8"
                >
                  下一步
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* 阶段 1: 选择照片 */}
          {currentPhase === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-pink-700 dark:text-pink-300">
                  <Camera className="w-5 h-5" />
                  选择她的照片
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  可以选择AI生成的照片，也可以上传你自己的照片
                </p>
              </div>

              {/* AI生成照片区域 */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleGeneratePhotos}
                    disabled={isGeneratingPhotos}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 gap-2"
                  >
                    <ImageIcon className="w-4 h-4" />
                    {isGeneratingPhotos ? '生成中...' : 'AI生成照片'}
                  </Button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {isGeneratingPhotos ? '正在为你生成3张照片...' : '一键生成3张不同风格的照片'}
                  </span>
                </div>

                {/* 生成的照片网格 */}
                {isGeneratingPhotos && (
                  <div className="grid grid-cols-3 gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-square rounded-lg" />
                    ))}
                  </div>
                )}

                {generatedPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {generatedPhotos.map((photo, index) => (
                      <div
                        key={index}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          girlfriendPhoto === photo
                            ? 'border-pink-500 ring-2 ring-pink-300'
                            : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'
                        }`}
                        onClick={() => handleSelectGeneratedPhoto(photo)}
                      >
                        <img
                          src={photo}
                          alt={`Generated photo ${index + 1}`}
                          className="w-full aspect-square object-cover"
                        />
                        {girlfriendPhoto === photo && (
                          <div className="absolute inset-0 bg-pink-500/20 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center">
                              <Check className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 上传照片区域 */}
              <div className="border-t border-pink-200 dark:border-pink-800 pt-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-40 h-40 border-4 border-pink-300 dark:border-pink-700">
                      {girlfriendPhoto ? (
                        <AvatarImage src={girlfriendPhoto} alt="女友照片" className="object-cover" />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900 dark:to-purple-900">
                          <Upload className="w-16 h-16 text-pink-400" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {girlfriendPhoto && photoFile && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 rounded-full h-8 w-8"
                        onClick={() => {
                          setGirlfriendPhoto('');
                          setPhotoFile(null);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="w-full max-w-md">
                    <Label htmlFor="photo-upload" className="cursor-pointer">
                      <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-pink-300 dark:border-pink-700 rounded-xl hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-950/20 transition-colors">
                        <Upload className="w-5 h-5 text-pink-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {photoFile ? photoFile.name : '点击上传你的照片'}
                        </span>
                      </div>
                    </Label>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                      支持 JPG、PNG 格式，建议上传正面清晰照片
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button 
                  onClick={() => setCurrentPhase(0)} 
                  variant="outline"
                  className="border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-300"
                >
                  上一步
                </Button>
                <Button 
                  onClick={() => setCurrentPhase(2)} 
                  disabled={!girlfriendPhoto}
                  size="lg" 
                  className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 gap-2 px-8"
                >
                  下一步
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* 阶段 2: 选择故事线 */}
          {currentPhase === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-pink-700 dark:text-pink-300">
                  <MessageCircle className="w-5 h-5" />
                  选择初始故事线
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  故事线只是背景，后续发展完全由你们的互动自由推演
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {STORY_LINES.map((story) => (
                  <div
                    key={story.id}
                    onClick={() => setSelectedStoryLine(story)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg ${
                      selectedStoryLine.id === story.id
                        ? 'border-pink-500 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20'
                        : 'border-pink-200 dark:border-pink-800 hover:border-pink-300 dark:hover:border-pink-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-pink-700 dark:text-pink-300">
                        {story.name}
                      </h4>
                      {selectedStoryLine.id === story.id && (
                        <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {story.description}
                    </p>
                    <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-pink-200 dark:border-pink-800">
                      <p className="text-xs leading-relaxed italic text-gray-700 dark:text-gray-300 line-clamp-2">
                        &ldquo;{story.initialScenario}&rdquo;
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between">
                <Button 
                  onClick={() => setCurrentPhase(1)} 
                  variant="outline"
                  className="border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-300"
                >
                  上一步
                </Button>
                <Button 
                  onClick={handleStartGame} 
                  size="lg" 
                  className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 gap-2 px-8"
                >
                  <Heart className="w-4 h-4 fill-white" />
                  开始恋爱之旅
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
