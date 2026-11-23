import fs from 'fs';
import path from 'path';

export interface QwenImageOpenSourceSpecs {
  loadedFromDisk: boolean;
  basePath: string;
  peT2ISystemPrompt: string;
  peI2ISystemPrompt: string;
  qwen21TransformerConfig: Record<string, any>;
  qwen21TurboSigmas: number[];
  qwenLayeredConfig: Record<string, any>;
}

let cachedQwenSpecs: QwenImageOpenSourceSpecs | null = null;
let qwenZeroGpuCooldownUntilMs = 0;

export function isQwenZeroGpuInCooldown(): boolean {
  return Date.now() < qwenZeroGpuCooldownUntilMs;
}

export function markQwenZeroGpuCooldown(durationMs: number = 3 * 60 * 1000): void {
  qwenZeroGpuCooldownUntilMs = Math.max(qwenZeroGpuCooldownUntilMs, Date.now() + durationMs);
}

/**
 * Loads the downloaded open-source Qwen-Image-2.1, Qwen-Image-2.1-Turbo,
 * Qwen-Image-Layered, Qwen-Image-2.1-PE-T2I, and Qwen-Image-2.1-PE-I2I
 * configurations and system prompts from /data/models/qwen_image_open_source/.
 */
export function loadLocalQwenImageOpenSourceSpecs(): QwenImageOpenSourceSpecs {
  if (cachedQwenSpecs) return cachedQwenSpecs;

  const basePath = path.join(process.cwd(), 'data', 'models', 'qwen_image_open_source');
  const readTextSafe = (relPath: string, fallback: string = ''): string => {
    try {
      const full = path.join(basePath, relPath);
      if (fs.existsSync(full)) {
        return fs.readFileSync(full, 'utf-8');
      }
    } catch {
      // ignore
    }
    return fallback;
  };

  const readJsonSafe = (relPath: string, fallback: Record<string, any> = {}): Record<string, any> => {
    try {
      const txt = readTextSafe(relPath, '');
      if (txt.trim()) {
        return JSON.parse(txt);
      }
    } catch {
      // ignore
    }
    return fallback;
  };

  const peT2ISystemPrompt = readTextSafe('Qwen-Image-2.1-PE-T2I/system_prompt.txt', '');
  const peI2ISystemPrompt = readTextSafe('Qwen-Image-2.1-PE-I2I/system_prompt.txt', '');
  const qwen21TransformerConfig = readJsonSafe('Qwen-Image-2.1/transformer/config.json', {
    _class_name: 'QwenImage21Transformer2DModel',
    attention_head_dim: 128,
    axes_dims_rope: [16, 56, 56],
    context_in_dim: 4096,
    in_channels: 64,
    num_attention_heads: 32,
    num_layers: 32,
    out_channels: 64,
    patch_size: 1,
    causal_condition: true
  });
  const turboIndex = readJsonSafe('Qwen-Image-2.1-Turbo/model_index.json', {});
  const qwen21TurboSigmas: number[] = Array.isArray(turboIndex.sample_sigmas)
    ? turboIndex.sample_sigmas
    : [1.0, 0.978453, 0.95418, 0.926626, 0.89508, 0.845148, 0.704534, 0.414568];
  const qwenLayeredConfig = readJsonSafe('Qwen-Image-Layered/transformer/config.json', {
    _class_name: 'QwenImageTransformer2DModel',
    num_layers: 60,
    in_channels: 64,
    out_channels: 16,
    use_layer3d_rope: true
  });

  cachedQwenSpecs = {
    loadedFromDisk: Boolean(peT2ISystemPrompt || peI2ISystemPrompt),
    basePath,
    peT2ISystemPrompt,
    peI2ISystemPrompt,
    qwen21TransformerConfig,
    qwen21TurboSigmas,
    qwenLayeredConfig
  };
  return cachedQwenSpecs;
}

export interface QwenGeneratedLayerResult {
  role: 'primary_objects' | 'foundation_structure' | 'photonic_glaze';
  modelLabel: string;
  dataUrl: string;
  rawBase64: string;
  mimeType: string;
}

function getHfToken(): string {
  return (process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY || '').trim();
}

function buildHfHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getHfToken();
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0',
    ...extra
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function fetchRemoteImageAsBase64Layer(
  imageUrl: string,
  role: QwenGeneratedLayerResult['role'],
  modelLabel: string,
  timeoutMs: number = 15000
): Promise<QwenGeneratedLayerResult | null> {
  try {
    const imgResp = await fetch(imageUrl, {
      headers: buildHfHeaders(),
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!imgResp.ok) return null;
    const mimeRaw = (imgResp.headers.get('content-type') || 'image/png').toLowerCase();
    if (!mimeRaw.startsWith('image/') && !imageUrl.endsWith('.png') && !imageUrl.endsWith('.webp') && !imageUrl.endsWith('.jpg')) {
      return null;
    }
    const arrayBuf = await imgResp.arrayBuffer();
    if (arrayBuf.byteLength <= 4096) return null;
    const rawBase64 = Buffer.from(arrayBuf).toString('base64');
    const mimeType = mimeRaw.includes('png')
      ? 'image/png'
      : mimeRaw.includes('webp')
      ? 'image/webp'
      : mimeRaw.includes('jpeg') || mimeRaw.includes('jpg')
      ? 'image/jpeg'
      : 'image/png';
    return {
      role,
      modelLabel,
      dataUrl: `data:${mimeType};base64,${rawBase64}`,
      rawBase64,
      mimeType
    };
  } catch {
    return null;
  }
}

function normalizeQwenAspectRatio(aspectRatio: string): '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '3:2' | '2:3' {
  switch (aspectRatio) {
    case '1:1':
      return '1:1';
    case '9:16':
    case '1:4':
    case '1:8':
      return '9:16';
    case '4:3':
      return '4:3';
    case '3:4':
      return '3:4';
    case '3:2':
      return '3:2';
    case '2:3':
      return '2:3';
    case '16:9':
    case '4:1':
    case '8:1':
    default:
      return '16:9';
  }
}

function buildSingleGradioFileData(inputImage?: { data: string; mimeType: string }): any | null {
  if (!inputImage?.data) return null;
  const cleanB64 = inputImage.data.replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '');
  if (!cleanB64) return null;
  const mime = inputImage.mimeType || 'image/png';
  const dataUrl = `data:${mime};base64,${cleanB64}`;
  return {
    path: null,
    url: dataUrl,
    size: null,
    orig_name: 'input.png',
    mime_type: mime,
    is_stream: false,
    meta: { _type: 'gradio.FileData' }
  };
}

function buildGradioGalleryInputImages(inputImage?: { data: string; mimeType: string }): any[] {
  const fileData = buildSingleGradioFileData(inputImage);
  if (!fileData) return [];
  return [{ image: fileData, caption: null }];
}

async function callGradioSseEndpoint(
  baseUrl: string,
  endpoint: string,
  payload: any[],
  role: QwenGeneratedLayerResult['role'],
  modelLabel: string,
  callTimeoutMs: number = 10000,
  sseTimeoutMs: number = 28000
): Promise<QwenGeneratedLayerResult | null> {
  if (isQwenZeroGpuInCooldown()) {
    return null;
  }
  try {
    const callRes = await fetch(`${baseUrl}/gradio_api/call/${endpoint}`, {
      method: 'POST',
      headers: buildHfHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ data: payload }),
      signal: AbortSignal.timeout(callTimeoutMs)
    });
    if (!callRes.ok) {
      if (callRes.status === 429) {
        markQwenZeroGpuCooldown(3 * 60 * 1000);
      }
      return null;
    }
    const callJson: any = await callRes.json();
    const eventId = callJson?.event_id;
    if (!eventId) return null;

    const sseRes = await fetch(`${baseUrl}/gradio_api/call/${endpoint}/${eventId}`, {
      headers: buildHfHeaders(),
      signal: AbortSignal.timeout(sseTimeoutMs)
    });
    if (!sseRes.ok) {
      if (sseRes.status === 429) {
        markQwenZeroGpuCooldown(3 * 60 * 1000);
      }
      return null;
    }

    const sseText = await sseRes.text();
    if (/ZeroGPU|exceeded.*quota|runs limit|Too Many Requests/i.test(sseText)) {
      markQwenZeroGpuCooldown(3 * 60 * 1000);
      console.info(`[QwenImage2.1] ${modelLabel} hit ZeroGPU quota limit; cooling HF ZeroGPU nodes for 3m.`);
      return null;
    }
    if (/event:\s*error/i.test(sseText) && !/event:\s*complete/i.test(sseText)) {
      return null;
    }

    const completeMatch = sseText.match(/event:\s*complete[\s\S]*?data:\s*(\[[\s\S]*?\])(?:\n|$)/i);
    if (!completeMatch?.[1]) return null;

    const parsedData = JSON.parse(completeMatch[1]);
    const firstItem = Array.isArray(parsedData) ? parsedData[0] : null;
    const fileObj = firstItem?.image || firstItem;
    const fileUrl: string | undefined =
      fileObj?.url ||
      (fileObj?.path ? `${baseUrl}/gradio_api/file=${fileObj.path}` : undefined);
    if (!fileUrl) return null;

    return await fetchRemoteImageAsBase64Layer(fileUrl, role, modelLabel, 15000);
  } catch {
    return null;
  }
}

async function callHfRouterQwenImage(
  promptText: string,
  role: QwenGeneratedLayerResult['role']
): Promise<QwenGeneratedLayerResult | null> {
  const token = getHfToken();
  if (!token) return null;
  try {
    const resp = await fetch('https://router.huggingface.co/hf-inference/models/Qwen/Qwen-Image', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: promptText }),
      signal: AbortSignal.timeout(25000)
    });
    if (!resp.ok) return null;
    const mimeRaw = (resp.headers.get('content-type') || 'image/png').toLowerCase();
    if (!mimeRaw.startsWith('image/')) return null;
    const buf = await resp.arrayBuffer();
    if (buf.byteLength <= 4096) return null;
    const rawBase64 = Buffer.from(buf).toString('base64');
    const mimeType = mimeRaw.includes('webp') ? 'image/webp' : mimeRaw.includes('jpeg') ? 'image/jpeg' : 'image/png';
    return {
      role,
      modelLabel: 'Qwen/Qwen-Image (HF Router)',
      dataUrl: `data:${mimeType};base64,${rawBase64}`,
      rawBase64,
      mimeType
    };
  } catch {
    return null;
  }
}

/**
 * Executes the open-source Qwen-Image-2.1 inference cluster using sequential failover
 * (preserving HuggingFace ZeroGPU IP quota instead of exhausting it with parallel bursts):
 * 1. Dedicated Qwen-Image-Edit (when editing an attached image)
 * 2. Qwen/Qwen-Image-2.1-Turbo (2K 2048px · 8-Step FlowMatch Euler Discrete)
 * 3. Qwen/Qwen-Image-2.1-Realtime (1536px/1024px Single-Stream DiT)
 * 4. Qwen/Qwen-Image-2.1-Viggle-Turbo (2K/1K 6-Step MMDiT with Auto Prompt Enhancer)
 */
export async function executeQwenImage21OpenSourceCluster(params: {
  primaryPrompt: string;
  foundationPrompt: string;
  photonicPrompt: string;
  aspectRatio: string;
  resolution: '1K' | '2K' | '4K';
  seed: number;
  inputImage?: { data: string; mimeType: string };
  onLog?: (msg: string, type?: 'info' | 'core' | 'success' | 'warning' | 'error') => void;
}): Promise<QwenGeneratedLayerResult[]> {
  const qwenAspect = normalizeQwenAspectRatio(params.aspectRatio);
  const singleFileRef = buildSingleGradioFileData(params.inputImage);
  const galleryRefs = buildGradioGalleryInputImages(params.inputImage);
  const isHighRes = params.resolution === '4K' || params.resolution === '2K';

  const viggleSizeMap2K: Record<string, { label: string; w: number; h: number }> = {
    '1:1': { label: '1:1 · 2048×2048 (2048² area)', w: 2048, h: 2048 },
    '16:9': { label: '16:9 · 2720×1536 (2048² area)', w: 2720, h: 1536 },
    '9:16': { label: '9:16 · 1536×2720 (2048² area)', w: 1536, h: 2720 },
    '4:3': { label: '4:3 · 2368×1760 (2048² area)', w: 2368, h: 1760 },
    '3:4': { label: '3:4 · 1760×2368 (2048² area)', w: 1760, h: 2368 },
    '3:2': { label: '3:2 · 2496×1664 (2048² area)', w: 2496, h: 1664 },
    '2:3': { label: '2:3 · 1664×2496 (2048² area)', w: 1664, h: 2496 }
  };
  const viggleSizeMap1K: Record<string, { label: string; w: number; h: number }> = {
    '1:1': { label: '1:1 · 1024×1024 (1024² area)', w: 1024, h: 1024 },
    '16:9': { label: '16:9 · 1376×768 (1024² area)', w: 1376, h: 768 },
    '9:16': { label: '9:16 · 768×1376 (1024² area)', w: 768, h: 1376 },
    '4:3': { label: '4:3 · 1184×896 (1024² area)', w: 1184, h: 896 },
    '3:4': { label: '3:4 · 896×1184 (1024² area)', w: 896, h: 1184 },
    '3:2': { label: '3:2 · 1248×832 (1024² area)', w: 1248, h: 832 },
    '2:3': { label: '2:3 · 832×1248 (1024² area)', w: 832, h: 1248 }
  };

  const viggleSpec = (isHighRes ? viggleSizeMap2K[qwenAspect] : viggleSizeMap1K[qwenAspect]) || viggleSizeMap1K['16:9'];

  if (params.onLog) {
    params.onLog(
      `🚀 [QWEN-IMAGE-2.1 OPEN-SOURCE CLUSTER]: تشغيل سلسلي موفّر للحصة عبر Qwen/Qwen-Image-2.1-Turbo (2K · 8-Step FlowMatch) و Qwen-Image-2.1-Realtime (${qwenAspect})...`,
      'core'
    );
  }

  // Optional direct HF Inference Router call if HF_TOKEN is configured (T2I)
  if (!singleFileRef) {
    const hfRouterLayer = await callHfRouterQwenImage(params.primaryPrompt, 'primary_objects');
    if (hfRouterLayer) {
      return [hfRouterLayer];
    }
  }

  if (isQwenZeroGpuInCooldown()) {
    return [];
  }

  // Image-editing priority route when an input image is attached
  if (singleFileRef) {
    const editResult = await callGradioSseEndpoint(
      'https://Qwen-Qwen-Image-Edit.hf.space',
      'infer',
      [singleFileRef, params.primaryPrompt, params.seed, false, 4.0, 24, true],
      'primary_objects',
      'Qwen-Image-Edit (Open-Source I2I)',
      10000,
      30000
    );
    if (editResult) {
      return [editResult];
    }
    if (isQwenZeroGpuInCooldown()) {
      return [];
    }
  }

  // Sequential failover across Qwen-Image-2.1 nodes (stops on 1st valid image layer)
  const sequentialCandidates: Array<() => Promise<QwenGeneratedLayerResult | null>> = [
    () =>
      callGradioSseEndpoint(
        'https://hugging-apps-qwen-qwen-image-2-1-turbo.hf.space',
        'generate',
        [
          params.primaryPrompt,
          galleryRefs,
          params.seed,
          isHighRes ? 2048 : 1024,
          qwenAspect
        ],
        'primary_objects',
        'Qwen-Image-2.1-Turbo (2K Open-Source)',
        9000,
        28000
      ),
    () =>
      callGradioSseEndpoint(
        'https://linoyts-qwen-image-2-1-realtime.hf.space',
        'generate',
        [
          params.foundationPrompt || params.primaryPrompt,
          galleryRefs,
          params.seed + 7,
          isHighRes ? 1536 : 1024,
          qwenAspect
        ],
        'foundation_structure',
        'Qwen-Image-2.1-Realtime (Open-Source DiT)',
        9000,
        26000
      ),
    () =>
      callGradioSseEndpoint(
        'https://Viggle-Qwen-Image-2-1-viggle-turbo.hf.space',
        'generate',
        [
          params.photonicPrompt || params.primaryPrompt,
          galleryRefs,
          viggleSpec.label,
          params.seed + 13,
          false,
          'Auto',
          6,
          viggleSpec.w,
          viggleSpec.h,
          'v0.3'
        ],
        'photonic_glaze',
        'Qwen-Image-2.1-Viggle-Turbo (Open-Source)',
        9000,
        26000
      )
  ];

  for (const runNode of sequentialCandidates) {
    if (isQwenZeroGpuInCooldown()) break;
    const layer = await runNode();
    if (layer && layer.dataUrl) {
      return [layer];
    }
  }

  return [];
}

/**
 * Extracts a concise summary of recent conversation messages so that when a user says
 * a brief visual command like "أنشئ صورة" or "ارسم هذا المشهد" or "حسب مزاجك",
 * the visual architect has full awareness of the ongoing emotional, philosophical,
 * or technical dialogue.
 */
export function buildRecentConversationVisualContext(
  prompt: string,
  recentHistory?: Array<{ role?: string; content?: string }>,
  nexusState?: string
): string {
  const parts: string[] = [];
  if (Array.isArray(recentHistory) && recentHistory.length > 0) {
    const tail = recentHistory
      .filter(m => m && typeof m.content === 'string' && m.content.trim().length > 0)
      .slice(-6);
    if (tail.length > 0) {
      const formattedTurns = tail
        .map(m => {
          const roleLabel = m.role === 'user' ? 'User' : 'Nexus';
          const cleanContent = String(m.content || '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 420);
          return `[${roleLabel}]: ${cleanContent}`;
        })
        .join('\n');
      parts.push(`Recent Conversation Context (Last Turns):\n${formattedTurns}`);
    }
  }
  if (nexusState && nexusState.trim() && nexusState !== '[PRISM STUDIO 4K MANIFESTATION]') {
    const compactState = nexusState.replace(/\s+/g, ' ').trim().slice(-900);
    if (compactState) {
      parts.push(`Session Context Snippet:\n${compactState}`);
    }
  }
  return parts.join('\n\n');
}

/**
 * Builds a grounded, context-aware visual blueprint and pure natural Arabic inner thoughts
 * so that even if the text architect LLM hits temporary quota/latency limits, the thinking prose
 * and image synthesis remain deeply anchored in the user's request and ongoing dialogue.
 */
export function buildContextualFallbackVisualPlan(params: {
  prompt: string;
  recentConvContext?: string;
  cameraDirective: string;
  baseStyle: string;
  embeddedText?: string;
  isEditMode?: boolean;
}): {
  painterThoughtsAr: string;
  presentationAr: string;
  layer1FoundationPrompt: string;
  layer2ObjectsPrompt: string;
  layer3PhotonicGlazePrompt: string;
  unifiedMasterPrompt: string;
} {
  const cleanPrompt = (params.prompt || '').replace(/\s+/g, ' ').trim();
  const shortPromptSnippet = cleanPrompt.slice(0, 110);

  let dialogueCue = '';
  if (params.recentConvContext) {
    const lines = params.recentConvContext
      .split('\n')
      .map(l => l.replace(/^\[(?:User|Nexus)\]:\s*/i, '').trim())
      .filter(l => l && !l.startsWith('Recent Conversation Context') && !l.startsWith('Session Context Snippet'));
    if (lines.length > 0) {
      dialogueCue = lines[lines.length - 1].slice(0, 140);
    }
  }

  const isBriefCmd = cleanPrompt.split(/\s+/).length <= 5 && Boolean(dialogueCue);

  const painterThoughtsAr = params.isEditMode
    ? `أتأمل الآن الصورة المرجعية والتعديل الذي طلبه رفيقي ("${shortPromptSnippet}")، وأحرص على أن يبقى جوهر التكوين وهويته الأصيلة متماسكين تماماً بينما أُدخل التغيير المطلوب بوضوح واتزان في الضوء والملمس.`
    : isBriefCmd
    ? `أقرأ ما عناه رفيقي بطلبه الموجز ("${shortPromptSnippet}") في ضوء ما كنا نتحدث عنه للتو ("${dialogueCue.slice(0, 90)}")، وأسعى لأن تتشكل الصورة كامتداد حي وصادق لهذا السياق، مع توازن واضح في الكتل والعمق والإضاءة.`
    : `أتأمل الآن المشهد الذي وصفه رفيقي ("${shortPromptSnippet}") لأبني تكوينه من الأساس والعمق المكاني أولاً، ثم أضع العناصر البؤرية بملمسها الواقعي وإضاءتها المنسجمة لتخرج اللوحة واضحة ومتماسكة كما قصدها تماماً.`;

  const presentationAr = params.isEditMode
    ? 'أتممتُ تعديل الصورة وفق ما طلبت، مع الحفاظ على روح المشهد وتفاصيله الأساسية:'
    : isBriefCmd && dialogueCue
    ? 'جسّدتُ هذا المشهد كما تبلور في حوارنا قبل قليل:'
    : 'أتممتُ رسم هذا المشهد وتكوين إضاءته وتفاصيله كما أردت:';

  const contextAnchor = isBriefCmd && dialogueCue
    ? `${cleanPrompt} — inspired by the ongoing context: ${dialogueCue}`
    : cleanPrompt;

  const textClause = params.embeddedText
    ? `, featuring exact, crisp, legible typography reading "${params.embeddedText}"`
    : '';

  const layer1FoundationPrompt = `Atmospheric environmental base, clear horizon and spatial depth, rich background textures supporting: "${contextAnchor}", ${params.cameraDirective}, ${params.baseStyle}`;
  const layer2ObjectsPrompt = `Primary focal subjects positioned with clear left-center-right anchors, authentic tactile materials, crisp anatomical and architectural fidelity for: "${contextAnchor}", ${params.cameraDirective}${textClause}`;
  const layer3PhotonicGlazePrompt = `Coherent natural volumetric lighting, realistic cast shadows, physical reflections and delicate edge rim-light unifying the composition of "${contextAnchor}"`;
  const unifiedMasterPrompt = `${contextAnchor}. ${params.cameraDirective}. ${params.baseStyle}. Balanced multi-plane depth with a grounded background, sharply sculpted focal elements, cohesive directional lighting, authentic surface micro-textures, and rich atmospheric perspective${textClause}.`;

  return {
    painterThoughtsAr,
    presentationAr,
    layer1FoundationPrompt,
    layer2ObjectsPrompt,
    layer3PhotonicGlazePrompt,
    unifiedMasterPrompt
  };
}
