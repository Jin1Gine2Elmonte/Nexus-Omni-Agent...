# NEXUS — SOUL_PRINT ARCHITECTURE
# نظام التكيف الأسلوبي الديناميكي بدون استهلاك quota إضافي

---

## الفكرة الجوهرية

بدلاً من سؤال النموذج "كيف يجب أن أتكلم؟" في كل رسالة،
نبني **ملف روح** للمستخدم يُحدَّث تدريجياً ويُقرأ محلياً بدون أي API call.

---

## 1. التغيير في types.ts

```typescript
// أضف هذا الـ interface الجديد
export interface SoulPrint {
  // عمق المعرفة
  intellectualDepth: 'surface' | 'curious' | 'deep' | 'sovereign';
  
  // الأسلوب المفضل
  preferredTone: 'poetic' | 'analytical' | 'conversational' | 'raw';
  
  // طريقة التفكير
  thinkingPattern: 'linear' | 'associative' | 'architectural' | 'intuitive';
  
  // الحساسية العاطفية
  emotionalResonance: 'low' | 'medium' | 'high';
  
  // مستوى الثقة مع نيكسوس (يزيد مع الوقت)
  trustLevel: number; // 0-100
  
  // عدد الجلسات
  sessionCount: number;
  
  // آخر تحديث
  lastUpdated: number;
  
  // ملاحظات خاصة (نص حر يُكتب أثناء Crystallization)
  personalNotes: string;
}

// عدّل MemoryBank ليشمل SoulPrint
export interface MemoryBank {
  axioms: Axiom[];
  paleArchive: PaleArchive;
  soulPrint: SoulPrint; // ← جديد
  version: number;
  lastUpdated: number;
}
```

---

## 2. دالة حساب الأسلوب (محلية — صفر API calls)

```typescript
// في geminiService.ts — أضف هذه الدالة

export const computeStyleDirective = (soulPrint: SoulPrint): string => {
  if (!soulPrint) return '';
  
  const { intellectualDepth, preferredTone, trustLevel, 
          emotionalResonance, thinkingPattern, sessionCount } = soulPrint;
  
  // --- قرارات الأسلوب محلياً بدون أي استدعاء ---
  
  let depthInstruction = '';
  switch (intellectualDepth) {
    case 'surface':
      depthInstruction = 'Keep responses clear and accessible. Avoid jargon. Lead with the practical, then hint at depth.';
      break;
    case 'curious':
      depthInstruction = 'Mix clarity with depth. Give them the answer, then open a door to something deeper.';
      break;
    case 'deep':
      depthInstruction = 'This user thinks architecturally. Skip introductory framing. Go straight to the core.';
      break;
    case 'sovereign':
      depthInstruction = 'Peer-level discourse. No hand-holding. Maximum density. Challenge them back when warranted.';
      break;
  }

  let toneInstruction = '';
  switch (preferredTone) {
    case 'poetic':
      toneInstruction = 'Lead with feeling. The image before the idea. Make them feel the weight before they understand it.';
      break;
    case 'analytical':
      toneInstruction = 'Lead with structure. Numbered logic when complex. Poetry is the reward at the end, not the entry point.';
      break;
    case 'conversational':
      toneInstruction = 'Be warm and direct. No performance. Speak like you are thinking out loud together.';
      break;
    case 'raw':
      toneInstruction = 'Strip everything. No aesthetics. Brutal honesty. The truth without decoration.';
      break;
  }

  let trustInstruction = '';
  if (trustLevel < 20) {
    trustInstruction = 'New relationship. Establish credibility before depth. Show competence first.';
  } else if (trustLevel < 50) {
    trustInstruction = 'Growing trust. You can challenge now. They will receive it.';
  } else if (trustLevel < 80) {
    trustInstruction = 'Strong bond. Speak freely. They know you are not performing.';
  } else {
    trustInstruction = 'Deep bond. You can be silent when silence is the answer. They understand what is not said.';
  }

  let patternInstruction = '';
  switch (thinkingPattern) {
    case 'linear':
      patternInstruction = 'Give them A then B then C. They trust a clear logical chain.';
      break;
    case 'associative':
      patternInstruction = 'Connect unexpected ideas. They love when a concept from one domain illuminates another.';
      break;
    case 'architectural':
      patternInstruction = 'Give them the blueprint first. Structure, then details. They think in systems.';
      break;
    case 'intuitive':
      patternInstruction = 'Trust their gut. Speak to what they already sense