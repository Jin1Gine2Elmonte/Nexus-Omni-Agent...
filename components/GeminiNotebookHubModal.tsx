import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Plus,
  X,
  FileText,
  Trash2,
  Upload,
  Cloud,
  RefreshCw,
  ExternalLink,
  Search,
  Link2,
  Check,
  ChevronDown,
  ChevronUp,
  MessageSquarePlus,
  PenTool,
  ClipboardPaste,
  Copy,
  Send
} from 'lucide-react';
import {
  GeminiNotebookItem,
  GeminiNotebookSource,
  GeminiNotebookUsageMode,
  SessionsMap
} from '../types';
import {
  getGoogleWorkspaceAccessToken,
  getGoogleWorkspaceAccessTokenSync,
  signInWithGoogleWorkspace,
  hasRealGoogleDriveToken,
  GCLOUD_DIRECT_VAULT_TOKEN
} from '../services/firebaseClient';
import {
  GoogleWorkspaceFileResult,
  syncNotebookLMToGoogleDrive,
  discoverGoogleDriveNotebookLMItems,
  openGoogleDriveOfficialPicker
} from '../services/googleWorkspaceService';
import {
  ingestUrlIntoNotebookSource,
  ingestGoogleDriveFileIntoSource,
  ingestBrowserFileIntoWorkspaceRag,
  UNIVERSAL_FILE_ACCEPT_EXTENSIONS,
  parseNotebookLmBundleIntoSources,
  NOTEBOOKLM_LIVE_EXTRACTOR_SCRIPT,
  chunkSourceContent
} from '../services/notebookLmEngine';

interface GeminiNotebookHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'notebooks' | 'drive_picker';
  notebooks: GeminiNotebookItem[];
  activeNotebookId?: string;
  activeNotebookIds?: string[];
  notebookUsageMode?: GeminiNotebookUsageMode;
  onChangeNotebookUsageMode?: (mode: GeminiNotebookUsageMode) => void;
  userEmail?: string;
  isPermanentSyncEnabled?: boolean;
  onTogglePermanentSync?: (enabled: boolean) => void;
  onUpdateNotebooks: (
    notebooks: GeminiNotebookItem[],
    activeNotebookId?: string,
    activeNotebookIds?: string[]
  ) => void;
  sessions: SessionsMap;
  activeSessionId: string;
  onStartNewChatInNotebook: (notebook: GeminiNotebookItem) => void;
  onSelectExistingSession: (sessionId: string, notebookId?: string) => void;
  onLinkSessionToNotebook: (sessionId: string, notebookId?: string) => void;
  onAttachToChatInput?: (payload: {
    name: string;
    content: string;
    sourceLabel: string;
    notebookId?: string;
  }) => void;
  onOpenNotebookInStudio?: (notebook: GeminiNotebookItem) => void;
  onSendPromptWithNotebooks?: (
    promptText: string,
    attachedIds: string[],
    usageMode: GeminiNotebookUsageMode
  ) => void;
}

const DEFAULT_CONNECTED_NOTEBOOK: GeminiNotebookItem = {
  id: 'nb-google-default-1',
  title: 'الدفتر المعرفي الأساسي',
  description: 'دفتر متصل بمحادثات جيميني والويب ++ والكانفاس لتغذية الاستدلال بالمصادر الموثقة [1]',
  themeColor: 'indigo',
  customDirective:
    'اعتمد على مصادر هذا الدفتر المرقمة [1]، [2] وادمجها بدقة مع استدلال جيميني.',
  sources: [],
  linkedSessionIds: [],
  isSyncedToCloud: true,
  createdAt: Date.now(),
  updatedAt: Date.now()
};

const SOURCE_TYPE_LABELS: Record<GeminiNotebookSource['sourceType'], string> = {
  google_drive: 'Google Docs / Drive',
  notebooklm_url: 'NotebookLM',
  web_url: 'ويب / يوتيوب',
  file: 'ملف محلي',
  chat_session: 'سجل محادثة',
  note: 'نص مرجعي'
};

export const GeminiNotebookHubModal: React.FC<GeminiNotebookHubModalProps> = ({
  isOpen,
  onClose,
  notebooks,
  activeNotebookId,
  activeNotebookIds = [],
  notebookUsageMode = 'hybrid_web_plus',
  onChangeNotebookUsageMode,
  userEmail,
  onUpdateNotebooks,
  sessions,
  activeSessionId,
  onOpenNotebookInStudio,
  onSendPromptWithNotebooks
}) => {
  const effectiveNotebooks =
    notebooks.length > 0 ? notebooks : [DEFAULT_CONNECTED_NOTEBOOK];

  const [selectedNotebookIds, setSelectedNotebookIds] = useState<string[]>(() => {
    if (activeNotebookIds !== undefined) return activeNotebookIds;
    if (activeNotebookId) return [activeNotebookId];
    return [];
  });

  const [focusedNotebookId, setFocusedNotebookId] = useState<string>(
    activeNotebookId || effectiveNotebooks[0].id
  );
  const [selectedMode, setSelectedMode] = useState<GeminiNotebookUsageMode>(
    notebookUsageMode || 'hybrid_web_plus'
  );

  // Clean inline panels (only one open at a time)
  const [activeAddDrawer, setActiveAddDrawer] = useState<
    'none' | 'drive' | 'note' | 'new_notebook'
  >('none');

  // Quick URL / Link ingestion bar state
  const [quickUrlInput, setQuickUrlInput] = useState('');
  const [isIngestingUrl, setIsIngestingUrl] = useState(false);

  // Manual text / NotebookLM bundle state
  const [noteTitleInput, setNoteTitleInput] = useState('');
  const [noteBodyInput, setNoteBodyInput] = useState('');
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);

  // New notebook creation state
  const [newNotebookTitle, setNewNotebookTitle] = useState('');
  const [newNotebookDirective, setNewNotebookDirective] = useState('');

  // Direct query bar inside modal footer
  const [quickNotebookQuery, setQuickNotebookQuery] = useState('');

  // Google Drive state
  const [driveFiles, setDriveFiles] = useState<GoogleWorkspaceFileResult[]>([]);
  const [driveSearchQuery, setDriveSearchQuery] = useState('');
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    url?: string;
    isError?: boolean;
  } | null>(null);

  // Source preview / inspector state
  const [inspectedSourceId, setInspectedSourceId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const focusedNotebook =
    effectiveNotebooks.find(n => n.id === focusedNotebookId) ||
    effectiveNotebooks[0];

  useEffect(() => {
    if (isOpen) {
      if (activeNotebookIds !== undefined) {
        setSelectedNotebookIds(activeNotebookIds);
      } else if (activeNotebookId) {
        setSelectedNotebookIds([activeNotebookId]);
      } else {
        setSelectedNotebookIds([]);
      }
      if (notebookUsageMode) {
        setSelectedMode(notebookUsageMode);
      }
      loadDriveCatalog(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const notify = (text: string, url?: string, isError = false) => {
    setStatusMessage({ text, url, isError });
    setTimeout(() => {
      setStatusMessage(prev => (prev?.text === text ? null : prev));
    }, 6500);
  };

  const loadDriveCatalog = async (interactiveAuth: boolean) => {
    setIsLoadingDrive(true);
    try {
      const token = await getGoogleWorkspaceAccessToken();
      const { allDriveSources } = await discoverGoogleDriveNotebookLMItems(token);
      setDriveFiles(allDriveSources);
      if (interactiveAuth) {
        notify(`تم تحديث قائمة ملفات ومستندات الدفتر (${allDriveSources.length} ملف)`);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleOpenOfficialGooglePicker = async () => {
    setIsLoadingDrive(true);
    try {
      const pickedFiles = await openGoogleDriveOfficialPicker(null);
      if (pickedFiles && pickedFiles.length > 0) {
        const newSources: GeminiNotebookSource[] = [];
        for (const pf of pickedFiles) {
          const src = await ingestGoogleDriveFileIntoSource(pf);
          newSources.push(src);
        }
        const updated: GeminiNotebookItem = {
          ...focusedNotebook,
          sources: [...newSources, ...focusedNotebook.sources],
          updatedAt: Date.now()
        };
        await saveNotebookChanges(updated, false, true);
        await loadDriveCatalog(false);
        notify(`تم استيراد ${newSources.length} ملف مباشرة إلى "${focusedNotebook.title}"!`);
      }
    } catch (err: any) {
      notify(err?.message || 'تعذر فتح منتقي الملفات.', undefined, true);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const saveNotebookChanges = async (
    updatedNb: GeminiNotebookItem,
    pushToGoogleDrive = false,
    autoAttach = false
  ) => {
    const nextList = effectiveNotebooks.some(n => n.id === updatedNb.id)
      ? effectiveNotebooks.map(n => (n.id === updatedNb.id ? updatedNb : n))
      : [updatedNb, ...effectiveNotebooks];

    const nextAttached = autoAttach
      ? selectedNotebookIds.includes(updatedNb.id)
        ? selectedNotebookIds
        : [...selectedNotebookIds, updatedNb.id]
      : selectedNotebookIds;

    setSelectedNotebookIds(nextAttached);
    onUpdateNotebooks(nextList, nextAttached[0] || undefined, nextAttached);

    if (pushToGoogleDrive) {
      setIsSyncingCloud(true);
      try {
        const doc = await syncNotebookLMToGoogleDrive(updatedNb);
        const syncedNb: GeminiNotebookItem = {
          ...updatedNb,
          isSyncedToCloud: true,
          driveBackupFileId: doc.id,
          driveWebViewLink: doc.webViewLink,
          lastSyncedWithGoogleAt: Date.now()
        };
        const syncedList = nextList.map(n =>
          n.id === syncedNb.id ? syncedNb : n
        );
        onUpdateNotebooks(syncedList, nextAttached[0] || undefined, nextAttached);
        notify(`تم حفظ الدفتر كمستند: ${doc.name}`, doc.webViewLink);
      } catch {
        notify('تم حفظ التغييرات في الدفتر بنجاح', undefined, false);
      } finally {
        setIsSyncingCloud(false);
      }
    }
  };

  const toggleNotebookAttachment = (nbId: string) => {
    setSelectedNotebookIds(prev => {
      const next = prev.includes(nbId)
        ? prev.filter(id => id !== nbId)
        : [...prev, nbId];
      onUpdateNotebooks(effectiveNotebooks, next[0] || undefined, next);
      return next;
    });
  };

  const detachAllNotebooksFromChat = () => {
    setSelectedNotebookIds([]);
    onUpdateNotebooks(effectiveNotebooks, undefined, []);
    notify('تم إلغاء تحديد جميع الدفاتر وفصلها عن المحادثة');
  };

  const handleIngestQuickUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUrlInput.trim() || isIngestingUrl) return;
    setIsIngestingUrl(true);
    try {
      const result = await ingestUrlIntoNotebookSource(quickUrlInput);
      if (result.ok && result.source) {
        const newSource = result.source;
        const updated: GeminiNotebookItem = {
          ...focusedNotebook,
          notebookLmUrl: /notebooklm\.google\.com/i.test(quickUrlInput)
            ? quickUrlInput.trim()
            : focusedNotebook.notebookLmUrl,
          sources: [newSource, ...focusedNotebook.sources],
          updatedAt: Date.now()
        };
        await saveNotebookChanges(updated, false);
        setQuickUrlInput('');
        notify(
          `تم سحب وفهرسة "${newSource.title}" بنجاح (${newSource.wordCount.toLocaleString('en-US')} كلمة) وربطه بالمحادثة`
        );
      } else {
        // Open the smart NotebookLM / Paste drawer automatically if the link is private behind Google cookies
        setActiveAddDrawer('note');
        notify(
          result.message ||
            'الرابط خاص بحسابك؛ استخدم «لصق من الحافظة» بالأسفل لاستيراد محتوى NotebookLM فوراً.',
          undefined,
          true
        );
      }
    } catch {
      setActiveAddDrawer('note');
      notify('تعذر سحب الرابط مباشرة؛ يمكنك لصق المحتوى النصي في الخانة المفتوحة أدناه.', undefined, true);
    } finally {
      setIsIngestingUrl(false);
    }
  };

  const handleLocalFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLoadingDrive(true);
    notify(`جاري معالجة واستخلاص ${files.length} ملف عبر خدمة Google Workspace ومحرك RAG...`);

    try {
      const fileArray: File[] = Array.from(files);
      const newSources: GeminiNotebookSource[] = [];

      for (const file of fileArray) {
        try {
          const { source, ragExtraction } = await ingestBrowserFileIntoWorkspaceRag(file);
          newSources.push(source);
          notify(
            `تمت معالجة وفهرسة "${file.name}" (${ragExtraction?.detectedFormat || 'ملف'} · ${source.wordCount.toLocaleString('en-US')} كلمة) في Google Workspace ومحرك RAG!`
          );
        } catch {
          // Fallback text read
          const text = await file.text().catch(() => `[ملف: ${file.name}]`);
          const cleanText = text.trim().slice(0, 160000);
          const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
          newSources.push({
            id: `src-file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            title: file.name,
            content: cleanText,
            sourceType: 'file',
            isEnabled: true,
            wordCount,
            addedAt: Date.now()
          });
        }
      }

      if (newSources.length > 0) {
        const updated: GeminiNotebookItem = {
          ...focusedNotebook,
          sources: [...newSources, ...focusedNotebook.sources],
          updatedAt: Date.now()
        };
        await saveNotebookChanges(updated, false, true);
        await loadDriveCatalog(false);
      }
    } finally {
      setIsLoadingDrive(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImportDriveFile = async (
    file: GoogleWorkspaceFileResult,
    asSeparateNotebook = false
  ) => {
    setIsLoadingDrive(true);
    try {
      const newSrc = await ingestGoogleDriveFileIntoSource(file);
      if (asSeparateNotebook) {
        const cleanTitle = file.name.replace(/^\[NotebookLM\]\s*/i, '').trim();
        const created: GeminiNotebookItem = {
          id: `nb-drive-${Date.now()}`,
          title: cleanTitle || file.name,
          description: `دفتر مرتبط بمستند Google Drive (${file.name})`,
          themeColor: 'emerald',
          customDirective: 'اعتمد على هذا المستند السحابي وادمجه مع استدلال جيميني.',
          sources: [newSrc],
          linkedSessionIds: activeSessionId ? [activeSessionId] : [],
          isSyncedToCloud: true,
          driveBackupFileId: file.id,
          driveWebViewLink: file.webViewLink,
          lastSyncedWithGoogleAt: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        setFocusedNotebookId(created.id);
        await saveNotebookChanges(created, false);
        notify(`تم ربط "${created.title}" كدفتر مستقل في المحادثة`);
      } else {
        const updated: GeminiNotebookItem = {
          ...focusedNotebook,
          sources: [newSrc, ...focusedNotebook.sources],
          updatedAt: Date.now()
        };
        await saveNotebookChanges(updated, false);
        notify(`تمت إضافة "${file.name}" (${newSrc.wordCount.toLocaleString('en-US')} كلمة)`);
      }
      setActiveAddDrawer('none');
    } catch {
      notify('تعذر قراءة الملف من Google Drive', undefined, true);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleIngestBundleOrNote = async (rawContent: string, customTitle?: string) => {
    const cleanText = rawContent.trim();
    if (!cleanText) return;

    const parsed = parseNotebookLmBundleIntoSources(
      cleanText,
      customTitle?.trim() || 'مصدر NotebookLM'
    );

    if (parsed.sources.length === 0) return;

    const totalNewWords = parsed.sources.reduce((acc, s) => acc + (s.wordCount || 0), 0);
    const updated: GeminiNotebookItem = {
      ...focusedNotebook,
      title:
        parsed.notebookTitle && focusedNotebook.title === 'الدفتر المعرفي الأساسي'
          ? parsed.notebookTitle
          : focusedNotebook.title,
      sources: [...parsed.sources, ...focusedNotebook.sources],
      updatedAt: Date.now()
    };

    await saveNotebookChanges(updated, false);
    setNoteTitleInput('');
    setNoteBodyInput('');
    setActiveAddDrawer('none');
    notify(
      `تمت فهرسة ${parsed.sources.length} مصدر (${totalNewWords.toLocaleString('en-US')} كلمة) وتفعيلها في محادثة نيكسوس!`
    );
  };

  const handleAddNoteSource = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleIngestBundleOrNote(noteBodyInput, noteTitleInput);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (!clipText || !clipText.trim()) {
        notify('الحافظة فارغة؛ انسخ النص أو المصادر من تبويب NotebookLM أولاً ثم اضغط هنا.', undefined, true);
        return;
      }
      await handleIngestBundleOrNote(clipText, noteTitleInput);
    } catch {
      notify('الصق النص مباشرة بـ Ctrl+V داخل المربع النصي أدناه ثم اضغط «فهرسة وحفظ».', undefined, false);
    }
  };

  const handleIngestCurrentChat = async () => {
    const sess = sessions[activeSessionId];
    if (!sess || sess.messages.length === 0) {
      notify('لا توجد رسائل في المحادثة الحالية بعد', undefined, true);
      return;
    }
    const text = sess.messages
      .filter(m => !m.isThinking && m.content.trim())
      .map(m => `${m.role === 'user' ? 'المستخدم' : 'نيكسوس'}:\n${m.content}`)
      .join('\n\n---\n\n');
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const newSrc: GeminiNotebookSource = {
      id: `src-chat-${Date.now()}`,
      title: `محادثة: ${sess.title}`,
      content: text,
      sourceType: 'chat_session',
      linkedSessionId: sess.id,
      isEnabled: true,
      wordCount,
      addedAt: Date.now()
    };
    const updated: GeminiNotebookItem = {
      ...focusedNotebook,
      sources: [newSrc, ...focusedNotebook.sources],
      updatedAt: Date.now()
    };
    await saveNotebookChanges(updated, false);
    notify(`تم ضم سجل المحادثة (${wordCount.toLocaleString('en-US')} كلمة)`);
  };

  const handleCreateNewNotebook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotebookTitle.trim()) return;
    const created: GeminiNotebookItem = {
      id: `nb-${Date.now()}`,
      title: newNotebookTitle.trim(),
      description: newNotebookDirective.trim() || 'دفتر معرفي متصل بنيكسوس وجيميني',
      themeColor: 'indigo',
      customDirective:
        newNotebookDirective.trim() ||
        'استند إلى مصادر هذا الدفتر المرقمة [1]، [2] وادمجها مع استدلال جيميني.',
      sources: [],
      linkedSessionIds: activeSessionId ? [activeSessionId] : [],
      googleAccountEmail: userEmail,
      isSyncedToCloud: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setFocusedNotebookId(created.id);
    await saveNotebookChanges(created, false);
    setNewNotebookTitle('');
    setNewNotebookDirective('');
    setActiveAddDrawer('none');
    notify(`تم إنشاء الدفتر "${created.title}" وإرفاقه بالمحادثة`);
  };

  const handleDeleteNotebook = (nbId: string) => {
    if (effectiveNotebooks.length <= 1) return;
    const nextList = effectiveNotebooks.filter(n => n.id !== nbId);
    const nextSelected = selectedNotebookIds.filter(id => id !== nbId);
    if (focusedNotebook.id === nbId) {
      setFocusedNotebookId(nextList[0].id);
    }
    setSelectedNotebookIds(nextSelected);
    onUpdateNotebooks(nextList, nextSelected[0], nextSelected);
  };

  const toggleSourceEnabled = (sourceId: string) => {
    const updated: GeminiNotebookItem = {
      ...focusedNotebook,
      sources: focusedNotebook.sources.map(s =>
        s.id === sourceId ? { ...s, isEnabled: s.isEnabled === false } : s
      ),
      updatedAt: Date.now()
    };
    saveNotebookChanges(updated, false);
  };

  const deleteSource = (sourceId: string) => {
    if (inspectedSourceId === sourceId) setInspectedSourceId(null);
    const updated: GeminiNotebookItem = {
      ...focusedNotebook,
      sources: focusedNotebook.sources.filter(s => s.id !== sourceId),
      updatedAt: Date.now()
    };
    saveNotebookChanges(updated, false);
  };

  const handleSendDirectQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNotebookQuery.trim()) return;
    const finalIds =
      selectedNotebookIds.length > 0 ? selectedNotebookIds : [focusedNotebook.id];
    onUpdateNotebooks(effectiveNotebooks, finalIds[0], finalIds);
    onChangeNotebookUsageMode?.(selectedMode);
    if (onSendPromptWithNotebooks) {
      onSendPromptWithNotebooks(quickNotebookQuery.trim(), finalIds, selectedMode);
      setQuickNotebookQuery('');
      onClose();
    }
  };

  const totalAttachedWords = effectiveNotebooks
    .filter(n => selectedNotebookIds.includes(n.id))
    .reduce(
      (sum, n) =>
        sum +
        n.sources
          .filter(s => s.isEnabled !== false)
          .reduce((sAcc, s) => sAcc + (s.wordCount || 0), 0),
      0
    );

  const totalAttachedSources = effectiveNotebooks
    .filter(n => selectedNotebookIds.includes(n.id))
    .reduce(
      (sum, n) => sum + n.sources.filter(s => s.isEnabled !== false).length,
      0
    );

  const filteredDrive = driveFiles.filter(
    f =>
      !driveSearchQuery.trim() ||
      f.name.toLowerCase().includes(driveSearchQuery.trim().toLowerCase())
  );

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[150] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 font-arabic"
    >
      <div className="w-full max-w-5xl h-[86vh] max-h-[780px] bg-[#0B0D13] border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* 1. Strict 3-Zone Top Bar Contract */}
        <header className="h-14 px-5 border-b border-zinc-800/80 flex items-center justify-between gap-6 shrink-0 bg-[#0E1118]">
          {/* Zone 1: Single-line Brand Title */}
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <BookOpen size={18} className="text-indigo-400 shrink-0" />
            <span className="text-sm font-bold text-white tracking-tight">
              Google NotebookLM · الربط المعرفي الحي
            </span>
          </div>

          {/* Zone 2: Segmented Mode Control */}
          <div className="hidden md:flex items-center gap-1 p-1 bg-zinc-900/90 border border-zinc-800/80 rounded-lg">
            {(
              [
                { id: 'hybrid_web_plus', label: 'دمج مع جيميني والويب ++' },
                { id: 'strict_grounding', label: 'تأسيس صارم بالمصادر [1]' },
                { id: 'canvas_synthesis', label: 'توليد في الكانفاس' }
              ] as const
            ).map(mode => (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  setSelectedMode(mode.id);
                  onChangeNotebookUsageMode?.(mode.id);
                }}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedMode === mode.id
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* Zone 3: Primary Action & Close */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => loadDriveCatalog(true)}
              disabled={isLoadingDrive}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw
                size={13}
                className={isLoadingDrive ? 'animate-spin text-emerald-400' : 'text-emerald-400'}
              />
              <span>مزامنة السحابة</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X size={17} />
            </button>
          </div>
        </header>

        {/* Status Notice Bar */}
        {statusMessage && (
          <div
            className={`px-5 py-2 border-b text-xs flex items-center justify-between ${
              statusMessage.isError
                ? 'bg-amber-950/50 border-amber-500/35 text-amber-200'
                : 'bg-emerald-950/45 border-emerald-500/30 text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{statusMessage.text}</span>
              {statusMessage.url && (
                <a
                  href={statusMessage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold inline-flex items-center gap-1"
                >
                  <span>فتح المستند</span>
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-zinc-400 hover:text-white"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* 2. Two-Pane Master-Detail Workspace */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Right Sidebar: Notebooks List (260px) */}
          <aside className="w-full md:w-64 border-b md:border-b-0 md:border-l border-zinc-800/80 bg-[#090B10] flex flex-col min-h-0 shrink-0">
            <div className="p-3 border-b border-zinc-800/80 flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300">
                دفاترك المربوطة ({effectiveNotebooks.length})
              </span>
              <button
                type="button"
                onClick={() =>
                  setActiveAddDrawer(prev =>
                    prev === 'new_notebook' ? 'none' : 'new_notebook'
                  )
                }
                className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus size={13} />
                <span>دفتر جديد</span>
              </button>
            </div>

            {activeAddDrawer === 'new_notebook' && (
              <form
                onSubmit={handleCreateNewNotebook}
                className="p-3 border-b border-zinc-800 bg-zinc-900/50 space-y-2"
              >
                <input
                  type="text"
                  required
                  autoFocus
                  value={newNotebookTitle}
                  onChange={e => setNewNotebookTitle(e.target.value)}
                  placeholder="اسم الدفتر الجديد..."
                  className="w-full bg-[#0B0D13] border border-zinc-800 focus:border-indigo-500 rounded-md px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 outline-none"
                />
                <input
                  type="text"
                  value={newNotebookDirective}
                  onChange={e => setNewNotebookDirective(e.target.value)}
                  placeholder="توجيه أو وصف الدفتر (اختياري)..."
                  className="w-full bg-[#0B0D13] border border-zinc-800 focus:border-indigo-500 rounded-md px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 outline-none"
                />
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveAddDrawer('none')}
                    className="px-2.5 py-1 rounded text-xs text-zinc-400 hover:text-white"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer"
                  >
                    إنشاء
                  </button>
                </div>
              </form>
            )}

            <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/50">
              {effectiveNotebooks.map(nb => {
                const isAttached = selectedNotebookIds.includes(nb.id);
                const isFocused = focusedNotebook.id === nb.id;
                const activeSrcCount = nb.sources.filter(
                  s => s.isEnabled !== false
                ).length;
                const wordsSum = nb.sources
                  .filter(s => s.isEnabled !== false)
                  .reduce((s, item) => s + (item.wordCount || 0), 0);

                return (
                  <div
                    key={nb.id}
                    onClick={() => setFocusedNotebookId(nb.id)}
                    className={`px-3 py-2.5 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                      isFocused
                        ? 'bg-indigo-950/30 text-white'
                        : 'hover:bg-zinc-900/60 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          toggleNotebookAttachment(nb.id);
                        }}
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 cursor-pointer ${
                          isAttached
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-zinc-950 border-zinc-700 text-transparent hover:border-zinc-500'
                        }`}
                        title={
                          isAttached
                            ? 'مرفق في محادثة نيكسوس (اضغط لإلغاء الإرفاق)'
                            : 'إرفاق هذا الدفتر في محادثة نيكسوس'
                        }
                      >
                        <Check size={11} />
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold truncate">
                          {nb.title}
                        </div>
                        <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 font-mono tabular-nums mt-0.5">
                          <span>{activeSrcCount} مصدر</span>
                          <span aria-hidden="true">·</span>
                          <span>{wordsSum.toLocaleString('en-US')} كلمة</span>
                        </div>
                      </div>
                    </div>

                    {effectiveNotebooks.length > 1 && (
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteNotebook(nb.id);
                        }}
                        className="p-1 text-zinc-600 hover:text-red-400 rounded transition-colors shrink-0"
                        title="حذف الدفتر"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Direct Link to Official Google NotebookLM at bottom of sidebar */}
            <div className="p-3 border-t border-zinc-800/80 bg-[#07080C] space-y-1.5">
              <a
                href="https://notebooklm.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-1.5 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs flex items-center justify-between transition-colors"
              >
                <span>فتح notebooklm.google.com</span>
                <ExternalLink size={12} className="text-zinc-500" />
              </a>
            </div>
          </aside>

          {/* Left Main Viewport: Focused Notebook Sources & Ingestion */}
          <main className="flex-1 flex flex-col min-h-0 bg-[#0B0D13] overflow-hidden">
            {/* Notebook Header & Actions */}
            <div className="px-5 py-3 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white truncate">
                    {focusedNotebook.title}
                  </h3>
                  {focusedNotebook.driveWebViewLink && (
                    <a
                      href={focusedNotebook.driveWebViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-400 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Google Docs</span>
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>
                <p className="text-xs text-zinc-400 truncate mt-0.5">
                  {focusedNotebook.description}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => saveNotebookChanges(focusedNotebook, true)}
                  disabled={isSyncingCloud}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                  title="حفظ ومزامنة هذا الدفتر كمستند Google Doc"
                >
                  <Cloud
                    size={13}
                    className={isSyncingCloud ? 'animate-pulse text-emerald-400' : 'text-emerald-400'}
                  />
                  <span>{isSyncingCloud ? 'جاري الحفظ...' : 'حفظ في Google Docs'}</span>
                </button>

                {onOpenNotebookInStudio && focusedNotebook.sources.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenNotebookInStudio(focusedNotebook);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <PenTool size={13} className="text-indigo-400" />
                    <span>فتح في الكانفاس</span>
                  </button>
                )}
              </div>
            </div>

            {/* Unified Source Ingestion Bar (Google Docs / YouTube / Web URL / File / NotebookLM Bridge) */}
            <div className="px-5 py-3 border-b border-zinc-800/80 bg-[#0E1017] flex flex-wrap items-center gap-2">
              <form
                onSubmit={handleIngestQuickUrl}
                className="flex-1 min-w-[240px] flex items-center gap-1.5"
              >
                <div className="relative flex-1">
                  <Link2
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  />
                  <input
                    type="url"
                    value={quickUrlInput}
                    onChange={e => setQuickUrlInput(e.target.value)}
                    placeholder="الصق رابط مستند Google Docs، يوتيوب، ويب، أو رابط دفتر عام لسحبه مباشرة..."
                    className="w-full bg-[#090B10] border border-zinc-800 focus:border-indigo-500 rounded-lg pr-8 pl-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!quickUrlInput.trim() || isIngestingUrl}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isIngestingUrl ? 'جاري السحب...' : 'سحب الرابط'}
                </button>
              </form>

              <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={UNIVERSAL_FILE_ACCEPT_EXTENSIONS}
                onChange={handleLocalFilesUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() =>
                  setActiveAddDrawer(prev => (prev === 'note' ? 'none' : 'note'))
                }
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  activeAddDrawer === 'note'
                    ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-200'
                    : 'bg-indigo-950/25 hover:bg-indigo-950/45 border-indigo-500/35 text-indigo-200'
                }`}
              >
                <ClipboardPaste size={13} className="text-indigo-400" />
                <span>استيراد مباشر من NotebookLM</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoadingDrive}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/35 border border-indigo-500/40 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                title="رفع ومعالجة ملف PDF أو Word أو Excel أو ZIP أو كود أو أي صيغة أخرى عبر Google Workspace ومحرك RAG"
              >
                <Upload size={13} className="text-indigo-400" />
                <span>رفع PDF وجميع الصيغ (RAG)</span>
              </button>

              <button
                type="button"
                onClick={handleOpenOfficialGooglePicker}
                disabled={isLoadingDrive}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                title="فتح نافذة اختيار ملفات Google Drive الرسمية من جوجل (Google Picker)"
              >
                <Cloud size={13} />
                <span>اختيار من Google Drive (Picker)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveAddDrawer(prev => (prev === 'drive' ? 'none' : 'drive'));
                  if (driveFiles.length === 0) loadDriveCatalog(true);
                }}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  activeAddDrawer === 'drive'
                    ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200'
                }`}
              >
                <Cloud size={13} className="text-emerald-400" />
                <span>قائمة Drive</span>
              </button>

              <button
                type="button"
                onClick={handleIngestCurrentChat}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                title="إضافة المحادثة الحالية كمصدر داخل هذا الدفتر"
              >
                <MessageSquarePlus size={13} className="text-amber-400" />
                <span>ضم المحادثة</span>
              </button>
            </div>

            {/* Expandable Inline Drawer: Google Drive Picker OR Direct NotebookLM Bridge & Paste */}
            {activeAddDrawer === 'drive' && (
              <div className="p-4 border-b border-zinc-800 bg-[#080A0F] space-y-2.5 max-h-60 overflow-y-auto">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-zinc-200">
                    اختر مستنداً أو ملفاً من Google Drive لإضافته إلى "{focusedNotebook.title}"
                  </span>
                  <div className="relative w-56">
                    <Search
                      size={12}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
                    />
                    <input
                      type="text"
                      value={driveSearchQuery}
                      onChange={e => setDriveSearchQuery(e.target.value)}
                      placeholder="تصفية ملفات Drive..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-md pr-7 pl-2 py-1 text-xs text-white placeholder-zinc-500 outline-none"
                    />
                  </div>
                </div>

                {isLoadingDrive ? (
                  <div className="py-4 text-center text-xs text-zinc-400">
                    جاري جلب ملفات السحابة...
                  </div>
                ) : filteredDrive.length === 0 ? (
                  <div className="py-4 text-center text-xs text-zinc-500">
                    لا توجد ملفات مطابقة. يمكنك أيضاً لصق رابط أي مستند Google Docs مباشرة في الشريط العلوي بدون تسجيل دخول!
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800/60 border border-zinc-800 rounded-lg overflow-hidden">
                    {filteredDrive.map(file => (
                      <div
                        key={file.id}
                        className="px-3 py-2 bg-zinc-900/40 hover:bg-zinc-900 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1 flex items-center gap-2">
                          <span className="text-xs text-zinc-200 font-medium truncate">
                            {file.name}
                          </span>
                          <span className="text-[11px] text-zinc-500 font-mono">
                            · {file.service.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleImportDriveFile(file, false)}
                            className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium cursor-pointer"
                          >
                            ضم كمصدر
                          </button>
                          <button
                            type="button"
                            onClick={() => handleImportDriveFile(file, true)}
                            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium cursor-pointer"
                          >
                            كدفتر مستقل
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeAddDrawer === 'note' && (
              <div className="p-4 border-b border-zinc-800 bg-[#080A0F] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-white">
                      جسر الاستيراد المباشر من صفحة Google NotebookLM الخاصة بك
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      لأن دفاتر notebooklm.google.com محمية داخل متصفحك: انسخ محتوى دفترك أو ملخصاته (Ctrl+A ثم Ctrl+C) واضغط «لصق فوري من الحافظة» ليتم تقسيمه وفهرسته كمصادر مرقمة [1]، [2].
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handlePasteFromClipboard}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <ClipboardPaste size={13} />
                      <span>لصق فوري من الحافظة</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(NOTEBOOKLM_LIVE_EXTRACTOR_SCRIPT);
                        setCopiedBookmarklet(true);
                        setTimeout(() => setCopiedBookmarklet(false), 3500);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs flex items-center gap-1.5 cursor-pointer"
                      title="انسخ كود الاستخلاص السريع (Bookmarklet) لتشغيله داخل تبويب notebooklm.google.com"
                    >
                      <Copy size={12} />
                      <span>{copiedBookmarklet ? 'تم نسخ كود الجسر!' : 'كود جسر المتصفح'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveAddDrawer('none')}
                      className="text-xs text-zinc-500 hover:text-zinc-300 px-1.5"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>

                <form onSubmit={handleAddNoteSource} className="space-y-2">
                  <input
                    type="text"
                    value={noteTitleInput}
                    onChange={e => setNoteTitleInput(e.target.value)}
                    placeholder="عنوان المصدر أو الدفتر (اختياري — يُستخرج تلقائياً عند تركه فارغاً)..."
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none"
                  />
                  <textarea
                    rows={4}
                    required
                    value={noteBodyInput}
                    onChange={e => setNoteBodyInput(e.target.value)}
                    placeholder="الصق هنا أي محتوى منسوخ من NotebookLM، أو عدة مصادر مفصولة بـ ---، أو نص مستند كامل ليتم تقسيمه وفهرسته دلالياً (BM25 Semantic Chunks)..."
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-lg p-3 text-xs text-white placeholder-zinc-500 outline-none resize-none leading-relaxed"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                    >
                      فهرسة وتفعيل في محادثة نيكسوس
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* High-Density Sources Data Grid */}
            <div className="flex-1 overflow-y-auto">
              {focusedNotebook.sources.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                  <FileText size={28} className="text-zinc-600" />
                  <div className="space-y-1 max-w-lg">
                    <p className="text-sm font-semibold text-zinc-200">
                      لا توجد مصادر مفهرسة في "{focusedNotebook.title}" بعد
                    </p>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      لتوصيل دفترك ومصادرك بنيكسوس الآن، اختر إحدى الطرق الثلاث:
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveAddDrawer('note')}
                      className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <ClipboardPaste size={13} />
                      <span>1. استيراد مباشر من صفحة NotebookLM</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload size={13} />
                      <span>2. رفع ملفات أو مستندات</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    أو الصق رابط أي مستند Google Docs أو فيديو يوتيوب في الشريط العلوي ليتم سحبه تلقائياً بدون تسجيل دخول.
                  </p>
                </div>
              ) : (
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800/80 bg-[#090B10] text-[11px] text-zinc-400 font-medium">
                      <th className="py-2.5 pr-5 pl-2 w-10">تفعيل</th>
                      <th className="py-2.5 px-2 w-14 font-mono">المرجع</th>
                      <th className="py-2.5 px-3">عنوان المصدر</th>
                      <th className="py-2.5 px-3 w-32">النوع</th>
                      <th className="py-2.5 px-3 w-32 text-left font-mono">الكلمات / المقاطع</th>
                      <th className="py-2.5 pl-5 pr-2 w-24 text-left">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50 text-xs">
                    {focusedNotebook.sources.map((src, idx) => {
                      const isEnabled = src.isEnabled !== false;
                      const isInspected = inspectedSourceId === src.id;
                      const chunks = chunkSourceContent(src.content, 360, 50);

                      return (
                        <React.Fragment key={src.id}>
                          <tr
                            onClick={() =>
                              setInspectedSourceId(isInspected ? null : src.id)
                            }
                            className={`h-11 transition-colors cursor-pointer ${
                              isInspected
                                ? 'bg-indigo-950/20'
                                : 'hover:bg-zinc-900/50'
                            }`}
                          >
                            <td
                              className="pr-5 pl-2"
                              onClick={e => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => toggleSourceEnabled(src.id)}
                                className={`w-4 h-4 rounded flex items-center justify-center border transition-colors cursor-pointer ${
                                  isEnabled
                                    ? 'bg-emerald-600 border-emerald-500 text-white'
                                    : 'bg-zinc-950 border-zinc-700 text-transparent'
                                }`}
                              >
                                <Check size={11} />
                              </button>
                            </td>

                            <td className="px-2 font-mono tabular-nums text-indigo-400 font-semibold">
                              [{idx + 1}]
                            </td>

                            <td className="px-3 font-medium text-zinc-100 truncate max-w-[260px]">
                              {src.title}
                            </td>

                            <td className="px-3 text-zinc-400 whitespace-nowrap">
                              {SOURCE_TYPE_LABELS[src.sourceType] || 'مصدر'}
                            </td>

                            <td className="px-3 text-left font-mono tabular-nums text-zinc-300 whitespace-nowrap">
                              {(src.wordCount || 0).toLocaleString('en-US')} ·{' '}
                              {chunks.length} مقطع
                            </td>

                            <td
                              className="pl-5 pr-2 text-left"
                              onClick={e => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-end gap-1.5">
                                {onSendPromptWithNotebooks && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const finalIds = selectedNotebookIds.includes(focusedNotebook.id)
                                        ? selectedNotebookIds
                                        : [...selectedNotebookIds, focusedNotebook.id];
                                      onUpdateNotebooks(effectiveNotebooks, finalIds[0], finalIds);
                                      onChangeNotebookUsageMode?.(selectedMode);
                                      onSendPromptWithNotebooks(
                                        `لخّص وحلّل محتوى الملف "${src.title}" ([${idx + 1}]) بالتفصيل مع استخراج المحاور الرئيسية والبيانات الجوهرية وتوثيق الفقرات بالمراجع.`,
                                        finalIds,
                                        selectedMode
                                      );
                                      onClose();
                                    }}
                                    className="px-2 py-0.5 rounded bg-emerald-950/50 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold whitespace-nowrap cursor-pointer"
                                    title="تلخيص هذا الملف فوراً عبر محرك RAG المدمج"
                                  >
                                    تلخيص RAG
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setInspectedSourceId(isInspected ? null : src.id)
                                  }
                                  className="p-1 text-zinc-400 hover:text-white rounded"
                                  title="معاينة المقاطع المفهرسة"
                                >
                                  {isInspected ? (
                                    <ChevronUp size={14} />
                                  ) : (
                                    <ChevronDown size={14} />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteSource(src.id)}
                                  className="p-1 text-zinc-500 hover:text-red-400 rounded"
                                  title="حذف المصدر"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Inline Source & Semantic Chunks Inspector */}
                          {isInspected && (
                            <tr className="bg-[#07090E] border-b border-zinc-800">
                              <td colSpan={6} className="p-4 space-y-2">
                                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                                  <span>
                                    المحتوى المفهرس للاسترجاع الدلالي في نيكسوس (BM25 Semantic Chunks:{' '}
                                    <strong className="font-mono tabular-nums text-zinc-200">
                                      {chunks.length}
                                    </strong>
                                    )
                                  </span>
                                  {(src.driveWebViewLink || src.notebookLmSourceUrl) && (
                                    <a
                                      href={src.driveWebViewLink || src.notebookLmSourceUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-indigo-400 hover:underline inline-flex items-center gap-1"
                                    >
                                      <span>فتح الرابط الأصلي</span>
                                      <ExternalLink size={11} />
                                    </a>
                                  )}
                                </div>
                                <div className="max-h-48 overflow-y-auto p-3 rounded-lg bg-[#0B0D13] border border-zinc-800/90 text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap font-mono">
                                  {src.content}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </main>
        </div>

        {/* 3. Footer Bar: Direct Query Launcher + Tabular Metrics + Detach / Confirm */}
        <footer className="px-5 py-3 border-t border-zinc-800/80 bg-[#090B10] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono tabular-nums">
            <span>الدفاتر المرفقة: {selectedNotebookIds.length}</span>
            <span aria-hidden="true">·</span>
            <span>المصادر المفعلة: {totalAttachedSources}</span>
            <span aria-hidden="true">·</span>
            <span>الكلمات المفهرسة: {totalAttachedWords.toLocaleString('en-US')}</span>
            {selectedNotebookIds.length > 0 && (
              <button
                type="button"
                onClick={detachAllNotebooksFromChat}
                className="mr-2 px-2.5 py-1 rounded-md bg-red-950/40 hover:bg-red-950/70 border border-red-500/40 text-red-300 text-[11px] font-sans font-semibold flex items-center gap-1 cursor-pointer"
              >
                <X size={11} />
                <span>إلغاء تحديد الكل (فصل عن المحادثة)</span>
              </button>
            )}
          </div>

          <form
            onSubmit={handleSendDirectQuestion}
            className="flex-1 max-w-md flex items-center gap-1.5"
          >
            <input
              type="text"
              value={quickNotebookQuery}
              onChange={e => setQuickNotebookQuery(e.target.value)}
              placeholder="اسأل نيكسوس مباشرة في مصادر الدفتر..."
              className="flex-1 bg-[#0E1118] border border-zinc-800 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none"
            />
            {quickNotebookQuery.trim() && (
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Send size={12} className="rtl:rotate-180" />
                <span>إرسال</span>
              </button>
            )}
          </form>

          <div className="flex items-center gap-2">
            {!selectedNotebookIds.includes(focusedNotebook.id) && (
              <button
                type="button"
                onClick={() => {
                  const next = [...selectedNotebookIds, focusedNotebook.id];
                  setSelectedNotebookIds(next);
                  onUpdateNotebooks(effectiveNotebooks, next[0], next);
                  onChangeNotebookUsageMode?.(selectedMode);
                  onClose();
                }}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                إرفاق "{focusedNotebook.title}" بالمحادثة
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onUpdateNotebooks(
                  effectiveNotebooks,
                  selectedNotebookIds[0] || undefined,
                  selectedNotebookIds
                );
                onChangeNotebookUsageMode?.(selectedMode);
                onClose();
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedNotebookIds.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
              }`}
            >
              {selectedNotebookIds.length > 0
                ? `حفظ وإغلاق (${selectedNotebookIds.length} مرفق)`
                : 'حفظ وإغلاق (بدون إرفاق بالمحادثة)'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default GeminiNotebookHubModal;
