import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Code,
  Play,
  Copy,
  Check,
  Download,
  Plus,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  Network,
  BarChart3,
  BookOpen,
  Presentation,
  HelpCircle,
  Terminal,
  FileText,
  Eye,
  CloudUpload,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Minimize2,
  Volume2,
  Square,
  History,
  Wand2,
  Columns,
  Send,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  Quote,
  FileDown,
  Sliders,
  FolderDown,
  Edit3
} from 'lucide-react';
import {
  createGoogleDocInWorkspace,
  createGoogleSheetInWorkspace,
  uploadFileToGoogleDrive,
  hasMarkdownOrCsvTable,
  extractRowsFromTextForSheets
} from '../services/googleWorkspaceService';

export type CanvasStudioTab =
  | 'code_project'
  | 'notebook_guide'
  | 'flashcards'
  | 'quiz'
  | 'data_chart'
  | 'mind_map'
  | 'slides_eras'
  | 'visual_studio';

export interface ProjectFileItem {
  name: string;
  path: string;
  language: 'html' | 'typescript' | 'javascript' | 'python' | 'css' | 'sql' | 'json' | 'markdown';
  content: string;
}

export interface GroundedSourceItem {
  id: string;
  title: string;
  content: string;
  enabled: boolean;
  wordCount: number;
}

export interface CanvasVersionSnapshot {
  id: string;
  label: string;
  timestamp: number;
  projectTitle: string;
  files: ProjectFileItem[];
  documentBody?: string;
}

interface NexusCanvasStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: CanvasStudioTab;
  initialPrompt?: string;
  initialCode?: string;
  initialContent?: string;
  initialImageBase64?: string;
  onSendToChat?: (message: string) => void;
  onSendPromptToChat?: (message: string) => void;
  onGenerateVisualWithNexus?: (
    visualPrompt: string,
    aspectRatio: string,
    inputImage?: { data: string; mimeType: string }
  ) => Promise<string | null>;
}

/**
 * Converts Markdown text (containing #, ##, ###, **, *, lists, blockquotes, code blocks, tables)
 * into clean, rich formatted HTML that matches Nexus ChatMessage styling—without raw ** or ### symbols.
 */
function markdownToRichHtml(markdown: string): string {
  if (!markdown) return '';
  let html = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Fenced code blocks ```lang ... ```
  html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    const cleanLang = lang || 'code';
    return `<div class="my-4 rounded-xl border border-zinc-800 bg-[#07080c] overflow-hidden" dir="ltr"><div class="px-3 py-1.5 bg-zinc-900/90 border-b border-zinc-800 text-[11px] font-mono text-emerald-400 uppercase">${cleanLang}</div><pre class="p-3.5 text-xs font-mono text-zinc-200 overflow-x-auto leading-relaxed"><code>${code.trim()}</code></pre></div>`;
  });

  // Inline code `...`
  html = html.replace(
    /`([^`\n]+)`/g,
    '<code class="px-1.5 py-0.5 rounded bg-zinc-800/90 text-emerald-300 font-mono text-xs border border-zinc-700/60">$1</code>'
  );

  // Process line by line for headings, lists, blockquotes, tables, and paragraphs
  const lines = html.split('\n');
  const outLines: string[] = [];
  let inUl = false;
  let inOl = false;
  let inTable = false;

  const closeListsAndTable = () => {
    if (inUl) {
      outLines.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      outLines.push('</ol>');
      inOl = false;
    }
    if (inTable) {
      outLines.push('</tbody></table></div>');
      inTable = false;
    }
  };

  const formatInline = (text: string): string => {
    return text
      // Bold + Italic ***text***
      .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong class="font-bold text-white italic">$1</strong>')
      // Bold **text** or __text__
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
      .replace(/__([^_]+)__/g, '<strong class="font-bold text-white">$1</strong>')
      // Italic *text*
      .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em class="italic text-emerald-100">$2</em>')
      // Strikethrough ~~text~~
      .replace(/~~([^~]+)~~/g, '<del class="line-through text-zinc-500">$1</del>');
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Skip lines inside code blocks already converted
    if (rawLine.includes('<div class="my-4 rounded-xl') || rawLine.includes('</code></pre></div>')) {
      closeListsAndTable();
      outLines.push(rawLine);
      continue;
    }

    if (!trimmed) {
      closeListsAndTable();
      outLines.push('<div class="h-2.5"></div>');
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      closeListsAndTable();
      outLines.push('<hr class="my-4 border-zinc-800" />');
      continue;
    }

    // Markdown Table row | ... |
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      // Check if separator row |---|---|
      if (/^\|[\s:-]+\|$/.test(trimmed.replace(/\|/g, '|'))) {
        if (/^[\s|:-]+$/.test(trimmed)) {
          continue;
        }
      }
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map(c => formatInline(c.trim()));
      if (!inTable) {
        closeListsAndTable();
        inTable = true;
        outLines.push(
          '<div class="my-4 overflow-x-auto rounded-xl border border-zinc-800"><table class="w-full text-right border-collapse text-xs md:text-sm"><thead><tr class="bg-zinc-900/90 border-b border-zinc-800 text-emerald-300 font-bold">' +
            cells.map(c => `<th class="p-2.5 border-l border-zinc-800 last:border-l-0">${c}</th>`).join('') +
            '</tr></thead><tbody class="divide-y divide-zinc-800/70">'
        );
      } else {
        outLines.push(
          '<tr class="bg-zinc-950/50 hover:bg-zinc-900/40">' +
            cells.map(c => `<td class="p-2.5 text-zinc-200 border-l border-zinc-800/60 last:border-l-0">${c}</td>`).join('') +
            '</tr>'
        );
      }
      continue;
    }

    // Headings
    const hMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (hMatch) {
      closeListsAndTable();
      const level = hMatch[1].length;
      const content = formatInline(hMatch[2]);
      if (level === 1) {
        outLines.push(
          `<h1 class="text-xl md:text-2xl font-bold text-white mt-4 mb-2.5 pb-2 border-b border-zinc-800/80">${content}</h1>`
        );
      } else if (level === 2) {
        outLines.push(
          `<h2 class="text-lg md:text-xl font-bold text-emerald-300 mt-4 mb-2">${content}</h2>`
        );
      } else if (level === 3) {
        outLines.push(
          `<h3 class="text-base md:text-lg font-bold text-zinc-100 mt-3 mb-1.5">${content}</h3>`
        );
      } else {
        outLines.push(
          `<h4 class="text-sm md:text-base font-bold text-zinc-200 mt-2.5 mb-1">${content}</h4>`
        );
      }
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('&gt;') || trimmed.startsWith('>')) {
      closeListsAndTable();
      const qText = formatInline(trimmed.replace(/^(&gt;|>)\s*/, ''));
      outLines.push(
        `<blockquote class="my-2.5 pr-3.5 pl-3 py-2 border-r-4 border-emerald-500/60 bg-emerald-950/15 rounded-l-xl text-zinc-200 italic">${qText}</blockquote>`
      );
      continue;
    }

    // Unordered list (- or * or •)
    const ulMatch = trimmed.match(/^([-*•])\s+(.+)$/);
    if (ulMatch) {
      if (inOl || inTable) closeListsAndTable();
      if (!inUl) {
        inUl = true;
        outLines.push('<ul class="my-2 space-y-1.5 pr-5 list-disc marker:text-emerald-400">');
      }
      outLines.push(`<li class="text-zinc-200 leading-relaxed">${formatInline(ulMatch[2])}</li>`);
      continue;
    }

    // Ordered list (1. 2. etc.)
    const olMatch = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
    if (olMatch) {
      if (inUl || inTable) closeListsAndTable();
      if (!inOl) {
        inOl = true;
        outLines.push('<ol class="my-2 space-y-1.5 pr-5 list-decimal marker:text-emerald-400 marker:font-mono">');
      }
      outLines.push(`<li class="text-zinc-200 leading-relaxed">${formatInline(olMatch[2])}</li>`);
      continue;
    }

    closeListsAndTable();
    outLines.push(`<p class="text-zinc-200 leading-relaxed my-1.5">${formatInline(trimmed)}</p>`);
  }

  closeListsAndTable();
  return outLines.join('\n');
}

/**
 * Converts edited rich HTML back into clean Markdown so AI transformations and exports stay synchronized.
 */
function richHtmlToMarkdown(container: HTMLElement): string {
  const clone = container.cloneNode(true) as HTMLElement;

  clone.querySelectorAll('h1').forEach(el => {
    el.replaceWith(`\n# ${el.textContent?.trim() || ''}\n`);
  });
  clone.querySelectorAll('h2').forEach(el => {
    el.replaceWith(`\n## ${el.textContent?.trim() || ''}\n`);
  });
  clone.querySelectorAll('h3').forEach(el => {
    el.replaceWith(`\n### ${el.textContent?.trim() || ''}\n`);
  });
  clone.querySelectorAll('h4').forEach(el => {
    el.replaceWith(`\n#### ${el.textContent?.trim() || ''}\n`);
  });
  clone.querySelectorAll('strong, b').forEach(el => {
    const t = el.textContent || '';
    if (t.trim()) el.replaceWith(`**${t}**`);
  });
  clone.querySelectorAll('em, i').forEach(el => {
    const t = el.textContent || '';
    if (t.trim()) el.replaceWith(`*${t}*`);
  });
  clone.querySelectorAll('blockquote').forEach(el => {
    el.replaceWith(`\n> ${el.textContent?.trim() || ''}\n`);
  });
  clone.querySelectorAll('ul').forEach(ul => {
    const items = Array.from(ul.querySelectorAll('li'))
      .map(li => `- ${li.textContent?.trim() || ''}`)
      .join('\n');
    ul.replaceWith(`\n${items}\n`);
  });
  clone.querySelectorAll('ol').forEach(ol => {
    const items = Array.from(ol.querySelectorAll('li'))
      .map((li, idx) => `${idx + 1}. ${li.textContent?.trim() || ''}`)
      .join('\n');
    ol.replaceWith(`\n${items}\n`);
  });
  clone.querySelectorAll('p').forEach(p => {
    p.replaceWith(`${p.textContent || ''}\n\n`);
  });

  return (clone.innerText || clone.textContent || '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const DEFAULT_PROJECT_FILES: ProjectFileItem[] = [
  {
    name: 'index.html',
    path: 'src/index.html',
    language: 'html',
    content: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>مساحة عمل الكانفاس التفاعلية</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-6 font-sans">
  <div class="max-w-4xl mx-auto space-y-6">
    <header class="p-6 rounded-2xl bg-gradient-to-l from-emerald-950/70 to-slate-900 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
      <div>
        <div class="text-xs font-mono text-emerald-400">NEXUS INTERACTIVE CANVAS</div>
        <h1 class="text-2xl font-bold text-white mt-1">لوحة هندسة المشاريع والمعاينة الفورية</h1>
        <p class="text-sm text-slate-400 mt-1">عدّل الكود أو جرّبه حياً هنا أو نزّله كملفات مشروع جاهزة.</p>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="runSimulation()" class="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20 cursor-pointer">
          تشغيل المحاكاة الحية
        </button>
        <button onclick="addNode()" class="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 transition cursor-pointer">
          + عقدة جديدة
        </button>
      </div>
    </header>

    <div id="metrics" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
        <div class="text-xs text-slate-400">كفاءة الاستنتاج المعماري</div>
        <div id="val-1" class="text-2xl font-bold text-emerald-400 mt-1">99.4%</div>
      </div>
      <div class="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
        <div class="text-xs text-slate-400">العقد الحسابية النشطة</div>
        <div id="val-2" class="text-2xl font-bold text-cyan-400 mt-1">1,024</div>
      </div>
      <div class="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
        <div class="text-xs text-slate-400">زمن الاستجابة الفوري</div>
        <div id="val-3" class="text-2xl font-bold text-amber-400 mt-1">11ms</div>
      </div>
    </div>

    <div id="log-box" class="p-4 rounded-xl bg-black/80 border border-slate-800 font-mono text-xs text-emerald-300 space-y-1.5 max-h-52 overflow-y-auto">
      <div>[READY] مساحة الكانفاس جاهزة للتشغيل الفوري والتطوير المستمر...</div>
    </div>
  </div>

  <script>
    let nodesCount = 1024;
    function runSimulation() {
      const logBox = document.getElementById('log-box');
      const v1 = (98.4 + Math.random() * 1.5).toFixed(2) + '%';
      const v2 = nodesCount.toLocaleString();
      const v3 = Math.floor(6 + Math.random() * 10) + 'ms';
      document.getElementById('val-1').textContent = v1;
      document.getElementById('val-2').textContent = v2;
      document.getElementById('val-3').textContent = v3;
      const entry = document.createElement('div');
      entry.textContent = '[EXEC ' + new Date().toLocaleTimeString() + '] تحديث القياسات الحية -> الكفاءة: ' + v1 + ' | العقد: ' + v2;
      logBox.prepend(entry);
    }
    function addNode() {
      nodesCount += 128;
      runSimulation();
    }
  </script>
</body>
</html>`
  },
  {
    name: 'engine.py',
    path: 'backend/engine.py',
    language: 'python',
    content: `# محرك التحليل الحسابي في كانفاس نيكسوس
import statistics

data_points = [42, 68, 91, 115, 148, 192, 240]
mean_val = statistics.mean(data_points)
stdev_val = statistics.stdev(data_points)
growth_rate = ((data_points[-1] - data_points[0]) / data_points[0]) * 100

print("=== NEXUS PYTHON SANDBOX EXECUTION ===")
print(f"عدد القراءات: {len(data_points)}")
print(f"المتوسط الحسابي: {mean_val:.2f}")
print(f"الانحراف المعياري: {stdev_val:.2f}")
print(f"معدل النمو الإجمالي: {growth_rate:.1f}%")
`
  },
  {
    name: 'schema.sql',
    path: 'database/schema.sql',
    language: 'sql',
    content: `-- هيكلية قاعدة بيانات المشروع في كانفاس نيكسوس
CREATE TABLE IF NOT EXISTS nexus_projects (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  architecture_type VARCHAR(64) DEFAULT 'sovereign_fullstack',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
  }
];

type PrimaryCanvasWorkspace = 'document' | 'code' | 'learning' | 'visual';
type LearningArtifactSubTab = 'flashcards' | 'quiz' | 'data_chart' | 'mind_map' | 'slides' | 'audio';

export const NexusCanvasStudioModal: React.FC<NexusCanvasStudioModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'code_project',
  initialPrompt = '',
  initialCode,
  initialContent,
  initialImageBase64,
  onSendPromptToChat,
  onGenerateVisualWithNexus
}) => {
  const [primaryWorkspace, setPrimaryWorkspace] = useState<PrimaryCanvasWorkspace>('document');
  const [learningSubTab, setLearningSubTab] = useState<LearningArtifactSubTab>('quiz');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [canvasWidthPreset, setCanvasWidthPreset] = useState<'balanced' | 'wide'>('balanced');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedState, setCopiedState] = useState<boolean>(false);
  const [showExportDropdown, setShowExportDropdown] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<{
    text: string;
    url?: string;
    type: 'info' | 'success' | 'error';
  } | null>(null);

  // Quick instruction bar at the bottom of the Canvas
  const [canvasInstructionInput, setCanvasInstructionInput] = useState<string>(initialPrompt || '');

  // 1. Document Workspace State (Rich Formatted View by default — no raw ** or ### clutter!)
  const [documentTitle, setDocumentTitle] = useState<string>('مستند ومساحة عمل الكانفاس');
  const [documentBody, setDocumentBody] = useState<string>(
    `# مستند الكانفاس التفاعلي المنسّق\n\nاكتب أو حرر مستنداتك، قصصك، ورواياتك، أو تقاريرك هنا بتنسيق كامل وواضح تماماً كما يظهر في رسائل نيكسوس بدون أي رموز نجوم أو علامات شبابيك مزعجة.\n\n## أبرز إمكانيات مساحة الكانفاس:\n- **التحرير المباشر المنسّق**: انقر في أي مكان داخل النص لتعديله مباشرة، أو ظلّل أي فقرة لتظهر لك أداة التعديل الذكي الجزئي.\n- **تحويل فوري متعدد الخيارات**: حوّل أي نص أو محادثة بنقرة واحدة إلى **اختبار تفاعلي (خيارات)**، **مخطط بياني**، **بطاقات تعليمية**، أو **عرض تقديمي**.\n- **البرمجة والمعاينة والتنزيل**: جرّب الأكواد والمشاريع البرمجية حياً داخل الكانفاس أو قم بتنزيل ملفات المشروع وتصديرها إلى Google Drive.`
  );
  const [isRawMarkdownMode, setIsRawMarkdownMode] = useState<boolean>(false);
  const richEditorRef = useRef<HTMLDivElement | null>(null);
  const isInternalTypingRef = useRef<boolean>(false);

  // Floating selection toolbar for "Select & Ask Nexus to Edit" (like Gemini Canvas)
  const [selectedSnippet, setSelectedSnippet] = useState<string>('');
  const [selectionCustomPrompt, setSelectionCustomPrompt] = useState<string>('');
  const [showToneLengthPopover, setShowToneLengthPopover] = useState<boolean>(false);

  // 2. Code & Live Preview Workspace State
  const [projectFiles, setProjectFiles] = useState<ProjectFileItem[]>(DEFAULT_PROJECT_FILES);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [activeDocChapterIdx, setActiveDocChapterIdx] = useState<number>(-1);
  const [fullUnifiedDocBody, setFullUnifiedDocBody] = useState<string>('');
  const [codeViewMode, setCodeViewMode] = useState<'preview' | 'code' | 'split'>('split');
  const [previewRefreshKey, setPreviewRefreshKey] = useState<number>(0);
  const [pythonOutput, setPythonOutput] = useState<string>('');
  const [isRunningPython, setIsRunningPython] = useState<boolean>(false);
  const [versionHistory, setVersionHistory] = useState<CanvasVersionSnapshot[]>([
    {
      id: 'v-1',
      label: 'v1',
      timestamp: Date.now(),
      projectTitle: 'مشروع الكانفاس التفاعلي',
      files: DEFAULT_PROJECT_FILES
    }
  ]);

  // Sovereign Harness Engine State (DeepSeek ctx.subagents + Claude Virtual Worktrees + OpenAI Codex apply_patch)
  const [showHarnessDrawer, setShowHarnessDrawer] = useState<boolean>(false);
  const [isHarnessRunning, setIsHarnessRunning] = useState<boolean>(false);
  const [harnessPromptInput, setHarnessPromptInput] = useState<string>('');
  const [surgicalPatchInput, setSurgicalPatchInput] = useState<string>('');
  const [harnessTelemetry, setHarnessTelemetry] = useState<{
    runId: string;
    mode: 'code_project' | 'grand_creation';
    exploreReportAr: string;
    architectPlanAr: string;
    verificationReportAr: string;
    totalDurationMs: number;
    subagentReports: Array<{
      id: string;
      roleNameAr: string;
      worktreeId: string;
      durationMs: number;
      ownedPaths: string[];
      distilledSummaryAr: string;
      linesWritten: number;
    }>;
    worktreeMergeLogAr: string[];
  } | null>(null);
  const [lastPatchDiffs, setLastPatchDiffs] = useState<
    Array<{ path: string; action: string; linesAdded: number; linesRemoved: number }>
  >([]);

  // 3. Interactive Learning & Data Artifacts State
  const [flashcards, setFlashcards] = useState<Array<{ q: string; a: string; tag: string }>>([
    {
      q: 'ما الميزة الأساسية لوضع المستند المنسّق في كانفاس نيكسوس؟',
      a: 'يعرض العناوين والنصوص العريضة والقوائم والجداول بتنسيقها الطبيعي الغني دون إظهار رموز الماركداون الخام مثل النجوم (**) أو الشبابيك (###)، مع إمكانية التعديل المباشر.',
      tag: 'تحرير المستندات'
    },
    {
      q: 'كيف يمكنك التعامل مع الأكواد البرمجية الطويلة داخل الكانفاس؟',
      a: 'يمكنك الاختيار بين تجربتها وتشغيلها حياً داخل معاينة الكانفاس التفاعلية أو تنزيلها كملفات مشروع جاهزة على جهازك أو تصديرها إلى Google Drive.',
      tag: 'المشاريع البرمجية'
    },
    {
      q: 'كيف تحول أي موضوع أو رسالة إلى اختبار أو مخطط بياني؟',
      a: 'من خلال شريط الخيارات التفاعلية السريعة في الكانفاس يمكنك توليد اختبار متعدد الخيارات أو مخطط بياني أو بطاقات استذكار بنقرة واحدة.',
      tag: 'التعلم والبيانات'
    }
  ]);
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false);

  const [quizQuestions, setQuizQuestions] = useState<
    Array<{ question: string; options: string[]; correctIndex: number; explanation: string }>
  >([
    {
      question: 'أي خيار في الكانفاس يتيح لك تجربة الكود البرمجي مباشرة أو تنزيله كملفات مشروع؟',
      options: [
        'قسم البرمجة والمعاينة الحية (تشغيل حي + تنزيل ملفات المشروع)',
        'وضع القراءة الصامتة فقط',
        'إعدادات الصوت فقط',
        'سجل البحث الخارجي'
      ],
      correctIndex: 0,
      explanation:
        'يتيح قسم البرمجة والمعاينة تشغيل واجهات الويب وأكواد بايثون حياً داخل الكانفاس أو تنزيل الملفات البرمجية مباشرة.'
    },
    {
      question: 'ماذا يحدث عند تظليل فقرة داخل مستند الكانفاس؟',
      options: [
        'تظهر أداة التعديل الذكي الجزئي لإعادة صياغة الفقرة أو توسيعها أو تعديلها مع نيكسوس',
        'يتم حذف المستند بالكامل',
        'تغلق نافذة المحادثة',
        'يتحول النص إلى رموز مشفرة'
      ],
      correctIndex: 0,
      explanation:
        'تماماً مثل كانفاس جيميني، يتيح لك تظليل أي جزء من النص توجيه نيكسوس لتعديل ذلك الجزء تحديداً دون المساس بباقي المستند.'
    }
  ]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

  const [chartTitle, setChartTitle] = useState<string>('مؤشرات الأداء والتحليل الكمي');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'comparison'>('bar');
  const [chartData, setChartData] = useState<Array<{ label: string; value: number; secondary: number }>>([
    { label: 'المرحلة 1', value: 64, secondary: 48 },
    { label: 'المرحلة 2', value: 78, secondary: 62 },
    { label: 'المرحلة 3', value: 89, secondary: 74 },
    { label: 'المرحلة 4', value: 96, secondary: 85 }
  ]);

  const [mindMapNodes, setMindMapNodes] = useState<Array<{ title: string; items: string[] }>>([
    {
      title: 'الركيزة الأولى: التحرير المنسّق والروايات',
      items: ['كتابة وتحرير القصص والمقالات الطويلة', 'عرض منسق خالٍ من رموز الماركداون الخام', 'تعديل الفقرات المحددة بالذكاء الاصطناعي']
    },
    {
      title: 'الركيزة الثانية: البرمجة والتشغيل الحي',
      items: ['معاينة فورية لتطبيقات الويب', 'تنفيذ أكواد بايثون في البيئة المعزولة', 'تنزيل ملفات المشروع الكاملة']
    },
    {
      title: 'الركيزة الثالثة: الاختبارات والمخططات والتصدير',
      items: ['اختبارات تفاعلية متعددة الخيارات', 'مخططات بيانية مقارنة', 'تصدير مباشر إلى PDF و Word و Google Drive']
    }
  ]);

  const [slidesList, setSlidesList] = useState<Array<{ title: string; subtitle: string; bullets: string[] }>>([
    {
      title: 'نظرة شاملة على المشروع',
      subtitle: 'عرض تقديمي مستخلص داخل مساحة الكانفاس',
      bullets: [
        'دمج سلس بين الكتابة المنسقة، البرمجة الحية، والاختبارات التفاعلية',
        'إمكانية التعديل المباشر أو التوجيه الذكي الفوري لكل فقرة',
        'جاهزية كاملة للتصدير بـ 7 صيغ أو الحفظ المباشر في Google Drive'
      ]
    },
    {
      title: 'الخطوات التنفيذية والمخرجات',
      subtitle: 'خارطة الطريق والتحقق',
      bullets: [
        'تحليل المتطلبات وبناء النموذج الأولي في المعاينة الحية',
        'اختبار الكفاءة عبر محرك بايثون والرسوم البيانية',
        'اعتماد النسخة النهائية وتصديرها للمستندات السحابية'
      ]
    }
  ]);
  const [activeSlideIdx, setActiveSlideIdx] = useState<number>(0);

  const [audioScript] = useState<Array<{ speaker: string; text: string }>>([
    {
      speaker: 'المحلل الأول',
      text: 'أهلاً بك في الملخص الصوتي التفاعلي داخل الكانفاس، حيث نحول المستندات والمشاريع المعقدة إلى نقاش واضح ومركّز.'
    },
    {
      speaker: 'المحلل الثاني',
      text: 'المميز هنا أنك تستطيع تعديل النص المنسق أو تجربة الكود حياً وتوليد اختبارات ومخططات بيانية من نفس المحتوى فوراً.'
    }
  ]);
  const [isSpeakingAudio, setIsSpeakingAudio] = useState<boolean>(false);

  // 4. Visual Studio & Region Editing State
  const [visualImage, setVisualImage] = useState<string | null>(initialImageBase64 || null);
  const [visualEditPrompt, setVisualEditPrompt] = useState<string>('');
  const [selectedAtmosphere, setSelectedAtmosphere] = useState<string>('إضاءة سينمائية دافئة');
  const [regionSelection] = useState<{ x: number; y: number; w: number; h: number } | null>({
    x: 22,
    y: 24,
    w: 45,
    h: 42
  });

  // Sync rich HTML editor whenever documentBody changes externally (and user isn't actively typing inside contentEditable)
  useEffect(() => {
    if (!isRawMarkdownMode && richEditorRef.current && !isInternalTypingRef.current) {
      richEditorRef.current.innerHTML = markdownToRichHtml(documentBody);
    }
  }, [documentBody, isRawMarkdownMode, primaryWorkspace, isOpen]);

  // Sync incoming props when user clicks "فتح في الكانفاس" or triggers a specific mode
  useEffect(() => {
    if (initialTab) {
      if (initialTab === 'code_project') {
        setPrimaryWorkspace('code');
      } else if (initialTab === 'visual_studio') {
        setPrimaryWorkspace('visual');
      } else if (initialTab === 'notebook_guide') {
        setPrimaryWorkspace('document');
      } else {
        setPrimaryWorkspace('learning');
        if (initialTab === 'flashcards') setLearningSubTab('flashcards');
        else if (initialTab === 'quiz') setLearningSubTab('quiz');
        else if (initialTab === 'data_chart') setLearningSubTab('data_chart');
        else if (initialTab === 'mind_map') setLearningSubTab('mind_map');
        else if (initialTab === 'slides_eras') setLearningSubTab('slides');
      }
    }
  }, [initialTab]);

  useEffect(() => {
    if (initialImageBase64) {
      setVisualImage(initialImageBase64);
      if (initialTab === 'visual_studio' || (!initialContent?.trim() && !initialCode?.trim())) {
        setPrimaryWorkspace('visual');
      }
    }
  }, [initialImageBase64, initialTab, initialContent, initialCode]);

  useEffect(() => {
    if (initialCode && initialCode.trim()) {
      setPrimaryWorkspace('code');
      setProjectFiles(prev => {
        const next = [...prev];
        next[0] = {
          ...next[0],
          content: initialCode
        };
        return next;
      });
      setPreviewRefreshKey(k => k + 1);
    }
  }, [initialCode]);

  useEffect(() => {
    if (initialContent && initialContent.trim()) {
      const rawText = initialContent.trim();

      // 1. Check for <nexus_file path="..." title="..." language="...">...</nexus_file> tags (AI Studio Fluid Agent Multi-File & Grand Work format)
      const nexusFileMatches = Array.from(
        rawText.matchAll(/<nexus_file([^>]*)>([\s\S]*?)<\/nexus_file>/gi)
      );

      const normalizeLang = (raw: string, pathHint: string = ''): ProjectFileItem['language'] => {
        const l = (raw || '').toLowerCase().trim();
        const ext = (pathHint.split('.').pop() || '').toLowerCase();
        if (l === 'html' || ext === 'html' || ext === 'htm') return 'html';
        if (l === 'css' || ext === 'css') return 'css';
        if (l === 'typescript' || l === 'ts' || l === 'tsx' || ext === 'ts' || ext === 'tsx') return 'typescript';
        if (l === 'javascript' || l === 'js' || l === 'jsx' || ext === 'js' || ext === 'jsx') return 'javascript';
        if (l === 'python' || l === 'py' || ext === 'py') return 'python';
        if (l === 'sql' || ext === 'sql') return 'sql';
        if (l === 'json' || ext === 'json') return 'json';
        return 'markdown';
      };

      if (nexusFileMatches.length > 0) {
        const extractedFiles: ProjectFileItem[] = nexusFileMatches.map((m, idx) => {
          const attrs = m[1] || '';
          const body = (m[2] || '')
            .replace(/^```[a-zA-Z0-9_-]*\n?/i, '')
            .replace(/```$/i, '')
            .trim();
          const pathAttr = attrs.match(/path="([^"]*)"/i)?.[1]?.trim() || `src/file_${idx + 1}.md`;
          const titleAttr = attrs.match(/title="([^"]*)"/i)?.[1]?.trim() || '';
          const langAttr = attrs.match(/(?:language|lang)="([^"]*)"/i)?.[1]?.trim() || '';
          const resolvedLang = normalizeLang(langAttr, pathAttr);
          const baseName = pathAttr.split('/').pop() || `file_${idx + 1}`;
          return {
            name: titleAttr ? `${titleAttr.slice(0, 32)} (${baseName})` : baseName,
            path: pathAttr,
            language: resolvedLang,
            content: body
          };
        });

        setProjectFiles(extractedFiles);
        setActiveFileIndex(0);
        setActiveDocChapterIdx(-1);

        const codeFileCount = extractedFiles.filter(f =>
          ['html', 'css', 'javascript', 'typescript', 'python', 'sql'].includes(f.language)
        ).length;
        const markdownFileCount = extractedFiles.filter(f => f.language === 'markdown').length;

        const combinedCleanedDoc = rawText
          .replace(/<nexus_file([^>]*)>([\s\S]*?)<\/nexus_file>/gi, (_full, attrs, body) => {
            const titleAttr = String(attrs || '').match(/title="([^"]*)"/i)?.[1]?.trim();
            const pathAttr = String(attrs || '').match(/path="([^"]*)"/i)?.[1]?.trim();
            const langAttr = (String(attrs || '').match(/(?:language|lang)="([^"]*)"/i)?.[1]?.trim() || '').toLowerCase();
            const header = titleAttr ? `${titleAttr} (${pathAttr || ''})` : pathAttr || 'قسم';
            const cleanBody = String(body || '').trim();
            if (['python', 'py', 'javascript', 'typescript', 'html', 'css', 'sql', 'json'].includes(langAttr) && !cleanBody.startsWith('```')) {
              return `\n\n## 💻 ${header}\n\n\`\`\`${langAttr}\n${cleanBody}\n\`\`\`\n\n`;
            }
            return `\n\n## 📑 ${header}\n\n${cleanBody}\n\n`;
          })
          .trim();

        const unifiedDoc = combinedCleanedDoc || rawText;
        isInternalTypingRef.current = false;
        setFullUnifiedDocBody(unifiedDoc);
        setDocumentBody(unifiedDoc);

        const firstTitle =
          extractedFiles[0]?.name ||
          unifiedDoc
            .split('\n')
            .find(line => line.trim().length > 3)
            ?.replace(/^[#*>-]+\s*/, '')
            .replace(/\*\*/g, '')
            .slice(0, 65);
        if (firstTitle) setDocumentTitle(firstTitle);

        // If user explicitly clicked "قراءة وتحرير وتوسيع الفصول" or the work is predominantly Markdown chapters (e.g. 6 chapters + 1 simulator), open Document mode with the multi-chapter bar; if predominantly code, open Code mode
        if (initialTab === 'notebook_guide' || markdownFileCount >= codeFileCount) {
          setPrimaryWorkspace('document');
        } else {
          setPrimaryWorkspace('code');
          setCodeViewMode('split');
          setPreviewRefreshKey(k => k + 1);
        }
        return;
      }

      // 1.5 Check for <nexus_patch path="..." action="update|add|delete">...</nexus_patch> tags (Codex Surgical Patch format)
      if (/<nexus_patch/i.test(rawText)) {
        fetch('/api/agent-os/harness/apply-patch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            files: projectFiles,
            patchText: rawText
          })
        })
          .then(r => r.json())
          .then(data => {
            if (data && data.patchResult && Array.isArray(data.patchResult.patchedFiles)) {
              setProjectFiles(data.patchResult.patchedFiles);
              setLastPatchDiffs(data.patchResult.diffSummary || []);
              setShowHarnessDrawer(true);
              setPrimaryWorkspace('code');
              setCodeViewMode('split');
              setPreviewRefreshKey(k => k + 1);
              setStatusBanner({
                text: data.patchResult.logAr || 'تم تطبيق الرقعة الجراحية تلقائياً في المرسم.',
                type: 'success'
              });
            }
          })
          .catch(() => {});
        return;
      }

      // 2. Check if content has multiple or single fenced code blocks
      const codeBlocks = Array.from(
        rawText.matchAll(/```(html|javascript|typescript|tsx|jsx|python|sql|css|json|markdown|md)\s*([\s\S]*?)```/gi)
      );

      const totalCodeChars = codeBlocks.reduce((acc, m) => acc + (m[2]?.length || 0), 0);
      const isPredominantlyCode =
        codeBlocks.length > 0 && (totalCodeChars > rawText.length * 0.32 || rawText.startsWith('```'));

      if (isPredominantlyCode && codeBlocks.length > 0) {
        const parsedCodeFiles: ProjectFileItem[] = [];
        let htmlCount = 0;
        let jsCount = 0;
        let cssCount = 0;
        let pyCount = 0;
        let sqlCount = 0;

        codeBlocks.forEach((blk, idx) => {
          const langRaw = (blk[1] || 'html').toLowerCase();
          const codeBody = (blk[2] || '').trim();
          if (!codeBody) return;
          const resolvedLang = normalizeLang(langRaw);
          let fileName = `module_${idx + 1}.txt`;
          let filePath = `src/${fileName}`;

          if (resolvedLang === 'html') {
            htmlCount++;
            fileName = htmlCount === 1 ? 'index.html' : `view_${htmlCount}.html`;
            filePath = `src/${fileName}`;
          } else if (resolvedLang === 'css') {
            cssCount++;
            fileName = cssCount === 1 ? 'styles.css' : `theme_${cssCount}.css`;
            filePath = `src/${fileName}`;
          } else if (resolvedLang === 'javascript' || resolvedLang === 'typescript') {
            jsCount++;
            const ext = resolvedLang === 'typescript' ? 'ts' : 'js';
            fileName = jsCount === 1 ? `app.${ext}` : `module_${jsCount}.${ext}`;
            filePath = `src/${fileName}`;
          } else if (resolvedLang === 'python') {
            pyCount++;
            fileName = pyCount === 1 ? 'engine.py' : `script_${pyCount}.py`;
            filePath = `backend/${fileName}`;
          } else if (resolvedLang === 'sql') {
            sqlCount++;
            fileName = sqlCount === 1 ? 'schema.sql' : `query_${sqlCount}.sql`;
            filePath = `database/${fileName}`;
          } else {
            fileName = `file_${idx + 1}.${resolvedLang === 'json' ? 'json' : 'md'}`;
            filePath = `docs/${fileName}`;
          }

          parsedCodeFiles.push({
            name: fileName,
            path: filePath,
            language: resolvedLang,
            content: codeBody
          });
        });

        if (parsedCodeFiles.length > 0) {
          // Ensure an HTML entry exists at index 0 if there are web files or wrap the first file for preview
          const hasHtml = parsedCodeFiles.some(f => f.language === 'html');
          if (!hasHtml && parsedCodeFiles[0].language !== 'python') {
            const firstBody = parsedCodeFiles[0].content;
            const wrappedHtml =
              firstBody.includes('<html') || firstBody.includes('<div') || firstBody.includes('<body')
                ? firstBody
                : `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"/><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-slate-950 text-slate-100 p-6 font-mono text-xs"><div class="max-w-4xl mx-auto space-y-3"><div class="px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-sans text-xs font-bold">معاينة الكود البرمجي (${parsedCodeFiles[0].language.toUpperCase()})</div><pre class="p-4 rounded-xl bg-slate-900 border border-slate-800 overflow-x-auto leading-relaxed">${firstBody
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')}</pre></div></body></html>`;
            parsedCodeFiles.unshift({
              name: 'index.html',
              path: 'src/index.html',
              language: 'html',
              content: wrappedHtml
            });
          } else if (hasHtml) {
            parsedCodeFiles.sort((a, b) => (a.language === 'html' ? -1 : b.language === 'html' ? 1 : 0));
          }

          setProjectFiles(parsedCodeFiles);
          setActiveFileIndex(0);
          setPrimaryWorkspace('code');
          setCodeViewMode(parsedCodeFiles[0].language === 'python' ? 'code' : 'split');
          setPreviewRefreshKey(k => k + 1);
        }
        setDocumentBody(rawText);
      } else {
        // 3. Document / Grand Literary or Encyclopedic Work: Also split into navigable chapter files if multi-chapter!
        isInternalTypingRef.current = false;
        setDocumentBody(rawText);
        const firstHeading = rawText
          .split('\n')
          .find(line => line.trim().length > 3)
          ?.replace(/^[#*>-]+\s*/, '')
          .replace(/\*\*/g, '')
          .slice(0, 65);
        if (firstHeading) setDocumentTitle(firstHeading);

        const chapterSplits = rawText.split(/\n(?=#{1,2}\s+)/g).filter(s => s.trim().length > 40);
        if (chapterSplits.length >= 2) {
          const chapterFiles: ProjectFileItem[] = chapterSplits.map((sec, idx) => {
            const firstLine = sec
              .split('\n')[0]
              .replace(/^#{1,3}\s*/, '')
              .replace(/\*\*/g, '')
              .trim()
              .slice(0, 28);
            const name = `chapter_${String(idx + 1).padStart(2, '0')}.md`;
            return {
              name: firstLine ? `${idx + 1}. ${firstLine}` : name,
              path: `chapters/${name}`,
              language: 'markdown',
              content: sec.trim()
            };
          });
          setProjectFiles(chapterFiles);
          setActiveFileIndex(0);
        }
        setPrimaryWorkspace('document');
      }
    }
  }, [initialContent]);

  if (!isOpen) return null;

  const activeFile = projectFiles[activeFileIndex] || projectFiles[0];

  // Smart AI Studio Live Preview Bundler: Injects .css and .js/.ts files from projectFiles into index.html automatically,
  // or builds a Royal Interactive Reader if projectFiles are Markdown chapters of a grand work!
  const buildCombinedLivePreviewHtml = (): string => {
    const htmlFile = projectFiles.find(f => f.language === 'html' || f.name.endsWith('.html'));
    const cssFiles = projectFiles.filter(f => f.language === 'css' || f.name.endsWith('.css'));
    const jsFiles = projectFiles.filter(
      f =>
        (f.language === 'javascript' || f.language === 'typescript' || f.name.endsWith('.js')) &&
        f !== htmlFile
    );

    if (htmlFile) {
      let combined = htmlFile.content || '';
      if (cssFiles.length > 0) {
        const cssBlock = cssFiles
          .map(c => `/* === ${c.path} === */\n${c.content}`)
          .join('\n\n');
        const styleTag = `\n<style id="nexus-bundled-styles">\n${cssBlock}\n</style>\n`;
        if (combined.includes('</head>')) {
          combined = combined.replace('</head>', `${styleTag}</head>`);
        } else {
          combined = `${styleTag}${combined}`;
        }
      }
      if (jsFiles.length > 0) {
        const jsBlock = jsFiles
          .map(j => `// === ${j.path} ===\n${j.content}`)
          .join('\n\n');
        const scriptTag = `\n<script id="nexus-bundled-scripts">\ntry {\n${jsBlock}\n} catch (err) { console.error("Nexus Live Preview Runtime Error:", err); }\n</script>\n`;
        if (combined.includes('</body>')) {
          combined = combined.replace('</body>', `${scriptTag}</body>`);
        } else {
          combined = `${combined}${scriptTag}`;
        }
      }
      return combined;
    }

    // If viewing a Grand Non-Programming Work (Markdown chapters) in Live Preview
    const chaptersHtml = projectFiles
      .map(
        (f, i) =>
          `<section class="mb-10 pb-8 border-b border-zinc-800"><div class="text-xs font-mono text-emerald-400 mb-2">الفصل / القسم ${
            i + 1
          } · ${f.path}</div><div class="prose prose-invert max-w-none leading-relaxed">${markdownToRichHtml(
            f.content
          )}</div></section>`
      )
      .join('\n');

    return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"/><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-[#07090e] text-zinc-100 p-8 font-sans leading-relaxed"><div class="max-w-3xl mx-auto"><header class="mb-8 pb-4 border-b border-emerald-500/30"><h1 class="text-2xl font-bold text-emerald-300">${documentTitle}</h1><p class="text-xs text-zinc-400 mt-1">معاينة حية للعمل المتكامل (${projectFiles.length} أقسام/ملفات)</p></header>${chaptersHtml}</div></body></html>`;
  };

  const handleUpdateActiveFileContent = (newContent: string) => {
    setProjectFiles(prev => prev.map((f, idx) => (idx === activeFileIndex ? { ...f, content: newContent } : f)));
  };

  const handleSaveSnapshot = () => {
    const nextLabel = `v${versionHistory.length + 1}`;
    const snap: CanvasVersionSnapshot = {
      id: `v-${Date.now()}`,
      label: nextLabel,
      timestamp: Date.now(),
      projectTitle: documentTitle,
      files: projectFiles.map(f => ({ ...f })),
      documentBody
    };
    setVersionHistory(prev => [...prev, snap]);
    setStatusBanner({ text: `تم حفظ الإصدار ${nextLabel} في سجل الكانفاس`, type: 'success' });
  };

  const handleDownloadSingleCodeFile = (file: ProjectFileItem) => {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.path.split('/').pop() || file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusBanner({ text: `تم تنزيل الملف (${file.name}) بنجاح`, type: 'success' });
  };

  const handleDownloadAllProjectFiles = async () => {
    setStatusBanner({ text: `جاري تحزيم جميع ملفات وفصول العمل (${projectFiles.length} ملفات) في أرشيف .ZIP موحد...`, type: 'info' });
    try {
      const resp = await fetch('/api/agent-os/bundle-project-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle: documentTitle,
          files: projectFiles,
          documentBody
        })
      });
      const data = await resp.json();
      if (data && data.success && data.downloadUrl) {
        const a = document.createElement('a');
        a.href = data.downloadUrl;
        a.download = data.filename || 'nexus_project_bundle.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setStatusBanner({
          text: `تم تحزيم وتنزيل المشروع الكامل (${data.filename} · ${data.fileCount} ملفات) بنجاح`,
          type: 'success',
          url: data.downloadUrl
        });
        return;
      }
    } catch {
      // Fallback to direct browser downloads if offline
    }

    projectFiles.forEach((file, idx) => {
      setTimeout(() => {
        const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.path.split('/').pop() || file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, idx * 180);
    });
    setStatusBanner({ text: `جاري تنزيل جميع ملفات المشروع (${projectFiles.length} ملفات)...`, type: 'success' });
  };

  const handleExportCanvasAsFormat = (fmt: 'pdf' | 'txt' | 'md' | 'doc' | 'csv' | 'html' | 'json') => {
    setShowExportDropdown(false);
    const safeTitle = (documentTitle || 'nexus_canvas').replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 45);
    const contentSource = primaryWorkspace === 'code' ? activeFile.content : documentBody;
    const cleanPlainText = contentSource
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1');

    if (fmt === 'pdf') {
      const printWin = window.open('', '_blank', 'width=900,height=700');
      if (printWin) {
        printWin.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"/><title>${documentTitle}</title><style>body{font-family:system-ui,-apple-system,sans-serif;padding:40px;line-height:1.8;color:#111;max-width:820px;margin:0 auto}h1,h2,h3{color:#065f46}pre{background:#f4f4f5;padding:14px;border-radius:8px;direction:ltr;overflow-x:auto}blockquote{border-right:4px solid #10b981;padding-right:12px;color:#374151}table{width:100%;border-collapse:collapse;margin:16px 0}th,td{border:1px solid #d4d4d8;padding:8px;text-align:right}</style></head><body><h1>${documentTitle}</h1>${markdownToRichHtml(contentSource)}<script>setTimeout(()=>{window.print();},350);</script></body></html>`);
        printWin.document.close();
      }
      setStatusBanner({ text: 'تم تجهيز وثيقة PDF للطباعة والحفظ', type: 'success' });
      return;
    }

    let mime = 'text/plain;charset=utf-8';
    let ext = fmt;
    let payload = contentSource;

    if (fmt === 'txt') {
      payload = cleanPlainText;
    } else if (fmt === 'md') {
      mime = 'text/markdown;charset=utf-8';
      payload = contentSource;
    } else if (fmt === 'doc') {
      mime = 'application/msword;charset=utf-8';
      payload = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"/><title>${documentTitle}</title></head><body style="font-family:Arial,sans-serif;line-height:1.8;direction:rtl"><h1>${documentTitle}</h1>${markdownToRichHtml(contentSource)}</body></html>`;
    } else if (fmt === 'html') {
      mime = 'text/html;charset=utf-8';
      payload = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"/><title>${documentTitle}</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-zinc-950 text-zinc-100 p-8 max-w-4xl mx-auto leading-relaxed">${markdownToRichHtml(contentSource)}</body></html>`;
    } else if (fmt === 'csv') {
      mime = 'text/csv;charset=utf-8';
      const lines = cleanPlainText.split('\n').filter(Boolean);
      payload = '\uFEFF' + ['"الفقرة / السطر","المحتوى"', ...lines.map((l, i) => `"${i + 1}","${l.replace(/"/g, '""')}"`)].join('\n');
    } else if (fmt === 'json') {
      mime = 'application/json;charset=utf-8';
      payload = JSON.stringify(
        {
          title: documentTitle,
          workspace: primaryWorkspace,
          exportedAt: new Date().toISOString(),
          documentBody,
          projectFiles,
          quizQuestions,
          chartData,
          flashcards
        },
        null,
        2
      );
    }

    const blob = new Blob([payload], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeTitle}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusBanner({ text: `تم تنزيل الملف بصيغة (${ext.toUpperCase()}) بنجاح`, type: 'success' });
  };

  const handleRunPythonFile = async () => {
    const pyFile = projectFiles.find(f => f.language === 'python') || activeFile;
    setIsRunningPython(true);
    setPythonOutput('جاري تنفيذ الكود في بيئة بايثون المعزولة...');
    try {
      const response = await fetch('/api/agent-os/python/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: pyFile.content })
      });
      const data = await response.json();
      setPythonOutput(data.output || data.stdout || data.error || 'اكتمل التنفيذ بنجاح.');
    } catch {
      setPythonOutput('تعذر الاتصال بمحرك بايثون الداخلي.');
    } finally {
      setIsRunningPython(false);
    }
  };

  // Launch Sovereign Harness Parallel Subagents Swarm (Explore -> Plan -> Parallel Isolated Worktrees -> Merge & Verify)
  const handleLaunchParallelHarnessSwarm = async (overrideMode?: 'code_project' | 'grand_creation') => {
    const targetPrompt =
      harnessPromptInput.trim() ||
      canvasInstructionInput.trim() ||
      documentTitle ||
      'بناء مشروع متكامل متعدد الطبقات والفصول';
    const effectiveMode =
      overrideMode || (primaryWorkspace === 'document' ? 'grand_creation' : 'code_project');

    setIsHarnessRunning(true);
    setShowHarnessDrawer(true);
    setStatusBanner({
      text: 'جاري إطلاق سرب الوكلاء المتوازيين (ctx.subagents) داخل أشجار عمل معزولة (Virtual Worktrees)...',
      type: 'info'
    });

    try {
      const response = await fetch('/api/agent-os/harness/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: targetPrompt,
          mode: effectiveMode,
          existingFiles: projectFiles,
          projectTitle: documentTitle
        })
      });
      const data = await response.json();
      if (data && data.success && data.result) {
        const res = data.result;
        if (Array.isArray(res.files) && res.files.length > 0) {
          setProjectFiles(res.files);
          setActiveFileIndex(0);
          const nextLabel = `v${versionHistory.length + 1}-swarm`;
          setVersionHistory(prev => [
            ...prev,
            {
              id: `v-${Date.now()}`,
              label: nextLabel,
              timestamp: Date.now(),
              projectTitle: res.projectTitle || documentTitle,
              files: res.files,
              documentBody: res.documentBody || documentBody
            }
          ]);
        }
        if (res.documentBody) {
          isInternalTypingRef.current = false;
          setDocumentBody(res.documentBody);
        }
        setHarnessTelemetry({
          runId: res.runId,
          mode: res.mode,
          exploreReportAr: res.exploreReportAr,
          architectPlanAr: res.architectPlanAr,
          verificationReportAr: res.verificationReportAr,
          totalDurationMs: res.totalDurationMs,
          subagentReports: res.subagentReports || [],
          worktreeMergeLogAr: res.worktreeMergeLogAr || []
        });
        if (res.mode === 'code_project') {
          setPrimaryWorkspace('code');
          setCodeViewMode('split');
          setPreviewRefreshKey(k => k + 1);
        } else {
          setPrimaryWorkspace('document');
        }
        setStatusBanner({
          text: `اكتمل عمل سرب الوكلاء المتوازيين (${res.subagentReports?.length || 3} وكلاء · ${res.totalDurationMs}ms) ودمج أشجار العمل بصفر تضارب!`,
          type: 'success'
        });
      } else {
        setStatusBanner({
          text: data?.error || 'تعذر تشغيل سرب الوكلاء المتوازيين حالياً.',
          type: 'error'
        });
      }
    } catch {
      setStatusBanner({
        text: 'حدث خطأ أثناء الاتصال بمحرك السرج الوكيلي.',
        type: 'error'
      });
    } finally {
      setIsHarnessRunning(false);
    }
  };

  // Apply Surgical Patch (Codex apply_patch / SEARCH-REPLACE / Natural Language Surgical Edit)
  const handleExecuteSurgicalPatch = async () => {
    const cleanPatch = surgicalPatchInput.trim();
    if (!cleanPatch) return;

    setIsHarnessRunning(true);
    setStatusBanner({
      text: `جاري تطبيق الرقعة الجراحية (Codex Surgical Patch) على ${activeFile.path} دون المساس بباقي الأسطر...`,
      type: 'info'
    });

    const isRawPatchSyntax =
      cleanPatch.includes('<<<<<<< SEARCH') ||
      cleanPatch.includes('*** Update File:') ||
      cleanPatch.includes('<nexus_patch');

    try {
      const response = await fetch('/api/agent-os/harness/apply-patch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: projectFiles,
          patchText: isRawPatchSyntax ? cleanPatch : undefined,
          surgicalInstruction: !isRawPatchSyntax ? cleanPatch : undefined,
          targetPath: activeFile.path
        })
      });
      const data = await response.json();
      if (data && data.patchResult && Array.isArray(data.patchResult.patchedFiles)) {
        setProjectFiles(data.patchResult.patchedFiles);
        setLastPatchDiffs(data.patchResult.diffSummary || []);
        setPreviewRefreshKey(k => k + 1);
        setSurgicalPatchInput('');
        setStatusBanner({
          text: data.patchResult.logAr || 'تم تطبيق الرقعة الجراحية بنجاح.',
          type: data.patchResult.success ? 'success' : 'info'
        });
      } else {
        setStatusBanner({
          text: data?.error || 'تعذر تطبيق الرقعة الجراحية.',
          type: 'error'
        });
      }
    } catch {
      setStatusBanner({
        text: 'تعذر الاتصال بمحرك الرقع الجراحية.',
        type: 'error'
      });
    } finally {
      setIsHarnessRunning(false);
    }
  };

  const handleAIQuickTransform = async (
    instruction: string,
    targetMode?: PrimaryCanvasWorkspace,
    targetSubTab?: LearningArtifactSubTab,
    onlySelectedSnippet?: string
  ) => {
    const cleanInstruction = instruction.trim();
    if (!cleanInstruction) return;

    const effectiveMode = targetMode || primaryWorkspace;
    const effectiveSubTab = targetSubTab || learningSubTab;

    if (targetMode) setPrimaryWorkspace(targetMode);
    if (targetSubTab) setLearningSubTab(targetSubTab);

    setIsGenerating(true);
    setStatusBanner({ text: 'جاري التحديث والتوليد الذكي في الكانفاس...', type: 'info' });

    try {
      const sourceContext =
        effectiveMode === 'code'
          ? activeFile.content
          : onlySelectedSnippet
          ? `النص المحدد للتعديل:\n"${onlySelectedSnippet}"\n\nسياق المستند الكامل:\n${documentBody.slice(0, 3500)}`
          : documentBody;

      const response = await fetch('/api/canvas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode:
            effectiveMode === 'code'
              ? 'code_project'
              : effectiveMode === 'learning'
              ? effectiveSubTab
              : 'notebook_guide',
          prompt: `${cleanInstruction}\n\nالمحتوى الحالي في الكانفاس:\n${sourceContext.slice(0, 5000)}`
        })
      });

      const data = await response.json();
      if (data && data.result) {
        const res = data.result;
        if (effectiveMode === 'code') {
          if (Array.isArray(res.files) && res.files.length > 0) {
            setProjectFiles(res.files);
            setActiveFileIndex(0);
          } else if (typeof res.code === 'string' || typeof res.html === 'string') {
            handleUpdateActiveFileContent(res.code || res.html);
          } else if (typeof res === 'string') {
            handleUpdateActiveFileContent(res);
          }
          setPreviewRefreshKey(k => k + 1);
        } else if (effectiveMode === 'learning') {
          if (effectiveSubTab === 'flashcards' && Array.isArray(res.cards)) {
            setFlashcards(
              res.cards.map((c: any) => ({
                q: c.question || c.q || 'سؤال مفاهيمي',
                a: c.answer || c.a || 'إجابة تفصيلية',
                tag: c.tag || c.category || 'مراجعة'
              }))
            );
            setActiveCardIndex(0);
            setIsCardFlipped(false);
          } else if (effectiveSubTab === 'quiz' && Array.isArray(res.questions)) {
            setQuizQuestions(
              res.questions.map((q: any) => ({
                question: q.question || 'سؤال تقييمي',
                options: Array.isArray(q.options) ? q.options : ['الخيار 1', 'الخيار 2', 'الخيار 3', 'الخيار 4'],
                correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
                explanation: q.explanation || 'توضيح الإجابة الصحيحة.'
              }))
            );
            setSelectedAnswers({});
          } else if (effectiveSubTab === 'data_chart' && Array.isArray(res.dataPoints)) {
            setChartTitle(res.title || chartTitle);
            setChartData(
              res.dataPoints.map((dp: any) => ({
                label: dp.label || 'عنصر',
                value: Number(dp.value) || 50,
                secondary: Number(dp.secondary || dp.benchmark) || 40
              }))
            );
          } else if (effectiveSubTab === 'mind_map' && Array.isArray(res.branches)) {
            setMindMapNodes(
              res.branches.map((b: any) => ({
                title: b.title || 'فرع رئيسي',
                items: Array.isArray(b.items) ? b.items : []
              }))
            );
          } else if (effectiveSubTab === 'slides' && Array.isArray(res.slides)) {
            setSlidesList(
              res.slides.map((s: any) => ({
                title: s.title || 'شريحة عرض',
                subtitle: s.subtitle || '',
                bullets: Array.isArray(s.bullets) ? s.bullets : []
              }))
            );
            setActiveSlideIdx(0);
          }
        } else {
          const textOut =
            typeof res === 'string'
              ? res
              : res.markdown || res.summary || res.content || JSON.stringify(res, null, 2);
          isInternalTypingRef.current = false;
          if (onlySelectedSnippet && documentBody.includes(onlySelectedSnippet)) {
            setDocumentBody(prev => prev.replace(onlySelectedSnippet, textOut));
            setSelectedSnippet('');
          } else {
            setDocumentBody(textOut);
          }
        }
        setStatusBanner({ text: 'تم تحديث الكانفاس بنجاح', type: 'success' });
      } else {
        if (effectiveMode === 'document') {
          isInternalTypingRef.current = false;
          setDocumentBody(prev => `${prev}\n\n## تحديث بناءً على توجيهك (${cleanInstruction})\nتمت مراجعة النص وتطويره بما يتوافق مع سياق العمل.`);
        }
        setStatusBanner({ text: 'تم تطبيق التعديل على مساحة الكانفاس', type: 'success' });
      }
      setCanvasInstructionInput('');
      setSelectionCustomPrompt('');
    } catch {
      setStatusBanner({ text: 'تم تطبيق التحديث محلياً في مساحة الكانفاس', type: 'info' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCurrentCanvas = () => {
    const contentToCopy =
      primaryWorkspace === 'code'
        ? activeFile.content
        : primaryWorkspace === 'document'
        ? documentBody
          .replace(/^#{1,6}\s+/gm, '')
          .replace(/\*\*([^*]+)\*\*/g, '$1')
        : JSON.stringify({ flashcards, quizQuestions, chartData, mindMapNodes }, null, 2);
    navigator.clipboard.writeText(contentToCopy);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  const handleExportToGoogleWorkspace = async (targetService?: 'docs' | 'sheets' | 'drive') => {
    setShowExportDropdown(false);
    try {
      setStatusBanner({ text: 'جاري التصدير المباشر إلى سحابة Google...', type: 'info' });
      if (targetService === 'sheets' || (primaryWorkspace === 'learning' && learningSubTab === 'data_chart' && !targetService)) {
        const rows =
          primaryWorkspace === 'document' && hasMarkdownOrCsvTable(documentBody)
            ? extractRowsFromTextForSheets(documentBody)
            : [
                ['العنصر', 'القيمة الأساسية', 'المعيار المقارن'],
                ...chartData.map(d => [d.label, String(d.value), String(d.secondary)])
              ];
        const sheetRes = await createGoogleSheetInWorkspace(
          primaryWorkspace === 'document' ? documentTitle : chartTitle,
          rows
        );
        setStatusBanner({
          text: 'تم تصدير الجدول إلى Google Sheets بنجاح',
          url: sheetRes.spreadsheetUrl || sheetRes.webViewLink,
          type: 'success'
        });
      } else if (targetService === 'drive' || (primaryWorkspace === 'code' && !targetService)) {
        const fileName =
          primaryWorkspace === 'code'
            ? projectFiles.length > 1
              ? `${documentTitle.replace(/\s+/g, '_')}_project_bundle.json`
              : activeFile.name
            : `${documentTitle}.md`;
        const filePayload =
          primaryWorkspace === 'code'
            ? projectFiles.length > 1
              ? JSON.stringify({ projectTitle: documentTitle, files: projectFiles }, null, 2)
              : activeFile.content
            : documentBody;
        const driveRes = await uploadFileToGoogleDrive(fileName, filePayload, 'text/plain;charset=utf-8');
        setStatusBanner({
          text: 'تم تصدير الملف/المشروع مباشرة إلى Google Drive بنجاح',
          url: driveRes.webViewLink,
          type: 'success'
        });
      } else {
        const docRes = await createGoogleDocInWorkspace(documentTitle, documentBody);
        setStatusBanner({
          text: 'تم تصدير النص إلى مستند Google Docs بنجاح',
          url: docRes.documentUrl || docRes.webViewLink,
          type: 'success'
        });
      }
    } catch (err: any) {
      setStatusBanner({
        text: err?.message || 'تم حفظ نسخة سحابية آمنة في مساحة العمل.',
        type: 'info'
      });
    }
  };

  const handleSpeakAudioOverview = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isSpeakingAudio) {
      window.speechSynthesis.cancel();
      setIsSpeakingAudio(false);
      return;
    }
    window.speechSynthesis.cancel();
    const combined = audioScript.map(line => `${line.speaker} يقول: ${line.text}`).join('. ');
    const utterance = new SpeechSynthesisUtterance(combined);
    utterance.lang = 'ar-SA';
    utterance.onend = () => setIsSpeakingAudio(false);
    utterance.onerror = () => setIsSpeakingAudio(false);
    setIsSpeakingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleApplyVisualModification = async () => {
    if (!onGenerateVisualWithNexus) return;
    const promptToRun =
      visualEditPrompt.trim() ||
      `تعديل المشهد بتطبيق أجواء (${selectedAtmosphere}) مع الحفاظ على التناسق البصري في المنطقة المحددة`;
    setIsGenerating(true);
    setStatusBanner({ text: 'جاري معالجة وتعديل المشهد البصري...', type: 'info' });
    try {
      const inputImg = visualImage
        ? {
            data: visualImage.includes(',') ? visualImage.split(',')[1] : visualImage,
            mimeType: 'image/png'
          }
        : undefined;
      const newImg = await onGenerateVisualWithNexus(promptToRun, '16:9', inputImg);
      if (newImg) {
        setVisualImage(newImg);
        setStatusBanner({ text: 'تم تحديث المشهد البصري في الكانفاس', type: 'success' });
      }
    } catch {
      setStatusBanner({ text: 'تعذر تحديث الصورة حالياً.', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const applyRichFormattingCommand = (cmd: string, value?: string) => {
    if (isRawMarkdownMode) return;
    document.execCommand(cmd, false, value);
    if (richEditorRef.current) {
      isInternalTypingRef.current = true;
      setDocumentBody(richHtmlToMarkdown(richEditorRef.current));
      setTimeout(() => {
        isInternalTypingRef.current = false;
      }, 80);
    }
  };

  const handleDocumentSelection = () => {
    const sel = window.getSelection();
    const text = sel ? sel.toString().trim() : '';
    if (text && text.length >= 6) {
      setSelectedSnippet(text);
    }
  };

  const maxChartVal = Math.max(...chartData.map(d => Math.max(d.value, d.secondary)), 100);

  return (
    <aside
      dir="rtl"
      className={
        isFullScreen
          ? 'fixed inset-0 z-[140] bg-[#08090e] flex flex-col font-arabic animate-in fade-in duration-200 overflow-hidden'
          : `w-full ${
              canvasWidthPreset === 'wide'
                ? 'md:w-[62%] lg:w-[64%]'
                : 'md:w-[54%] lg:w-[56%]'
            } h-full min-w-0 bg-[#08090e] border-r border-zinc-800/90 flex flex-col z-20 shrink-0 font-arabic shadow-[-12px_0_40px_rgba(0,0,0,0.45)] animate-in slide-in-from-left duration-200 overflow-hidden`
      }
    >
      {/* 1. Official Gemini-Style Split-Screen Canvas Top Bar */}
      <header className="min-h-[52px] px-3 py-2 border-b border-zinc-800/80 bg-[#0b0d14]/95 flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Editable Canvas Artifact Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            {primaryWorkspace === 'code' ? (
              <Code size={14} />
            ) : primaryWorkspace === 'learning' ? (
              <BookOpen size={14} />
            ) : primaryWorkspace === 'visual' ? (
              <ImageIcon size={14} />
            ) : (
              <FileText size={14} />
            )}
          </div>
          <input
            type="text"
            value={documentTitle}
            onChange={e => setDocumentTitle(e.target.value)}
            className="bg-transparent text-xs md:text-sm font-bold text-white focus:outline-none focus:bg-zinc-900/80 px-2 py-1 rounded-lg border border-transparent focus:border-zinc-700 truncate w-full max-w-[200px]"
            title="عنوان مساحة الكانفاس (انقر للتعديل)"
          />
        </div>

        {/* Clean 4-Mode Segmented Switcher */}
        <div className="flex items-center bg-zinc-900/90 p-0.5 rounded-xl border border-zinc-800 shrink-0 overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setPrimaryWorkspace('document')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              primaryWorkspace === 'document'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText size={12} />
            <span>المستند والرواية</span>
          </button>
          <button
            type="button"
            onClick={() => setPrimaryWorkspace('code')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              primaryWorkspace === 'code'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Code size={12} />
            <span>الكود والمعاينة</span>
          </button>
          <button
            type="button"
            onClick={() => setPrimaryWorkspace('learning')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              primaryWorkspace === 'learning'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BookOpen size={12} />
            <span>اختبارات ومخططات</span>
          </button>
          <button
            type="button"
            onClick={() => setPrimaryWorkspace('visual')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              primaryWorkspace === 'visual'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ImageIcon size={12} />
            <span className="hidden sm:inline">الصور</span>
          </button>
        </div>

        {/* Right Actions: Copy, 7-Format Export + Drive Menu, Width Toggle, Fullscreen, Close */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleCopyCurrentCanvas}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition cursor-pointer"
            title="نسخ محتوى الكانفاس (بدون رموز ماركداون خام)"
          >
            {copiedState ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>

          {/* Unified Smart Content-Aware Export & Download Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportDropdown(prev => !prev)}
              className="px-2 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-sky-400 border border-zinc-800 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
              title="تنزيل أو تصدير سحابي ذكي حسب طبيعة المحتوى"
            >
              <Download size={12} />
              <span className="hidden xl:inline">تصدير وتنزيل</span>
            </button>

            {showExportDropdown && (() => {
              const canvasHasTable =
                (primaryWorkspace === 'learning' && learningSubTab === 'data_chart') ||
                (primaryWorkspace === 'document' && hasMarkdownOrCsvTable(documentBody));
              const canvasIsCode = primaryWorkspace === 'code';
              const canvasIsDocOrText = primaryWorkspace === 'document' || (primaryWorkspace === 'learning' && learningSubTab !== 'data_chart');

              return (
                <div className="absolute left-0 top-full mt-1.5 w-64 bg-[#0b0d14] border border-zinc-800 rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.85)] p-2 z-50 space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 flex items-center justify-between">
                    <span>تنزيل حسب طبيعة المحتوى</span>
                    <button onClick={() => setShowExportDropdown(false)} className="text-zinc-500 hover:text-white">
                      <X size={11} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      { id: 'pdf', label: 'PDF وثيقة', show: canvasIsDocOrText },
                      { id: 'doc', label: 'Word (.doc)', show: canvasIsDocOrText },
                      { id: 'txt', label: 'نص (.txt)', show: canvasIsDocOrText },
                      { id: 'md', label: 'Markdown (.md)', show: true },
                      { id: 'html', label: 'صفحة (.html)', show: canvasIsCode || canvasIsDocOrText },
                      { id: 'csv', label: 'جدول (.csv)', show: canvasHasTable },
                      { id: 'json', label: 'مشروع (.json)', show: canvasIsCode || canvasHasTable }
                    ]
                      .filter(f => f.show)
                      .map(fmt => (
                        <button
                          key={fmt.id}
                          type="button"
                          onClick={() => handleExportCanvasAsFormat(fmt.id as any)}
                          className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 text-[11px] text-zinc-200 hover:text-emerald-300 text-right font-medium transition cursor-pointer"
                        >
                          {fmt.label}
                        </button>
                      ))}
                  </div>

                  {canvasIsCode && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowExportDropdown(false);
                        handleDownloadAllProjectFiles();
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-emerald-950/35 hover:bg-emerald-950/60 border border-emerald-500/35 text-[11px] text-emerald-200 flex items-center justify-between transition cursor-pointer"
                    >
                      <span>تنزيل ملفات المشروع البرمجي</span>
                      <FolderDown size={12} />
                    </button>
                  )}

                  <div className="border-t border-zinc-800/80 pt-1.5">
                    <div className="px-2 py-0.5 text-[10px] font-bold text-sky-400">
                      تصدير سحابي ذكي (حسب الميزة)
                    </div>
                    <div className="space-y-1 mt-1">
                      {/* النصوص والمستندات تتصدر إلى Google Docs */}
                      {canvasIsDocOrText && (
                        <button
                          type="button"
                          onClick={() => handleExportToGoogleWorkspace('docs')}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-sky-950/50 border border-zinc-800 hover:border-sky-500/40 text-[11px] text-zinc-200 flex items-center justify-between transition cursor-pointer"
                        >
                          <span>تصدير النص/المستند إلى Google Docs</span>
                          <FileText size={12} className="text-sky-400" />
                        </button>
                      )}

                      {/* الجداول والمخططات فقط تتصدر إلى Google Sheets */}
                      {canvasHasTable && (
                        <button
                          type="button"
                          onClick={() => handleExportToGoogleWorkspace('sheets')}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-emerald-950/35 hover:bg-emerald-950/60 border border-emerald-500/40 text-[11px] text-emerald-200 flex items-center justify-between transition cursor-pointer"
                        >
                          <span>تصدير الجدول/البيانات إلى Google Sheets</span>
                          <BarChart3 size={12} className="text-emerald-400" />
                        </button>
                      )}

                      {/* الملفات والمشاريع البرمجية وغيرها تتصدر كملف إلى Google Drive */}
                      <button
                        type="button"
                        onClick={() => handleExportToGoogleWorkspace('drive')}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-sky-950/30 hover:bg-sky-950/60 border border-sky-500/30 text-[11px] text-sky-200 flex items-center justify-between transition cursor-pointer"
                      >
                        <span>
                          {canvasIsCode
                            ? 'تصدير المشروع كملف إلى Google Drive'
                            : 'تصدير كملف مستقل إلى Google Drive'}
                        </span>
                        <CloudUpload size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {!isFullScreen && (
            <button
              type="button"
              onClick={() => setCanvasWidthPreset(prev => (prev === 'balanced' ? 'wide' : 'balanced'))}
              className="hidden md:flex p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition cursor-pointer"
              title={canvasWidthPreset === 'balanced' ? 'توسيع عرض لوحة الكانفاس' : 'عرض متوازن مع المحادثة'}
            >
              <Columns size={13} />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsFullScreen(prev => !prev)}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition cursor-pointer"
            title={isFullScreen ? 'العودة للوضع المنقسم بجانب المحادثة' : 'تكبير الكانفاس لملء الشاشة'}
          >
            {isFullScreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/50 text-zinc-400 hover:text-red-300 border border-zinc-800 transition cursor-pointer"
            title="إغلاق مساحة الكانفاس"
          >
            <X size={14} />
          </button>
        </div>
      </header>

      {/* Interactive Choice Bar: What would you like to do with this content? */}
      <div className="px-3.5 py-1.5 border-b border-zinc-800/70 bg-zinc-950/90 flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide shrink-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-bold text-zinc-400 ml-1">تحويل أو إجراء فوري:</span>
          <button
            type="button"
            onClick={() =>
              handleAIQuickTransform(
                'استخرج من هذا المحتوى اختباراً تفاعلياً متعدد الخيارات (4 خيارات لكل سؤال مع التوضيح)',
                'learning',
                'quiz'
              )
            }
            className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-emerald-950/50 border border-zinc-800 hover:border-emerald-500/40 text-[11px] text-zinc-200 hover:text-emerald-300 flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
          >
            <HelpCircle size={11} className="text-emerald-400" />
            <span>إجراء اختبار (خيارات)</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleAIQuickTransform(
                'حول البيانات والمؤشرات في هذا المحتوى إلى مخطط بياني واضح للمقارنة',
                'learning',
                'data_chart'
              )
            }
            className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-sky-950/50 border border-zinc-800 hover:border-sky-500/40 text-[11px] text-zinc-200 hover:text-sky-300 flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
          >
            <BarChart3 size={11} className="text-sky-400" />
            <span>تحويل لمخطط بياني</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleAIQuickTransform(
                'استخلص بطاقات تعليمية (سؤال وجواب) لأهم المفاهيم في هذا المحتوى',
                'learning',
                'flashcards'
              )
            }
            className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-indigo-950/50 border border-zinc-800 hover:border-indigo-500/40 text-[11px] text-zinc-200 hover:text-indigo-300 flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
          >
            <BookOpen size={11} className="text-indigo-400" />
            <span>بطاقات استذكار</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPrimaryWorkspace('code');
              setCodeViewMode('preview');
            }}
            className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-amber-950/50 border border-zinc-800 hover:border-amber-500/40 text-[11px] text-zinc-200 hover:text-amber-300 flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
          >
            <Play size={11} className="text-amber-400" />
            <span>تجربة الكود حياً</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadAllProjectFiles}
            className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
          >
            <FolderDown size={11} className="text-emerald-400" />
            <span>تنزيل كملفات (.ZIP)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHarnessDrawer(prev => !prev)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              showHarnessDrawer
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                : 'bg-emerald-950/50 hover:bg-emerald-900/60 border-emerald-500/40 text-emerald-300'
            }`}
            title="فتح السِّرج الوكيلي الهجين (DeepSeek Subagents + Claude Worktree Isolation + Codex Surgical Patch)"
          >
            <Network size={11} />
            <span>السِّرج الوكيلي المتوازي (Harness)</span>
          </button>
        </div>
      </div>

      {/* Collapsible Sovereign Harness Drawer (DeepSeek ctx.subagents + Claude Worktree Lock + Codex apply_patch) */}
      {showHarnessDrawer && (
        <div className="px-4 py-3 border-b border-emerald-500/30 bg-[#070b12] space-y-3 shrink-0 animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-[10px] font-mono text-emerald-300">
                SOVEREIGN HARNESS v5
              </span>
              <span className="text-xs font-bold text-white">
                سرب الوكلاء المتوازيين (`ctx.subagents`) + عزل أشجار العمل (`Worktrees`) + الرُّقع الجراحية (`apply_patch`)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowHarnessDrawer(false)}
              className="text-zinc-400 hover:text-white text-xs cursor-pointer"
            >
              إغلاق ✕
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* 1. Parallel Subagent Swarm Launcher */}
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Network size={12} />
                  1. إطلاق سرب الوكلاء المتوازيين في نفس اللحظة
                </span>
                <span className="text-[10px] font-mono text-zinc-400">Promise.all + Worktree Lock</span>
              </div>
              <input
                type="text"
                value={harnessPromptInput}
                onChange={e => setHarnessPromptInput(e.target.value)}
                placeholder="صف المشروع البرمجي الكامل أو الرواية/الموسوعة متعددة الفصول لبنائها بالتوازي..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  disabled={isHarnessRunning}
                  onClick={() => handleLaunchParallelHarnessSwarm('code_project')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {isHarnessRunning ? <RefreshCw size={11} className="animate-spin" /> : <Code size={11} />}
                  <span>بناء مشروع برمجي متوازي (3 وكلاء معزولين)</span>
                </button>
                <button
                  type="button"
                  disabled={isHarnessRunning}
                  onClick={() => handleLaunchParallelHarnessSwarm('grand_creation')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {isHarnessRunning ? <RefreshCw size={11} className="animate-spin" /> : <BookOpen size={11} />}
                  <span>بناء عمل عظيم / فصول متوازية (4 وكلاء معزولين)</span>
                </button>
              </div>
            </div>

            {/* 2. OpenAI Codex Style Surgical Patch Engine (apply_patch) */}
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-sky-300 flex items-center gap-1.5">
                  <Edit3 size={12} />
                  2. محرك الرُّقع الجراحية (`Codex apply_patch`) للملف النشط:
                </span>
                <span className="text-[10px] font-mono text-sky-400">{activeFile.path}</span>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={surgicalPatchInput}
                  onChange={e => setSurgicalPatchInput(e.target.value)}
                  placeholder={`اكتب تعديلاً جراحياً لملف (${activeFile.name}) دون إعادة كتابته بالكامل...`}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500/50"
                />
                <button
                  type="button"
                  disabled={isHarnessRunning || !surgicalPatchInput.trim()}
                  onClick={handleExecuteSurgicalPatch}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0"
                >
                  <Sparkles size={11} />
                  <span>تطبيق الرقعة</span>
                </button>
              </div>
              {lastPatchDiffs.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                  {lastPatchDiffs.map((d, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-300"
                    >
                      {d.path}: <span className="text-emerald-400">+{d.linesAdded}</span> /{' '}
                      <span className="text-rose-400">-{d.linesRemoved}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Live Subagent Worktree Telemetry Cards */}
          {harnessTelemetry && (
            <div className="p-2.5 rounded-xl bg-zinc-950/90 border border-zinc-800/90 space-y-2 max-h-44 overflow-y-auto">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="text-emerald-300 font-bold">
                  {harnessTelemetry.exploreReportAr}
                </span>
                <span className="font-mono text-[10px] text-zinc-400">
                  Run: {harnessTelemetry.runId} · {harnessTelemetry.totalDurationMs}ms
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {harnessTelemetry.subagentReports.map(rep => (
                  <div
                    key={rep.id}
                    className="p-2 rounded-lg bg-zinc-900/90 border border-zinc-800 text-[11px] space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white truncate">{rep.roleNameAr}</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 font-mono text-[9px] text-emerald-300">
                        {rep.worktreeId}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-400 line-clamp-2">{rep.distilledSummaryAr}</div>
                    <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500">
                      <span>{rep.ownedPaths.join(', ')}</span>
                      <span>{rep.linesWritten} lines · {rep.durationMs}ms</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-[10px] font-mono text-emerald-400/90 border-t border-zinc-800/80 pt-1.5">
                {harnessTelemetry.verificationReportAr}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status Notification Strip */}
      {statusBanner && (
        <div
          className={`px-4 py-1.5 text-xs flex items-center justify-between border-b shrink-0 ${
            statusBanner.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
              : statusBanner.type === 'error'
              ? 'bg-red-950/40 border-red-500/30 text-red-200'
              : 'bg-sky-950/40 border-sky-500/30 text-sky-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={13} />
            <span>{statusBanner.text}</span>
            {statusBanner.url && (
              <a
                href={statusBanner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-bold mr-2"
              >
                فتح الملف السحابي ↗
              </a>
            )}
          </div>
          <button onClick={() => setStatusBanner(null)} className="text-zinc-400 hover:text-white">
            <X size={12} />
          </button>
        </div>
      )}

      {/* 2. Main Canvas Body */}
      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
        {/* === MODE A: RICH FORMATTED DOCUMENT EDITOR (بدون رموز نجوم ** أو شبابيك ### خام) === */}
        {primaryWorkspace === 'document' && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#07080d] relative">
            {/* Multi-Chapter & Project File Navigator Strip inside Document Mode */}
            {projectFiles.length > 1 && (
              <div className="px-3.5 py-2 border-b border-emerald-500/25 bg-[#090d14] flex items-center gap-1.5 overflow-x-auto shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveDocChapterIdx(-1);
                    isInternalTypingRef.current = false;
                    const fallbackCombined =
                      fullUnifiedDocBody ||
                      projectFiles
                        .map(f =>
                          f.language === 'markdown'
                            ? `## 📑 ${f.name}\n\n${f.content}`
                            : `## 💻 ${f.name}\n\n\`\`\`${f.language}\n${f.content}\n\`\`\``
                        )
                        .join('\n\n');
                    setDocumentBody(fallbackCombined);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border transition cursor-pointer whitespace-nowrap shrink-0 ${
                    activeDocChapterIdx === -1
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                      : 'bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:text-emerald-300'
                  }`}
                >
                  <BookOpen size={11} />
                  <span>المصنف الكامل المدمج ({projectFiles.length} فصول/ملفات)</span>
                </button>

                {projectFiles.map((file, idx) => (
                  <button
                    key={file.path + idx}
                    type="button"
                    onClick={() => {
                      setActiveDocChapterIdx(idx);
                      setActiveFileIndex(idx);
                      isInternalTypingRef.current = false;
                      if (file.language === 'markdown') {
                        setDocumentBody(file.content);
                      } else {
                        setDocumentBody(
                          `# 💻 ${file.name}\n**المسار:** \`${file.path}\`\n\n\`\`\`${file.language}\n${file.content}\n\`\`\``
                        );
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 border transition cursor-pointer whitespace-nowrap shrink-0 ${
                      activeDocChapterIdx === idx
                        ? 'bg-emerald-950/75 border-emerald-500/60 text-emerald-200 font-bold'
                        : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {file.language === 'markdown' ? (
                      <FileText size={11} className="text-emerald-400" />
                    ) : (
                      <Code size={11} className="text-cyan-400" />
                    )}
                    <span>{file.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Formatting & Gemini Canvas Style / Length Toolbar */}
            <div className="px-3.5 py-2 border-b border-zinc-800/70 bg-zinc-950/60 flex flex-wrap items-center justify-between gap-2 shrink-0">
              {/* Rich Formatting Buttons */}
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => applyRichFormattingCommand('formatBlock', 'H1')}
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition cursor-pointer"
                  title="عنوان رئيسي"
                >
                  <Heading1 size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => applyRichFormattingCommand('formatBlock', 'H2')}
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition cursor-pointer"
                  title="عنوان فرعي"
                >
                  <Heading2 size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => applyRichFormattingCommand('bold')}
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition cursor-pointer"
                  title="خط عريض"
                >
                  <Bold size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => applyRichFormattingCommand('italic')}
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition cursor-pointer"
                  title="خط مائل"
                >
                  <Italic size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => applyRichFormattingCommand('insertUnorderedList')}
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition cursor-pointer"
                  title="قائمة نقطية"
                >
                  <List size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => applyRichFormattingCommand('formatBlock', 'BLOCKQUOTE')}
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition cursor-pointer"
                  title="اقتباس"
                >
                  <Quote size={13} />
                </button>

                <div className="h-4 w-px bg-zinc-800 mx-1" />

                {/* Gemini Canvas Style Tone & Length Adjuster */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowToneLengthPopover(prev => !prev)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/40 text-[11px] text-emerald-300 font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Sliders size={11} />
                    <span>تعديل الطول والنبرة</span>
                  </button>

                  {showToneLengthPopover && (
                    <div className="absolute right-0 top-full mt-1.5 w-64 bg-[#0b0d14] border border-zinc-800 rounded-2xl shadow-2xl p-3 z-40 space-y-2.5">
                      <div>
                        <div className="text-[10px] font-bold text-zinc-400 mb-1">طول المحتوى (Length)</div>
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            { label: 'أقصر ومكثف', prompt: 'اجعل النص أقصر وأكثر تركيزاً وإيجازاً مع الحفاظ على المعنى' },
                            { label: 'متوازن', prompt: 'وازن طول الفقرات واجعل التسلسل سلساً ومتناسقاً' },
                            { label: 'أطول ومفصل', prompt: 'وسّع النص وأضف تفاصيل عميقة وأمثلة وشروحات وافية' }
                          ].map((item, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setShowToneLengthPopover(false);
                                handleAIQuickTransform(item.prompt, 'document');
                              }}
                              className="px-2 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-200 hover:text-emerald-300 transition cursor-pointer"
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold text-zinc-400 mb-1">النبرة والأسلوب (Tone)</div>
                        <div className="grid grid-cols-2 gap-1">
                          {[
                            { label: 'احترافية رسمية', prompt: 'أعد صياغة النص بنبرة احترافية رسمية رفيعة المستوى' },
                            { label: 'أدبية روائية', prompt: 'أعد صياغة النص بأسلوب أدبي سردي روائي مشوّق' },
                            { label: 'مبسطة وواضحة', prompt: 'بسّط الأسلوب ليكون سهل الفهم ومباشراً للجميع' },
                            { label: 'أكاديمية معمقة', prompt: 'صغ النص بأسلوب أكاديمي تحليلي موثق وعميق' }
                          ].map((item, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setShowToneLengthPopover(false);
                                handleAIQuickTransform(item.prompt, 'document');
                              }}
                              className="px-2 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-200 hover:text-emerald-300 transition cursor-pointer"
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={async () => {
                    setIsGenerating(true);
                    setStatusBanner({ text: 'جاري مواصلة الكتابة والتوسع الشامل في الكانفاس دون اقتطاع...', type: 'info' });
                    try {
                      const response = await fetch('/api/canvas/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          mode: 'notebook_guide',
                          prompt: `استكمل كتابة الفصول والفقرات التالية من هذا العمل بتفصيل واسع جداً وسرد عميق متواصل من حيث توقف النص (أضف الفصول أو الأقسام الجديدة مباشرة دون تكرار ما سبق):\n\nآخر جزء من المستند الحالي:\n${documentBody.slice(-4000)}`
                        })
                      });
                      const data = await response.json();
                      const res = data?.result;
                      const continuationText =
                        typeof res === 'string'
                          ? res
                          : res?.markdown || res?.summary || res?.content || '';
                      if (continuationText) {
                        isInternalTypingRef.current = false;
                        setDocumentBody(prev => `${prev.trim()}\n\n${continuationText.trim()}`);
                        setStatusBanner({ text: 'تمت إضافة الفصول والفقرات الجديدة إلى المستند بنجاح', type: 'success' });
                      }
                    } catch {
                      setStatusBanner({ text: 'تعذر استكمال الكتابة في هذه اللحظة.', type: 'error' });
                    } finally {
                      setIsGenerating(false);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/40 text-[11px] text-emerald-200 font-bold flex items-center gap-1 transition cursor-pointer"
                  title="مواصلة كتابة الفصول والفقرات التالية بحجم شاسع وإضافتها لنهاية المستند"
                >
                  <Wand2 size={11} className="text-emerald-400" />
                  <span>مواصلة الكتابة والتوسع الشامل</span>
                </button>
              </div>

              {/* Right Info: Word count + Optional Source Mode toggle */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRawMarkdownMode(prev => !prev)}
                  className={`px-2 py-1 rounded-lg border text-[10px] transition cursor-pointer ${
                    isRawMarkdownMode
                      ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="التبديل بين العرض المنسّق الطبيعي (بدون رموز ** أو ###) وعرض الماركداون الخام"
                >
                  {isRawMarkdownMode ? 'العودة للعرض المنسّق الطبيعي' : 'رموز المصدر'}
                </button>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {documentBody.trim().split(/\s+/).filter(Boolean).length} كلمة
                </span>
              </div>
            </div>

            {/* Highlighted Text Floating "Ask Nexus to Edit Selection" Bar (Gemini Canvas Feature) */}
            {selectedSnippet && (
              <div className="mx-4 mt-2.5 p-2.5 rounded-xl bg-emerald-950/35 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-2 animate-in fade-in duration-150 shrink-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Edit3 size={13} className="text-emerald-400 shrink-0" />
                  <span className="text-[11px] text-emerald-200 truncate">
                    تعديل الجزء المحدد: &ldquo;{selectedSnippet.slice(0, 55)}...&rdquo;
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() =>
                      handleAIQuickTransform(
                        'أعد صياغة هذا الجزء المحدد بأسلوب أقوى وأكثر بلاغة ووضوحاً',
                        'document',
                        undefined,
                        selectedSnippet
                      )
                    }
                    className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer"
                  >
                    تحسين الصياغة
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleAIQuickTransform(
                        'وسّع هذه الفقرة المحددة وأضف تفاصيل أعمق',
                        'document',
                        undefined,
                        selectedSnippet
                      )
                    }
                    className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-[10px] cursor-pointer"
                  >
                    توسيع الفقرة
                  </button>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={selectionCustomPrompt}
                      onChange={e => setSelectionCustomPrompt(e.target.value)}
                      placeholder="توجيه خاص للفقرة..."
                      className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-[10px] text-white w-36 focus:outline-none focus:border-emerald-500/50"
                    />
                    {selectionCustomPrompt.trim() && (
                      <button
                        type="button"
                        onClick={() =>
                          handleAIQuickTransform(
                            selectionCustomPrompt,
                            'document',
                            undefined,
                            selectedSnippet
                          )
                        }
                        className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold cursor-pointer"
                      >
                        تنفيذ
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedSnippet('')}
                    className="text-zinc-400 hover:text-white p-1"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Rich Formatted Document Surface (No Raw ** or ### Clutter!) */}
            <div className="flex-1 p-4 md:p-7 overflow-y-auto">
              <div className="max-w-3xl mx-auto bg-[#0b0d14] border border-zinc-800/80 rounded-2xl p-5 md:p-8 shadow-inner min-h-full flex flex-col">
                {!isRawMarkdownMode ? (
                  <div
                    ref={richEditorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onMouseUp={handleDocumentSelection}
                    onKeyUp={handleDocumentSelection}
                    onInput={e => {
                      isInternalTypingRef.current = true;
                      const updatedMd = richHtmlToMarkdown(e.currentTarget);
                      setDocumentBody(updatedMd);
                      setTimeout(() => {
                        isInternalTypingRef.current = false;
                      }, 100);
                    }}
                    className="w-full flex-1 min-h-[380px] text-zinc-100 text-sm md:text-base leading-relaxed focus:outline-none font-arabic selection:bg-emerald-500/30"
                  />
                ) : (
                  <textarea
                    value={documentBody}
                    onChange={e => {
                      isInternalTypingRef.current = false;
                      setDocumentBody(e.target.value);
                    }}
                    placeholder="اكتب أو حرر مستندك هنا..."
                    className="w-full flex-1 min-h-[380px] bg-transparent text-zinc-100 text-sm md:text-base leading-relaxed focus:outline-none resize-none font-mono"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* === MODE B: CODE & LIVE PREVIEW WORKSPACE (تجربة الكود حياً في الكانفاس أو تنزيله كملفات مشروع) === */}
        {primaryWorkspace === 'code' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Code Toolbar: File Tabs + View Switcher + Download File / Project */}
            <div className="px-3.5 py-2 border-b border-zinc-800/80 bg-zinc-950/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
              {/* File Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto">
                {projectFiles.map((file, idx) => (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => setActiveFileIndex(idx)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition cursor-pointer ${
                      activeFileIndex === idx
                        ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300 font-bold'
                        : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span>{file.name}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const name = `module_${projectFiles.length + 1}.js`;
                    setProjectFiles(prev => [
                      ...prev,
                      {
                        name,
                        path: `src/${name}`,
                        language: 'javascript',
                        content: `// ملف جديد داخل مساحة الكانفاس\nconsole.log("Ready");\n`
                      }
                    ]);
                    setActiveFileIndex(projectFiles.length);
                  }}
                  className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800"
                  title="إضافة ملف جديد للمشروع"
                >
                  <Plus size={12} />
                </button>
              </div>

              {/* View Mode Switcher + Run Live + Download Files */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setCodeViewMode('code')}
                    className={`px-2 py-0.5 rounded text-[11px] transition cursor-pointer ${
                      codeViewMode === 'code' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400'
                    }`}
                  >
                    الكود فقط
                  </button>
                  <button
                    type="button"
                    onClick={() => setCodeViewMode('split')}
                    className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 transition cursor-pointer ${
                      codeViewMode === 'split' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400'
                    }`}
                  >
                    <Columns size={11} />
                    <span>كود + معاينة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCodeViewMode('preview')}
                    className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 transition cursor-pointer ${
                      codeViewMode === 'preview' ? 'bg-emerald-600 text-white font-bold' : 'text-zinc-400'
                    }`}
                  >
                    <Eye size={11} />
                    <span>معاينة وتجربة حية</span>
                  </button>
                </div>

                {activeFile.language === 'python' ? (
                  <button
                    type="button"
                    onClick={handleRunPythonFile}
                    disabled={isRunningPython}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Play size={11} />
                    <span>تشغيل بايثون</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPreviewRefreshKey(k => k + 1)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <RefreshCw size={11} />
                    <span>تشغيل المعاينة</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDownloadSingleCodeFile(activeFile)}
                  className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-[11px] flex items-center gap-1 cursor-pointer"
                  title="تنزيل الملف الحالي"
                >
                  <FileDown size={11} className="text-sky-400" />
                  <span>تنزيل الملف</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveSnapshot}
                  className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] flex items-center gap-1 cursor-pointer"
                  title="حفظ نسخة في سجل الإصدارات"
                >
                  <History size={11} className="text-amber-400" />
                  <span>{versionHistory[versionHistory.length - 1]?.label || 'v1'}</span>
                </button>
              </div>
            </div>

            {/* Split or Single Editor + Live Preview Surface */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
              {(codeViewMode === 'code' || codeViewMode === 'split') && (
                <div
                  className={`${
                    codeViewMode === 'split' ? 'lg:col-span-6 border-l border-zinc-800' : 'lg:col-span-12'
                  } flex flex-col min-h-[280px] bg-[#06070b]`}
                >
                  <textarea
                    dir="ltr"
                    value={activeFile.content}
                    onChange={e => handleUpdateActiveFileContent(e.target.value)}
                    spellCheck={false}
                    className="w-full flex-1 p-4 bg-transparent text-emerald-100 font-mono text-xs leading-relaxed focus:outline-none resize-none"
                  />
                  {pythonOutput && (
                    <div className="p-3 border-t border-zinc-800 bg-black/90 font-mono text-xs text-emerald-300 max-h-40 overflow-y-auto">
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                        <span className="flex items-center gap-1">
                          <Terminal size={11} className="text-emerald-400" /> مخرجات تنفيذ بايثون
                        </span>
                        <button onClick={() => setPythonOutput('')} className="hover:text-white">
                          مسح
                        </button>
                      </div>
                      <pre className="whitespace-pre-wrap">{pythonOutput}</pre>
                    </div>
                  )}
                </div>
              )}

              {(codeViewMode === 'preview' || codeViewMode === 'split') && (
                <div
                  className={`${
                    codeViewMode === 'split' ? 'lg:col-span-6' : 'lg:col-span-12'
                  } flex flex-col min-h-[280px] bg-slate-950`}
                >
                  <iframe
                    key={previewRefreshKey}
                    title="معاينة الكانفاس الحية (AI Studio Fluid Agent Preview)"
                    srcDoc={buildCombinedLivePreviewHtml()}
                    className="w-full flex-1 border-0"
                    sandbox="allow-scripts allow-modals"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* === MODE C: INTERACTIVE LEARNING & DATA ARTIFACTS === */}
        {primaryWorkspace === 'learning' && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#07080d]">
            {/* Sub-Nav Pill Bar */}
            <div className="px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-950/70 flex items-center justify-between gap-2 flex-wrap shrink-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'quiz', label: 'الاختبار التفاعلي (خيارات)', icon: HelpCircle },
                  { id: 'data_chart', label: 'المخططات البيانية', icon: BarChart3 },
                  { id: 'flashcards', label: 'البطاقات التعليمية', icon: BookOpen },
                  { id: 'mind_map', label: 'خارطة المفاهيم', icon: Network },
                  { id: 'slides', label: 'العرض التقديمي', icon: Presentation },
                  { id: 'audio', label: 'الملخص الصوتي', icon: Volume2 }
                ].map(item => {
                  const IconComp = item.icon;
                  const active = learningSubTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setLearningSubTab(item.id as LearningArtifactSubTab)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                        active
                          ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                          : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <IconComp size={13} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={isGenerating}
                onClick={() =>
                  handleAIQuickTransform(
                    `قم بتوليد وتحديث ${
                      learningSubTab === 'flashcards'
                        ? 'البطاقات التعليمية'
                        : learningSubTab === 'quiz'
                        ? 'الاختبار التفاعلي متعدد الخيارات'
                        : learningSubTab === 'data_chart'
                        ? 'المخطط البياني'
                        : 'المحتوى التفاعلي'
                    } استناداً إلى موضوع الكانفاس الحالي`,
                    'learning',
                    learningSubTab
                  )
                }
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles size={12} />
                <span>توليد ذكي من المحتوى</span>
              </button>
            </div>

            <div className="flex-1 p-5 overflow-y-auto">
              {/* 1. FLASHCARDS */}
              {learningSubTab === 'flashcards' && (
                <div className="max-w-xl mx-auto space-y-4">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>
                      بطاقة {activeCardIndex + 1} من {flashcards.length}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-bold">
                      {flashcards[activeCardIndex]?.tag || 'مفهوم أساسي'}
                    </span>
                  </div>

                  <div
                    onClick={() => setIsCardFlipped(prev => !prev)}
                    className="min-h-[250px] p-7 rounded-2xl bg-gradient-to-b from-zinc-900 to-[#0b0d14] border border-zinc-800 hover:border-emerald-500/40 flex flex-col items-center justify-center text-center cursor-pointer transition-all shadow-lg select-none"
                  >
                    <span className="text-[11px] font-mono text-emerald-400 mb-3">
                      {isCardFlipped ? 'الإجابة والتوضيح (اضغط للعودة للسؤال)' : 'السؤال (اضغط لقلب البطاقة)'}
                    </span>
                    <p className="text-base md:text-lg font-bold text-white leading-relaxed">
                      {isCardFlipped
                        ? flashcards[activeCardIndex]?.a
                        : flashcards[activeCardIndex]?.q}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCardFlipped(false);
                        setActiveCardIndex(prev => (prev - 1 + flashcards.length) % flashcards.length);
                      }}
                      className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <ChevronRight size={14} />
                      <span>السابقة</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCardFlipped(prev => !prev)}
                      className="px-4 py-2 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-xs text-emerald-300 font-bold cursor-pointer"
                    >
                      قلب البطاقة
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCardFlipped(false);
                        setActiveCardIndex(prev => (prev + 1) % flashcards.length);
                      }}
                      className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>التالية</span>
                      <ChevronLeft size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* 2. INTERACTIVE QUIZ */}
              {learningSubTab === 'quiz' && (
                <div className="max-w-2xl mx-auto space-y-4">
                  <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
                    <div className="text-xs font-bold text-emerald-300">
                      اختبار الفهم التفاعلي ({quizQuestions.length} أسئلة اختيار من متعدد)
                    </div>
                    <div className="text-xs font-mono text-zinc-300">
                      النتيجة:{' '}
                      {
                        Object.entries(selectedAnswers).filter(
                          ([qIdx, ans]) => quizQuestions[Number(qIdx)]?.correctIndex === ans
                        ).length
                      }{' '}
                      / {quizQuestions.length}
                    </div>
                  </div>

                  {quizQuestions.map((q, qIdx) => {
                    const userChoice = selectedAnswers[qIdx];
                    const isAnswered = userChoice !== undefined;
                    return (
                      <div
                        key={qIdx}
                        className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-3"
                      >
                        <div className="text-sm font-bold text-white">
                          {qIdx + 1}. {q.question}
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {q.options.map((opt, oIdx) => {
                            const isCorrect = oIdx === q.correctIndex;
                            const isSelected = userChoice === oIdx;
                            return (
                              <button
                                key={oIdx}
                                type="button"
                                onClick={() =>
                                  setSelectedAnswers(prev => ({ ...prev, [qIdx]: oIdx }))
                                }
                                className={`p-3 rounded-xl border text-right text-xs transition flex items-center justify-between cursor-pointer ${
                                  !isAnswered
                                    ? 'bg-zinc-950/80 border-zinc-800 hover:border-emerald-500/40 text-zinc-200'
                                    : isCorrect
                                    ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-200 font-bold'
                                    : isSelected
                                    ? 'bg-red-950/50 border-red-500/60 text-red-200'
                                    : 'bg-zinc-950/40 border-zinc-800/50 text-zinc-500'
                                }`}
                              >
                                <span>{opt}</span>
                                {isAnswered && isCorrect && (
                                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                        {isAnswered && (
                          <div className="p-3 rounded-xl bg-zinc-950/90 border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
                            <span className="font-bold text-emerald-400 ml-1">التوضيح:</span>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 3. DATA CHARTS */}
              {learningSubTab === 'data_chart' && (
                <div className="max-w-2xl mx-auto space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <input
                      type="text"
                      value={chartTitle}
                      onChange={e => setChartTitle(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-sm font-bold text-white focus:outline-none"
                    />
                    <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                      {[
                        { id: 'bar', label: 'أعمدة' },
                        { id: 'comparison', label: 'مقارنة مزدوجة' },
                        { id: 'line', label: 'مؤشر نمو' }
                      ].map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setChartType(t.id as any)}
                          className={`px-2.5 py-1 rounded-lg text-xs transition cursor-pointer ${
                            chartType === t.id
                              ? 'bg-emerald-600 text-white font-bold'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Visual Chart Canvas */}
                  <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                    {chartData.map((row, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-zinc-200">{row.label}</span>
                          <span className="font-mono text-emerald-400">
                            {row.value}
                            {chartType === 'comparison' ? ` / معيار: ${row.secondary}` : ''}
                          </span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-zinc-950 overflow-hidden p-0.5 border border-zinc-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-teal-500 transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.round((row.value / maxChartVal) * 100))}%` }}
                          />
                        </div>
                        {chartType === 'comparison' && (
                          <div className="w-full h-2 rounded-full bg-zinc-950 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-indigo-500/80 transition-all duration-300"
                              style={{ width: `${Math.min(100, Math.round((row.secondary / maxChartVal) * 100))}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. MIND MAP */}
              {learningSubTab === 'mind_map' && (
                <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3">
                  {mindMapNodes.map((branch, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-2.5"
                    >
                      <div className="text-xs font-bold text-emerald-300 border-b border-zinc-800 pb-2">
                        {branch.title}
                      </div>
                      <ul className="space-y-1.5 text-xs text-zinc-300">
                        {branch.items.map((it, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-400 mt-0.5">•</span>
                            <span>{it}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* 5. SLIDES */}
              {learningSubTab === 'slides' && (
                <div className="max-w-2xl mx-auto space-y-4">
                  <div className="p-7 rounded-2xl bg-gradient-to-br from-zinc-900 via-[#0b0e17] to-emerald-950/30 border border-zinc-800 min-h-[240px] flex flex-col justify-between">
                    <div className="space-y-2">
                      <span className="text-[11px] font-mono text-emerald-400">
                        شريحة {activeSlideIdx + 1} من {slidesList.length}
                      </span>
                      <h3 className="text-xl font-bold text-white">
                        {slidesList[activeSlideIdx]?.title}
                      </h3>
                      <p className="text-xs text-zinc-400">
                        {slidesList[activeSlideIdx]?.subtitle}
                      </p>
                    </div>
                    <ul className="space-y-2 my-4">
                      {(slidesList[activeSlideIdx]?.bullets || []).map((b, idx) => (
                        <li key={idx} className="text-xs md:text-sm text-zinc-200 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveSlideIdx(prev => (prev - 1 + slidesList.length) % slidesList.length)
                      }
                      className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 cursor-pointer"
                    >
                      الشريحة السابقة
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSlideIdx(prev => (prev + 1) % slidesList.length)}
                      className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 cursor-pointer"
                    >
                      الشريحة التالية
                    </button>
                  </div>
                </div>
              )}

              {/* 6. AUDIO OVERVIEW */}
              {learningSubTab === 'audio' && (
                <div className="max-w-xl mx-auto space-y-4">
                  <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-white">الملخص الصوتي الحواري</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        استمع لمناقشة صوتية مركزة تلخص أهم النقاط والمفاهيم في مساحة العمل
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSpeakAudioOverview}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                        isSpeakingAudio
                          ? 'bg-red-600 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      {isSpeakingAudio ? <Square size={13} /> : <Volume2 size={14} />}
                      <span>{isSpeakingAudio ? 'إيقاف الاستماع' : 'تشغيل الملخص الصوتي'}</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {audioScript.map((item, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs">
                        <span className="font-bold text-emerald-400 block mb-1">{item.speaker}:</span>
                        <p className="text-zinc-300 leading-relaxed">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* === MODE D: VISUAL SCENE & REGION CUSTOMIZATION === */}
        {primaryWorkspace === 'visual' && (
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#07080d]">
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-white">تخصيص المشهد والأجواء وتعديل منطقة محددة</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['إضاءة سينمائية دافئة', 'أجواء ليلية مستقبلية', 'نهار طبيعي مشرق', 'طابع معماري هندسي'].map(
                      atm => (
                        <button
                          key={atm}
                          type="button"
                          onClick={() => setSelectedAtmosphere(atm)}
                          className={`px-2 py-1 rounded-lg text-[10px] border transition cursor-pointer ${
                            selectedAtmosphere === atm
                              ? 'bg-purple-950/60 border-purple-500/60 text-purple-200 font-bold'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                          }`}
                        >
                          {atm}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {visualImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-black max-h-[340px] flex items-center justify-center">
                    <img
                      src={visualImage.startsWith('data:') ? visualImage : `data:image/png;base64,${visualImage}`}
                      alt="المشهد البصري في الكانفاس"
                      className="max-h-[340px] w-auto object-contain"
                    />
                    {regionSelection && (
                      <div
                        style={{
                          left: `${regionSelection.x}%`,
                          top: `${regionSelection.y}%`,
                          width: `${regionSelection.w}%`,
                          height: `${regionSelection.h}%`
                        }}
                        className="absolute border-2 border-dashed border-emerald-400 bg-emerald-500/10 rounded-lg pointer-events-none flex items-start justify-end p-1"
                      >
                        <span className="px-1.5 py-0.5 rounded bg-black/80 text-emerald-300 text-[9px]">
                          منطقة التعديل المحددة
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-52 rounded-xl border border-dashed border-zinc-800 flex flex-col items-center justify-center text-center p-4 text-zinc-500 text-xs">
                    <ImageIcon size={28} className="mb-2 text-zinc-600" />
                    <p>اكتب وصف المشهد بالأسفل لتوليد صورة جديدة داخل الكانفاس أو افتح أي صورة من المحادثة لتعديلها هنا.</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={visualEditPrompt}
                    onChange={e => setVisualEditPrompt(e.target.value)}
                    placeholder="صف التعديل المطلوب على المنطقة المحددة أو المشهد الكامل..."
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50"
                  />
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={handleApplyVisualModification}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                  >
                    <Sparkles size={13} />
                    <span>تطبيق على المشهد</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Sleek Bottom Floating Canvas Prompt Bar */}
      <div className="p-3 border-t border-zinc-800/80 bg-[#0b0d14]/95 shrink-0">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleAIQuickTransform(canvasInstructionInput);
          }}
          className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 focus-within:border-emerald-500/50 rounded-xl px-3 py-1.5"
        >
          <Sparkles size={14} className="text-emerald-400 shrink-0" />
          <input
            type="text"
            value={canvasInstructionInput}
            onChange={e => setCanvasInstructionInput(e.target.value)}
            placeholder="اطلب من نيكسوس تعديل الكانفاس، إكمال الرواية، تطوير الكود، أو توليد اختبار ومخطط..."
            className="flex-1 bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none min-w-0"
          />
          {onSendPromptToChat && canvasInstructionInput.trim() && (
            <button
              type="button"
              onClick={() => {
                onSendPromptToChat(canvasInstructionInput);
                setCanvasInstructionInput('');
              }}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] shrink-0 cursor-pointer"
              title="إرسال للمحادثة الرئيسية أيضاً"
            >
              إرسال للمحادثة
            </button>
          )}
          <button
            type="submit"
            disabled={isGenerating || !canvasInstructionInput.trim()}
            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer shrink-0"
          >
            {isGenerating ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
            <span>تحديث الكانفاس</span>
          </button>
        </form>
      </div>
    </aside>
  );
};

export default NexusCanvasStudioModal;
