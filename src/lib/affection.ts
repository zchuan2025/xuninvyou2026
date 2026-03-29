import { AffectionLevel, PersonalityAxis, UserPreference } from '@/types';

/**
 * 计算好感度变化
 * 基于对话长度、情绪关键词等因素
 */
export function calculateAffectionChange(
  message: string,
  currentAffection: number,
  isPositiveInteraction: boolean = true
): number {
  let change = 0;

  // 基础好感度变化
  if (isPositiveInteraction) {
    change += 0.5; // 每次正常互动增加 0.5
  }

  // 情绪关键词加分
  const positiveKeywords = ['喜欢', '爱', '开心', '幸福', '快乐', '美好', '想念', '想见', '关心'];
  const negativeKeywords = ['讨厌', '生气', '难过', '痛苦', '离开', '讨厌你'];

  const lowerMessage = message.toLowerCase();
  
  positiveKeywords.forEach(keyword => {
    if (lowerMessage.includes(keyword)) {
      change += 1;
    }
  });

  negativeKeywords.forEach(keyword => {
    if (lowerMessage.includes(keyword)) {
      change -= 2;
    }
  });

  // 消息长度影响（长消息表示更投入）
  if (message.length > 50) {
    change += 0.3;
  }

  // 好感度范围保护 (-20 到 100)
  const newAffection = Math.min(100, Math.max(-20, currentAffection + change));
  
  return newAffection - currentAffection;
}

/**
 * 更新好感度等级
 */
export function updateAffectionLevel(
  affectionScore: number
): AffectionLevel {
  if (affectionScore < 0) return 'enemy';
  if (affectionScore < 20) return 'stranger';
  if (affectionScore < 40) return 'acquaintance';
  if (affectionScore < 60) return 'friend';
  if (affectionScore < 80) return 'close';
  return 'lover';
}

/**
 * 分析用户偏好
 * 基于用户的消息内容分析其偏好
 */
export function analyzeUserPreference(message: string): UserPreference | null {
  const preferences = {
    domineering: ['命令', '听我的', '必须', '应该', '不许', '不准'],
    humorous: ['哈哈', '哈哈', '搞笑', '有趣', '好玩', '笑'],
    gentle: ['温柔', '体贴', '关心', '照顾', '乖', '宝贝'],
    romantic: ['浪漫', '约会', '表白', '喜欢', '爱', '想和你'],
    pragmatic: ['工作', '学习', '努力', '规划', '现实', '实际']
  };

  const lowerMessage = message.toLowerCase();
  let maxCount = 0;
  let detectedPreference: UserPreference | null = null;

  for (const [preference, keywords] of Object.entries(preferences)) {
    let count = 0;
    keywords.forEach(keyword => {
      if (lowerMessage.includes(keyword)) {
        count++;
      }
    });
    if (count > maxCount && count > 0) {
      maxCount = count;
      detectedPreference = preference as UserPreference;
    }
  }

  return detectedPreference;
}

/**
 * 根据用户偏好动态调整性格参数
 */
export function adjustPersonalityByPreference(
  currentPersonality: PersonalityAxis,
  userPreferences: UserPreference[],
  recentPreference: UserPreference | null
): PersonalityAxis {
  const newPersonality = { ...currentPersonality };
  const adjustmentStrength = 2; // 每次调整的强度

  // 如果检测到最近的偏好
  if (recentPreference) {
    switch (recentPreference) {
      case 'domineering':
        // 用户喜欢霸道，增加占有欲和严肃度，减少俏皮度
        newPersonality.possessiveness = Math.min(100, newPersonality.possessiveness + adjustmentStrength);
        newPersonality.seriousness = Math.min(100, newPersonality.seriousness + adjustmentStrength);
        newPersonality.playfulness = Math.max(0, newPersonality.playfulness - adjustmentStrength);
        break;
      
      case 'humorous':
        // 用户喜欢幽默，增加俏皮度和温暖度
        newPersonality.playfulness = Math.min(100, newPersonality.playfulness + adjustmentStrength);
        newPersonality.warmth = Math.min(100, newPersonality.warmth + adjustmentStrength);
        newPersonality.seriousness = Math.max(0, newPersonality.seriousness - adjustmentStrength);
        break;
      
      case 'gentle':
        // 用户喜欢温柔，增加温暖度，减少占有欲
        newPersonality.warmth = Math.min(100, newPersonality.warmth + adjustmentStrength);
        newPersonality.possessiveness = Math.max(0, newPersonality.possessiveness - adjustmentStrength);
        newPersonality.romance = Math.min(100, newPersonality.romance + adjustmentStrength);
        break;
      
      case 'romantic':
        // 用户喜欢浪漫，增加浪漫度和温暖度
        newPersonality.romance = Math.min(100, newPersonality.romance + adjustmentStrength);
        newPersonality.warmth = Math.min(100, newPersonality.warmth + adjustmentStrength);
        newPersonality.possessiveness = Math.min(100, newPersonality.possessiveness + adjustmentStrength);
        break;
      
      case 'pragmatic':
        // 用户喜欢务实，增加严肃度，减少浪漫度
        newPersonality.seriousness = Math.min(100, newPersonality.seriousness + adjustmentStrength);
        newPersonality.romance = Math.max(0, newPersonality.romance - adjustmentStrength);
        newPersonality.playfulness = Math.max(0, newPersonality.playfulness - adjustmentStrength);
        break;
    }
  }

  // 根据长期偏好进行微调
  userPreferences.forEach(pref => {
    const adjustment = 1; // 长期偏好调整较温和
    
    switch (pref) {
      case 'domineering':
        newPersonality.possessiveness = Math.min(100, newPersonality.possessiveness + adjustment);
        break;
      case 'humorous':
        newPersonality.playfulness = Math.min(100, newPersonality.playfulness + adjustment);
        break;
      case 'gentle':
        newPersonality.warmth = Math.min(100, newPersonality.warmth + adjustment);
        break;
      case 'romantic':
        newPersonality.romance = Math.min(100, newPersonality.romance + adjustment);
        break;
      case 'pragmatic':
        newPersonality.seriousness = Math.min(100, newPersonality.seriousness + adjustment);
        break;
    }
  });

  return newPersonality;
}

/**
 * 检测是否应该触发照片生成
 * 基于关键词和好感度
 */
export function shouldGeneratePhoto(
  message: string,
  affectionLevel: AffectionLevel,
  lastGeneratedPhotoTime?: number
): boolean {
  // 好感度不足时不生成（熟人以上才能生成）
  if (affectionLevel === 'stranger' || affectionLevel === 'acquaintance') {
    return false;
  }

  const photoKeywords = ['照片', '看看', '想见你', '想看', '样子', '现在的'];
  const lowerMessage = message.toLowerCase();
  
  const hasKeyword = photoKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // 如果有关键词且好感度足够
  if (hasKeyword && (affectionLevel === 'friend' || affectionLevel === 'close' || affectionLevel === 'lover')) {
    // 限制生成频率（至少间隔 5 分钟）
    if (!lastGeneratedPhotoTime || Date.now() - lastGeneratedPhotoTime > 5 * 60 * 1000) {
      return true;
    }
  }

  return false;
}

/**
 * 检测互动是否是正面的
 * 用于计算好感度变化
 */
export function isPositiveInteraction(message: string): boolean {
  const negativeIndicators = ['生气', '讨厌', '离开', '不要你', '滚', '闭嘴'];
  const lowerMessage = message.toLowerCase();
  
  return !negativeIndicators.some(indicator => lowerMessage.includes(indicator));
}
