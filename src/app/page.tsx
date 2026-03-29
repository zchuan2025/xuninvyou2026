'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Image as ImageIcon, Sparkles, ArrowRight, Upload } from 'lucide-react';
import { 
  GirlfriendType, 
  GIRLFRIEND_TYPES, 
  StoryLine, 
  STORY_LINES, 
  GameState, 
  createInitialGameState 
} from '@/types';

export default function SetupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  
  // 女友信息
  const [selectedType, setSelectedType] = useState<GirlfriendType>('gentle');
  const [girlfriendName, setGirlfriendName] = useState('');
  const [girlfriendAge, setGirlfriendAge] = useState<number>(22);
  const [girlfriendPhoto, setGirlfriendPhoto] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  // 故事线
  const [selectedStoryLine, setSelectedStoryLine] = useState<StoryLine>(STORY_LINES[0]);
  
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

    // 保存到 localStorage
    localStorage.setItem('gameState', JSON.stringify(gameState));
    
    // 跳转到主界面
    router.push('/game');
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="w-8 h-8 text-pink-500 fill-pink-500" />
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Digital Romance
            </CardTitle>
          </div>
          <CardDescription className="text-base">
            开启你的专属 AI 互动之旅
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* 进度指示器 */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    currentStep >= step 
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}
                >
                  {currentStep > step ? '✓' : step}
                </div>
                {step < 3 && (
                  <div 
                    className={`w-12 h-1 rounded-full transition-all ${
                      currentStep > step 
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500' 
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* 步骤 1: 选择女友类型 */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  选择她的性格类型
                </h3>
                <RadioGroup 
                  value={selectedType} 
                  onValueChange={(value) => setSelectedType(value as GirlfriendType)}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {(Object.keys(GIRLFRIEND_TYPES) as GirlfriendType[]).map((type) => (
                    <div
                      key={type}
                      className={`relative p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-lg ${
                        selectedType === type
                          ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'
                      }`}
                    >
                      <RadioGroupItem value={type} id={type} className="sr-only" />
                      <Label htmlFor={type} className="cursor-pointer">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-lg">
                            {GIRLFRIEND_TYPES[type].name}
                          </h4>
                          {selectedType === type && (
                            <div className="w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {GIRLFRIEND_TYPES[type].description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {GIRLFRIEND_TYPES[type].personality.map((trait) => (
                            <span
                              key={trait}
                              className="px-2 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                            >
                              {trait}
                            </span>
                          ))}
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">她的名字</Label>
                  <Input
                    id="name"
                    placeholder="输入她的名字"
                    value={girlfriendName}
                    onChange={(e) => setGirlfriendName(e.target.value)}
                    className="text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">年龄: {girlfriendAge}</Label>
                  <Input
                    id="age"
                    type="range"
                    min="18"
                    max="35"
                    value={girlfriendAge}
                    onChange={(e) => setGirlfriendAge(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>18岁</span>
                    <span>35岁</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={nextStep} size="lg" className="gap-2">
                  下一步
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* 步骤 2: 选择照片 */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-blue-500" />
                  选择她的照片
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  这张照片将作为她的形象基准，后续生成的照片都会参考这张照片的面部特征
                </p>
              </div>

              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <Avatar className="w-48 h-48 border-4 border-pink-200 dark:border-pink-800">
                    {girlfriendPhoto ? (
                      <AvatarImage src={girlfriendPhoto} alt="女友照片" className="object-cover" />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900 dark:to-purple-900">
                        <Upload className="w-16 h-16 text-muted-foreground" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {girlfriendPhoto && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 rounded-full"
                      onClick={() => {
                        setGirlfriendPhoto('');
                        setPhotoFile(null);
                      }}
                    >
                      ✕
                    </Button>
                  )}
                </div>

                <div className="w-full max-w-md">
                  <Label htmlFor="photo-upload" className="cursor-pointer">
                    <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-pink-500 transition-colors">
                      <Upload className="w-5 h-5" />
                      <span>{photoFile ? photoFile.name : '点击上传照片'}</span>
                    </div>
                  </Label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    支持 JPG、PNG 格式，建议上传正面清晰照片
                  </p>
                </div>
              </div>

              <div className="flex justify-between">
                <Button onClick={prevStep} variant="outline" size="lg">
                  上一步
                </Button>
                <Button onClick={nextStep} disabled={!girlfriendPhoto} size="lg" className="gap-2">
                  下一步
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* 步骤 3: 选择故事线 */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-green-500" />
                  选择初始故事线
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  故事线只是背景，后续发展完全由你们的互动自由推演
                </p>
              </div>

              <Tabs defaultValue={selectedStoryLine.id} className="w-full">
                <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-gray-100 dark:bg-gray-800">
                  {STORY_LINES.slice(0, 5).map((story) => (
                    <TabsTrigger
                      key={story.id}
                      value={story.id}
                      onClick={() => setSelectedStoryLine(story)}
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white text-xs py-2"
                    >
                      {story.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-gray-100 dark:bg-gray-800 mt-2">
                  {STORY_LINES.slice(5).map((story) => (
                    <TabsTrigger
                      key={story.id}
                      value={story.id}
                      onClick={() => setSelectedStoryLine(story)}
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white text-xs py-2"
                    >
                      {story.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {STORY_LINES.map((story) => (
                  <TabsContent key={story.id} value={story.id} className="mt-6">
                    <Card className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-pink-200 dark:border-pink-800">
                      <CardHeader>
                        <CardTitle className="text-xl">{story.name}</CardTitle>
                        <CardDescription>{story.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                          <p className="text-sm leading-relaxed italic text-gray-700 dark:text-gray-300">
                            "{story.initialScenario}"
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>

              <div className="flex justify-between">
                <Button onClick={prevStep} variant="outline" size="lg">
                  上一步
                </Button>
                <Button 
                  onClick={handleStartGame} 
                  size="lg" 
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 gap-2 px-8"
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
