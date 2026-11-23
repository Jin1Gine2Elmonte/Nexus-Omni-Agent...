import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  FolderArchive,
  FileText,
  Trash2,
  Eye,
  Send,
  Database,
  PenTool,
  RefreshCw,
  CheckCircle2,
  FolderOpen,
  ClipboardPaste,
  ChevronDown,
  ChevronUp,
  Sparkles,
  HardDrive
} from 'lucide-react';

export interface ExtractedArchiveFileInfo {
  relPath: string;
  sizeBytes: number;
  ext: string;
  isTextReadable: boolean;
}

export interface ImportBoxItem {
  id: string;
  originalName: string;
  storedFileName: string;
  storedRelPath: string;
  mimeType: string;
  ext: string;
  sizeBytes: number;
  uploadedAt: number;
  isArchive: boolean;
  extractedDirRelPath?: string;
  extractedFiles: ExtractedArchiveFileInfo[];
  textPreview: string;
  note?: string;
}

interface AdminImportBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttachToChat: (payload: { name: string; content: string; sourceLabel: string }) => void;
  onOpenInCanvas: (title: string, content: string) => void;
  onIngestIntoMemoryMatrix: (folderName: string, files: Array<{ path: string; name: string; extension: string; size: number; content: string }>) => Promise<void>;
}

export const AdminImportBoxModal: React.FC<AdminImportBoxModalProps> = ({
  isOpen,
  onClose,
  onAttachToChat,
  onOpenInCanvas,
  onIngestIntoMemoryMatrix
}) => {
  const [items, setItems] = useState<ImportBoxItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isIngestingId, setIsIngestingId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [statusToast, setStatusToast] = useState<{ text: string; type: 'success' | 'warn' | 'info' } | null>(null);
  const [expandedArchiveIds, setExpandedArchiveIds] = useState<Record<string, boolean>>({});
  const [previewData, setPreviewData] = useState<{
    title: string;
    fileName: string;
    sizeBytes: number;
    content: string;
    truncated?: boolean;
  } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Direct paste creation mode
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [pasteFileName, setPasteFileName] = useState('nexus_imported_dialogue.md');
  const [pasteContent, setPasteContent] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const resp = await fetch('/api/import-box/list');
      const data = await resp.json();
      if (data.ok && Array.isArray(data.items)) {
        setItems(data.items);
      }
    } catch (err) {
      console.warn('Error fetching import box:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchItems();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const readBlobAsBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = String(reader.result || '');
        const b64 = res.includes(',') ? res.split(',')[1] : res;
        resolve(b64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const handleUploadFilesList = async (fileList: FileList | File[]) => {
    const arr = Array.from(fileList || []);
    if (arr.length === 0) return;

    setIsUploading(true);
    let totalAddedCount = 0;
    let totalArchiveCount = 0;
    let totalExtractedCount = 0;
    let failedCount = 0;
    const CHUNK_THRESHOLD_BYTES = 6 * 1024 * 1024; // 6 MB
    const CHUNK_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB per chunk

    try {
      for (let idx = 0; idx < arr.length; idx++) {
        const f = arr[idx];
        const relName = (f as any).webkitRelativePath || f.name;
        setStatusToast({
          text: `جاري رفع (${idx + 1}/${arr.length}): ${relName} (${formatSize(f.size)})...`,
          type: 'info'
        });

        try {
          if (f.size > CHUNK_THRESHOLD_BYTES) {
            const uploadId = `up_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
            const totalChunks = Math.ceil(f.size / CHUNK_SIZE_BYTES);
            for (let cIdx = 0; cIdx < totalChunks; cIdx++) {
              const start = cIdx * CHUNK_SIZE_BYTES;
              const end = Math.min(f.size, start + CHUNK_SIZE_BYTES);
              const sliceBlob = f.slice(start, end);
              const base64Chunk = await readBlobAsBase64(sliceBlob);
              setStatusToast({
                text: `جاري رفع (${idx + 1}/${arr.length}): ${relName} — الجزء ${cIdx + 1}/${totalChunks}...`,
                type: 'info'
              });
              const cResp = await fetch('/api/import-box/upload-chunk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uploadId, chunkIndex: cIdx, base64Chunk })
              });
              const cData = await cResp.json();
              if (!cData.ok) {
                throw new Error(cData.error || 'فشل رفع جزء من الملف الكبير.');
              }
            }
            const finResp = await fetch('/api/import-box/upload-finalize', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                uploadId,
                name: relName,
                mimeType: f.type || 'application/octet-stream'
              })
            });
            const finData = await finResp.json();
            if (finData.ok) {
              setItems(finData.items || []);
              totalAddedCount += finData.addedCount || 1;
              const added: ImportBoxItem[] = finData.addedItems || [];
              totalArchiveCount += added.filter((i) => i.isArchive).length;
              totalExtractedCount += added.reduce((acc, i) => acc + (i.extractedFiles?.length || 0), 0);
            } else {
              failedCount++;
            }
          } else {
            const base64Data = await readBlobAsBase64(f);
            const resp = await fetch('/api/import-box/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                files: [
                  {
                    name: relName,
                    mimeType: f.type || 'application/octet-stream',
                    base64Data
                  }
                ]
              })
            });
            const data = await resp.json();
            if (data.ok) {
              setItems(data.items || []);
              totalAddedCount += data.addedCount || 1;
              const added: ImportBoxItem[] = data.addedItems || [];
              totalArchiveCount += added.filter((i) => i.isArchive).length;
              totalExtractedCount += added.reduce((acc, i) => acc + (i.extractedFiles?.length || 0), 0);
            } else {
              failedCount++;
            }
          }
        } catch (fileErr) {
          console.warn(`Failed uploading ${relName}:`, fileErr);
          failedCount++;
        }
      }

      if (totalAddedCount > 0) {
        setStatusToast({
          text:
            totalArchiveCount > 0
              ? `تم استيراد ${totalAddedCount} عنصر وفك ضغط ${totalExtractedCount} ملف داخلي بنجاح في /data/admin_import_box!${failedCount > 0 ? ` (تعذر ${failedCount})` : ''}`
              : `تم إيداع ${totalAddedCount} ملف في صندوق الاستيراد بنجاح!${failedCount > 0 ? ` (تعذر ${failedCount})` : ''}`,
          type: 'success'
        });
      } else {
        setStatusToast({ text: 'تعذر رفع الملفات المختارة.', type: 'warn' });
      }
    } catch (err: any) {
      setStatusToast({ text: err?.message || 'حدث خطأ أثناء رفع الملفات.', type: 'warn' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (folderInputRef.current) folderInputRef.current.value = '';
    }
  };

  const handleSavePastedText = async () => {
    if (!pasteContent.trim()) return;
    setIsUploading(true);
    try {
      const cleanName = pasteFileName.trim() || `pasted_note_${Date.now()}.md`;
      const resp = await fetch('/api/import-box/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: [
            {
              name: cleanName.includes('.') ? cleanName : `${cleanName}.md`,
              mimeType: 'text/markdown',
              rawText: pasteContent
            }
          ]
        })
      });
      const data = await resp.json();
      if (data.ok) {
        setItems(data.items || []);
        setPasteContent('');
        setShowPasteBox(false);
        setStatusToast({ text: `تم حفظ "${cleanName}" في صندوق الاستيراد بنجاح!`, type: 'success' });
      }
    } catch (err: any) {
      setStatusToast({ text: err?.message || 'تعذر حفظ النص.', type: 'warn' });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePreviewFile = async (itemId: string, innerPath?: string) => {
    setIsLoadingPreview(true);
    try {
      const qs = new URLSearchParams({ id: itemId, maxChars: '120000' });
      if (innerPath) qs.set('innerPath', innerPath);
      const resp = await fetch(`/api/import-box/read?${qs.toString()}`);
      const data = await resp.json();
      if (data.ok) {
        setPreviewData({
          title: data.title,
          fileName: data.fileName,
          sizeBytes: data.sizeBytes,
          content: data.content,
          truncated: data.truncated
        });
      }
    } catch {
      setStatusToast({ text: 'تعذر قراءة محتوى الملف.', type: 'warn' });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleActionWithItem = async (
    item: ImportBoxItem,
    mode: 'chat' | 'canvas' | 'memory',
    innerPath?: string
  ) => {
    if (mode === 'memory') {
      setIsIngestingId(item.id);
    }
    try {
      const qs = new URLSearchParams({ id: item.id, maxChars: '200000' });
      if (innerPath) qs.set('innerPath', innerPath);
      const resp = await fetch(`/api/import-box/read?${qs.toString()}`);
      const data = await resp.json();
      if (!data.ok) {
        setStatusToast({ text: data.error || 'تعذر قراءة الملف.', type: 'warn' });
        return;
      }

      if (mode === 'chat') {
        onAttachToChat({
          name: data.fileName || item.originalName,
          content: data.content,
          sourceLabel: 'صندوق الاستيراد السيادي'
        });
        setStatusToast({ text: `تم إرفاق "${data.title}" بالمحادثة الحالية!`, type: 'success' });
        onClose();
      } else if (mode === 'canvas') {
        onOpenInCanvas(data.title, data.content);
        onClose();
      } else if (mode === 'memory') {
        await onIngestIntoMemoryMatrix(item.originalName, [
          {
            path: innerPath || item.originalName,
            name: data.fileName || item.originalName,
            extension: item.ext || 'md',
            size: data.sizeBytes || item.sizeBytes,
            content: data.content
          }
        ]);
        setStatusToast({ text: `تم هضم ودمج "${data.title}" في مصفوفة ذاكرة نيكسوس!`, type: 'success' });
      }
    } catch (err: any) {
      setStatusToast({ text: err?.message || 'حدث خطأ أثناء تنفيذ العملية.', type: 'warn' });
    } finally {
      setIsIngestingId(null);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const resp = await fetch(`/api/import-box/item/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      const data = await resp.json();
      if (data.ok) {
        setItems(data.items || []);
        if (previewData) setPreviewData(null);
        setStatusToast({ text: 'تم حذف العنصر من صندوق الاستيراد.', type: 'info' });
      }
    } catch {
      setStatusToast({ text: 'فشل حذف العنصر.', type: 'warn' });
    }
  };

  const totalBytes = items.reduce((acc, i) => acc + (i.sizeBytes || 0), 0);
  const totalExtractedCount = items.reduce((acc, i) => acc + (i.extractedFiles?.length || 0), 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6"
      dir="rtl"
    >
      <div className="w-full max-w-5xl max-h-[90vh] bg-[#080a0f] border border-zinc-800 rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-zinc-800/80 bg-[#0b0e16] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <FolderArchive size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white">
                  صندوق الاستيراد السيادي (مساحة الفراغ الخاصة بالمشرف)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono">
                  /data/admin_import_box
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                ارمِ هنا أي ملفات مضغوطة (.ZIP / .TAR.GZ) أو ملفات نصية وبرمجية أو محادثات بأي حجم — يتم فك ضغطها وحفظها مباشرة لنصل إليها معاً فوراً دون قيود المرفقات.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/api/import-box/export-clean-project"
              download="Nexus_3.1_Clean_Shareable.zip"
              className="px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="تحميل كود المشروع بالكامل كملف .ZIP نظيف للمشاركة (خالي تماماً من محادثاتك الخاصة وذاكرتك وملفات صندوق الاستيراد)"
            >
              <FolderArchive size={14} className="text-emerald-400" />
              <span>تحميل نسخة نظيفة للمشاركة (.ZIP)</span>
            </a>
            <button
              type="button"
              onClick={fetchItems}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition cursor-pointer"
              title="تحديث محتويات الصندوق"
            >
              <RefreshCw size={15} className={isLoading ? 'animate-spin text-emerald-400' : ''} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-red-950/50 border border-zinc-800 text-zinc-400 hover:text-red-300 transition cursor-pointer"
              title="إغلاق"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusToast && (
          <div
            className={`mx-5 mt-3 px-4 py-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
              statusToast.type === 'success'
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                : statusToast.type === 'warn'
                ? 'bg-amber-950/50 border-amber-500/40 text-amber-200'
                : 'bg-sky-950/50 border-sky-500/40 text-sky-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 size={14} className="shrink-0" />
              <span>{statusToast.text}</span>
            </span>
            <button onClick={() => setStatusToast(null)} className="text-zinc-400 hover:text-white">
              <X size={13} />
            </button>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Drag & Drop Void Zone + Action Buttons */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleUploadFilesList(e.dataTransfer.files);
              }
            }}
            className={`rounded-2xl border-2 border-dashed p-5 transition-all text-center ${
              isDragging
                ? 'border-emerald-400 bg-emerald-950/25 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
                : 'border-zinc-800 hover:border-emerald-500/40 bg-zinc-950/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleUploadFilesList(e.target.files)}
            />
            <input
              ref={folderInputRef}
              type="file"
              multiple
              {...({ webkitdirectory: '', directory: '' } as any)}
              className="hidden"
              onChange={(e) => e.target.files && handleUploadFilesList(e.target.files)}
            />

            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                {isUploading ? <RefreshCw size={22} className="animate-spin" /> : <Upload size={22} />}
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  اسحب وارمِ أي ملفات أو أرشيفات مضغوطة (.ZIP / .TAR.GZ) هنا مباشرة
                </div>
                <div className="text-xs text-zinc-400 mt-1">
                  يدعم جميع الصيغ (ZIP, MD, TXT, JSON, PY, TS, HTML, PDF, DOCX) مع فك ضغط تلقائي للأرشيفات وحفظ فوري في مساحة المشرف.
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5 mt-1">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm"
                >
                  <Upload size={14} />
                  <span>اختيار ملفات أو أرشيف (.ZIP)</span>
                </button>

                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => folderInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                >
                  <FolderOpen size={14} className="text-amber-400" />
                  <span>رفع مجلد كامل</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPasteBox((prev) => !prev)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                >
                  <ClipboardPaste size={14} className="text-sky-400" />
                  <span>لصق محادثة أو نص ضخم كملف</span>
                </button>
              </div>
            </div>
          </div>

          {/* Direct Paste Box */}
          {showPasteBox && (
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                  <ClipboardPaste size={14} />
                  <span>إيداع نص أو محادثة ضخمة مباشرة في صندوق الاستيراد</span>
                </span>
                <input
                  type="text"
                  value={pasteFileName}
                  onChange={(e) => setPasteFileName(e.target.value)}
                  placeholder="اسم الملف (مثال: claude_dialogue.md)"
                  className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1 text-xs text-white font-mono w-64 outline-none focus:border-sky-500"
                />
              </div>
              <textarea
                rows={5}
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder="الصق هنا أي محادثة طويلة أو شيفرة أو وثيقة ليتم حفظها كملف دائم في صندوق الاستيراد..."
                className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 outline-none focus:border-sky-500/50 resize-y"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasteBox(false)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 text-zinc-400 text-xs hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSavePastedText}
                  disabled={!pasteContent.trim() || isUploading}
                  className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer"
                >
                  حفظ في صندوق الاستيراد
                </button>
              </div>
            </div>
          )}

          {/* Summary Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-zinc-900/50 border border-zinc-800/80 text-xs text-zinc-300">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <HardDrive size={13} className="text-emerald-400" />
                <span>العناصر المودعة: <strong className="text-white">{items.length}</strong></span>
              </span>
              {totalExtractedCount > 0 && (
                <span>
                  ملفات مفكوكة من الأرشيفات: <strong className="text-amber-300">{totalExtractedCount}</strong>
                </span>
              )}
              <span>
                الحجم الإجمالي: <strong className="text-sky-300 font-mono">{formatSize(totalBytes)}</strong>
              </span>
            </div>
            <span className="text-[11px] text-zinc-400">
              💡 بمجرد رمي أي ملف هنا، يمكنك إخباري في المحادثة: «تفقد صندوق الاستيراد» وسأقرأه مباشرة من القرص.
            </span>
          </div>

          {/* Preview Drawer if open */}
          {previewData && (
            <div className="p-4 rounded-2xl bg-[#05070b] border border-emerald-500/40 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Eye size={14} className="text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-white truncate">{previewData.title}</span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    ({formatSize(previewData.sizeBytes)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewData(null)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs"
                >
                  إغلاق المعاينة
                </button>
              </div>
              <pre className="max-h-64 overflow-y-auto p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-200 font-mono whitespace-pre-wrap leading-relaxed">
                {previewData.content}
              </pre>
            </div>
          )}

          {/* Items List */}
          {items.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              صندوق الاستيراد فارغ حالياً. اسحب أي ملف عادي أو مضغوط (.ZIP) وأفلته في المساحة أعلاه.
            </div>
          ) : (
            <div className="space-y-2.5">
              {items.map((item) => {
                const isExpanded = Boolean(expandedArchiveIds[item.id]);
                const isIngestingThis = isIngestingId === item.id;

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-zinc-950/90 border border-zinc-800/90 hover:border-zinc-700 transition overflow-hidden"
                  >
                    <div className="p-3.5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            item.isArchive
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                              : 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                          }`}
                        >
                          {item.isArchive ? <FolderArchive size={17} /> : <FileText size={17} />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white truncate">
                              {item.originalName}
                            </span>
                            {item.isArchive && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-950/70 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                                أرشيف مفكوك ({item.extractedFiles?.length || 0} ملف)
                              </span>
                            )}
                            <span className="text-[10px] font-mono text-zinc-400">
                              {formatSize(item.sizeBytes)}
                            </span>
                          </div>
                          {item.textPreview && (
                            <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                              {item.textPreview.slice(0, 140)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Item Actions */}
                      <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                        {item.isArchive && item.extractedFiles?.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedArchiveIds((prev) => ({
                                ...prev,
                                [item.id]: !prev[item.id]
                              }))
                            }
                            className="px-2.5 py-1.5 rounded-xl bg-amber-950/40 hover:bg-amber-950/70 border border-amber-500/40 text-amber-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span>تصفح الملفات ({item.extractedFiles.length})</span>
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handlePreviewFile(item.id)}
                          disabled={isLoadingPreview}
                          className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-[11px] flex items-center gap-1 cursor-pointer"
                          title="معاينة المحتوى الكامل"
                        >
                          <Eye size={12} className="text-sky-400" />
                          <span>معاينة</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleActionWithItem(item, 'chat')}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          title="إرفاق محتوى الملف أو الأرشيف بالمحادثة الحالية"
                        >
                          <Send size={12} className="text-emerald-400" />
                          <span>إرفاق بالمحادثة</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleActionWithItem(item, 'canvas')}
                          className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-[11px] flex items-center gap-1 cursor-pointer"
                          title="فتح في استوديو الكانفاس"
                        >
                          <PenTool size={12} className="text-indigo-400" />
                          <span>الكانفاس</span>
                        </button>

                        <button
                          type="button"
                          disabled={isIngestingThis}
                          onClick={() => handleActionWithItem(item, 'memory')}
                          className="px-2.5 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-950/70 border border-purple-500/40 text-purple-200 text-[11px] flex items-center gap-1 cursor-pointer"
                          title="هضم ودمج في مصفوفة ذاكرة نيكسوس الدائمة"
                        >
                          {isIngestingThis ? (
                            <RefreshCw size={12} className="animate-spin text-purple-300" />
                          ) : (
                            <Database size={12} className="text-purple-400" />
                          )}
                          <span>دمج بالذاكرة</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 rounded-xl bg-zinc-900 hover:bg-red-950/50 border border-zinc-800 text-zinc-400 hover:text-red-300 transition cursor-pointer"
                          title="حذف من الصندوق"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Archive Inner Files Tree */}
                    {item.isArchive && isExpanded && item.extractedFiles?.length > 0 && (
                      <div className="border-t border-zinc-800/80 bg-[#05060a] px-4 py-3 space-y-1.5 max-h-60 overflow-y-auto">
                        <div className="text-[11px] font-bold text-amber-300 mb-2 flex items-center gap-1.5">
                          <Sparkles size={12} />
                          <span>الملفات المستخرجة تلقائياً من الأرشيف ({item.extractedFiles.length}):</span>
                        </div>
                        {item.extractedFiles.map((ef, idx) => (
                          <div
                            key={`${item.id}-ef-${idx}`}
                            className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/60 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText size={12} className="text-zinc-400 shrink-0" />
                              <span className="font-mono text-[11px] text-zinc-200 truncate" dir="ltr">
                                {ef.relPath}
                              </span>
                              <span className="text-[10px] font-mono text-zinc-500">
                                ({formatSize(ef.sizeBytes)})
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handlePreviewFile(item.id, ef.relPath)}
                                className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[10px] text-sky-300 cursor-pointer"
                              >
                                قراءة
                              </button>
                              <button
                                type="button"
                                onClick={() => handleActionWithItem(item, 'chat', ef.relPath)}
                                className="px-2 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/30 text-[10px] text-emerald-300 cursor-pointer"
                              >
                                إرفاق بالمحادثة
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
