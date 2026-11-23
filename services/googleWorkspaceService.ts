import {
  ensureGoogleWorkspaceAccessToken,
  getGoogleWorkspaceAccessToken,
  GCLOUD_DIRECT_VAULT_TOKEN
} from './firebaseClient.ts';

export interface GoogleWorkspaceFileResult {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  documentUrl?: string;
  spreadsheetUrl?: string;
  presentationUrl?: string;
  thumbnailLink?: string;
  iconLink?: string;
  isFolder?: boolean;
  parentId?: string;
  service: 'docs' | 'sheets' | 'slides' | 'drive';
  createdAt: number;
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  bodyText: string;
}

export interface GoogleCalendarEventItem {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  htmlLink?: string;
  location?: string;
}

export interface SmartExportProfile {
  hasTable: boolean;
  hasCodeOrFiles: boolean;
  hasTextDocument: boolean;
  primaryCategory: 'table' | 'code' | 'document';
}

/**
 * Detects whether a given Markdown/text content genuinely contains a table or structured CSV data.
 * Only when this returns true should Google Sheets / CSV export options be offered for the message/session.
 */
export function hasMarkdownOrCsvTable(rawText: string): boolean {
  if (!rawText || !rawText.trim()) return false;
  const lines = rawText
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  // 1. Check for Markdown table (pipes + separator row like |---|---| or 3+ pipe rows)
  const pipeLines = lines.filter(l => l.includes('|') && l.split('|').filter(Boolean).length >= 2);
  const hasSeparatorRow = pipeLines.some(l => /^\|?[\s\-:|]+\|?$/.test(l) && l.includes('-'));
  if (pipeLines.length >= 2 && (hasSeparatorRow || pipeLines.length >= 3)) {
    return true;
  }

  // 2. Check for fenced CSV/TSV block
  if (/```(?:csv|tsv)\b/i.test(rawText)) {
    return true;
  }

  return false;
}

/**
 * Detects whether content contains code blocks or software project files.
 */
export function hasCodeBlocksOrProjectFiles(rawText: string): boolean {
  if (!rawText || !rawText.trim()) return false;
  if (/```[a-zA-Z0-9_-]*\n[\s\S]*?```/.test(rawText)) {
    // Exclude pure markdown/txt blocks if no programming code
    const matches = rawText.match(/```([a-zA-Z0-9_-]*)\n/g) || [];
    const nonTextBlock = matches.some(m => {
      const lang = m.replace(/```|\n/g, '').trim().toLowerCase();
      return lang !== 'markdown' && lang !== 'md' && lang !== 'txt' && lang !== 'text';
    });
    if (nonTextBlock || matches.length > 0) return true;
  }
  return false;
}

/**
 * Smartly classifies content so UI menus show the right export targets:
 * - Tables & Charts -> Google Sheets (.csv)
 * - Messages & Text Documents -> Google Docs (.pdf, .doc, .txt, .md)
 * - Code & Project Files -> Google Drive (as files)
 */
export function detectSmartExportProfile(rawText: string): SmartExportProfile {
  const hasTable = hasMarkdownOrCsvTable(rawText);
  const hasCodeOrFiles = hasCodeBlocksOrProjectFiles(rawText);
  const strippedCode = (rawText || '').replace(/```[\s\S]*?```/g, '').trim();
  const hasTextDocument = strippedCode.length > 0 || (!hasTable && !hasCodeOrFiles);

  let primaryCategory: 'table' | 'code' | 'document' = 'document';
  if (hasTable && !hasCodeOrFiles && strippedCode.length < 300) {
    primaryCategory = 'table';
  } else if (hasCodeOrFiles && strippedCode.length < 250) {
    primaryCategory = 'code';
  }

  return {
    hasTable,
    hasCodeOrFiles,
    hasTextDocument,
    primaryCategory
  };
}

const LOCAL_CLOUD_DRIVE_KEY = 'nexus_firebase_cloud_drive_files';

function saveToLocalFirebaseVaultCache(fileObj: GoogleWorkspaceFileResult, content: string) {
  try {
    const raw = localStorage.getItem(LOCAL_CLOUD_DRIVE_KEY);
    const list: (GoogleWorkspaceFileResult & { content?: string })[] = raw ? JSON.parse(raw) : [];
    const next = [{ ...fileObj, content }, ...list.filter(f => f.id !== fileObj.id)].slice(0, 40);
    localStorage.setItem(LOCAL_CLOUD_DRIVE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage quota errors
  }
}

export async function saveToGoogleCloudDirectVault(
  name: string,
  content: string,
  service: 'docs' | 'sheets' | 'slides' | 'drive',
  mimeType?: string,
  extra?: {
    thumbnailLink?: string;
    isFolder?: boolean;
    parentId?: string;
  }
): Promise<GoogleWorkspaceFileResult> {
  try {
    const res = await fetch('/api/agent-os/cloud-drive/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        content,
        service,
        mimeType,
        thumbnailLink: extra?.thumbnailLink,
        isFolder: extra?.isFolder,
        parentId: extra?.parentId
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.file) {
        const enriched: GoogleWorkspaceFileResult = {
          ...data.file,
          documentUrl: data.file.webViewLink,
          spreadsheetUrl: data.file.webViewLink
        };
        saveToLocalFirebaseVaultCache(enriched, content);
        return enriched;
      }
    }
  } catch {
    // Running on static Firebase Hosting — use local Firebase Vault cache
  }
  const fallbackId = `gcloud-${extra?.isFolder ? 'folder' : service}-${Date.now()}`;
  const resolvedMime =
    mimeType ||
    (extra?.isFolder
      ? 'application/vnd.google-apps.folder'
      : service === 'docs'
      ? 'application/vnd.google-apps.document'
      : service === 'sheets'
      ? 'application/vnd.google-apps.spreadsheet'
      : 'text/plain;charset=utf-8');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const blobUrl = typeof URL !== 'undefined' ? URL.createObjectURL(blob) : `/api/agent-os/cloud-drive/view/${fallbackId}`;
  const fallbackResult: GoogleWorkspaceFileResult = {
    id: fallbackId,
    name,
    mimeType: resolvedMime,
    webViewLink: blobUrl,
    documentUrl: blobUrl,
    spreadsheetUrl: blobUrl,
    thumbnailLink: extra?.thumbnailLink,
    isFolder: extra?.isFolder,
    parentId: extra?.parentId,
    service,
    createdAt: Date.now()
  };
  saveToLocalFirebaseVaultCache(fallbackResult, content);
  return fallbackResult;
}

export async function createGoogleDriveFolder(
  folderName: string,
  parentId?: string
): Promise<GoogleWorkspaceFileResult> {
  const cleanName = (folderName || 'مجلد جديد').trim();
  return saveToGoogleCloudDirectVault(
    cleanName,
    '',
    'drive',
    'application/vnd.google-apps.folder',
    { isFolder: true, parentId }
  );
}

export async function deleteGoogleDriveVaultItem(fileId: string): Promise<void> {
  try {
    const raw = localStorage.getItem(LOCAL_CLOUD_DRIVE_KEY);
    if (raw) {
      const list: GoogleWorkspaceFileResult[] = JSON.parse(raw);
      const filtered = list.filter(f => f.id !== fileId && f.parentId !== fileId);
      localStorage.setItem(LOCAL_CLOUD_DRIVE_KEY, JSON.stringify(filtered));
    }
  } catch {
    // ignore
  }
  try {
    await fetch(`/api/agent-os/cloud-drive/file/${encodeURIComponent(fileId)}`, {
      method: 'DELETE'
    });
  } catch {
    // ignore
  }
}

export interface UniversalRagExtractionResult {
  ok: boolean;
  fileName: string;
  detectedFormat: string;
  mimeType: string;
  extractedText: string;
  wordCount: number;
  pageOrSectionCount: number;
  chunksCount: number;
  summaryPreview: string;
}

/**
 * Helper to read a Blob/File slice as Base64 string without loading the entire multi-megabyte file at once.
 */
function readBlobSliceAsBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = String(reader.result || '');
      resolve(res.includes(',') ? res.split(',')[1] : res);
    };
    reader.onerror = () => reject(new Error('Failed to read file chunk'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Extracts structured text, tables, and metadata from PDF and all other file formats
 * (.pdf, .docx, .xlsx, .pptx, .csv, .tsv, .zip, .ipynb, .json, .sql, code, images, audio)
 * via the server-side Universal Google Workspace RAG Engine.
 * Supports both direct base64 (for files <= 4MB) and chunked uploadId (for large 26MB-250MB files).
 */
export async function extractFileViaWorkspaceRagEngine(
  fileName: string,
  mimeType: string,
  base64DataOrDataUrl: string,
  uploadId?: string
): Promise<UniversalRagExtractionResult> {
  const cleanBase64 = base64DataOrDataUrl.includes(',')
    ? base64DataOrDataUrl.split(',')[1]
    : base64DataOrDataUrl;

  try {
    const res = await fetch('/api/agent-os/extract-universal-file-rag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        uploadId
          ? { fileName, mimeType, uploadId }
          : { fileName, mimeType, base64Data: cleanBase64 }
      )
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.ok && data?.extractedText) {
        return data as UniversalRagExtractionResult;
      }
    }
  } catch {
    // Fallback below
  }

  // Client-side UTF-8 fallback if server is unreachable
  let fallbackText = `[ملف Google Workspace: ${fileName}]`;
  if (cleanBase64 && cleanBase64.length < 15 * 1024 * 1024) {
    try {
      const bin = atob(cleanBase64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) {
        bytes[i] = bin.charCodeAt(i);
      }
      const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      if (decoded && !decoded.slice(0, 200).includes('\u0000')) {
        fallbackText = decoded.slice(0, 150000);
      }
    } catch {
      // ignore
    }
  }

  const words = fallbackText.split(/\s+/).filter(Boolean).length;
  return {
    ok: true,
    fileName,
    detectedFormat: fileName.split('.').pop()?.toUpperCase() || 'FILE',
    mimeType: mimeType || 'application/octet-stream',
    extractedText: fallbackText,
    wordCount: words,
    pageOrSectionCount: 1,
    chunksCount: Math.max(1, Math.ceil(words / 310)),
    summaryPreview: fallbackText.slice(0, 350)
  };
}

export async function uploadBrowserFileToGoogleDrive(
  file: File,
  parentId?: string,
  onProgress?: (percent: number) => void
): Promise<{
  record: GoogleWorkspaceFileResult;
  rawContentOrDataUrl: string;
  ragExtraction?: UniversalRagExtractionResult;
}> {
  const CHUNK_THRESHOLD = 4 * 1024 * 1024; // 4MB per chunk to stay well below Cloud Run 32MB limit
  const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg|bmp)$/i.test(file.name);

  let dataUrl = '';
  let uploadId: string | undefined;

  if (file.size > CHUNK_THRESHOLD) {
    uploadId = `up_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const totalChunks = Math.ceil(file.size / CHUNK_THRESHOLD);

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_THRESHOLD;
      const end = Math.min(file.size, start + CHUNK_THRESHOLD);
      const slice = file.slice(start, end);
      const chunkBase64 = await readBlobSliceAsBase64(slice);

      const chunkRes = await fetch('/api/agent-os/upload-file-chunk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId,
          fileName: file.name,
          chunkIndex,
          totalChunks,
          chunkBase64
        })
      });

      if (!chunkRes.ok) {
        throw new Error(`فشل رفع الجزء ${chunkIndex + 1}/${totalChunks} من الملف.`);
      }

      if (onProgress) {
        const pct = Math.min(82, Math.max(15, Math.round(((chunkIndex + 1) / totalChunks) * 80)));
        onProgress(pct);
      }
    }
  } else {
    dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onprogress = (ev) => {
        if (onProgress && ev.lengthComputable && ev.total > 0) {
          onProgress(Math.min(75, Math.max(15, Math.round((ev.loaded / ev.total) * 75))));
        }
      };
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsDataURL(file);
    });
  }

  if (isImage && dataUrl) {
    const ragExtraction = await extractFileViaWorkspaceRagEngine(
      file.name,
      file.type || 'image/png',
      dataUrl
    );
    if (onProgress) onProgress(95);
    const saved = await saveToGoogleCloudDirectVault(
      file.name,
      ragExtraction.extractedText || dataUrl,
      'drive',
      file.type || 'image/png',
      {
        thumbnailLink: dataUrl,
        parentId
      }
    );
    return { record: saved, rawContentOrDataUrl: dataUrl, ragExtraction };
  }

  // Extract full text from PDF, DOCX, XLSX, PPTX, 26MB+ ZIP, CSV, Code, Audio, or any other format
  const ragExtraction = await extractFileViaWorkspaceRagEngine(
    file.name,
    file.type || 'application/octet-stream',
    dataUrl,
    uploadId
  );
  if (onProgress) onProgress(95);

  const textContent = ragExtraction.extractedText || `[ملف: ${file.name}]`;
  const lower = file.name.toLowerCase();
  const service: 'docs' | 'sheets' | 'slides' | 'drive' =
    lower.endsWith('.csv') || lower.endsWith('.tsv') || lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.ods')
      ? 'sheets'
      : lower.endsWith('.pptx') || lower.endsWith('.ppt') || lower.endsWith('.odp')
      ? 'slides'
      : lower.endsWith('.pdf') || lower.endsWith('.md') || lower.endsWith('.txt') || lower.endsWith('.doc') || lower.endsWith('.docx') || lower.endsWith('.rtf') || lower.endsWith('.odt')
      ? 'docs'
      : 'drive';

  const saved = await saveToGoogleCloudDirectVault(
    file.name,
    textContent,
    service,
    file.type || (lower.endsWith('.pdf') ? 'application/pdf' : 'text/plain;charset=utf-8'),
    { parentId }
  );
  return { record: saved, rawContentOrDataUrl: textContent, ragExtraction };
}

export const GOOGLE_BRIDGE_URL_STORAGE_KEY = 'nexus_personal_google_bridge_url_v1';
export const GOOGLE_CALENDAR_ICAL_STORAGE_KEY = 'nexus_personal_google_ical_url_v1';

export function getPersonalGoogleBridgeUrl(): string {
  try {
    return (localStorage.getItem(GOOGLE_BRIDGE_URL_STORAGE_KEY) || '').trim();
  } catch {
    return '';
  }
}

export function setPersonalGoogleBridgeUrl(url: string): void {
  try {
    const clean = (url || '').trim();
    if (clean) {
      localStorage.setItem(GOOGLE_BRIDGE_URL_STORAGE_KEY, clean);
    } else {
      localStorage.removeItem(GOOGLE_BRIDGE_URL_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export function getPersonalGoogleCalendarIcalUrl(): string {
  try {
    return (localStorage.getItem(GOOGLE_CALENDAR_ICAL_STORAGE_KEY) || '').trim();
  } catch {
    return '';
  }
}

export function setPersonalGoogleCalendarIcalUrl(url: string): void {
  try {
    const clean = (url || '').trim();
    if (clean) {
      localStorage.setItem(GOOGLE_CALENDAR_ICAL_STORAGE_KEY, clean);
    } else {
      localStorage.removeItem(GOOGLE_CALENDAR_ICAL_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export async function callPersonalGoogleBridge(
  action: string,
  payload: Record<string, any> = {}
): Promise<any | null> {
  const bridgeUrl = getPersonalGoogleBridgeUrl();
  if (!bridgeUrl) return null;
  try {
    const res = await fetch('/api/google-bridge/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bridgeUrl, action, payload })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.ok ? data : null;
  } catch {
    return null;
  }
}

/**
 * Ready-to-copy Google Apps Script code (`script.google.com`) that runs 100% free inside the user's
 * personal Google Account without requiring Google Cloud Platform Billing or OAuth app verification.
 */
export const NEXUS_PERSONAL_GOOGLE_APPS_SCRIPT = `// جسر نيكسوس الشخصي المجاني لخدمات Google (Gmail + Drive + Docs + Sheets + Slides + Calendar)
// يعمل داخل حساب جوجل العادي مجاناً 100% بدون Google Cloud Billing:
// 1. افتح https://script.google.com/home/start واضغط مشروع جديد (New Project)
// 2. الصق هذا الكود ثم اضغط Deploy -> New deployment -> Web app
// 3. اجعل Execute as: Me واجعل Who has access: Anyone ثم انسخ رابط Web App والصقه في نيكسوس

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents || "{}");
    var action = body.action;
    var out = { ok: true };

    if (action === "ping") {
      out.email = Session.getActiveUser().getEmail();
      out.status = "connected";
    } else if (action === "list_drive") {
      var files = DriveApp.getFiles();
      var list = [];
      var count = 0;
      while (files.hasNext() && count < (body.maxResults || 25)) {
        var f = files.next();
        list.push({
          id: f.getId(),
          name: f.getName(),
          mimeType: f.getMimeType(),
          webViewLink: f.getUrl(),
          createdAt: f.getLastUpdated().getTime()
        });
        count++;
      }
      out.files = list;
    } else if (action === "read_drive_file") {
      var fileId = body.fileId;
      var mime = body.mimeType || "";
      if (mime.indexOf("document") !== -1) {
        out.content = DocumentApp.openById(fileId).getBody().getText();
      } else if (mime.indexOf("spreadsheet") !== -1) {
        var sheet = SpreadsheetApp.openById(fileId).getActiveSheet();
        var data = sheet.getDataRange().getValues();
        out.content = data.map(function(r) { return r.join(" | "); }).join("\\n");
      } else {
        out.content = DriveApp.getFileById(fileId).getBlob().getDataAsString();
      }
    } else if (action === "create_doc") {
      var doc = DocumentApp.create(body.title || "مستند نيكسوس");
      doc.getBody().setText(body.content || "");
      doc.saveAndClose();
      out.file = { id: doc.getId(), name: doc.getName(), webViewLink: doc.getUrl(), service: "docs" };
    } else if (action === "create_sheet") {
      var ss = SpreadsheetApp.create(body.title || "جدول نيكسوس");
      var sh = ss.getActiveSheet();
      var rows = body.rows || [];
      for (var i = 0; i < rows.length; i++) {
        sh.appendRow(rows[i]);
      }
      out.file = { id: ss.getId(), name: ss.getName(), webViewLink: ss.getUrl(), service: "sheets" };
    } else if (action === "create_slides") {
      var pres = SlidesApp.create(body.title || "عرض نيكسوس");
      var lines = String(body.content || "").split(/\\n+/).filter(Boolean);
      for (var j = 0; j < Math.min(lines.length, 10); j++) {
        var slide = pres.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);
        var shapes = slide.getPlaceholders();
        if (shapes.length > 0) shapes[0].asShape().getText().setText("شريحة " + (j + 1));
        if (shapes.length > 1) shapes[1].asShape().getText().setText(lines[j]);
      }
      out.file = { id: pres.getId(), name: pres.getName(), webViewLink: pres.getUrl(), service: "slides" };
    } else if (action === "list_gmail") {
      var threads = GmailApp.search(body.query || "label:inbox", 0, body.maxResults || 12);
      var msgs = [];
      for (var t = 0; t < threads.length; t++) {
        var m = threads[t].getMessages()[threads[t].getMessageCount() - 1];
        var plain = m.getPlainBody() || "";
        msgs.push({
          id: m.getId(),
          threadId: threads[t].getId(),
          subject: m.getSubject() || "(بدون موضوع)",
          from: m.getFrom(),
          date: m.getDate().toISOString(),
          snippet: plain.slice(0, 180),
          bodyText: plain.slice(0, 8000)
        });
      }
      out.messages = msgs;
    } else if (action === "send_gmail") {
      if (body.draftOnly) {
        var draft = GmailApp.createDraft(body.to, body.subject, body.body);
        out.id = draft.getId();
      } else {
        GmailApp.sendEmail(body.to, body.subject, body.body);
        out.id = "sent-" + new Date().getTime();
      }
    } else if (action === "list_calendar") {
      var cal = CalendarApp.getDefaultCalendar();
      var now = new Date();
      var future = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      var evs = cal.getEvents(now, future);
      out.events = evs.slice(0, 15).map(function(ev) {
        return {
          id: ev.getId(),
          summary: ev.getTitle(),
          description: ev.getDescription() || "",
          start: ev.getStartTime().toISOString(),
          end: ev.getEndTime().toISOString(),
          location: ev.getLocation() || "",
          htmlLink: "https://calendar.google.com"
        };
      });
    } else if (action === "create_calendar") {
      var cal2 = CalendarApp.getDefaultCalendar();
      var ev2 = cal2.createEvent(
        body.summary || "موعد نيكسوس",
        new Date(body.startIso),
        new Date(body.endIso),
        { description: body.description || "", location: body.location || "" }
      );
      out.event = { id: ev2.getId(), summary: ev2.getTitle(), htmlLink: "https://calendar.google.com" };
    }

    return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

/**
 * Creates a new Google Docs document in the user's Google Drive via Personal Google Bridge (if connected)
 * or mirrors to the Workspace Cloud Vault.
 */
export async function createGoogleDocInWorkspace(
  title: string,
  content: string,
  providedToken?: string | null
): Promise<GoogleWorkspaceFileResult> {
  const cleanTitle = (title || 'مستند نيكسوس').trim().slice(0, 120);
  const cleanBodyText = (content || '').replace(/\r\n/g, '\n').trim();

  // Always mirror to Firebase Cloud Vault for guaranteed availability
  const vaultCopy = await saveToGoogleCloudDirectVault(
    cleanTitle,
    cleanBodyText,
    'docs',
    'application/vnd.google-apps.document'
  );

  // 1. Try Personal Google Apps Script Bridge (100% Free Real Google Account Docs Creation!)
  const bridgeRes = await callPersonalGoogleBridge('create_doc', {
    title: cleanTitle,
    content: cleanBodyText
  });
  if (bridgeRes?.file?.webViewLink) {
    return {
      id: bridgeRes.file.id || vaultCopy.id,
      name: bridgeRes.file.name || cleanTitle,
      mimeType: 'application/vnd.google-apps.document',
      webViewLink: bridgeRes.file.webViewLink,
      documentUrl: bridgeRes.file.webViewLink,
      service: 'docs',
      createdAt: Date.now()
    };
  }

  const accessToken = providedToken || (await ensureGoogleWorkspaceAccessToken());
  if (!accessToken || accessToken === GCLOUD_DIRECT_VAULT_TOKEN) {
    return vaultCopy;
  }

  try {
    const metadata = {
      name: cleanTitle,
      mimeType: 'application/vnd.google-apps.document'
    };
    const boundary = '-------NexusDocBoundary' + Date.now().toString(16);
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: text/plain; charset=UTF-8\r\n\r\n' +
      cleanBodyText +
      closeDelimiter;

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartBody
      }
    );

    if (uploadRes.ok) {
      const data = await uploadRes.json();
      const link = data.webViewLink || `https://docs.google.com/document/d/${data.id}/edit`;
      return {
        id: data.id,
        name: data.name || cleanTitle,
        mimeType: 'application/vnd.google-apps.document',
        webViewLink: link,
        documentUrl: link,
        service: 'docs',
        createdAt: Date.now()
      };
    }
  } catch (e) {
    console.warn('Drive conversion fallback to Firebase Cloud Vault:', e);
  }

  return vaultCopy;
}

/**
 * Creates a new Google Sheets spreadsheet in the user's Google Workspace via Personal Google Bridge
 * or mirrors to the Cloud Vault.
 */
export async function createGoogleSheetInWorkspace(
  title: string,
  rows: (string | number)[][],
  providedToken?: string | null
): Promise<GoogleWorkspaceFileResult> {
  const cleanTitle = (title || 'جدول بيانات نيكسوس').trim().slice(0, 120);
  const safeRows = rows && rows.length > 0 ? rows : [['البند', 'القيمة']];
  const csvContent = safeRows
    .map(row =>
      row
        .map(cell => {
          const str = String(cell ?? '').replace(/"/g, '""');
          return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
        })
        .join(',')
    )
    .join('\n');

  const vaultCopy = await saveToGoogleCloudDirectVault(
    cleanTitle,
    csvContent,
    'sheets',
    'application/vnd.google-apps.spreadsheet'
  );

  // 1. Try Personal Google Apps Script Bridge
  const bridgeRes = await callPersonalGoogleBridge('create_sheet', {
    title: cleanTitle,
    rows: safeRows
  });
  if (bridgeRes?.file?.webViewLink) {
    return {
      id: bridgeRes.file.id || vaultCopy.id,
      name: bridgeRes.file.name || cleanTitle,
      mimeType: 'application/vnd.google-apps.spreadsheet',
      webViewLink: bridgeRes.file.webViewLink,
      spreadsheetUrl: bridgeRes.file.webViewLink,
      service: 'sheets',
      createdAt: Date.now()
    };
  }

  const accessToken = providedToken || (await ensureGoogleWorkspaceAccessToken());
  if (!accessToken || accessToken === GCLOUD_DIRECT_VAULT_TOKEN) {
    return vaultCopy;
  }

  try {
    const metadata = {
      name: cleanTitle,
      mimeType: 'application/vnd.google-apps.spreadsheet'
    };
    const boundary = '-------NexusSheetBoundary' + Date.now().toString(16);
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: text/csv; charset=UTF-8\r\n\r\n' +
      csvContent +
      closeDelimiter;

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartBody
      }
    );

    if (uploadRes.ok) {
      const data = await uploadRes.json();
      const link = data.webViewLink || `https://docs.google.com/spreadsheets/d/${data.id}/edit`;
      return {
        id: data.id,
        name: data.name || cleanTitle,
        mimeType: 'application/vnd.google-apps.spreadsheet',
        webViewLink: link,
        spreadsheetUrl: link,
        service: 'sheets',
        createdAt: Date.now()
      };
    }
  } catch (e) {
    console.warn('Sheets conversion fallback to Firebase Cloud Vault:', e);
  }

  return vaultCopy;
}

/**
 * Extracts ONLY genuine table rows from Markdown or CSV text so tables export cleanly to Google Sheets.
 */
export function extractRowsFromTextForSheets(rawText: string): string[][] {
  const lines = (rawText || '')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  const tableLines = lines.filter(l => l.includes('|') && l.split('|').filter(Boolean).length >= 2);
  if (tableLines.length >= 2) {
    const parsedRows: string[][] = [];
    for (const line of tableLines) {
      if (/^\|?[\s\-:|]+\|?$/.test(line) && line.includes('-')) continue;
      const cells = line
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map(c => c.trim().replace(/\*\*([^*]+)\*\*/g, '$1'));
      if (cells.length > 0) parsedRows.push(cells);
    }
    if (parsedRows.length > 0) return parsedRows;
  }

  const csvLines = lines.filter(l => l.includes(','));
  if (csvLines.length >= 2) {
    return csvLines.map(l =>
      l.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    );
  }

  const fallbackRows: string[][] = [['البند / القسم', 'التفاصيل والمحتوى المستخرج']];
  lines.forEach((line, idx) => {
    const cleaned = line.replace(/^#+\s*/, '').replace(/^\*+\s*/, '');
    if (cleaned.includes(':')) {
      const [k, ...rest] = cleaned.split(':');
      fallbackRows.push([k.trim(), rest.join(':').trim()]);
    } else {
      fallbackRows.push([`فقرة ${idx + 1}`, cleaned]);
    }
  });
  return fallbackRows;
}

/**
 * Uploads any file (Code, Markdown, JSON, HTML, SQL, etc.) to Google Drive and mirrors to Google Cloud Direct Vault.
 */
export async function uploadFileToGoogleDrive(
  fileName: string,
  content: string,
  mimeType = 'text/plain;charset=utf-8',
  providedToken?: string | null
): Promise<GoogleWorkspaceFileResult> {
  const cleanFileName = (fileName || `nexus_artifact_${Date.now()}.txt`).trim();

  const vaultCopy = await saveToGoogleCloudDirectVault(
    cleanFileName,
    content,
    'drive',
    mimeType
  );

  const accessToken = providedToken || (await ensureGoogleWorkspaceAccessToken());
  if (!accessToken || accessToken === GCLOUD_DIRECT_VAULT_TOKEN) {
    return vaultCopy;
  }

  try {
    const metadata = {
      name: cleanFileName,
      mimeType
    };

    const boundary = '-------NexusMultipartBoundary' + Date.now().toString(16);
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n\r\n` +
      content +
      closeDelimiter;

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartRequestBody
      }
    );

    if (uploadRes.ok) {
      const data = await uploadRes.json();
      return {
        id: data.id,
        name: data.name || cleanFileName,
        mimeType: data.mimeType || mimeType,
        webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
        service: 'drive',
        createdAt: Date.now()
      };
    }
  } catch (e) {
    console.warn('Drive file upload fallback to Google Cloud Vault:', e);
  }

  return vaultCopy;
}

/**
 * Lists files from Personal Google Bridge (real Google Drive), Firebase Cloud Vault, and local cache.
 */
export async function listNexusGoogleDriveFiles(
  providedToken?: string | null
): Promise<GoogleWorkspaceFileResult[]> {
  const combined: GoogleWorkspaceFileResult[] = [];
  const seenIds = new Set<string>();

  // 0. Try Personal Google Apps Script Bridge (Real Google Drive files!)
  const bridgeRes = await callPersonalGoogleBridge('list_drive', { maxResults: 30 });
  if (Array.isArray(bridgeRes?.files)) {
    for (const f of bridgeRes.files) {
      if (f?.id && !seenIds.has(f.id)) {
        seenIds.add(f.id);
        const mime = String(f.mimeType || '');
        combined.push({
          id: f.id,
          name: f.name || 'ملف Google Drive',
          mimeType: mime,
          webViewLink: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
          service:
            mime.includes('document')
              ? 'docs'
              : mime.includes('spreadsheet')
              ? 'sheets'
              : mime.includes('presentation')
              ? 'slides'
              : 'drive',
          createdAt: Number(f.createdAt) || Date.now()
        });
      }
    }
  }

  // 1. Load server-side Cloud Vault files if available
  try {
    const vaultRes = await fetch('/api/agent-os/cloud-drive/list');
    if (vaultRes.ok) {
      const vaultData = await vaultRes.json();
      if (Array.isArray(vaultData.files)) {
        for (const f of vaultData.files) {
          if (f?.id && !seenIds.has(f.id)) {
            seenIds.add(f.id);
            combined.push(f);
          }
        }
      }
    }
  } catch {
    // ignore on static hosting
  }

  // 1b. Also load local Firebase Vault cache files
  try {
    const raw = localStorage.getItem(LOCAL_CLOUD_DRIVE_KEY);
    if (raw) {
      const localList: GoogleWorkspaceFileResult[] = JSON.parse(raw);
      if (Array.isArray(localList)) {
        for (const f of localList) {
          if (f?.id && !seenIds.has(f.id)) {
            seenIds.add(f.id);
            combined.push(f);
          }
        }
      }
    }
  } catch {
    // ignore
  }

  // 2. Also load live Google Drive files and folders if a real OAuth token is present
  const accessToken = providedToken || (await getGoogleWorkspaceAccessToken());
  if (accessToken && accessToken !== GCLOUD_DIRECT_VAULT_TOKEN) {
    try {
      const res = await fetch(
        'https://www.googleapis.com/drive/v3/files?pageSize=40&q=trashed=false&orderBy=folder,modifiedTime desc&fields=files(id,name,mimeType,webViewLink,createdTime,thumbnailLink,iconLink)',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      if (res.ok) {
        const data = await res.json();
        const files = Array.isArray(data.files) ? data.files : [];
        const mapped: GoogleWorkspaceFileResult[] = files.map((f: any) => ({
          id: f.id,
          name: f.name,
          mimeType: f.mimeType,
          thumbnailLink: f.thumbnailLink,
          iconLink: f.iconLink,
          isFolder: f.mimeType === 'application/vnd.google-apps.folder',
          webViewLink:
            f.webViewLink ||
            (f.mimeType === 'application/vnd.google-apps.folder'
              ? `https://drive.google.com/drive/folders/${f.id}`
              : f.mimeType === 'application/vnd.google-apps.document'
              ? `https://docs.google.com/document/d/${f.id}/edit`
              : f.mimeType === 'application/vnd.google-apps.spreadsheet'
              ? `https://docs.google.com/spreadsheets/d/${f.id}/edit`
              : f.mimeType === 'application/vnd.google-apps.presentation'
              ? `https://docs.google.com/presentation/d/${f.id}/edit`
              : `https://drive.google.com/file/d/${f.id}/view`),
          service:
            f.mimeType === 'application/vnd.google-apps.document'
              ? 'docs'
              : f.mimeType === 'application/vnd.google-apps.spreadsheet'
              ? 'sheets'
              : f.mimeType === 'application/vnd.google-apps.presentation'
              ? 'slides'
              : 'drive',
          createdAt: f.createdTime ? new Date(f.createdTime).getTime() : Date.now()
        }));
        combined.unshift(...mapped.filter(m => !seenIds.has(m.id)));
      }
    } catch {
      // ignore
    }
  }

  return combined;
}

/**
 * Updates an existing Google Drive file's content ONLY after explicit user confirmation (`userConfirmed === true`).
 */
export async function updateExistingGoogleDriveFile(
  fileId: string,
  newContent: string,
  mimeType: string,
  userConfirmed: boolean,
  providedToken?: string | null
): Promise<void> {
  if (!userConfirmed) {
    throw new Error('User confirmation is required before updating an existing Google Drive file.');
  }
  const accessToken = providedToken || (await ensureGoogleWorkspaceAccessToken());
  if (!accessToken || accessToken === GCLOUD_DIRECT_VAULT_TOKEN || fileId.startsWith('gcloud-')) {
    await saveToGoogleCloudDirectVault(fileId, newContent, 'drive', mimeType);
    return;
  }
  const res = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': mimeType
      },
      body: newContent
    }
  );
  if (!res.ok) {
    throw new Error(`فشل تحديث الملف في Google Drive (${res.status})`);
  }
}

/**
 * Deletes an existing Google Drive file ONLY after explicit user confirmation (`userConfirmed === true`).
 */
export async function deleteExistingGoogleDriveFile(
  fileId: string,
  userConfirmed: boolean,
  providedToken?: string | null
): Promise<void> {
  if (!userConfirmed) {
    throw new Error('User confirmation is required before deleting a file from Google Drive.');
  }
  const accessToken = providedToken || (await ensureGoogleWorkspaceAccessToken());
  if (!accessToken || accessToken === GCLOUD_DIRECT_VAULT_TOKEN || fileId.startsWith('gcloud-')) {
    return;
  }
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );
  if (!res.ok) {
    throw new Error(`فشل حذف الملف من Google Drive (${res.status})`);
  }
}

/**
 * Fetches readable text content from a Firebase Cloud Vault file or Real Google Drive file (via Personal Bridge or OAuth).
 */
export async function fetchGoogleDriveFileTextContent(
  file: GoogleWorkspaceFileResult,
  providedToken?: string | null
): Promise<string> {
  // 1. Check if the file is stored in local or server Cloud Vault
  if (file.id.startsWith('gcloud-')) {
    try {
      const raw = localStorage.getItem(LOCAL_CLOUD_DRIVE_KEY);
      if (raw) {
        const localList: (GoogleWorkspaceFileResult & { content?: string })[] = JSON.parse(raw);
        const found = localList.find(f => f.id === file.id);
        if (found?.content) return found.content;
      }
    } catch {
      // ignore
    }
    try {
      const vaultRes = await fetch(`/api/agent-os/cloud-drive/file/${encodeURIComponent(file.id)}`);
      if (vaultRes.ok) {
        const data = await vaultRes.json();
        if (data?.file?.content) {
          return data.file.content;
        }
      }
    } catch {
      // ignore
    }
  }

  // 2. Try Personal Google Apps Script Bridge for real Google Drive files
  const bridgeRead = await callPersonalGoogleBridge('read_drive_file', {
    fileId: file.id,
    mimeType: file.mimeType
  });
  if (bridgeRead?.content) {
    return String(bridgeRead.content).slice(0, 50000);
  }

  const accessToken = providedToken || (await ensureGoogleWorkspaceAccessToken());
  if (!accessToken || accessToken === GCLOUD_DIRECT_VAULT_TOKEN) {
    return `[ملف سحابي: ${file.name}]`;
  }

  if (file.mimeType === 'application/vnd.google-apps.document') {
    const expRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}/export?mimeType=text/plain`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (expRes.ok) {
      return (await expRes.text()).trim() || `[مستند Google Docs: ${file.name}]`;
    }
  }

  if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
    const expRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}/export?mimeType=text/csv`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (expRes.ok) {
      return (await expRes.text()).trim() || `[جدول Google Sheets: ${file.name}]`;
    }
  }

  if (file.mimeType === 'application/vnd.google-apps.presentation') {
    const expRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}/export?mimeType=text/plain`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (expRes.ok) {
      return (await expRes.text()).trim() || `[عرض Google Slides: ${file.name}]`;
    }
  }

  const mediaRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?alt=media`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );
  if (!mediaRes.ok) {
    return `[ملف Google Drive: ${file.name} (${file.webViewLink})]`;
  }
  const text = await mediaRes.text();
  return text.slice(0, 25000);
}

/**
 * MCP Tool: Searches Google Workspace (Drive, Docs, Sheets, Slides) + Cloud Vault by keyword and optional service type.
 */
export async function searchGoogleWorkspaceFiles(
  queryText: string,
  serviceFilter: 'all' | 'docs' | 'sheets' | 'slides' | 'drive' = 'all',
  providedToken?: string | null
): Promise<GoogleWorkspaceFileResult[]> {
  const allFiles = await listNexusGoogleDriveFiles(providedToken);
  const cleanQuery = (queryText || '').trim().toLowerCase();

  return allFiles.filter(f => {
    const matchesService = serviceFilter === 'all' || f.service === serviceFilter;
    if (!matchesService) return false;
    if (!cleanQuery) return true;
    return f.name.toLowerCase().includes(cleanQuery);
  });
}

/**
 * MCP Pre-Execution Connector:
 * Detects if the user is asking Nexus (via `@Gmail`, `@Drive`, `@Docs`, `@Sheets`, `@Slides`, `@Calendar` or natural language)
 * to read, search, or analyze emails, calendar events, or files from Google Workspace,
 * and automatically injects the live data into Nexus's reasoning context!
 */
export async function executeMcpWorkspacePreContext(
  userPrompt: string
): Promise<{
  triggered: boolean;
  contextBlock: string;
  matchedFiles: GoogleWorkspaceFileResult[];
}> {
  const prompt = (userPrompt || '').trim();
  const isGmailIntent =
    /@gmail/i.test(prompt) ||
    /(جيميل|بريدي|رسائل البريد|الإيميل|الايميل|أرسل بريد|ارسل بريد|أرسل إيميل|ارسل ايميل|inbox|gmail)/i.test(prompt);
  const isCalendarIntent =
    /@calendar/i.test(prompt) ||
    /(تقويم جوجل|مواعيدي|جدول مواعيد|حدث في التقويم|جدول لي|أضف موعد|اضف موعد|google calendar|calendar)/i.test(prompt);
  const isWorkspaceReadIntent =
    isGmailIntent ||
    isCalendarIntent ||
    /@drive|@docs|@sheets|@slides/i.test(prompt) ||
    /(ابحث في درايف|في جوجل درايف|من درايف|ملفاتي في السحابة|اقرأ ملف|اقرأ مستند|مستندات جوجل|جدول شيتس|جداول جوجل|عروض جوجل|سلايدز|استدع من درايف|استدعي من درايف|راجع ملف|حلل ملف|google drive|google docs|google sheets|google slides|workspace|mcp)/i.test(
      prompt
    );

  if (!isWorkspaceReadIntent) {
    return { triggered: false, contextBlock: '', matchedFiles: [] };
  }

  try {
    const extraBlocks: string[] = [];

    if (isGmailIntent) {
      try {
        const emails = await listGmailMessages(8);
        if (emails.length > 0) {
          extraBlocks.push(
            `[GMAIL LIVE INBOX — آخر ${emails.length} رسائل بريد إلكتروني متاحة لنيكسوس]:\n` +
              emails
                .map(
                  (e, i) =>
                    `${i + 1}. من: ${e.from} | الموضوع: ${e.subject} | التاريخ: ${e.date}\nالمحتوى: ${e.bodyText.slice(0, 1400)}`
                )
                .join('\n\n')
          );
        }
      } catch {
        // ignore
      }
    }

    if (isCalendarIntent) {
      try {
        const events = await listGoogleCalendarEvents(12);
        if (events.length > 0) {
          extraBlocks.push(
            `[GOOGLE CALENDAR LIVE EVENTS — المواعيد المسجلة (${events.length})]:\n` +
              events
                .map(
                  (ev, i) =>
                    `${i + 1}. الحدث: ${ev.summary} | البداية: ${ev.start} | النهاية: ${ev.end}${
                      ev.location ? ` | الموقع: ${ev.location}` : ''
                    }${ev.description ? `\nالتفاصيل: ${ev.description}` : ''}`
                )
                .join('\n')
          );
        }
      } catch {
        // ignore
      }
    }

    const allFiles = await listNexusGoogleDriveFiles();
    if (allFiles.length === 0 && extraBlocks.length === 0) {
      return {
        triggered: true,
        contextBlock: `\n[GOOGLE WORKSPACE EXTENSION CONNECTOR]: تم تفعيل إضافات Google Workspace (@Gmail / @Drive / @Docs / @Sheets / @Slides / @Calendar). يمكنك إصدار أوامر تنفيذية مباشرة باستخدام وسم <nexus_workspace_action>.`,
        matchedFiles: []
      };
    }

    const promptLower = prompt.toLowerCase();
    const scored = allFiles.map(file => {
      const words = file.name
        .toLowerCase()
        .split(/[\s_\-.]+/)
        .filter(w => w.length > 2);
      const matchCount = words.filter(w => promptLower.includes(w)).length;
      return { file, score: matchCount };
    });

    scored.sort((a, b) => b.score - a.score || b.file.createdAt - a.file.createdAt);
    const selectedFiles = scored.slice(0, 3).map(s => s.file);

    const fileContentsBlocks: string[] = [];
    for (const file of selectedFiles) {
      const content = await fetchGoogleDriveFileTextContent(file);
      fileContentsBlocks.push(
        `--- [ملف Google Workspace (${file.service.toUpperCase()}): "${file.name}" | الرابط: ${file.webViewLink}] ---\n${content.slice(0, 6000)}`
      );
    }

    const indexSummary = allFiles
      .slice(0, 12)
      .map((f, i) => `${i + 1}. [${f.service.toUpperCase()}] ${f.name} (${f.webViewLink})`)
      .join('\n');

    return {
      triggered: true,
      matchedFiles: selectedFiles,
      contextBlock: `\n\n[GOOGLE WORKSPACE LIVE EXTENSIONS (@Gmail · @Drive · @Docs · @Sheets · @Slides · @Calendar)]:\n${
        extraBlocks.length > 0 ? extraBlocks.join('\n\n') + '\n\n' : ''
      }فهرس الملفات والمستندات المتاحة (${allFiles.length} ملف):\n${indexSummary}\n\nمحتوى الملفات المستدعاة تلقائياً:\n${fileContentsBlocks.join('\n\n')}\n`
    };
  } catch {
    return { triggered: false, contextBlock: '', matchedFiles: [] };
  }
}

/**
 * MCP & Autonomous AI Workspace Post-Execution Connector:
 * Parses structured `<nexus_workspace_action>` tags emitted by Nexus in the chat response OR
 * explicit user requests to send/draft Gmail, schedule Calendar events, or create Docs/Sheets/Slides,
 * executes them automatically, and returns a rich result + formatted Markdown summary.
 */
export async function executeMcpWorkspaceAutoExportIfRequested(
  userPrompt: string,
  modelResponseText: string,
  defaultTitle = 'مخرجات نيكسوس'
): Promise<
  | (GoogleWorkspaceFileResult & {
      cleanedResponseText?: string;
      actionSummaryMarkdown?: string;
    })
  | null
> {
  const prompt = (userPrompt || '').trim();
  let workingText = modelResponseText || '';
  if (!workingText.trim()) return null;

  const actionSummaries: string[] = [];
  let primaryResult: GoogleWorkspaceFileResult | null = null;

  // 1. Parse explicit <nexus_workspace_action ...>...</nexus_workspace_action> tags emitted by the AI
  const actionTagRegex = /<nexus_workspace_action\s+([^>]+)>([\s\S]*?)<\/nexus_workspace_action>/gi;
  let match: RegExpExecArray | null;
  while ((match = actionTagRegex.exec(modelResponseText)) !== null) {
    const attrsRaw = match[1] || '';
    const innerContent = (match[2] || '').trim();
    const getAttr = (name: string) => {
      const m = attrsRaw.match(new RegExp(`${name}="([^"]*)"`, 'i'));
      return m ? m[1].trim() : '';
    };

    const service = getAttr('service').toLowerCase();
    const title = getAttr('title') || getAttr('summary') || getAttr('subject') || defaultTitle;

    if (service === 'gmail') {
      const to = getAttr('to') || 'recipient@example.com';
      const subject = getAttr('subject') || title;
      const sent = await sendGmailMessage(to, subject, innerContent || subject);
      actionSummaries.push(
        `📧 **تم تجهيز وإرسال البريد عبر إضافة @Gmail:** إلى \`${to}\` — الموضوع: **${subject}** · [اضغط هنا لفتحه وإرساله مباشرة في Gmail](${sent.composeUrl})`
      );
      if (!primaryResult) {
        primaryResult = {
          id: sent.id,
          name: `Gmail: ${subject}`,
          mimeType: 'text/plain',
          webViewLink: sent.composeUrl,
          service: 'drive',
          createdAt: Date.now()
        };
      }
    } else if (service === 'calendar') {
      const summary = getAttr('summary') || title;
      const startIso = getAttr('start') || new Date(Date.now() + 3600 * 1000).toISOString();
      const endIso = getAttr('end') || new Date(Date.now() + 7200 * 1000).toISOString();
      const location = getAttr('location') || '';
      const ev = await createGoogleCalendarEvent({
        summary,
        description: innerContent || summary,
        startIso,
        endIso,
        location
      });
      actionSummaries.push(
        `📅 **تمت جدولة الموعد عبر إضافة @Calendar:** **${ev.summary}** (${ev.start}) · [اضغط هنا لتأكيده في تقويم Google Calendar](${ev.htmlLink})`
      );
      if (!primaryResult) {
        primaryResult = {
          id: ev.id,
          name: `Calendar: ${ev.summary}`,
          mimeType: 'text/calendar',
          webViewLink: ev.htmlLink,
          service: 'drive',
          createdAt: Date.now()
        };
      }
    } else if (service === 'sheets') {
      const rows = extractRowsFromTextForSheets(innerContent || modelResponseText);
      const sheet = await createGoogleSheetInWorkspace(title, rows);
      actionSummaries.push(
        `📊 **تم إنشاء جدول البيانات عبر إضافة @Sheets:** [${sheet.name} — فتح الجدول](${sheet.webViewLink})`
      );
      primaryResult = sheet;
    } else if (service === 'slides') {
      const slides = await createGoogleSlidesPresentation(title, innerContent || modelResponseText);
      actionSummaries.push(
        `📽️ **تم إنشاء العرض التقديمي عبر إضافة @Slides:** [${slides.name} — فتح العرض](${slides.webViewLink})`
      );
      primaryResult = slides;
    } else if (service === 'docs' || service === 'drive') {
      const doc = await createGoogleDocInWorkspace(title, innerContent || modelResponseText);
      actionSummaries.push(
        `📄 **تم إنشاء المستند عبر إضافة @Docs:** [${doc.name} — فتح المستند](${doc.webViewLink})`
      );
      primaryResult = doc;
    }
  }

  // Strip the raw <nexus_workspace_action> tags from the visible chat text
  workingText = workingText.replace(actionTagRegex, '').trim();

  if (primaryResult && actionSummaries.length > 0) {
    return {
      ...primaryResult,
      cleanedResponseText: workingText,
      actionSummaryMarkdown: actionSummaries.join('\n\n')
    };
  }

  // 2. Fallback heuristic detection if user explicitly asked in prompt but model didn't emit the XML tag
  const wantsExplicitWorkspaceCreate =
    /@docs|@sheets|@slides|@drive|@gmail|@calendar/i.test(prompt) ||
    /(احفظ في درايف|احفظه في درايف|صدر إلى درايف|صدره إلى درايف|أنشئ مستند جوجل|انشئ مستند جوجل|احفظ في مستندات جوجل|صدر إلى مستندات جوجل|أنشئ جدول بيانات|انشئ جدول شيتس|صدر إلى شيتس|احفظ في شيتس|أنشئ عرض تقديمي|انشئ عرض تقديمي|في جوجل سلايدز|أرسل بريد|ارسل بريد|أرسل إيميل|ارسل ايميل|أضف موعد في التقويم|اضف موعد في التقويم|جدول لي في التقويم|save to google drive|create google doc|create google sheet|create google slides|export to google docs|export to google sheets)/i.test(
      prompt
    );

  if (!wantsExplicitWorkspaceCreate) {
    return null;
  }

  const cleanTitle = defaultTitle.slice(0, 80);

  if (/@gmail|أرسل بريد|ارسل بريد|أرسل إيميل|ارسل ايميل/i.test(prompt)) {
    const emailMatch = prompt.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const toAddr = emailMatch ? emailMatch[0] : '';
    const sent = await sendGmailMessage(toAddr, cleanTitle, workingText);
    return {
      id: sent.id,
      name: `Gmail: ${cleanTitle}`,
      mimeType: 'text/plain',
      webViewLink: sent.composeUrl,
      service: 'drive',
      createdAt: Date.now(),
      cleanedResponseText: workingText,
      actionSummaryMarkdown: `📧 **تم تجهيز رسالة البريد عبر إضافة @Gmail:** [اضغط هنا لفتح الرسالة وإرسالها مباشرة في Gmail](${sent.composeUrl})`
    };
  }

  if (/@calendar|أضف موعد|اضف موعد|جدول لي في التقويم/i.test(prompt)) {
    const startIso = new Date(Date.now() + 3600 * 1000).toISOString();
    const endIso = new Date(Date.now() + 7200 * 1000).toISOString();
    const ev = await createGoogleCalendarEvent({
      summary: cleanTitle,
      description: workingText.slice(0, 800),
      startIso,
      endIso
    });
    return {
      id: ev.id,
      name: `Calendar: ${ev.summary}`,
      mimeType: 'text/calendar',
      webViewLink: ev.htmlLink,
      service: 'drive',
      createdAt: Date.now(),
      cleanedResponseText: workingText,
      actionSummaryMarkdown: `📅 **تم تجهيز الموعد عبر إضافة @Calendar:** [${ev.summary} — اضغط هنا لإضافته في تقويم Google Calendar](${ev.htmlLink})`
    };
  }

  const profile = detectSmartExportProfile(workingText);

  if (/@slides|عرض تقديمي|سلايدز|شرائح|slides|presentation/i.test(prompt)) {
    const created = await createGoogleSlidesPresentation(cleanTitle, workingText);
    return { ...created, cleanedResponseText: workingText };
  }

  if (
    /@sheets|شيتس|جدول بيانات|sheets/i.test(prompt) ||
    (profile.hasTable && !/docs|مستند/i.test(prompt))
  ) {
    const rows = extractRowsFromTextForSheets(workingText);
    const created = await createGoogleSheetInWorkspace(cleanTitle, rows);
    return { ...created, cleanedResponseText: workingText };
  }

  if (/كود|ملف برمجي|مشروع|drive|درايف/i.test(prompt) && profile.hasCodeOrFiles) {
    const created = await uploadFileToGoogleDrive(`${cleanTitle}.md`, workingText, 'text/markdown');
    return { ...created, cleanedResponseText: workingText };
  }

  const created = await createGoogleDocInWorkspace(cleanTitle, workingText);
  return { ...created, cleanedResponseText: workingText };
}

/**
 * Syncs a connected Google NotebookLM notebook to the user's Google Drive as a Google Doc
 * (`[NotebookLM] <Title>`) so it is accessible across Gemini, Google Drive, and notebooklm.google.com.
 */
export async function syncNotebookLMToGoogleDrive(
  notebook: {
    id: string;
    title: string;
    description: string;
    customDirective: string;
    notebookLmUrl?: string;
    sources: {
      id: string;
      title: string;
      content: string;
      sourceType: string;
      wordCount: number;
    }[];
  },
  providedToken?: string | null
): Promise<GoogleWorkspaceFileResult> {
  const docTitle = notebook.title.startsWith('[NotebookLM]')
    ? notebook.title
    : `[NotebookLM] ${notebook.title}`;

  const compiledBody = [
    `# ${notebook.title}`,
    `معرف الدفتر المتصل في جيميني: ${notebook.id}`,
    notebook.notebookLmUrl ? `رابط Google NotebookLM الرسمي: ${notebook.notebookLmUrl}` : '',
    notebook.description ? `الوصف: ${notebook.description}` : '',
    notebook.customDirective ? `توجيهات الدفتر لـ Gemini: ${notebook.customDirective}` : '',
    `تاريخ المزامنة مع Google: ${new Date().toLocaleString('ar-SA')}`,
    `عدد المصادر المتصلة: ${notebook.sources.length}`,
    `\n========================================\n`,
    ...notebook.sources.map(
      (src, idx) =>
        `## [مصدر ${idx + 1}: ${src.title}] (النوع: ${src.sourceType} | الكلمات: ${src.wordCount})\n${src.content}`
    )
  ]
    .filter(Boolean)
    .join('\n\n');

  return await createGoogleDocInWorkspace(docTitle, compiledBody, providedToken);
}

/**
 * Discovers NotebookLM notebooks, exported NotebookLM Google Docs, and cloud research files
 * from the user's connected Google Drive (OAuth / Personal Bridge) so they can be
 * attached and used directly inside Gemini (+ menu / @NotebookLM).
 */
export async function discoverGoogleDriveNotebookLMItems(
  providedToken?: string | null
): Promise<{
  notebookDocs: GoogleWorkspaceFileResult[];
  allDriveSources: GoogleWorkspaceFileResult[];
}> {
  const allFiles = await listNexusGoogleDriveFiles(providedToken);
  const notebookSelectRegex = /(notebooklm|notebook|دفتر|ملاحظات|ملخص|دراسة|مرجع|بحث|مشروع|رواية)/i;

  const notebookDocs = allFiles.filter(
    f =>
      notebookSelectRegex.test(f.name) ||
      f.name.startsWith('[NotebookLM]') ||
      f.service === 'docs'
  );

  return {
    notebookDocs,
    allDriveSources: allFiles
  };
}

let gapiPickerLoaded = false;

async function ensureGooglePickerScriptLoaded(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const win = window as any;
  if (gapiPickerLoaded && win.google?.picker) return true;

  await new Promise<void>(resolve => {
    if (win.gapi) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[src="https://apis.google.com/js/api.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      setTimeout(() => resolve(), 2500);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });

  if (!win.gapi?.load) return false;

  return new Promise<boolean>(resolve => {
    try {
      win.gapi.load('picker', {
        callback: () => {
          gapiPickerLoaded = Boolean(win.google?.picker);
          resolve(gapiPickerLoaded);
        },
        onerror: () => resolve(false)
      });
    } catch {
      resolve(false);
    }
  });
}

export async function openLocalFileUploadDialog(): Promise<GoogleWorkspaceFileResult[] | null> {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept =
      '.txt,.md,.json,.csv,.tsv,.html,.xml,.py,.js,.ts,.tsx,.jsx,.css,.sql,.yaml,.yml,.log,.pdf,.doc,.docx,text/*,application/json,image/*';
    input.style.display = 'none';
    document.body.appendChild(input);

    let settled = false;
    const cleanup = () => {
      if (input.parentNode) {
        input.parentNode.removeChild(input);
      }
    };

    input.onchange = async () => {
      if (settled) return;
      settled = true;
      const files = input.files;
      if (!files || files.length === 0) {
        cleanup();
        resolve(null);
        return;
      }

      const results: GoogleWorkspaceFileResult[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        try {
          const text = await f.text();
          const lower = f.name.toLowerCase();
          const service: 'docs' | 'sheets' | 'slides' | 'drive' =
            lower.endsWith('.csv') || lower.endsWith('.tsv')
              ? 'sheets'
              : lower.endsWith('.md') || lower.endsWith('.txt') || lower.endsWith('.doc') || lower.endsWith('.docx')
              ? 'docs'
              : 'drive';

          const saved = await saveToGoogleCloudDirectVault(
            f.name,
            text || `[ملف: ${f.name} (${f.size} bytes)]`,
            service,
            f.type || 'text/plain;charset=utf-8'
          );
          results.push(saved);
        } catch {
          // ignore unreadable binary
        }
      }
      cleanup();
      resolve(results.length > 0 ? results : null);
    };

    input.oncancel = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(null);
    };

    input.click();
  });
}

/**
 * Opens the official Google Drive Picker (`google.picker.PickerBuilder` with My Drive, Upload, and Recent tabs)
 * when an OAuth accessToken is available, or falls back to local file upload dialog.
 */
export async function openGoogleDriveOfficialPicker(
  providedToken?: string | null
): Promise<GoogleWorkspaceFileResult[] | null> {
  const token = providedToken || (await getGoogleWorkspaceAccessToken());

  if (token && token !== GCLOUD_DIRECT_VAULT_TOKEN) {
    const pickerReady = await ensureGooglePickerScriptLoaded();
    const win = window as any;
    if (pickerReady && win.google?.picker) {
      return new Promise(resolve => {
        try {
          const googlePicker = win.google.picker;
          const docsView = new googlePicker.DocsView(googlePicker.ViewId.DOCS)
            .setIncludeFolders(true)
            .setSelectFolderEnabled(true);
          const uploadView = new googlePicker.DocsUploadView().setIncludeFolders(true);
          const recentView = new googlePicker.DocsView(googlePicker.ViewId.RECENTLY_PICKED);

          const pickerOrigin =
            window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
              ? window.location.ancestorOrigins[0]
              : window.location.origin;

          const picker = new googlePicker.PickerBuilder()
            .addView(docsView)
            .addView(uploadView)
            .addView(recentView)
            .enableFeature(googlePicker.Feature.MULTISELECT_ENABLED)
            .setOAuthToken(token)
            .setOrigin(pickerOrigin)
            .setCallback((data: any) => {
              if (data[googlePicker.Response.ACTION] === googlePicker.Action.PICKED) {
                const docs = data[googlePicker.Response.DOCUMENTS] || [];
                const picked: GoogleWorkspaceFileResult[] = docs.map((d: any) => {
                  const mime = d[googlePicker.Document.MIME_TYPE] || 'application/octet-stream';
                  const id = d[googlePicker.Document.ID];
                  const name = d[googlePicker.Document.NAME] || 'ملف Google Drive';
                  const url = d[googlePicker.Document.URL] || `https://drive.google.com/file/d/${id}/view`;
                  return {
                    id,
                    name,
                    mimeType: mime,
                    webViewLink: url,
                    isFolder: mime === 'application/vnd.google-apps.folder',
                    service:
                      mime === 'application/vnd.google-apps.document'
                        ? 'docs'
                        : mime === 'application/vnd.google-apps.spreadsheet'
                        ? 'sheets'
                        : mime === 'application/vnd.google-apps.presentation'
                        ? 'slides'
                        : 'drive',
                    createdAt: Date.now()
                  };
                });
                resolve(picked);
              } else if (data[googlePicker.Response.ACTION] === googlePicker.Action.CANCEL) {
                resolve(null);
              }
            })
            .build();

          picker.setVisible(true);
        } catch {
          openLocalFileUploadDialog().then(resolve);
        }
      });
    }
  }

  return openLocalFileUploadDialog();
}

/**
 * Creates a new Google Slides presentation via Personal Google Bridge (if connected)
 * or saves it directly into the workspace vault.
 */
export async function createGoogleSlidesPresentation(
  title: string,
  outlineText: string,
  _providedToken?: string | null
): Promise<GoogleWorkspaceFileResult> {
  const cleanTitle = (title || 'عرض تقديمي نيكسوس').trim().slice(0, 120);
  const vaultCopy = await saveToGoogleCloudDirectVault(
    cleanTitle,
    outlineText || cleanTitle,
    'slides',
    'application/vnd.google-apps.presentation'
  );

  const bridgeRes = await callPersonalGoogleBridge('create_slides', {
    title: cleanTitle,
    content: outlineText || cleanTitle
  });
  if (bridgeRes?.file?.webViewLink) {
    return {
      id: bridgeRes.file.id || vaultCopy.id,
      name: bridgeRes.file.name || cleanTitle,
      mimeType: 'application/vnd.google-apps.presentation',
      webViewLink: bridgeRes.file.webViewLink,
      presentationUrl: bridgeRes.file.webViewLink,
      service: 'slides',
      createdAt: Date.now()
    };
  }

  return vaultCopy;
}

const GMAIL_VAULT_KEY = 'nexus_gmail_vault_v1';
const CALENDAR_VAULT_KEY = 'nexus_calendar_vault_v1';

function readGmailVault(): GmailMessageSummary[] {
  try {
    const raw = localStorage.getItem(GMAIL_VAULT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function writeGmailVault(list: GmailMessageSummary[]) {
  try {
    localStorage.setItem(GMAIL_VAULT_KEY, JSON.stringify(list.slice(0, 50)));
  } catch {
    // ignore
  }
}

/**
 * Lists Gmail messages from the user's Personal Google Bridge (`GmailApp.search`) + local workspace vault.
 */
export async function listGmailMessages(
  maxResults = 15,
  query = '',
  _providedToken?: string | null
): Promise<GmailMessageSummary[]> {
  // 1. Try Personal Google Bridge (Real Gmail Inbox!)
  const bridgeRes = await callPersonalGoogleBridge('list_gmail', {
    maxResults,
    query: query.trim() || 'label:inbox'
  });
  if (Array.isArray(bridgeRes?.messages) && bridgeRes.messages.length > 0) {
    writeGmailVault(bridgeRes.messages);
    return bridgeRes.messages;
  }

  const all = readGmailVault();
  const q = query.trim().toLowerCase();
  const filtered = q
    ? all.filter(
        m =>
          m.subject.toLowerCase().includes(q) ||
          m.from.toLowerCase().includes(q) ||
          m.bodyText.toLowerCase().includes(q)
      )
    : all;
  return filtered.slice(0, maxResults);
}

/**
 * Sends a real email via the user's Personal Google Bridge (if connected) AND generates a direct
 * Gmail Web Compose URL so it works 100% of the time without Google Cloud Billing.
 */
export async function sendGmailMessage(
  to: string,
  subject: string,
  body: string,
  _providedToken?: string | null
): Promise<{ id: string; threadId: string; composeUrl: string; sentViaBridge?: boolean }> {
  const id = `gmail-${Date.now()}`;
  const threadId = `thread-${Date.now()}`;
  const newMsg: GmailMessageSummary = {
    id,
    threadId,
    subject: subject.trim() || '(بدون موضوع)',
    from: `إلى: ${to.trim() || 'مستلم'}`,
    date: new Date().toLocaleString('ar-SA'),
    snippet: body.trim().slice(0, 160),
    bodyText: body.trim()
  };

  const current = readGmailVault();
  writeGmailVault([newMsg, ...current]);

  let sentViaBridge = false;
  if (to.trim() && to.includes('@')) {
    const bridgeRes = await callPersonalGoogleBridge('send_gmail', {
      to: to.trim(),
      subject: subject.trim(),
      body: body.trim()
    });
    if (bridgeRes?.ok) {
      sentViaBridge = true;
    }
  }

  const composeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    to.trim()
  )}&su=${encodeURIComponent(subject.trim())}&body=${encodeURIComponent(body.trim())}`;

  return { id, threadId, composeUrl, sentViaBridge };
}

function readCalendarVault(): GoogleCalendarEventItem[] {
  try {
    const raw = localStorage.getItem(CALENDAR_VAULT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function writeCalendarVault(list: GoogleCalendarEventItem[]) {
  try {
    localStorage.setItem(CALENDAR_VAULT_KEY, JSON.stringify(list.slice(0, 50)));
  } catch {
    // ignore
  }
}

function toGoogleCalendarDateString(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) {
      return new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  } catch {
    return new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }
}

/**
 * Lists upcoming events from the user's Personal Google Bridge (`CalendarApp`), iCal feed, or workspace vault.
 */
export async function listGoogleCalendarEvents(
  maxResults = 15,
  _providedToken?: string | null
): Promise<GoogleCalendarEventItem[]> {
  // 1. Try Personal Google Bridge (Real Google Calendar!)
  const bridgeRes = await callPersonalGoogleBridge('list_calendar', { maxResults });
  if (Array.isArray(bridgeRes?.events) && bridgeRes.events.length > 0) {
    writeCalendarVault(bridgeRes.events);
    return bridgeRes.events;
  }

  // 2. Try Google Calendar iCal Feed URL if configured
  const icalUrl = getPersonalGoogleCalendarIcalUrl();
  if (icalUrl) {
    try {
      const res = await fetch('/api/google-bridge/ical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icalUrl })
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.events) && data.events.length > 0) {
          writeCalendarVault(data.events);
          return data.events.slice(0, maxResults);
        }
      }
    } catch {
      // ignore
    }
  }

  return readCalendarVault().slice(0, maxResults);
}

/**
 * Creates a calendar event via the user's Personal Google Bridge (if connected) AND generates
 * a direct Google Calendar Web template link (`https://calendar.google.com/calendar/render?action=TEMPLATE...`).
 */
export async function createGoogleCalendarEvent(
  params: {
    summary: string;
    description?: string;
    startIso: string;
    endIso: string;
    location?: string;
  },
  _providedToken?: string | null
): Promise<GoogleCalendarEventItem> {
  const startFormatted = toGoogleCalendarDateString(params.startIso);
  const endFormatted = toGoogleCalendarDateString(params.endIso);
  const templateUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    params.summary.trim()
  )}&dates=${startFormatted}/${endFormatted}&details=${encodeURIComponent(
    params.description?.trim() || ''
  )}&location=${encodeURIComponent(params.location?.trim() || '')}`;

  await callPersonalGoogleBridge('create_calendar', {
    summary: params.summary.trim(),
    description: params.description?.trim() || '',
    startIso: params.startIso,
    endIso: params.endIso,
    location: params.location?.trim() || ''
  });

  const item: GoogleCalendarEventItem = {
    id: `cal-${Date.now()}`,
    summary: params.summary.trim(),
    description: params.description?.trim() || '',
    start: params.startIso,
    end: params.endIso,
    htmlLink: templateUrl,
    location: params.location?.trim() || ''
  };

  const current = readCalendarVault();
  writeCalendarVault([item, ...current]);
  return item;
}






