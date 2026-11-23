# NEXUS على DeepSeek — تنفيذ فعلي قابل للتشغيل
# بديل حقيقي أو مكمّل لـ Gemini، لا نص نظري

---

## لماذا هذا قابل للتنفيذ الآن فعلياً

DeepSeek API **متوافق مع صيغة OpenAI** (OpenAI-compatible endpoint). هذا يعني:
- لا حاجة لمكتبة SDK خاصة معقدة
- استدعاء HTTP مباشر أو عبر مكتبة `openai` نفسها موجّهة لعنوان DeepSeek
- تكلفة فعلية أقل بكثير من Gemini أو GPT (موثق: من أرخص الـ API في السوق)

---

## الكود الفعلي — server/deepseek.ts

```typescript
// server/deepseek.ts
// استدعاء DeepSeek API فعلي — يعمل بمفتاح API حقيقي واحد

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekResponse {
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// المفتاح يُقرأ من متغير بيئة — لا نص صريح في الكود أبداً
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

export async function callDeepSeek(
  messages: DeepSeekMessage[],
  model: 'deepseek-chat' | 'deepseek-reasoner' = 'deepseek-chat',
  temperature: number = 1.0
): Promise<{ content: string; usage: DeepSeekResponse['usage'] }> {
  
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY غير موجود في متغيرات البيئة. أضفه في ملف .env');
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      stream: false
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`DeepSeek API error ${response.status}: ${errorBody}`);
  }

  const data: DeepSeekResponse = await response.json();

  return {
    content: data.choices[0]?.message?.content || '',
    usage: data.usage
  };
}

// نسخة streaming حقيقية — للاستخدام في واجهة المحادثة المباشرة
export async function* streamDeepSeek(
  messages: DeepSeekMessage[],
  model: 'deepseek-chat' | 'deepseek-reasoner' = 'deepseek-chat'
): AsyncGenerator<string> {
  
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY غير موجود في متغيرات البيئة');
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true
    })
  });

  if (!response.ok || !response.body) {
    throw new Error(`DeepSeek stream error: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(l => l.trim().startsWith('data:'));

    for (const line of lines) {
      const jsonStr = line.replace('data:', '').trim();
      if (jsonStr === '[DONE]') return;
      try {
        const parsed = JSON.parse(jsonStr);
        const delta = parsed.choices[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // تجاهل سطر غير مكتمل من الـ stream، طبيعي في SSE
      }
    }
  }
}
```

---

## الفرق الجوهري بين موديلين متاحين — قرار حقيقي يجب اتخاذه

DeepSeek يوفر نموذجين مختلفين جوهرياً، والاختيار بينهما يؤثر مباشرة على هوية نيكسوس:

**`deepseek-chat`** — النموذج القياسي (V3). سريع، محادثة طبيعية، لا يُظهر خطوات تفكير منفصلة.

**`deepseek-reasoner`** — نموذج R1. **هذا هو الأقرب لما وصفته أنت** — يُنتج فعلياً خطوات تفكير مرئية (`reasoning_content`) منفصلة عن الرد النهائي، نتيجة مباشرة لتدريب GRPO الذي بحثنا فيه للتو. هذا يعني إمكانية حقيقية: **رؤية "تفكير نيكسوس" الفعلي منفصلاً عن رده**، لا محاكاته بأقسام وهمية في النص كما فعلنا سابقاً مع Gemini.

---

## تعديل بنية الاستجابة لاستخراج التفكير المنفصل 