import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  Upload,
  Folder,
  FolderPlus,
  FileText,
  FileSpreadsheet,
  Presentation,
  FileCode,
  Image as ImageIcon,
  LayoutGrid,
  List,
  RefreshCw,
  ExternalLink,
  Check,
  ArrowUpDown,
  Link2,
  Trash2,
  ChevronLeft
} from 'lucide-react';
import {
  GoogleWorkspaceFileResult,
  listNexusGoogleDriveFiles,
  fetchGoogleDriveFileTextContent,
  createGoogleDriveFolder,
  deleteGoogleDriveVaultItem,
  uploadBrowserFileToGoogleDrive,
  saveToGoogleCloudDirectVault
} from '../services/googleWorkspaceService';
import { getGoogleWorkspaceAccessToken } from '../services/firebaseClient';
import {
  ingestUrlIntoNotebookSource,
  UNIVERSAL_FILE_ACCEPT_EXTENSIONS
} from '../services/notebookLmEngine';
import { UserAccountProfile } from '../types';

interface GoogleServicesConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserAccountProfile | null;
  userEmail?: string | null;
  onConnectGoogleAccount: (customEmail?: string) => Promise<void>;
  onDisconnectGoogleAccount: () => Promise<void>;
  onAttachFileToChat?: (payload: {
    name: string;
    content: string;
    sourceLabel: string;
    mimeType?: string;
    dataUrl?: string;
    autoPrompt?: string;
  }) => void;
}

export const GoogleServicesConnectModal: React.FC<GoogleServicesConnectModalProps> = ({
  isOpen,
  onClose,
  onAttachFileToChat
}) => {
  const [activeTab, setActiveTab] = useState<'my_drive' | 'upload' | 'recent'>('my_drive');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchOrUrl, setSearchOrUrl] = useState('');
  const [files, setFiles] = useState<GoogleWorkspaceFileResult[]>([]);
  const [currentFolder, setCurrentFolder] = useState<GoogleWorkspaceFileResult | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachingFileId, setAttachingFileId] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDriveItems();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showNotice = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => {
      setStatusNotice(prev => (prev === msg ? null : prev));
    }, 4000);
  };

  const loadDriveItems = async () => {
    setIsLoading(true);
    try {
      const token = await getGoogleWorkspaceAccessToken();
      const list = await listNexusGoogleDriveFiles(token);
      setFiles(list);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFile = async (file: GoogleWorkspaceFileResult, autoPrompt?: string) => {
    if (file.isFolder) {
      setCurrentFolder(file);
      return;
    }
    if (!onAttachFileToChat) return;

    setAttachingFileId(file.id);
    try {
      const isImg =
        file.mimeType?.startsWith('image/') ||
        Boolean(file.thumbnailLink && file.thumbnailLink.startsWith('data:image/'));

      if (isImg && file.thumbnailLink?.startsWith('data:image/')) {
        onAttachFileToChat({
          name: file.name,
          content: '',
          sourceLabel: 'Google Drive',
          mimeType: file.mimeType || 'image/png',
          dataUrl: file.thumbnailLink,
          autoPrompt
        });
        onClose();
        return;
      }

      const textContent = await fetchGoogleDriveFileTextContent(file);
      if (isImg && textContent.startsWith('data:image/')) {
        onAttachFileToChat({
          name: file.name,
          content: '',
          sourceLabel: 'Google Drive',
          mimeType: file.mimeType || 'image/png',
          dataUrl: textContent,
          autoPrompt
        });
        onClose();
        return;
      }

      onAttachFileToChat({
        name: file.name,
        content: textContent,
        mimeType: file.mimeType,
        autoPrompt,
        sourceLabel:
          file.service === 'docs'
            ? 'Google Docs'
            : file.service === 'sheets'
            ? 'Google Sheets'
            : file.service === 'slides'
            ? 'Google Slides'
            : 'Google Drive'
      });
      onClose();
    } catch {
      onAttachFileToChat({
        name: file.name,
        content: `[ملف من Google Drive: ${file.name}]`,
        mimeType: file.mimeType,
        autoPrompt,
        sourceLabel: 'Google Drive'
      });
      onClose();
    } finally {
      setAttachingFileId(null);
    }
  };

  const handleDeleteItem = async (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    await deleteGoogleDriveVaultItem(fileId);
    setFiles(prev => prev.filter(f => f.id !== fileId && f.parentId !== fileId));
  };

  const handleCreateFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newFolderName.trim();
    if (!clean) return;
    setIsLoading(true);
    try {
      const created = await createGoogleDriveFolder(clean, currentFolder?.id);
      setFiles(prev => [created, ...prev]);
      setNewFolderName('');
      setIsCreatingFolder(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlPasteOrSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchOrUrl.trim();
    if (!trimmed) return;

    if (/^https?:\/\//i.test(trimmed)) {
      setIsLoading(true);
      try {
        const src = await ingestUrlIntoNotebookSource(trimmed);
        const docTitle = src.source?.title || 'مستند مستورد من الرابط';
        const docContent = src.source?.content || '';
        const saved = await saveToGoogleCloudDirectVault(
          docTitle,
          docContent,
          'docs',
          'application/vnd.google-apps.document',
          { parentId: currentFolder?.id }
        );
        setFiles(prev => [saved, ...prev]);
        if (onAttachFileToChat) {
          onAttachFileToChat({
            name: saved.name,
            content: docContent,
            sourceLabel: 'Google Drive'
          });
          setSearchOrUrl('');
          onClose();
        }
      } catch {
        showNotice('تعذر جلب محتوى الرابط المباشر.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleLocalFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedList = e.target.files;
    if (!selectedList || selectedList.length === 0) return;

    setIsLoading(true);
    showNotice(`جاري رفع ومعالجة ${selectedList.length} ملف عبر خدمة Google Workspace ومحرك RAG...`);
    try {
      for (let i = 0; i < selectedList.length; i++) {
        const f = selectedList[i];
        const { record, rawContentOrDataUrl, ragExtraction } = await uploadBrowserFileToGoogleDrive(
          f,
          currentFolder?.id
        );
        if (onAttachFileToChat) {
          const isImg =
            record.mimeType.startsWith('image/') && rawContentOrDataUrl.startsWith('data:image/');
          const extractedBody =
            ragExtraction?.extractedText ||
            (!isImg ? rawContentOrDataUrl : '') ||
            `[ملف: ${record.name}]`;
          onAttachFileToChat({
            name: record.name,
            content: extractedBody,
            mimeType: record.mimeType,
            dataUrl: isImg ? rawContentOrDataUrl : undefined,
            sourceLabel: `Google Workspace RAG (${ragExtraction?.detectedFormat || 'Drive'})`
          });
        }
      }
      await loadDriveItems();
      onClose();
    } catch {
      showNotice('تعذر رفع الملف.');
    } finally {
      setIsLoading(false);
      e.target.value = '';
    }
  };

  const isUrlTyped = /^https?:\/\//i.test(searchOrUrl.trim());
  const queryLower = isUrlTyped ? '' : searchOrUrl.trim().toLowerCase();

  const filteredItems = files.filter(f => {
    if (queryLower) {
      return f.name.toLowerCase().includes(queryLower);
    }
    if (activeTab === 'recent') {
      return !f.isFolder;
    }
    if (currentFolder) {
      return f.parentId === currentFolder.id;
    }
    return !f.parentId;
  });

  const folders = activeTab === 'recent' ? [] : filteredItems.filter(f => f.isFolder);
  const regularFiles = filteredItems
    .filter(f => !f.isFolder)
    .sort((a, b) => {
      if (activeTab === 'recent') {
        return b.createdAt - a.createdAt;
      }
      return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    });

  const renderFileCardIcon = (f: GoogleWorkspaceFileResult, large = false) => {
    const size = large ? 34 : 16;
    const lower = f.name.toLowerCase();
    if (f.service === 'sheets' || lower.endsWith('.csv') || lower.endsWith('.xlsx')) {
      return (
        <div
          className={`${
            large ? 'w-14 h-14 rounded-xl' : 'w-6 h-6 rounded-md'
          } bg-emerald-600/15 text-emerald-400 flex items-center justify-center shrink-0`}
        >
          <FileSpreadsheet size={size} />
        </div>
      );
    }
    if (f.service === 'slides' || lower.endsWith('.pptx')) {
      return (
        <div
          className={`${
            large ? 'w-14 h-14 rounded-xl' : 'w-6 h-6 rounded-md'
          } bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0`}
        >
          <Presentation size={size} />
        </div>
      );
    }
    if (
      lower.endsWith('.py') ||
      lower.endsWith('.ts') ||
      lower.endsWith('.tsx') ||
      lower.endsWith('.js') ||
      lower.endsWith('.json') ||
      lower.endsWith('.html') ||
      lower.endsWith('.ipynb')
    ) {
      return (
        <div
          className={`${
            large ? 'w-14 h-14 rounded-xl' : 'w-6 h-6 rounded-md'
          } bg-red-600/90 text-white flex items-center justify-center shadow-sm shrink-0`}
        >
          <FileCode size={size} />
        </div>
      );
    }
    if (
      f.mimeType?.startsWith('image/') ||
      lower.endsWith('.png') ||
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      lower.endsWith('.webp')
    ) {
      return (
        <div
          className={`${
            large ? 'w-14 h-14 rounded-xl' : 'w-6 h-6 rounded-md'
          } bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0`}
        >
          <ImageIcon size={size} />
        </div>
      );
    }
    return (
      <div
        className={`${
          large ? 'w-14 h-14 rounded-xl' : 'w-6 h-6 rounded-md'
        } bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0`}
      >
        <FileText size={size} />
      </div>
    );
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[150] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150 font-arabic"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl h-[82vh] max-h-[680px] bg-[#13151c] border border-zinc-800 rounded-3xl shadow-[0_24px_90px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={UNIVERSAL_FILE_ACCEPT_EXTENSIONS}
          onChange={handleLocalFileChange}
          className="hidden"
        />

        {/* Top Bar: Drive Logo + Title + Pill Search/URL Input + Close */}
        <div className="px-5 pt-4 pb-3 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 bg-[#171922]">
          <div className="flex items-center gap-2.5 shrink-0">
            <svg className="w-6 h-6 shrink-0" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
              <path
                d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z"
                fill="#0066da"
              />
              <path
                d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z"
                fill="#00ac47"
              />
              <path
                d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z"
                fill="#ea4335"
              />
              <path
                d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z"
                fill="#00832d"
              />
              <path
                d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"
                fill="#2684fc"
              />
              <path
                d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z"
                fill="#ffba00"
              />
            </svg>
            <h2 className="text-base font-bold text-white">اختر ملفاً أو ارفعه</h2>
          </div>

          {/* Search in Drive or paste URL */}
          <form onSubmit={handleUrlPasteOrSearchSubmit} className="flex-1 max-w-xl min-w-[220px]">
            <div className="relative flex items-center">
              <Search size={15} className="absolute right-3.5 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={searchOrUrl}
                onChange={e => setSearchOrUrl(e.target.value)}
                placeholder="ابحث في Drive أو الصق رابط ملف..."
                className="w-full bg-[#222530] hover:bg-[#272a36] focus:bg-[#1d202a] border border-zinc-700/70 focus:border-blue-500/60 rounded-full pr-10 pl-24 py-2 text-xs text-white placeholder-zinc-400 outline-none transition"
              />
              {isUrlTyped && (
                <button
                  type="submit"
                  className="absolute left-1.5 px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Link2 size={11} />
                  <span>إرفاق الرابط</span>
                </button>
              )}
            </div>
          </form>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            title="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sub-Bar: Tabs (My Drive | Upload | Recent) + Quick Upload & Grid/List Toggle */}
        <div className="px-6 border-b border-zinc-800/80 bg-[#171922] flex items-center justify-between gap-3">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('my_drive');
              }}
              className={`py-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                activeTab === 'my_drive'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              ملفاتي (My Drive)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`py-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                activeTab === 'upload'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              رفع ملف (Upload)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('recent')}
              className={`py-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                activeTab === 'recent'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              الأخيرة (Recent)
            </button>
          </div>

          <div className="flex items-center gap-2 py-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-full bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/35 text-blue-300 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Upload size={12} />
              <span>رفع ملف</span>
            </button>

            <div className="flex items-center bg-[#222530] rounded-full p-0.5 border border-zinc-700/60">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-full transition cursor-pointer ${
                  viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
                title="عرض قائمة"
              >
                <List size={13} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-full transition cursor-pointer ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
                title="عرض شبكي"
              >
                <LayoutGrid size={13} />
              </button>
            </div>
          </div>
        </div>

        {statusNotice && (
          <div className="mx-6 mt-3 px-3.5 py-2 rounded-xl bg-blue-950/40 border border-blue-500/40 text-blue-200 text-xs flex items-center justify-between">
            <span>{statusNotice}</span>
            <button type="button" onClick={() => setStatusNotice(null)} className="text-zinc-400 hover:text-white">
              <X size={13} />
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'upload' ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-zinc-800 hover:border-blue-500/50 rounded-2xl bg-[#171922]/50 transition">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4">
                <Upload size={28} />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">
                رفع ومعالجة ملفات PDF وجميع الصيغ مباشرة عبر خدمة Google Workspace ومحرك RAG المدمج
              </h3>
              <p className="text-xs text-zinc-400 max-w-lg mb-5 leading-relaxed">
                يدعم استخلاص وفهرسة جميع الصيغ الممكنة تلقائياً: ملفات PDF (الرقمية والممسوحة ضوئياً والجداول)، Word (DOCX/DOC)، Excel (XLSX/CSV/TSV)، PowerPoint (PPTX)، دفاتر Jupyter (IPYNB)، الأرشيفات المضغوطة (ZIP/TAR/GZ)، الأكواد البرمجية، الصور، والصوتيات، مع حفظها في Google Drive وفهرستها للاستعلام والتلخيص.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md cursor-pointer"
              >
                اختيار ملف PDF أو أي صيغة أخرى (Browse & Index in RAG)
              </button>
            </div>
          ) : (
            <>
              {/* Breadcrumb when inside a folder */}
              {currentFolder && (
                <div className="flex items-center justify-between bg-[#181b25] px-4 py-2.5 rounded-xl border border-zinc-800/80">
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setCurrentFolder(null)}
                      className="text-blue-400 hover:underline font-bold cursor-pointer"
                    >
                      ملفاتي (My Drive)
                    </button>
                    <ChevronLeft size={14} className="text-zinc-500" />
                    <span className="text-white font-bold flex items-center gap-1.5">
                      <Folder size={14} className="text-amber-400" />
                      {currentFolder.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentFolder(null)}
                    className="text-[11px] text-zinc-400 hover:text-white cursor-pointer"
                  >
                    رجوع
                  </button>
                </div>
              )}

              {/* Folders Section */}
              {activeTab === 'my_drive' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-400">المجلدات (Folders)</span>
                    <button
                      type="button"
                      onClick={() => setIsCreatingFolder(prev => !prev)}
                      className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition cursor-pointer"
                    >
                      <FolderPlus size={13} />
                      <span>مجلد جديد</span>
                    </button>
                  </div>

                  {isCreatingFolder && (
                    <form onSubmit={handleCreateFolderSubmit} className="flex items-center gap-2 max-w-sm">
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={e => setNewFolderName(e.target.value)}
                        placeholder="اسم المجلد الجديد..."
                        autoFocus
                        className="flex-1 bg-[#1c1f2b] border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                      >
                        إنشاء
                      </button>
                    </form>
                  )}

                  {folders.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {folders.map(folder => (
                        <div
                          key={folder.id}
                          onClick={() => handleSelectFile(folder)}
                          className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-[#1c1f2b] hover:bg-[#252938] border border-zinc-800/90 text-right transition cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Folder size={16} className="text-amber-400 shrink-0 fill-amber-400/20" />
                            <span className="text-xs font-medium text-zinc-200 group-hover:text-white truncate">
                              {folder.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={e => handleDeleteItem(e, folder.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-500 hover:text-red-400 transition"
                            title="حذف المجلد"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Files Section (Grid or List view) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-400">
                    الملفات ({regularFiles.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setSortAsc(prev => !prev)}
                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition cursor-pointer"
                  >
                    <span>الاسم (Name)</span>
                    <ArrowUpDown size={12} />
                  </button>
                </div>

                {isLoading && regularFiles.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-2 text-zinc-400">
                    <RefreshCw size={22} className="animate-spin text-blue-400" />
                    <span className="text-xs">جاري التحميل...</span>
                  </div>
                ) : regularFiles.length === 0 ? (
                  <div className="py-12 px-4 rounded-2xl border border-zinc-800/80 bg-[#171922]/60 text-center space-y-3">
                    <p className="text-xs text-zinc-300 font-medium">
                      هذا المجلد فارغ حالياً. يمكنك رفع ملفات إليه أو لصق رابط بالأعلى.
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer"
                    >
                      رفع ملفات هنا
                    </button>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                    {regularFiles.map(file => {
                      const isAttaching = attachingFileId === file.id;
                      return (
                        <div
                          key={file.id}
                          onClick={() => handleSelectFile(file)}
                          className="group rounded-2xl bg-[#1b1e29] hover:bg-[#232736] border border-zinc-800/90 hover:border-blue-500/50 overflow-hidden flex flex-col cursor-pointer transition shadow-sm"
                        >
                          {/* Visual Thumbnail Box */}
                          <div className="h-28 bg-[#12141c] flex items-center justify-center relative overflow-hidden border-b border-zinc-800/60">
                            {file.thumbnailLink ? (
                              <img
                                src={file.thumbnailLink}
                                alt={file.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              renderFileCardIcon(file, true)
                            )}

                            {/* Delete button on top-left corner */}
                            <button
                              type="button"
                              onClick={e => handleDeleteItem(e, file.id)}
                              className="absolute top-2 left-2 z-10 p-1.5 rounded-full bg-black/60 text-zinc-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                              title="حذف الملف"
                            >
                              <Trash2 size={12} />
                            </button>

                            {/* Hover quick action overlay */}
                            <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1.5 p-2">
                              <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center gap-1 shadow">
                                {isAttaching ? (
                                  <RefreshCw size={11} className="animate-spin" />
                                ) : (
                                  <Check size={11} />
                                )}
                                <span>{isAttaching ? 'جاري الإرفاق...' : 'إرفاق وفهرسة RAG'}</span>
                              </span>
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleSelectFile(
                                    file,
                                    `لخّص وحلّل محتوى الملف "${file.name}" عبر محرك RAG المدمج واستخرج المحاور والبيانات الأساسية مع التوثيق بالمراجع.`
                                  );
                                }}
                                className="px-2.5 py-0.5 rounded-full bg-emerald-600/90 hover:bg-emerald-500 text-white text-[10px] font-bold shadow cursor-pointer"
                              >
                                تلخيص فوري عبر RAG
                              </button>
                            </div>
                          </div>

                          {/* Card Footer: Small icon + File Name */}
                          <div className="px-3 py-2.5 flex items-center gap-2 min-w-0">
                            {renderFileCardIcon(file, false)}
                            <span
                              className="text-xs font-medium text-zinc-200 group-hover:text-white truncate flex-1"
                              title={file.name}
                            >
                              {file.name}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800/70 rounded-2xl border border-zinc-800/80 bg-[#171922] overflow-hidden">
                    {regularFiles.map(file => {
                      const isAttaching = attachingFileId === file.id;
                      return (
                        <div
                          key={file.id}
                          onClick={() => handleSelectFile(file)}
                          className="px-4 py-3 hover:bg-[#202330] flex items-center justify-between gap-3 cursor-pointer transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {renderFileCardIcon(file, false)}
                            <span className="text-xs font-medium text-zinc-200 truncate">
                              {file.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                handleSelectFile(
                                  file,
                                  `لخّص وحلّل محتوى الملف "${file.name}" عبر محرك RAG المدمج واستخرج المحاور والبيانات الأساسية مع التوثيق بالمراجع.`
                                );
                              }}
                              className="px-2.5 py-1 rounded-full bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold cursor-pointer"
                            >
                              تلخيص RAG
                            </button>
                            <span className="px-2.5 py-1 rounded-full bg-blue-600/15 text-blue-300 text-[11px] font-bold">
                              {isAttaching ? 'جاري الإرفاق...' : 'إرفاق'}
                            </span>
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                                title="فتح في علامة تبويب جديدة"
                              >
                                <ExternalLink size={13} />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={e => handleDeleteItem(e, file.id)}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800"
                              title="حذف"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleServicesConnectModal;
