import express from "express";
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { bootstrapFoundationalImportBoxItems } from "./server_importBoxSeed.ts";

const router = express.Router();

export const ADMIN_IMPORT_BOX_DIR = path.join(process.cwd(), "data", "admin_import_box");
const MANIFEST_PATH = path.join(ADMIN_IMPORT_BOX_DIR, "_manifest.json");

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

function ensureImportBoxDir() {
  if (!fs.existsSync(ADMIN_IMPORT_BOX_DIR)) {
    fs.mkdirSync(ADMIN_IMPORT_BOX_DIR, { recursive: true });
  }
  try {
    bootstrapFoundationalImportBoxItems(ADMIN_IMPORT_BOX_DIR, MANIFEST_PATH);
  } catch (seedErr) {
    console.warn("Import box foundational seed check warning:", seedErr);
  }
}

export function loadImportBoxManifest(): ImportBoxItem[] {
  ensureImportBoxDir();
  let items: ImportBoxItem[] = [];
  try {
    if (fs.existsSync(MANIFEST_PATH)) {
      const raw = fs.readFileSync(MANIFEST_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        items = parsed;
      }
    }
  } catch {
    items = [];
  }
  return items;
}

function saveImportBoxManifest(items: ImportBoxItem[]) {
  ensureImportBoxDir();
  const serialized = JSON.stringify(items, null, 2);
  fs.writeFileSync(MANIFEST_PATH, serialized, "utf-8");
}

const TEXT_EXTENSIONS = new Set([
  "txt", "md", "markdown", "json", "jsonl", "ts", "tsx", "js", "jsx", "mjs", "cjs",
  "py", "html", "htm", "css", "scss", "sql", "xml", "yaml", "yml", "toml", "ini",
  "env", "sh", "bash", "csv", "tsv", "log", "svg", "rst", "tex"
]);

function isTextExt(ext: string): boolean {
  return TEXT_EXTENSIONS.has(ext.toLowerCase().replace(/^\./, ""));
}

function sanitizeFileName(name: string): string {
  const base = path.basename(String(name || "uploaded_file")).trim();
  const cleaned = base.replace(/[<>:"/\\|?*\x00-\x1F]+/g, "_");
  return cleaned || `file_${Date.now()}`;
}

function extractTextPreviewFromFile(absPath: string, ext: string): string {
  try {
    const cleanExt = ext.toLowerCase().replace(/^\./, "");
    if (isTextExt(cleanExt)) {
      const buf = fs.readFileSync(absPath);
      return buf.toString("utf-8").slice(0, 4000);
    }
    if (cleanExt === "docx") {
      const pyScript = `
import zipfile, xml.etree.ElementTree as ET, sys
p = sys.argv[1]
with zipfile.ZipFile(p, 'r') as z:
    if 'word/document.xml' in z.namelist():
        xml_content = z.read('word/document.xml')
        tree = ET.fromstring(xml_content)
        texts = [node.text for node in tree.iter() if node.tag.endswith('}t') and node.text]
        print(" ".join(texts)[:4000])
`;
      return execFileSync("python3", ["-c", pyScript, absPath], {
        encoding: "utf-8",
        timeout: 6000
      }).trim();
    }
  } catch {
    // Ignore preview extraction failure
  }
  return "";
}

function extractArchiveSafely(archiveAbsPath: string, extractTargetDir: string): ExtractedArchiveFileInfo[] {
  if (!fs.existsSync(extractTargetDir)) {
    fs.mkdirSync(extractTargetDir, { recursive: true });
  }

  const pyExtract = `
import os, sys, zipfile, tarfile, json

archive_path = sys.argv[1]
target_dir = os.path.abspath(sys.argv[2])
os.makedirs(target_dir, exist_ok=True)

def is_safe_path(base, path_to_check):
    abs_target = os.path.abspath(os.path.join(base, path_to_check))
    return abs_target.startswith(base + os.sep) or abs_target == base

extracted_list = []

try:
    if zipfile.is_zipfile(archive_path):
        with zipfile.ZipFile(archive_path, 'r') as zf:
            for member in zf.infolist():
                if member.is_dir():
                    continue
                rel_name = member.filename.replace('\\\\', '/').lstrip('/')
                if not rel_name or '..' in rel_name.split('/'):
                    continue
                if not is_safe_path(target_dir, rel_name):
                    continue
                dest_path = os.path.join(target_dir, rel_name)
                os.makedirs(os.path.dirname(dest_path), exist_ok=True)
                with zf.open(member, 'r') as src, open(dest_path, 'wb') as dst:
                    dst.write(src.read())
    elif tarfile.is_tarfile(archive_path):
        with tarfile.open(archive_path, 'r:*') as tf:
            for member in tf.getmembers():
                if not member.isfile():
                    continue
                rel_name = member.name.replace('\\\\', '/').lstrip('/')
                if not rel_name or '..' in rel_name.split('/'):
                    continue
                if not is_safe_path(target_dir, rel_name):
                    continue
                dest_path = os.path.join(target_dir, rel_name)
                os.makedirs(os.path.dirname(dest_path), exist_ok=True)
                src = tf.extractfile(member)
                if src:
                    with open(dest_path, 'wb') as dst:
                        dst.write(src.read())
except Exception as e:
    sys.stderr.write(str(e))

for root, _, files in os.walk(target_dir):
    for f in sorted(files):
        full_p = os.path.join(root, f)
        rel_p = os.path.relpath(full_p, target_dir).replace('\\\\', '/')
        try:
            sz = os.path.getsize(full_p)
            ext = os.path.splitext(f)[1].lower().lstrip('.')
            extracted_list.append({"relPath": rel_p, "sizeBytes": sz, "ext": ext})
        except Exception:
            pass

print(json.dumps(extracted_list, ensure_ascii=False))
`;

  try {
    const stdout = execFileSync("python3", ["-c", pyExtract, archiveAbsPath, extractTargetDir], {
      encoding: "utf-8",
      timeout: 25000,
      maxBuffer: 10 * 1024 * 1024
    }).trim();
    const rawList = JSON.parse(stdout || "[]");
    if (Array.isArray(rawList)) {
      return rawList.map((item: any) => ({
        relPath: String(item.relPath || ""),
        sizeBytes: Number(item.sizeBytes || 0),
        ext: String(item.ext || ""),
        isTextReadable: isTextExt(String(item.ext || "")) || !item.ext
      }));
    }
  } catch (err) {
    console.warn("Archive extraction warning:", err);
  }
  return [];
}

const ARCHIVE_EXTENSIONS = new Set(["zip", "tar", "gz", "tgz", "rar", "7z"]);

function collectExtractedArchiveFileInfos(extractTargetDir: string): ExtractedArchiveFileInfo[] {
  const results: ExtractedArchiveFileInfo[] = [];
  function walk(dir: string) {
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        try {
          const stat = fs.statSync(fullPath);
          const relPath = path.relative(extractTargetDir, fullPath).replace(/\\/g, "/");
          const ext = path.extname(entry.name).toLowerCase().replace(/^\./, "");
          results.push({
            relPath,
            sizeBytes: stat.size,
            ext,
            isTextReadable: isTextExt(ext) || !ext
          });
        } catch {
          // ignore unreadable file
        }
      }
    }
  }
  walk(extractTargetDir);
  return results;
}

function syncDiskFilesIntoImportBox(): { items: ImportBoxItem[]; discoveredCount: number } {
  ensureImportBoxDir();
  const existing = loadImportBoxManifest();
  let manifestMutated = false;

  // Normalize any existing items whose originalName still carries the internal `${stamp}__` prefix or lacks linked extracted files
  const diskEntries = fs.readdirSync(ADMIN_IMPORT_BOX_DIR);
  for (const item of existing) {
    const stripped = item.originalName.replace(/^[a-z0-9]{7,10}_[a-z0-9]{3,6}__/, "");
    if (stripped && stripped !== item.originalName) {
      item.originalName = stripped;
      manifestMutated = true;
    }
    const stampMatch = item.storedFileName.match(/^([a-z0-9]{7,10}_[a-z0-9]{3,6})__/);
    if (stampMatch && (!item.extractedFiles || item.extractedFiles.length === 0)) {
      const stampPrefix = `extracted_${stampMatch[1]}_`;
      const matchingExtractDir = diskEntries.find(d => d.startsWith(stampPrefix));
      if (matchingExtractDir) {
        const extractAbs = path.join(ADMIN_IMPORT_BOX_DIR, matchingExtractDir);
        try {
          if (fs.statSync(extractAbs).isDirectory()) {
            item.isArchive = true;
            item.extractedDirRelPath = matchingExtractDir;
            item.extractedFiles = collectExtractedArchiveFileInfos(extractAbs);
            manifestMutated = true;
          }
        } catch {
          // ignore
        }
      }
    }
  }

  const knownStoredNames = new Set(existing.map(i => i.storedFileName));
  const newlyDiscovered: ImportBoxItem[] = [];

  for (const fname of diskEntries) {
    if (fname === "_manifest.json" || fname.startsWith(".") || fname.startsWith("extracted_")) continue;
    if (knownStoredNames.has(fname)) continue;
    const absPath = path.join(ADMIN_IMPORT_BOX_DIR, fname);
    try {
      const stat = fs.statSync(absPath);
      if (!stat.isFile()) continue;
      const cleanOriginalName = fname.replace(/^[a-z0-9]{7,10}_[a-z0-9]{3,6}__/, "") || fname;
      const extMatch = cleanOriginalName.match(/\.([a-zA-Z0-9]+)$/);
      const ext = extMatch ? extMatch[1].toLowerCase() : "txt";
      const archiveFlag = ARCHIVE_EXTENSIONS.has(ext) || cleanOriginalName.toLowerCase().endsWith(".tar.gz");
      const mimeType =
        ext === "pdf"
          ? "application/pdf"
          : ext === "md"
          ? "text/markdown"
          : isTextExt(ext)
          ? "text/plain"
          : "application/octet-stream";

      let extractedFiles: ExtractedArchiveFileInfo[] = [];
      let extractedDirRelPath: string | undefined;
      const stampMatch = fname.match(/^([a-z0-9]{7,10}_[a-z0-9]{3,6})__/);
      if (stampMatch) {
        const stampPrefix = `extracted_${stampMatch[1]}_`;
        const matchingExtractDir = diskEntries.find(d => d.startsWith(stampPrefix));
        if (matchingExtractDir) {
          const extractAbs = path.join(ADMIN_IMPORT_BOX_DIR, matchingExtractDir);
          if (fs.existsSync(extractAbs) && fs.statSync(extractAbs).isDirectory()) {
            extractedDirRelPath = matchingExtractDir;
            extractedFiles = collectExtractedArchiveFileInfos(extractAbs);
          }
        }
      }

      const textPreview =
        extractedFiles.length > 0
          ? `أرشيف مفكوك يحتوي على ${extractedFiles.length} ملف:\n` +
            extractedFiles.slice(0, 20).map(ef => ef.relPath).join("\n")
          : extractTextPreviewFromFile(absPath, ext);

      newlyDiscovered.push({
        id: `imp_disk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        originalName: cleanOriginalName,
        storedFileName: fname,
        storedRelPath: fname,
        mimeType,
        ext,
        sizeBytes: stat.size,
        uploadedAt: Math.round(stat.mtimeMs || Date.now()),
        isArchive: archiveFlag || extractedFiles.length > 0,
        extractedDirRelPath,
        extractedFiles,
        textPreview,
        note: "اكتُشف وفُهرس تلقائياً من مستودع الاستيراد على القرص"
      });
    } catch {
      // skip unreadable file
    }
  }

  if (newlyDiscovered.length > 0 || manifestMutated) {
    const merged = [...existing, ...newlyDiscovered];
    saveImportBoxManifest(merged);
    return { items: merged, discoveredCount: newlyDiscovered.length };
  }
  return { items: existing, discoveredCount: 0 };
}

// 1. LIST ALL ITEMS IN ADMIN IMPORT BOX (with auto-discovery of restored disk files)
router.get("/list", (_req, res) => {
  try {
    const { items, discoveredCount } = syncDiskFilesIntoImportBox();
    const totalBytes = items.reduce((acc, item) => acc + (item.sizeBytes || 0), 0);
    const totalExtractedFiles = items.reduce((acc, item) => acc + (item.extractedFiles?.length || 0), 0);
    res.json({
      ok: true,
      storagePath: "/data/admin_import_box",
      totalItems: items.length,
      discoveredCount,
      totalExtractedFiles,
      totalBytes,
      items
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || "تعذر قراءة صندوق الاستيراد." });
  }
});

// 1b. EXPLICIT SYNC OF RESTORED DISK FILES INTO IMPORT BOX MANIFEST
router.post("/sync-foundational", (_req, res) => {
  try {
    const { items, discoveredCount } = syncDiskFilesIntoImportBox();
    res.json({
      ok: true,
      discoveredCount,
      totalItems: items.length,
      items
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || "تعذر مزامنة ملفات صندوق الاستيراد." });
  }
});

function processStoredFileIntoImportItem(
  storedAbsPath: string,
  storedFileName: string,
  originalName: string,
  mimeType?: string,
  note?: string,
  stampOverride?: string
): ImportBoxItem {
  const safeName = sanitizeFileName(originalName);
  const stamp = stampOverride || (Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6));
  const extMatch = safeName.match(/\.([a-zA-Z0-9]+)$/);
  const ext = extMatch ? extMatch[1].toLowerCase() : "";
  const isTarGz = safeName.toLowerCase().endsWith(".tar.gz") || safeName.toLowerCase().endsWith(".tgz");
  const isArchive = ext === "zip" || ext === "tar" || ext === "gz" || isTarGz;

  const stat = fs.statSync(storedAbsPath);
  let extractedDirRelPath: string | undefined = undefined;
  let extractedFiles: ExtractedArchiveFileInfo[] = [];
  let textPreview = "";

  if (isArchive) {
    const extractFolderName = `extracted_${stamp}_${safeName.replace(/\.[^.]+$/, "")}`;
    const extractAbsDir = path.join(ADMIN_IMPORT_BOX_DIR, extractFolderName);
    extractedFiles = extractArchiveSafely(storedAbsPath, extractAbsDir);
    extractedDirRelPath = extractFolderName;

    const previewSnippets: string[] = [];
    for (const ef of extractedFiles.slice(0, 6)) {
      if (ef.isTextReadable && ef.sizeBytes < 2 * 1024 * 1024) {
        try {
          const innerAbs = path.join(extractAbsDir, ef.relPath);
          const snippet = fs.readFileSync(innerAbs, "utf-8").slice(0, 600);
          previewSnippets.push(`=== [${ef.relPath}] (${ef.sizeBytes}B) ===\n${snippet}`);
        } catch {}
      }
    }
    textPreview =
      previewSnippets.length > 0
        ? previewSnippets.join("\n\n")
        : `أرشيف مضغوط يحتوي على ${extractedFiles.length} ملفاً مستخرجاً جاهزاً للفحص.`;
  } else {
    textPreview = extractTextPreviewFromFile(storedAbsPath, ext);
  }

  return {
    id: `imp_${stamp}`,
    originalName,
    storedFileName,
    storedRelPath: storedFileName,
    mimeType: mimeType || (isArchive ? "application/zip" : "application/octet-stream"),
    ext: isTarGz ? "tar.gz" : ext,
    sizeBytes: stat.size,
    uploadedAt: Date.now(),
    isArchive,
    extractedDirRelPath,
    extractedFiles,
    textPreview,
    note: note ? String(note).trim() : undefined
  };
}

// 2. UPLOAD ONE OR MORE FILES (REGULAR OR COMPRESSED .ZIP / .TAR.GZ) TO ADMIN IMPORT BOX
router.post("/upload", (req, res) => {
  try {
    ensureImportBoxDir();
    const { files, note } = req.body as {
      files?: Array<{
        name: string;
        mimeType?: string;
        base64Data?: string;
        rawText?: string;
      }>;
      note?: string;
    };

    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ ok: false, error: "لم يتم تمرير أي ملفات للرفع في صندوق الاستيراد." });
    }

    const currentManifest = loadImportBoxManifest();
    const newlyAdded: ImportBoxItem[] = [];

    for (const fileObj of files) {
      const originalName = String(fileObj.name || "unnamed_file").trim();
      const safeName = sanitizeFileName(originalName);
      const stamp = Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6);
      const storedFileName = `${stamp}__${safeName}`;
      const storedAbsPath = path.join(ADMIN_IMPORT_BOX_DIR, storedFileName);

      if (typeof fileObj.rawText === "string" && !fileObj.base64Data) {
        fs.writeFileSync(storedAbsPath, fileObj.rawText, "utf-8");
      } else {
        const cleanB64 = String(fileObj.base64Data || "").replace(/^data:[^;]+;base64,/, "");
        const buf = Buffer.from(cleanB64, "base64");
        fs.writeFileSync(storedAbsPath, buf);
      }

      const newItem = processStoredFileIntoImportItem(
        storedAbsPath,
        storedFileName,
        originalName,
        fileObj.mimeType,
        note,
        stamp
      );
      newlyAdded.push(newItem);
    }

    const updatedManifest = [...newlyAdded, ...currentManifest];
    saveImportBoxManifest(updatedManifest);

    res.json({
      ok: true,
      addedCount: newlyAdded.length,
      addedItems: newlyAdded,
      items: updatedManifest
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || "فشل رفع الملفات إلى صندوق الاستيراد." });
  }
});

// 2b. CHUNKED UPLOAD FOR LARGE FILES / ARCHIVES (bypasses 32MB Cloud Run proxy payload limits)
router.post("/upload-chunk", (req, res) => {
  try {
    ensureImportBoxDir();
    const { uploadId, chunkIndex, base64Chunk } = req.body as {
      uploadId?: string;
      chunkIndex?: number;
      base64Chunk?: string;
    };
    const safeUploadId = String(uploadId || "").replace(/[^a-zA-Z0-9_-]/g, "");
    if (!safeUploadId || typeof base64Chunk !== "string") {
      return res.status(400).json({ ok: false, error: "بيانات الجزء المرفوع غير صالحة." });
    }
    const tmpPath = path.join(ADMIN_IMPORT_BOX_DIR, `.chunk_${safeUploadId}.part`);
    const cleanB64 = base64Chunk.replace(/^data:[^;]+;base64,/, "");
    const buf = Buffer.from(cleanB64, "base64");
    if (chunkIndex === 0 && fs.existsSync(tmpPath)) {
      fs.unlinkSync(tmpPath);
    }
    fs.appendFileSync(tmpPath, buf);
    res.json({ ok: true, uploadId: safeUploadId, chunkIndex, appendedBytes: buf.length });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || "فشل كتابة جزء الملف." });
  }
});

router.post("/upload-finalize", (req, res) => {
  try {
    ensureImportBoxDir();
    const { uploadId, name, mimeType, note } = req.body as {
      uploadId?: string;
      name?: string;
      mimeType?: string;
      note?: string;
    };
    const safeUploadId = String(uploadId || "").replace(/[^a-zA-Z0-9_-]/g, "");
    const tmpPath = path.join(ADMIN_IMPORT_BOX_DIR, `.chunk_${safeUploadId}.part`);
    if (!safeUploadId || !fs.existsSync(tmpPath)) {
      return res.status(404).json({ ok: false, error: "لم يتم العثور على أجزاء الملف المجمع." });
    }
    const originalName = String(name || "unnamed_file").trim();
    const safeName = sanitizeFileName(originalName);
    const stamp = Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6);
    const storedFileName = `${stamp}__${safeName}`;
    const storedAbsPath = path.join(ADMIN_IMPORT_BOX_DIR, storedFileName);
    fs.renameSync(tmpPath, storedAbsPath);

    const newItem = processStoredFileIntoImportItem(
      storedAbsPath,
      storedFileName,
      originalName,
      mimeType,
      note,
      stamp
    );
    const currentManifest = loadImportBoxManifest();
    const updatedManifest = [newItem, ...currentManifest];
    saveImportBoxManifest(updatedManifest);

    res.json({
      ok: true,
      addedCount: 1,
      addedItems: [newItem],
      items: updatedManifest
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || "فشل إتمام تجميع الملف في صندوق الاستيراد." });
  }
});

// 3. READ FULL CONTENT OF AN ITEM OR AN EXTRACTED INNER FILE
router.get("/read", (req, res) => {
  try {
    const itemId = String(req.query.id || "").trim();
    const innerRelPath = String(req.query.innerPath || "").trim();
    const maxChars = Math.min(500_000, Math.max(5_000, Number(req.query.maxChars) || 120_000));

    const manifest = loadImportBoxManifest();
    const item = manifest.find(i => i.id === itemId);
    if (!item) {
      return res.status(404).json({ ok: false, error: "العنصر غير موجود في صندوق الاستيراد." });
    }

    if (innerRelPath && item.extractedDirRelPath) {
      const baseExtractDir = path.resolve(ADMIN_IMPORT_BOX_DIR, item.extractedDirRelPath);
      const cleanInner = innerRelPath.replace(/^\/+/, "");
      const targetAbs = path.resolve(baseExtractDir, cleanInner);
      if (targetAbs.startsWith(baseExtractDir) && fs.existsSync(targetAbs)) {
        const rawContent = fs.readFileSync(targetAbs, "utf-8");
        return res.json({
          ok: true,
          title: `${item.originalName} :: ${innerRelPath}`,
          fileName: path.basename(innerRelPath),
          sizeBytes: fs.statSync(targetAbs).size,
          content: rawContent.slice(0, maxChars),
          truncated: rawContent.length > maxChars
        });
      }
      // Fallback: if the archive is a NEXUS project snapshot and the inner file exists in the workspace root
      const workspaceRoot = path.resolve(process.cwd());
      const strippedInner = cleanInner.replace(/^[^/]+\//, "");
      for (const candidateRel of [cleanInner, strippedInner]) {
        const wsCandidate = path.resolve(workspaceRoot, candidateRel);
        if (wsCandidate.startsWith(workspaceRoot) && fs.existsSync(wsCandidate) && fs.statSync(wsCandidate).isFile()) {
          const rawContent = fs.readFileSync(wsCandidate, "utf-8");
          return res.json({
            ok: true,
            title: `${item.originalName} :: ${innerRelPath}`,
            fileName: path.basename(innerRelPath),
            sizeBytes: fs.statSync(wsCandidate).size,
            content: rawContent.slice(0, maxChars),
            truncated: rawContent.length > maxChars
          });
        }
      }
      return res.status(404).json({ ok: false, error: "الملف الداخلي غير موجود في الأرشيف المستخرج." });
    }

    if (item.isArchive && item.extractedDirRelPath) {
      // Combine all readable files inside the archive up to maxChars
      const baseExtractDir = path.resolve(ADMIN_IMPORT_BOX_DIR, item.extractedDirRelPath);
      const workspaceRoot = path.resolve(process.cwd());
      const combinedParts: string[] = [
        `# حزمة صندوق الاستيراد السيادي: ${item.originalName} (${item.extractedFiles.length} ملفاً)`
      ];
      if (item.textPreview) {
        combinedParts.push(`\n\n${item.textPreview}`);
      }
      let accumLen = combinedParts.join("").length;

      for (const ef of item.extractedFiles) {
        if (accumLen >= maxChars) break;
        const rawRel = typeof ef === "string" ? ef : ef.relPath;
        if (!rawRel) continue;
        let targetAbs = path.resolve(baseExtractDir, rawRel);
        if (!targetAbs.startsWith(baseExtractDir) || !fs.existsSync(targetAbs)) {
          const strippedRel = rawRel.replace(/^[^/]+\//, "");
          const wsCandidate = path.resolve(workspaceRoot, strippedRel);
          if (wsCandidate.startsWith(workspaceRoot) && fs.existsSync(wsCandidate) && fs.statSync(wsCandidate).isFile()) {
            targetAbs = wsCandidate;
          } else {
            continue;
          }
        }
        const isReadable = typeof ef === "string" ? true : Boolean(ef.isTextReadable || ef.sizeBytes < 512 * 1024);
        if (isReadable) {
          try {
            const st = fs.statSync(targetAbs);
            if (st.size < 512 * 1024) {
              const txt = fs.readFileSync(targetAbs, "utf-8");
              const remaining = maxChars - accumLen;
              const chunk = `\n\n--- FILE: ${rawRel} (${st.size} bytes) ---\n${txt.slice(0, remaining)}`;
              combinedParts.push(chunk);
              accumLen += chunk.length;
            }
          } catch {}
        }
      }

      return res.json({
        ok: true,
        title: item.originalName,
        fileName: item.originalName,
        sizeBytes: item.sizeBytes,
        content: combinedParts.join(""),
        truncated: accumLen >= maxChars
      });
    }

    const fileAbs = path.resolve(ADMIN_IMPORT_BOX_DIR, item.storedFileName);
    if (!fileAbs.startsWith(path.resolve(ADMIN_IMPORT_BOX_DIR)) || !fs.existsSync(fileAbs)) {
      if (item.textPreview) {
        return res.json({
          ok: true,
          title: item.originalName,
          fileName: item.originalName,
          sizeBytes: item.sizeBytes || Buffer.byteLength(item.textPreview, "utf-8"),
          content: item.textPreview.slice(0, maxChars),
          truncated: item.textPreview.length > maxChars
        });
      }
      return res.status(404).json({ ok: false, error: "الملف غير موجود على القرص." });
    }

    let content = "";
    if (isTextExt(item.ext) || !item.ext) {
      content = fs.readFileSync(fileAbs, "utf-8");
    } else {
      content = item.textPreview || `[ملف ثنائي محفوظ في صندوق الاستيراد: /data/admin_import_box/${item.storedFileName} (${item.sizeBytes} بايت)]`;
    }

    return res.json({
      ok: true,
      title: item.originalName,
      fileName: item.originalName,
      sizeBytes: item.sizeBytes,
      content: content.slice(0, maxChars),
      truncated: content.length > maxChars
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || "تعذر قراءة محتوى الملف من صندوق الاستيراد." });
  }
});

// 4. DELETE AN ITEM FROM ADMIN IMPORT BOX
router.delete("/item/:id", (req, res) => {
  try {
    const targetId = String(req.params.id || "").trim();
    const manifest = loadImportBoxManifest();
    const target = manifest.find(i => i.id === targetId);
    if (!target) {
      return res.status(404).json({ ok: false, error: "العنصر غير موجود." });
    }

    const storedAbs = path.resolve(ADMIN_IMPORT_BOX_DIR, target.storedFileName);
    if (storedAbs.startsWith(path.resolve(ADMIN_IMPORT_BOX_DIR)) && fs.existsSync(storedAbs)) {
      try {
        fs.unlinkSync(storedAbs);
      } catch {}
    }

    if (target.extractedDirRelPath) {
      const extractAbs = path.resolve(ADMIN_IMPORT_BOX_DIR, target.extractedDirRelPath);
      if (extractAbs.startsWith(path.resolve(ADMIN_IMPORT_BOX_DIR)) && fs.existsSync(extractAbs)) {
        try {
          fs.rmSync(extractAbs, { recursive: true, force: true });
        } catch {}
      }
    }

    const nextManifest = manifest.filter(i => i.id !== targetId);
    saveImportBoxManifest(nextManifest);

    res.json({ ok: true, items: nextManifest });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || "فشل حذف العنصر." });
  }
});

// 5. EXPORT CLEAN PROJECT ZIP (ZERO-LEAKAGE: NO CONVERSATIONS, NO CLOUD STORAGE CREDENTIALS, NO UPLOADED FILES)
router.get("/export-clean-project", (_req, res) => {
  try {
    const tmpZipPath = path.join("/tmp", `nexus_3_1_clean_share_${Date.now()}.zip`);
    const pyScript = `
import os, sys, json, re, zipfile

root_dir = sys.argv[1]
out_zip = sys.argv[2]

EXCLUDED_DIRS = {
    "node_modules", "dist", ".git", ".aistudio", ".nexus_ideogram_4.0",
    "data", "agent_bridge", "__pycache__", ".vite", "import_box_vault"
}
EXCLUDED_REL_PREFIXES = (
    "public/assets/aistudio",
    "public/generated_files",
    "nexus_lab/genomes",
    "data",
)
EXCLUDED_FILES = {
    "NEXUS_HERMES_MEMORY.json",
    "NEXUS_HERMES_VAULT.json",
    "nexus_global_persistence.json",
    "nexus_global_power_ledger.json",
    "firebase-applet-config.json",
    ".firebaserc",
    ".env",
    ".env.local",
    ".DS_Store"
}

TEXT_EXTS = {
    ".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".txt", ".html", ".css", ".py", ".rules", ".example"
}

REDACTION_PATTERNS = [
    (re.compile(r"[a-zA-Z0-9._%+-]+@gmail\\.com", re.IGNORECASE), "admin@nexus.workspace"),
    (re.compile(r"acct_[a-z0-9_]+_gmail_com_[a-z0-9]+", re.IGNORECASE), "guest"),
    (re.compile(r"ai-studio-nexus31-[a-z0-9-]+", re.IGNORECASE), "(default)"),
    (re.compile(r"AIzaSy[A-Za-z0-9_\\-]{33}"), "YOUR_FIREBASE_API_KEY")
]

def sanitize_text(content: str) -> str:
    for pattern, repl in REDACTION_PATTERNS:
        content = pattern.sub(repl, content)
    return content

with zipfile.ZipFile(out_zip, "w", zipfile.ZIP_DEFLATED) as zf:
    for current_root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS and not d.startswith(".nexus_")]
        rel_dir = os.path.relpath(current_root, root_dir).replace("\\\\", "/")
        if rel_dir == ".":
            rel_dir = ""
        if any(rel_dir == p or rel_dir.startswith(p + "/") for p in EXCLUDED_REL_PREFIXES):
            dirs[:] = []
            continue
        for fname in files:
            if fname in EXCLUDED_FILES:
                continue
            if fname.startswith("NEXUS_GENOME_") and fname.endswith(".md"):
                continue
            if fname.startswith("nexus_sessions__") or fname.startswith("nexus_memory_bank__") or fname.startswith("nexus_firebase_vault__"):
                continue
            abs_p = os.path.join(current_root, fname)
            rel_p = os.path.join(rel_dir, fname).replace("\\\\", "/") if rel_dir else fname
            _, ext = os.path.splitext(fname)
            try:
                if ext.lower() in TEXT_EXTS or fname in ("firestore.rules", ".env.example"):
                    with open(abs_p, "r", encoding="utf-8", errors="ignore") as f:
                        raw_txt = f.read()
                    clean_txt = sanitize_text(raw_txt)
                    zf.writestr(rel_p, clean_txt.encode("utf-8"))
                else:
                    zf.write(abs_p, rel_p)
            except Exception:
                pass

    # 1. Write 100% clean offline-mode firebase-applet-config.json (prevents any cloud storage connection to owner's project)
    clean_firebase_cfg = {
        "projectId": "local-offline-mode",
        "appId": "",
        "apiKey": "",
        "authDomain": "",
        "firestoreDatabaseId": "(default)",
        "storageBucket": "",
        "messagingSenderId": "",
        "measurementId": ""
    }
    zf.writestr("firebase-applet-config.json", json.dumps(clean_firebase_cfg, indent=2).encode("utf-8"))

    # 2. Write clean factory-default NEXUS_HERMES_VAULT.json (skills & ontological nodes only, 0 personal session memories)
    vault_path = os.path.join(root_dir, "NEXUS_HERMES_VAULT.json")
    if os.path.exists(vault_path):
        try:
            with open(vault_path, "r", encoding="utf-8") as vf:
                vault_data = json.load(vf)
            vault_data["memories"] = []
            vault_data["totalEntriesCount"] = 0
            zf.writestr("NEXUS_HERMES_VAULT.json", sanitize_text(json.dumps(vault_data, ensure_ascii=False, indent=2)).encode("utf-8"))
        except Exception:
            pass

    # 3. Write clean factory-default nexus_global_power_ledger.json
    clean_ledger = {
        "globalPowerIndex": 402,
        "evolutionTier": 7,
        "evolutionTierLabelAr": "الطور السابع (الأعلى): الانصهار التشغيلي الكامل للأنظمة الأربعة (0➔4) والمذيب البديهي ومصفوفة الـ 56 مهارة (Woven, Never Listed)",
        "totalSandboxExperiments": 0,
        "totalPromotedSkillsAndExperiences": 0,
        "activeGlobalExperiences": [],
        "lastUpdated": 0
    }
    zf.writestr("nexus_global_power_ledger.json", json.dumps(clean_ledger, ensure_ascii=False, indent=2).encode("utf-8"))

    # 4. Write empty data/.gitkeep so directory structure is ready out of the box
    zf.writestr("data/.gitkeep", b"")

print(out_zip)
`;
    execFileSync("python3", ["-c", pyScript, process.cwd(), tmpZipPath], {
      encoding: "utf-8",
      timeout: 30000
    });

    if (!fs.existsSync(tmpZipPath)) {
      return res.status(500).json({ ok: false, error: "تعذر إنشاء أرشيف المشروع النظيف." });
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="Nexus_Sovereign_Clean_Distributable.zip"');
    const stream = fs.createReadStream(tmpZipPath);
    stream.on("close", () => {
      try {
        fs.unlinkSync(tmpZipPath);
      } catch {}
    });
    stream.pipe(res);
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || "فشل تصدير النسخة النظيفة من المشروع." });
  }
});

export default router;
