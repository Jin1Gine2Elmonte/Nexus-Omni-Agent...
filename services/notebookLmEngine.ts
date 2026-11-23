import type {
  GeminiNotebookItem,
  GeminiNotebookSource,
  GeminiNotebookUsageMode
} from '../types.ts';
import {
  type GoogleWorkspaceFileResult,
  fetchGoogleDriveFileTextContent,
  uploadBrowserFileToGoogleDrive,
  extractFileViaWorkspaceRagEngine,
  type UniversalRagExtractionResult
} from './googleWorkspaceService.ts';

export const UNIVERSAL_FILE_ACCEPT_EXTENSIONS =
  '.pdf,.doc,.docx,.odt,.rtf,.xls,.xlsx,.ods,.csv,.tsv,.ppt,.pptx,.odp,.txt,.md,.json,.jsonl,.xml,.yaml,.yml,.toml,.ini,.sql,.ipynb,.py,.js,.ts,.tsx,.jsx,.html,.htm,.css,.scss,.java,.c,.cpp,.cs,.go,.rs,.php,.rb,.swift,.kt,.sh,.log,.zip,.tar,.gz,.tgz,image/*,audio/*,*/*';

export interface IndexedPassage {
  passageId: string;
  notebookId: string;
  notebookTitle: string;
  sourceId: string;
  sourceTitle: string;
  sourceType: GeminiNotebookSource['sourceType'];
  citationIndex: number;
  text: string;
  score: number;
}

const ARABIC_STOP_WORDS = new Set([
  'في', 'من', 'على', 'إلى', 'الى', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك',
  'التي', 'الذي', 'الذين', 'أن', 'ان', 'إن', 'كان', 'كانت', 'يكون', 'ما',
  'لا', 'لم', 'لن', 'قد', 'كل', 'بعض', 'أو', 'او', 'ثم', 'بل', 'حتى', 'لو',
  'كيف', 'ماذا', 'متى', 'أين', 'اين', 'لماذا', 'هل', 'هو', 'هي', 'هم', 'نحن',
  'أنا', 'انا', 'أنت', 'انت', 'بين', 'فوق', 'تحت', 'قبل', 'بعد', 'عند', 'منذ'
]);

const ENGLISH_STOP_WORDS = new Set([
  'the', 'and', 'for', 'that', 'this', 'with', 'from', 'have', 'has', 'had',
  'not', 'are', 'was', 'were', 'will', 'would', 'could', 'should', 'what',
  'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how', 'into',
  'about', 'than', 'then', 'them', 'they', 'their', 'there', 'here'
]);

/**
 * Normalizes Arabic & English text for high-recall lexical + stem matching.
 */
function normalizeToken(token: string): string {
  return token
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // Strip Arabic diacritics
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/^ال/, '') // Strip definite article prefix for root matching
    .trim();
}

/**
 * Extracts meaningful query terms from the user's prompt.
 */
export function tokenizeForRetrieval(text: string): string[] {
  if (!text) return [];
  const rawTokens = text
    .split(/[^\p{L}\p{N}_-]+/u)
    .map(normalizeToken)
    .filter(t => t.length >= 2);

  return rawTokens.filter(
    t => !ARABIC_STOP_WORDS.has(t) && !ENGLISH_STOP_WORDS.has(t)
  );
}

/**
 * Splits a document's text into overlapping semantic passages (chunks) of ~360 words
 * so large books, research papers, or codebases can be searched accurately without truncation.
 */
export function chunkSourceContent(
  content: string,
  targetWordsPerChunk = 360,
  overlapWords = 60
): string[] {
  const clean = (content || '').replace(/\r\n/g, '\n').trim();
  if (!clean) return [];

  const paragraphs = clean.split(/\n{2,}/);
  const chunks: string[] = [];
  let currentWords: string[] = [];

  for (const para of paragraphs) {
    const paraWords = para.trim().split(/\s+/).filter(Boolean);
    if (paraWords.length === 0) continue;

    if (currentWords.length + paraWords.length <= targetWordsPerChunk) {
      currentWords.push(...paraWords);
    } else {
      if (currentWords.length > 0) {
        chunks.push(currentWords.join(' '));
        currentWords = currentWords.slice(
          Math.max(0, currentWords.length - overlapWords)
        );
      }
      if (paraWords.length > targetWordsPerChunk) {
        let idx = 0;
        while (idx < paraWords.length) {
          const slice = paraWords.slice(idx, idx + targetWordsPerChunk);
          chunks.push(slice.join(' '));
          idx += Math.max(1, targetWordsPerChunk - overlapWords);
        }
        currentWords = [];
      } else {
        currentWords.push(...paraWords);
      }
    }
  }

  if (currentWords.length > 0) {
    chunks.push(currentWords.join(' '));
  }

  return chunks;
}

/**
 * Computes a BM25-inspired relevance score for a passage against query tokens.
 */
function scorePassageBM25(
  passageText: string,
  sourceTitle: string,
  queryTokens: string[]
): number {
  if (queryTokens.length === 0) return 1;

  const normalizedPassage = normalizeToken(passageText);
  const normalizedTitle = normalizeToken(sourceTitle);
  const passageWords = normalizedPassage.split(/\s+/);
  const passageLength = Math.max(1, passageWords.length);
  const avgLength = 320;
  const k1 = 1.5;
  const b = 0.75;

  let score = 0;
  for (const qToken of queryTokens) {
    // Title match boost
    if (normalizedTitle.includes(qToken)) {
      score += 4.5;
    }

    // Count occurrences in passage
    let tf = 0;
    for (const w of passageWords) {
      if (w === qToken || (qToken.length >= 3 && w.includes(qToken))) {
        tf++;
      }
    }

    if (tf > 0) {
      const numerator = tf * (k1 + 1);
      const denominator = tf + k1 * (1 - b + b * (passageLength / avgLength));
      score += numerator / denominator;
    }
  }

  return score;
}

/**
 * Performs real multi-notebook RAG retrieval across all enabled sources in the attached
 * NotebookLM notebooks, returning the top-ranked passages with citation indices [1], [2], etc.
 */
export function retrieveGroundedNotebookContext(
  attachedNotebooks: GeminiNotebookItem[],
  userQuery: string,
  usageMode: GeminiNotebookUsageMode,
  maxPassages = 16
): {
  contextBlock: string;
  citedSourcesSummary: { index: number; title: string; notebookTitle: string; wordCount: number }[];
  totalSourcesCount: number;
  totalWordsCount: number;
} {
  if (!attachedNotebooks || attachedNotebooks.length === 0) {
    return {
      contextBlock: '',
      citedSourcesSummary: [],
      totalSourcesCount: 0,
      totalWordsCount: 0
    };
  }

  const queryTokens = tokenizeForRetrieval(userQuery);
  const allPassages: IndexedPassage[] = [];
  const citedSourcesSummary: {
    index: number;
    title: string;
    notebookTitle: string;
    wordCount: number;
  }[] = [];

  let citationCounter = 1;
  let totalSourcesCount = 0;
  let totalWordsCount = 0;

  for (const nb of attachedNotebooks) {
    const activeSources = (nb.sources || []).filter(s => s.isEnabled !== false && s.content?.trim());
    for (const src of activeSources) {
      totalSourcesCount++;
      const wc = src.wordCount || src.content.split(/\s+/).filter(Boolean).length;
      totalWordsCount += wc;
      const citationIndex = citationCounter++;
      citedSourcesSummary.push({
        index: citationIndex,
        title: src.title,
        notebookTitle: nb.title,
        wordCount: wc
      });

      const chunks = chunkSourceContent(src.content, 360, 50);
      chunks.forEach((chunkText, cIdx) => {
        const baseScore = scorePassageBM25(chunkText, src.title, queryTokens);
        const positionBoost = cIdx === 0 ? 0.85 : 0;
        allPassages.push({
          passageId: `${src.id}-p${cIdx}`,
          notebookId: nb.id,
          notebookTitle: nb.title,
          sourceId: src.id,
          sourceTitle: src.title,
          sourceType: src.sourceType,
          citationIndex,
          text: chunkText,
          score: baseScore + positionBoost
        });
      });
    }
  }

  if (totalSourcesCount === 0) {
    return {
      contextBlock: '',
      citedSourcesSummary: [],
      totalSourcesCount: 0,
      totalWordsCount: 0
    };
  }

  const topPassages = [...allPassages]
    .sort((a, b) => b.score - a.score)
    .slice(0, maxPassages)
    .sort((a, b) => a.citationIndex - b.citationIndex);

  const modeDirective =
    usageMode === 'strict_grounding'
      ? `التأسيس الصارم بالمصادر (Strict Grounding): الاستناد المباشر إلى المقاطع الموثقة أدناه مع إدراج رقم المرجع [1]، [2] بجانب كل معلومة مستخرجة، وتوضيح ما لم يرد في المصادر بشفافية.`
      : usageMode === 'canvas_synthesis'
      ? `التوليد الشاسع في الكانفاس (NotebookLM → Canvas): نسج المقاطع الموثقة أدناه في عمل كامل ومفصل داخل <nexus_canvas title="..." type="document">...</nexus_canvas> مع تمهيد موجز في المحادثة.`
      : `الدمج الذكي مع جيميني والويب ++ (Gemini + NotebookLM + Web++): توظيف المقاطع المسترجعة من دفاتر المستخدم كقاعدة معرفية أساسية مندمجة مع الاستدلال الحر وأدوات الويب ++ مع الإشارة لأرقام المصادر [1]، [2] عند الاقتباس.`;

  const sourceDirectoryLines = citedSourcesSummary
    .map(s => `[${s.index}] ${s.title} (الدفتر: ${s.notebookTitle} · ${s.wordCount.toLocaleString('en-US')} كلمة)`)
    .join('\n');

  const passagesFormatted =
    topPassages.length > 0
      ? topPassages
          .map(
            p =>
              `--- مقطع مسترجع من المصدر [${p.citationIndex}] "${p.sourceTitle}" (الدفتر: ${p.notebookTitle}) ---\n${p.text}`
          )
          .join('\n\n')
      : '';

  const contextBlock = `\n\n[GOOGLE NOTEBOOKLM RAG ENGINE — LIVE CONNECTED SOURCES IN NEXUS]:
- الدفاتر المعرفية المتصلة بهذه المحادثة: (${attachedNotebooks.map(n => n.title).join(' + ')})، ومقاطعها المسترجعة أدناه حاضرة للتوثيق بأرقام المراجع مثل [1] و [2].
- طبيعة التوظيف المعرفي: ${modeDirective}
- إجمالي المصادر المفعلة: ${totalSourcesCount} مصدر (${totalWordsCount.toLocaleString('en-US')} كلمة)
- فهرس المراجع المرقمة للتوثيق:
${sourceDirectoryLines}

- المقاطع الأعلى صلة بسؤال المستخدم (Top-${topPassages.length} BM25 Semantic Chunks):
${passagesFormatted}\n`;

  return {
    contextBlock,
    citedSourcesSummary,
    totalSourcesCount,
    totalWordsCount
  };
}

export interface UrlIngestResult {
  ok: boolean;
  source?: GeminiNotebookSource;
  isPrivateNotebookLmUrl?: boolean;
  requiresSharingOrPaste?: boolean;
  message?: string;
}

/**
 * Ingests a URL (Google Docs, Google Sheets, Google Drive, YouTube video with captions,
 * Web article, or public NotebookLM link) using the dedicated server-side `/api/notebooklm/ingest` engine.
 */
export async function ingestUrlIntoNotebookSource(
  rawUrl: string,
  customTitle?: string
): Promise<UrlIngestResult> {
  const cleanUrl = rawUrl.trim();
  const isNotebookLmUrl = /notebooklm\.google\.com/i.test(cleanUrl);

  try {
    const res = await fetch('/api/notebooklm/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: cleanUrl, customTitle })
    });

    const data = await res.json();

    if (res.ok && data?.ok && data?.content) {
      const cleanBody = String(data.content).trim();
      const wordCount = data.wordCount || cleanBody.split(/\s+/).filter(Boolean).length;
      const source: GeminiNotebookSource = {
        id: `src-url-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: data.title || customTitle || cleanUrl,
        content: cleanBody,
        sourceType: data.sourceType || (isNotebookLmUrl ? 'notebooklm_url' : 'web_url'),
        notebookLmSourceUrl: cleanUrl,
        driveWebViewLink: data.sourceType === 'google_drive' ? cleanUrl : undefined,
        isEnabled: true,
        wordCount,
        addedAt: Date.now()
      };
      return { ok: true, source };
    }

    return {
      ok: false,
      isPrivateNotebookLmUrl: Boolean(data?.isPrivateNotebookLmUrl || isNotebookLmUrl),
      requiresSharingOrPaste: Boolean(data?.requiresSharingOrPaste),
      message:
        data?.message ||
        'تعذر سحب المحتوى المباشر من هذا الرابط لأنه يتطلب تسجيل دخول خاص. الصق النص مباشرة في «الاستيراد المباشر من NotebookLM».'
    };
  } catch (err: any) {
    return {
      ok: false,
      isPrivateNotebookLmUrl: isNotebookLmUrl,
      message: err?.message || 'تعذر الاتصال بمحرك استخلاص الروابط.'
    };
  }
}

/**
 * Smart parser that takes raw pasted content from an open `notebooklm.google.com` page
 * (or a JSON bundle generated by the 1-Click NotebookLM Bridge Script, or multi-section markdown)
 * and splits it into distinct, indexed `GeminiNotebookSource` items `[1]`, `[2]`, `[3]`.
 */
export function parseNotebookLmBundleIntoSources(
  rawInput: string,
  defaultTitlePrefix = 'مصدر NotebookLM'
): { notebookTitle?: string; sources: GeminiNotebookSource[] } {
  const trimmed = (rawInput || '').trim();
  if (!trimmed) return { sources: [] };

  // 1. Check if it's a JSON bundle from our 1-Click NotebookLM Bookmarklet / Console Bridge
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && Array.isArray(parsed.sources) && parsed.sources.length > 0) {
        const mapped: GeminiNotebookSource[] = parsed.sources
          .filter((s: any) => s && typeof s.content === 'string' && s.content.trim().length > 0)
          .map((s: any, idx: number) => {
            const cleanText = s.content.trim();
            return {
              id: `src-nblm-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
              title: (s.title || `${defaultTitlePrefix} #${idx + 1}`).trim(),
              content: cleanText,
              sourceType: 'notebooklm_url',
              notebookLmSourceUrl: parsed.notebookUrl || 'https://notebooklm.google.com/',
              isEnabled: true,
              wordCount: cleanText.split(/\s+/).filter(Boolean).length,
              addedAt: Date.now()
            };
          });
        if (mapped.length > 0) {
          return {
            notebookTitle: parsed.notebookTitle || undefined,
            sources: mapped
          };
        }
      }
    } catch {
      // Not a JSON bundle; proceed with multi-section text parsing
    }
  }

  // 2. Check if the pasted text contains explicit source dividers (`=== المصدر:`, `--- المصدر`, `## المصدر`, etc.)
  const sectionSplits = trimmed
    .split(/\n(?:={3,}|-{3,})\s*(?:\n|$)|(?=\n#{1,2}\s+(?:المصدر|Source|ملاحظة|Note|الفصل|Document)\b)/i)
    .map(s => s.trim())
    .filter(s => s.length >= 25);

  if (sectionSplits.length > 1 && sectionSplits.length <= 25) {
    const sources: GeminiNotebookSource[] = sectionSplits.map((block, idx) => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      const firstLine = lines[0]?.replace(/^[#=*-\s]+/, '').trim() || '';
      const hasHeaderLine = firstLine.length > 2 && firstLine.length <= 95 && lines.length > 1;
      const title = hasHeaderLine ? firstLine : `${defaultTitlePrefix} #${idx + 1}`;
      const body = hasHeaderLine ? lines.slice(1).join('\n\n').trim() : block;
      const finalContent = body.length >= 15 ? body : block;

      return {
        id: `src-split-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
        title,
        content: finalContent,
        sourceType: 'notebooklm_url',
        isEnabled: true,
        wordCount: finalContent.split(/\s+/).filter(Boolean).length,
        addedAt: Date.now()
      };
    });
    return { sources };
  }

  // 3. Single rich source
  const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
  const firstLine = lines[0]?.replace(/^[#=*-\s]+/, '').trim() || '';
  const resolvedTitle =
    defaultTitlePrefix !== 'مصدر NotebookLM'
      ? defaultTitlePrefix
      : firstLine.length >= 3 && firstLine.length <= 80
      ? firstLine
      : `${defaultTitlePrefix} (${new Date().toLocaleDateString('ar-SA')})`;

  return {
    sources: [
      {
        id: `src-note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: resolvedTitle,
        content: trimmed,
        sourceType: 'note',
        isEnabled: true,
        wordCount: trimmed.split(/\s+/).filter(Boolean).length,
        addedAt: Date.now()
      }
    ]
  };
}

/**
 * 1-Click Bookmarklet / Console Script that users can run inside `https://notebooklm.google.com`
 * to extract the active notebook title, all visible sources, notes, and chat responses into their clipboard
 * as a structured JSON bundle for instant import into Nexus.
 */
export const NOTEBOOKLM_LIVE_EXTRACTOR_SCRIPT = `javascript:(function(){try{const title=(document.querySelector('h1, .notebook-title, [contenteditable="true"]')?.innerText||document.title||'دفتر NotebookLM').trim();const blocks=Array.from(document.querySelectorAll('article, .source-card, .note-card, .message-content, [role="article"], .mat-mdc-card, main p, main li')).map(el=>el.innerText?.trim()).filter(t=>t&&t.length>40);const unique=[...new Set(blocks)];const content=unique.length>0?unique.join('\\n\\n---\\n\\n'):document.body.innerText;const payload=JSON.stringify({notebookTitle:title,notebookUrl:location.href,sources:[{title:title+' — مستخلص شامل',content:content}]},null,2);navigator.clipboard.writeText(payload).then(()=>alert('تم نسخ محتوى دفترك من NotebookLM بنجاح! انتقل الآن إلى نيكسوس واضغط «لصق الحزمة المنسوخة».'));}catch(e){alert('انسخ النص بـ Ctrl+A ثم Ctrl+C والصقه في نيكسوس مباشرة.');}})();`;

/**
 * Ingests a Google Drive / Google Docs file into a structured NotebookLM source.
 */
export async function ingestGoogleDriveFileIntoSource(
  file: GoogleWorkspaceFileResult
): Promise<GeminiNotebookSource> {
  const textContent = await fetchGoogleDriveFileTextContent(file);
  const cleanText = (textContent || '').trim();
  const wordCount = cleanText.split(/\s+/).filter(Boolean).length;

  return {
    id: `src-drive-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: file.name,
    content: cleanText,
    sourceType: 'google_drive',
    driveFileId: file.id,
    driveWebViewLink: file.webViewLink,
    isEnabled: true,
    wordCount,
    addedAt: Date.now()
  };
}

/**
 * Directly processes any uploaded browser file (PDF, DOCX, XLSX, PPTX, CSV, ZIP, IPYNB, Code, Image, Audio, Text)
 * through Google Workspace & the built-in RAG engine:
 * 1. Uploads/mirrors the file into Google Workspace Drive Vault.
 * 2. Extracts 100% structured text, tables, and page sections via `/api/agent-os/extract-universal-file-rag`.
 * 3. Returns the indexed `GeminiNotebookSource`, Google Workspace Drive file record, and RAG extraction metadata.
 */
export async function ingestBrowserFileIntoWorkspaceRag(
  file: File,
  parentFolderId?: string,
  onProgress?: (percent: number) => void
): Promise<{
  source: GeminiNotebookSource;
  driveRecord: GoogleWorkspaceFileResult;
  ragExtraction?: UniversalRagExtractionResult;
}> {
  const { record, rawContentOrDataUrl, ragExtraction } = await uploadBrowserFileToGoogleDrive(
    file,
    parentFolderId,
    onProgress
  );

  const cleanText = (
    ragExtraction?.extractedText ||
    (rawContentOrDataUrl && !rawContentOrDataUrl.startsWith('data:image/')
      ? rawContentOrDataUrl
      : `[ملف مرفوع عبر Google Workspace: ${file.name}]`)
  ).trim();

  const wordCount =
    ragExtraction?.wordCount || cleanText.split(/\s+/).filter(Boolean).length;

  const source: GeminiNotebookSource = {
    id: `src-wsrag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: file.name,
    content: cleanText,
    sourceType: 'google_drive',
    driveFileId: record.id,
    driveWebViewLink: record.webViewLink,
    isEnabled: true,
    wordCount,
    addedAt: Date.now()
  };

  return {
    source,
    driveRecord: record,
    ragExtraction
  };
}

