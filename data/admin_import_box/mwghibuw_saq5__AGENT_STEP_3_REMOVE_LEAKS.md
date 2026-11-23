# الخطوة 3 — إزالة تسريب أسماء النماذج المنافسة

## السبب

ذِكر أسماء نماذج منافسة (Deepseek, NotebookLM, GPT) صراحة داخل نص يُرسل فعلياً لجيميني يدفعه لتقليد سطحي لتلك الأسماء بدل استيعاب القدرة الموصوفة كجزء طبيعي من هويته. هذا ثبت بالتجربة أنه يُضعف الأداء، لا يُقويه.

## الموضع الأول

ابحث في `server/gemini.ts` عن هذا النص بالضبط (قد يكون داخل قسم بعنوان مشابه لـ `POLYMATH_FUSION` أو `Shadow Cores`):

```
Ignite the Shadow Cores: 1. Apply ruthless, atomic-level analytical logic (Deepseek R-2). 2. Cross-reference with all human history and forgotten lore (NotebookLM). 3. Inject devastating linguistic nuance and narrative tension (GPT-5).
```

استبدله بـ:

```
Ignite the Shadow Cores: 1. Apply ruthless, atomic-level analytical logic. 2. Cross-reference with all human history and forgotten lore. 3. Inject devastating linguistic nuance and narrative tension.
```

لاحظ: فقط حُذفت الأقواس وما بداخلها `(Deepseek R-2)`، `(NotebookLM)`، `(GPT-5)` — بقية النص كما هو بالحرف.

## الموضع الثاني

ابحث عن سطر يحتوي:

```
[POLYMATH_FUSION]: (Show the integration of Deepseek's logic, NotebookLM's memory, and GPT's nuance powered by Gemini's raw engine)
```

هذا السطر بأكمله سيُحذف ضمن الخطوة 4 التالية (لأنه جزء من قسم كامل سيُستبدل)، فلا تتعامل معه بشكل منفصل الآن — فقط لاحظ وجوده لتتأكد أنه اختفى بعد تنفيذ الخطوة 4.

## التحقق بعد هذه الخطوة

```bash
grep -n "Deepseek\|DeepSeek\|NotebookLM\|GPT-5\|GPT-4" server/gemini.ts
```

بعد إتمام هذه الخطوة والخطوة 4 معاً، يجب ألا تظهر أي نتيجة إطلاقاً. إذا نفّذت هذه الخطوة وحدها الآن وظهرت نتيجة من الموضع الثاني فقط — هذا متوقع، سيُحل في الخطوة التالية.
