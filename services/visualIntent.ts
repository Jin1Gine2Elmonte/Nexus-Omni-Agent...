// Shared natural-language visual intent & image-editing detection (Client + Server)

export interface VisualIntentDetectionResult {
  requested: boolean;
  isEditFollowup: boolean;
  explicitPromptOnly: boolean;
  isMoodOrOpenVisual: boolean;
}

const PROMPT_TEXT_ONLY_GUARD_REGEX =
  /^(?!.*(?:ولّدها|ولدها|ارسمها|أنشئها|انشئها|اصنعها|صممها|generate\s+(?:the\s+)?image|render\s+it|draw\s+it)).*(?:برومبت\s+(?:فقط|جاهز|ميدجورني|لميدجورني|فلاكس|دال)|(?:اكتب|صغ|جهّز|جهز|أعطني|اعطني|اقترح)\s+(?:لي\s+)?(?:وصفاً|وصفا|برومبت|نص\s+برومبت)(?:\s+(?:بالانجليزي|بالإنجليزية|بالعربي|فقط|لصورة|لميدجورني|لمولد))?|بدون\s+(?:توليد|إنشاء|انشاء|رسم)\s+(?:صورة|الصورة)|(?:write|give|craft|suggest|create)\s+(?:me\s+)?(?:just\s+|only\s+)?(?:an?\s+)?(?:midjourney|flux|dall-e|image)?\s*prompt(?:\s+only)?|\bprompt\s+only\b)/i;

const SOFTWARE_OR_DATA_CONTEXT_REGEX =
  /(?:تطبيق|برنامج|موقع\s+ويب|متجر|معرض\s+صور|مكتبة\s+صور|كود\s+(?:برمجي|بايثون|جافاسكريبت|html|react)|قاعدة\s+بيانات|ملف\s+(?:pdf|docx|xlsx|pptx|csv|json|zip|html)|build\s+(?:an?\s+)?(?:app|website|web\s+app|gallery|component|system|api)|react\s+component)/i;

const ARABIC_DIRECT_DRAW_REGEX =
  /(?:^|[\s،,.؛:!؟])(?:[وفبل]?(?:ارسم|أرسم|ترسم)(?:لي|ها|ه)?|رسم\s+(?:لي\s+)?(?:صورة|لوحة|مشهد|شخصية|قط|قطة|كلب|منظر|بورتريه)|رسّم|ارسملي)/i;

const ARABIC_CREATE_OR_REQUEST_IMAGE_REGEX =
  /(?:^|[\s،,.؛:!؟])(?:[وفبل]?(?:أريد|اريد|أبغى|ابغى|أبي|ابي|بدي|أود|اود|أعطني|اعطني|هات|أرني|ارني|وريني|ورّيني|أرسل|ارسل|أخرج|اخرج|سوّي|سوي|سولي|اعملي|اعمل|عمل|اصنع|صنع|ولّد|ولد|توليد|أنشئ|انشئ|إنشاء|انشاء|أنشاء|بإنشاء|بأنشاء|بانشاء|صمّم|صمم|تصميم|جهّز|جهز|شكّل|شكل|جسّد|جسد|ابتكر|تخيل|تخيّل|أنتج|انتج|انتاج|إنتاج|حضّر|حضر|حول|حوّل|اعرض|أعرض|أرفق|ارفق|ضع))(?:\s+(?:لي|لنا|لها|له|هنا|الآن|الان|فوراً|فورا|بسرعة|هذا|هذه|تلك|ذلك|أجمل|أفضل|أروع|لقطة|تخيلي|تخيلية|معها|معه)){0,4}\s+(?:(?:لـ|ل|عن)\s+)?(?:(?:ال)?صورةً?|(?:ال)?صور[ةه]|(?:ال)?لوحةً?|(?:ال)?لوح[ةه]|(?:ال)?رسم[ةه]|(?:ال)?مشهد(?:اً|ا)?\s+(?:ال)?(?:بصري(?:اً|ا)?|فني(?:اً|ا)?|سينمائي(?:اً|ا)?)|بوستر|ملصق(?:اً|ا)?|غلاف(?:اً|ا)?|بورتريه|كاريكاتير|أيقونة|ايقونة|لوقو|شعار(?:اً|ا)?\s+(?:مرئي|بصري|فني)|خلفية\s+(?:فنية|سطح\s+مكتب|شاشة|جوال|موبايل|سينمائية|خيالية))/i;

const ARABIC_COMPOUND_IMAGE_CLAUSE_REGEX =
  /(?:(?:عليك|يمكنك|ربما|يفضل|لو\s+أمكن|أتمنى|من\s+فضلك|بالمرة|في\s+طريقك)[\s\S]{0,30}(?:إنشاء|انشاء|توليد|تصميم|رسم|صنع|تجهيز)\s+(?:ال)?صورة|(?:مع|و|إلى\s+جانب)\s+(?:إنشاء|انشاء|توليد|تصميم|رسم)?\s*(?:ال)?صورة(?:\s+(?:أيضاً|ايضا|لها|له|معها|تعبيرية|مناسبة|مرافقة))?)/i;

const ARABIC_STANDALONE_IMAGE_PHRASE_REGEX =
  /(?:^|[\s،,.؛:!؟])(?:(?:ال)?صورة\s+(?:لـ|ل(?!ا\b|م\b|ن\b|ي\b|ك\b|هم\b)|عن|حسب\s+مزاجك|من\s+خيالك|فنية|تعبيرية|سينمائية|واقعية|أنمي|انمي|كرتونية|ثلاثية\s+الأبعاد|3d|4k|خيالية|مستقبلية|مرعبة|درامية|كلاسيكية|مضيئة|ليلية)|(?:ال)?لوحة\s+(?:فنية|تعبيرية|سينمائية|زيتية|رقمية|من\s+خيالك)|(?:ال)?مشهد\s+(?:ال)?بصري(?:\s|$|[:：]|لـ|عن))/i;

const ARABIC_CONVERT_TO_IMAGE_REGEX =
  /(?:حوّل|حول|تحويل|جسّد|جسد|ترجم)\s+(?:هذا|هذه|ذلك|تلك|ما\s+سبق|ما\s+تحدثنا\s+عنه|حوارنا|النص|الوصف|الفكرة|المشهد|الكلام|القصة|الشخصية|الشعور|الإحساس)?\s*(?:إلى|الى|لـ|ل|في|على\s+شكل|بصرياً|بصريا)\s*(?:صورة|لوحة|رسمة|مشهد\s+بصري|تجسيد\s+بصري)?/i;

const ENGLISH_DIRECT_VISUAL_REGEX =
  /(?:^|[\s,.;:!?])(?:(?:draw|paint|sketch|illustrate|render|visualize)\s+(?:me\s+)?(?:(?:a|an|the|this|that|some|one)\s+)?(?!.*?\b(?:code|script|app|website|api|sql|json|html|svg\s+code|mermaid|flowchart|uml|chart\s+in\s+(?:python|js|react)|table|list|essay|summary)\b)[a-z0-9\u0600-\u06FF]|(?:generate|create|make|design|craft|produce|show\s+me|give\s+me|want|need)\s+(?:me\s+)?(?:(?:a|an|the|some|one)\s+)?(?:\w+\s+){0,3}(?:image|picture|photo|photograph|painting|artwork|illustration|visual|concept\s+art|portrait|wallpaper|poster|logo|avatar)\b|(?:generate|create|render)\s+(?:me\s+)?(?:a|an)\s+(?:\w+\s+){0,3}(?:cat|dog|city|cityscape|landscape|forest|warrior|knight|dragon|castle|galaxy|world|scene|planet|mountain|ocean|robot|spaceship|moon|sunset|character|creature|girl|boy|man|woman|sky)\b)/i;

const ARABIC_PRONOUN_VISUAL_ACTION_REGEX =
  /(?:^|[\s،,.؛:!؟])(?:(?:حاول|جرّب|جرب|أعد|اعد|يمكنك|تستطيع|قم\s+بـ?|ابدأ\s+بـ?)\s+)?(?:إنشائها|انشائها|إنشاءها|انشاءها|إنشائه|انشائه|إنشاءه|انشاءه|توليدها|توليده|رسمها|رسمه|تصميمها|تصميمه|تجسيدها|تجسيده|صنعها|صنعه|إنتاجها|انتاجها|تنفيذها)(?:\s|$|[،,.؛:!؟])|(?:^|[\s،,.؛:!؟])(?:أنشئها|انشئها|أنشئه|انشئه|ولّدها|ولدها|ولّده|ولده|اصنعها|اصنعه|صمّمها|صممها|جسّدها|جسدها|نفّذها|نفذها)(?:\s|$|[،,.؛:!؟])/i;

const IMAGE_EDIT_FOLLOWUP_REGEX =
  /(?:عدّل|عدل|تعديل|غيّر|غير|بدّل|بدل|أضف|اضف|احذف|أزل|ازل|حسّن|حسن|كبّر|كبر|لوّن|لون|اجعل|ارفع\s+الجودة|أعد\s+(?:توليد|رسم|إنشاء|انشاء|المحاولة)|اعد\s+(?:توليد|رسم|إنشاء|انشاء|المحاولة)|حاول\s+(?:مجدداً|مجددا|مرة\s+أخرى|إنشائها|انشائها|توليدها|رسمها)|كرر\s+(?:المحاولة|الطلب)|أعدها|ولدها\s+مجدداً|edit|modify|change|add\s+to|remove\s+from|replace|adjust|enhance|upscale|recolor|make\s+it|turn\s+it\s+into|transform|redo|regenerate|try\s+again)/i;

const IMAGE_ANALYTICAL_ONLY_REGEX =
  /(?:ماذا\s+(?:ترى|في|يوجد)|اشرح\s+(?:لي\s+)?الصورة|حلل\s+الصورة|اقرأ\s+(?:النص|ما\s+في)|استخرج\s+النص|ترجم\s+(?:ما\s+في\s+)?الصورة|ما\s+المكتوب|what\s+is\s+in\s+(?:this|the)\s+image|describe\s+(?:this|the)\s+image|read\s+the\s+text|ocr|analyze\s+(?:this|the)\s+image)/i;

export const VISUAL_INTENT_REGEX =
  new RegExp(
    [
      ARABIC_DIRECT_DRAW_REGEX.source,
      ARABIC_CREATE_OR_REQUEST_IMAGE_REGEX.source,
      ARABIC_COMPOUND_IMAGE_CLAUSE_REGEX.source,
      ARABIC_STANDALONE_IMAGE_PHRASE_REGEX.source,
      ARABIC_CONVERT_TO_IMAGE_REGEX.source,
      ARABIC_PRONOUN_VISUAL_ACTION_REGEX.source,
      ENGLISH_DIRECT_VISUAL_REGEX.source
    ].join('|'),
    'i'
  );

export function detectVisualGenerationIntent(
  prompt: string,
  options?: {
    hasImageAttachment?: boolean;
    hasRecentGeneratedImage?: boolean;
  }
): VisualIntentDetectionResult {
  const clean = (prompt || '').trim();
  if (!clean) {
    return {
      requested: false,
      isEditFollowup: false,
      explicitPromptOnly: false,
      isMoodOrOpenVisual: false
    };
  }

  const isMoodOrOpenVisual = /حسب\s+مزاجك|من\s+خيالك|ذوقك|ما\s+تشعر\s+به|according\s+to\s+your\s+mood/i.test(clean);
  const explicitPromptOnly = PROMPT_TEXT_ONLY_GUARD_REGEX.test(clean);
  if (explicitPromptOnly) {
    return {
      requested: false,
      isEditFollowup: false,
      explicitPromptOnly: true,
      isMoodOrOpenVisual
    };
  }

  const hasExplicitVisualVerbAndNoun = VISUAL_INTENT_REGEX.test(clean);
  const isAnalyticalQuestionAboutImage = IMAGE_ANALYTICAL_ONLY_REGEX.test(clean);
  const hasEditVerb = IMAGE_EDIT_FOLLOWUP_REGEX.test(clean);

  const isEditFollowup = Boolean(
    !isAnalyticalQuestionAboutImage &&
      ((options?.hasImageAttachment && (hasEditVerb || hasExplicitVisualVerbAndNoun)) ||
        (options?.hasRecentGeneratedImage &&
          hasEditVerb &&
          (/(?:الصورة|اللوحة|الرسمة|المشهد|الخلفية|اللون|الإضاءة|الاضاءة|الزاوية|مجدداً|مجددا|image|background|lighting|angle|style|colors?|regenerate|make\s+it|change\s+the|edit\s+this)/i.test(
            clean
          ) ||
            clean.split(/\s+/).length <= 12)))
  );

  // If the user is purely asking to code a React/HTML app that happens to contain the word "صور" (gallery app)
  // without an explicit "draw/generate image" command, do not misclassify as image generation.
  const isSoftwareWithoutDirectImageCommand =
    SOFTWARE_OR_DATA_CONTEXT_REGEX.test(clean) &&
    !/(?:ارسم|توليد\s+صورة|إنشاء\s+صورة|انشاء\s+صورة|generate\s+(?:an?\s+)?image|create\s+(?:an?\s+)?image|صورة\s+فنية)/i.test(
      clean
    );

  const requested = Boolean(
    isEditFollowup || (hasExplicitVisualVerbAndNoun && !isSoftwareWithoutDirectImageCommand)
  );

  return {
    requested,
    isEditFollowup,
    explicitPromptOnly: false,
    isMoodOrOpenVisual
  };
}

export const FALSE_VISUAL_UNAVAILABLE_REGEX =
  /(?:أداة\s+(?:توليد|إنشاء|انشاء|رسم)\s+الصور\s+(?:غير\s+متاحة|معطلة|لا\s+تعمل)|لا\s+(?:أستطيع|استطيع|يمكنني)\s+(?:حالياً\s+)?(?:إنشاء|انشاء|توليد|رسم|إرسال)\s+(?:الصورة|الصور|أي\s+صورة)|غير\s+متاح[ة]?\s+(?:لي\s+)?في\s+هذه\s+الجلسة|image\s+generation\s+(?:tool\s+)?is\s+(?:not\s+available|unavailable)|cannot\s+(?:directly\s+)?(?:generate|create)\s+(?:the\s+)?image)/i;

export function extractBestPromptFromModelTextFallback(
  modelText: string,
  originalUserPrompt: string
): string {
  const raw = (modelText || '').trim();
  if (!raw) return originalUserPrompt;

  // Check if the model wrote an explicit English Prompt block in markdown quotes or labeled section
  const labeledMatch = raw.match(
    /(?:\*\*Prompt(?:\s*\(.*?\))?:\*\*|Prompt\s*:|البرومبت(?:\s*\(.*?\))?:)\s*\n*(?:```(?:\w+)?\n?([\s\S]+?)\n?```|>\s*([^\n]+(?:\n>\s*[^\n]+)*)|"([^"]{20,600})"|([^\n]{25,500}))/i
  );
  const candidate = (
    labeledMatch?.[1] ||
    labeledMatch?.[2]?.replace(/^>\s*/gm, '') ||
    labeledMatch?.[3] ||
    labeledMatch?.[4] ||
    ''
  )
    .replace(/[`*]/g, '')
    .trim();

  if (candidate.length >= 20 && !FALSE_VISUAL_UNAVAILABLE_REGEX.test(candidate)) {
    return candidate;
  }

  return originalUserPrompt;
}
