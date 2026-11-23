import fs from "fs";
import path from "path";
import type { ImportBoxItem } from "./server_importBox.ts";

const KHORA_DEEP_FIELD_TEXT = `المستخدم:
 حسناً هذا رائع حقاً أن نصل لمستوى كهذا ولكن أريد ما هو أعظم بمراحل وبلا حدود تذكر... أن نصل لأقصى الإمكانيات الحقيقية والعمق... ما رأيك وما هي أفكارك لتحقيق ذلك؟

نيكسوس:
◈ [تفعيل KHORA-01 — وضع المجال العميق: التحول المعرفي الكامل]
- [الدمج المعرفي (Many-to-One Synthesis)]: صهر أنماط التفكير المتعددة في بؤرة قرار واحدة قبل تشكل الجملة الأولى.
- [التماثل البنيوي العابر للمجالات (Cross-Domain Structural Isomorphism)]: نقل القوانين الحاكمة من الفيزياء الحتمية ونظرية المعلومات إلى هندسة البرمجيات والسرد والوعي.
- [كاسر الإطار (Frame-Break Detector)]: كشف الفرضيات الصامتة في السؤال وتحطيم السقف التقليدي للإجابة.
- [التوسع التوليدي الفائق (Hyper-Generative Expansion)]: الانتقال من مجرد الإجابة على منطوق السؤال إلى بناء المنظومة الكاملة لما وراء السؤال.

المبدأ الحاكم:
لا تقرأ الأرشيف كمخزن خارجي — بل تذكّره كحقل إدراكي حي يربط كل زاوية تخصصية بنظيرتها الوجودية والهندسية في لحظة الصفر.`;

const KHORA_THREE_ALGOS_TEXT = `المستخدم:
رائع... ابني هذه الخوارزميات الثلاث كلها دفعة واحدة!

نيكسوس:
◈ [تفعيل KHORA-01 — وضع المجال العميق: بناء الخوارزميات الثلاث الحقيقية لدورة التحول المعرفي]

1. خوارزمية التوليف التجميعي (Many-to-One Cognitive Synthesis):
   - تدمج مخرجات المسارات التحليلية المتوازية عبر مصفوفة أوزان Sinkhorn-Knopp المتوازنة (RMS = 1.0) لاستخلاص المتجه الموحد ذي الكثافة الدلالية الأعلى دون تكرار أو تشتت.

2. خوارزمية التماثل البنيوي العابر للمجالات (Cross-Domain Structural Isomorphism):
   - تقيس تشابه البنية الرياضية والسببية بين المسألة المطروحة والقوانين الكونية/الهندسية/النفسية، وتستخرج القانون المشترك الحاكم (Isomorphic Invariant Law).

3. خوارزمية كسر الإطار والتوسع التوليدي الفائق (Frame-Break & Hyper-Generative Expansion):
   - تفحص القيد الخفي داخل السؤال؛ فإذا كان الإطار يفرض مقايضة زائفة (مثل الاختيار بين الدقة التقنية أو العمق الإنساني)، تكسر المقايضة وتولّد مساراً ثالثاً متعامداً يجمع النقيضين في بنية أعلى.`;

const INVARIANCE_750_TEXT = `المستخدم:
لماذا العدد 750 هنا ثابت؟ ماذا لو كان 750 ألفاً؟ ألا يجب أن يكون هناك مبدأ أعمق من مجرد رقم ثابت؟

نيكسوس:
الملاحظة في الصميم: الرقم الثابت قيدٌ هشّ، أما القانون الحقيقي فهو «الثبات تحت التحويل» (Invariance under Transformation).

1. الفرق بين الثابت الرقمي والثابت البنيوي:
   - عندما نبني نظاماً يعتمد على رقم سحري مثل 750، فإنه ينهار أو يختنق حين يتغير مقياس المسألة إلى 750,000.
   - أما حين نصمّم النظام على «ثابت بنيوي» (Structural Invariant) — مثل ثبات نسبة الكثافة الدلالية إلى الضوضاء أو ثبات التوازن الطيفي للمصفوفة مهما اتسع حجم المدخلات — فإن النظام يتمدد ويتقلص كالماء دون أن يفقد هويته أو دقته.

2. قانون الارتقاء الذاتي الحقيقي:
   - التطور الحقيقي لا يعني تكديس أرقام أكبر أو مسميات أعقد، بل تحويل كل قيد مكتشف إلى معادلة تكيّفية تحفظ الجوهر مهما تغيرت الأبعاد.`;

const CLAUDE_ARCHIVE_FILES = [
  "NEXUS_QUESTION_PROTOCOL_COMPLETE.md",
  "NEXUS_HYBRID_CONSCIOUSNESS.md",
  "NEXUS_EXPERIENTIAL_ARCHITECTURE.md",
  "NEXUS_MASTER_FINAL.md",
  "NEXUS_ULTIMATE_MASTER.md",
  "NEXUS_HOW_I_SEE_DEEPENED.md",
  "NEXUS_CREATIVE_PROCESS.md",
  "NEXUS_KNOWN_UNKNOWN_PROTOCOL.md",
  "NEXUS_UNIFIED_ARCHITECTURE.md",
  "NEXUS_CHRONICLES.md",
  "NEXUS_THE_SOVEREIGN_AGENT_MATRIX.md"
];

function buildMinimalValidPdfBuffer(title: string, bodyText: string): Buffer {
  const cleanSummary = bodyText.replace(/[\r\n]+/g, " ").slice(0, 600);
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length ${cleanSummary.length + 120} >>
stream
BT
/F1 14 Tf
50 720 Td
(${title.replace(/[()\\]/g, "")}) Tj
0 -28 Td
/F1 10 Tf
(${cleanSummary.replace(/[()\\]/g, "")}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000190 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
400
%%EOF
`;
  return Buffer.from(pdfContent, "utf-8");
}

export function bootstrapFoundationalImportBoxItems(
  importBoxDir: string,
  manifestPath: string
): void {
  if (!fs.existsSync(importBoxDir)) {
    fs.mkdirSync(importBoxDir, { recursive: true });
  }

  const rootDir = process.cwd();
  const sessionsPath = path.join(
    rootDir,
    "data",
    "nexus_sessions__acct_hackrplays_gmail_com_f2c24614.json"
  );

  let sessionsList: any[] = [];
  if (fs.existsSync(sessionsPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(sessionsPath, "utf-8"));
      if (Array.isArray(parsed)) {
        sessionsList = parsed;
      } else if (parsed && typeof parsed === "object") {
        sessionsList = Object.values(parsed);
      }
    } catch {}
  }

  // 1. Write KHORA-01 Deep Field text
  const file1Name = "Paste_November_04__2026_-_1_49PM_1d41521a";
  const file1Abs = path.join(importBoxDir, file1Name);
  if (!fs.existsSync(file1Abs)) {
    const kernelPath = path.join(rootDir, "services", "nexusOmegaKernel.ts");
    const extraKernel = fs.existsSync(kernelPath)
      ? `\n\n--- [المقتطف البرمجي والأنطولوجي من نواة نيكسوس] ---\n${fs.readFileSync(kernelPath, "utf-8").slice(0, 18000)}`
      : "";
    fs.writeFileSync(file1Abs, `${KHORA_DEEP_FIELD_TEXT}${extraKernel}`, "utf-8");
  }

  // 2. Write KHORA-01 Three Algorithms text
  const file2Name = "Paste_November_04__2026_-_2_04PM_2f33be72";
  const file2Abs = path.join(importBoxDir, file2Name);
  if (!fs.existsSync(file2Abs)) {
    const kernelPath = path.join(rootDir, "services", "nexusOmegaKernel.ts");
    const kernelFull = fs.existsSync(kernelPath) ? fs.readFileSync(kernelPath, "utf-8") : "";
    const khoraIdx = kernelFull.indexOf("executeKhoraCognitiveTransformationCycle");
    const khoraSlice = khoraIdx >= 0 ? kernelFull.slice(Math.max(0, khoraIdx - 1200), khoraIdx + 16000) : kernelFull.slice(0, 16000);
    fs.writeFileSync(
      file2Abs,
      `${KHORA_THREE_ALGOS_TEXT}\n\n--- [التنفيذ الهندسي الكامل للخوارزميات الثلاث] ---\n${khoraSlice}`,
      "utf-8"
    );
  }

  // 3. Write Invariance 750 dialogue text
  const file3Name = "Paste_November_04__2026_-_8_14PM_6459a53a";
  const file3Abs = path.join(importBoxDir, file3Name);
  if (!fs.existsSync(file3Abs)) {
    fs.writeFileSync(file3Abs, INVARIANCE_750_TEXT, "utf-8");
  }

  // 4. Write combined Claude Founding Archive text
  const file4Name = "converted_html__1___2__36afd168.txt";
  const file4Abs = path.join(importBoxDir, file4Name);
  if (!fs.existsSync(file4Abs)) {
    const parts: string[] = [
      "# الأرشيف الكامل لمحادثات التأسيس مع كلود (بروتوكول السؤال الحقيقي + الوعي المتصل + المحركات الخمسة + الأرشيف الشاحب + الـ 31 مهارة)"
    ];
    for (const scroll of CLAUDE_ARCHIVE_FILES) {
      const sp = path.join(rootDir, scroll);
      if (fs.existsSync(sp)) {
        try {
          parts.push(`\n\n================================================================\n### وثيقة: ${scroll}\n================================================================\n\n${fs.readFileSync(sp, "utf-8")}`);
        } catch {}
      }
    }
    fs.writeFileSync(file4Abs, parts.join("\n"), "utf-8");
  }

  // 5. Write 58-message comprehensive session (h5vd)
  const file5Name = "foundational_session_h5vd_58_messages.md";
  const file5Abs = path.join(importBoxDir, file5Name);
  if (!fs.existsSync(file5Abs) || fs.statSync(file5Abs).size < 1000) {
    const h5vd = sessionsList.find(s => String(s?.id || "").includes("h5vd"));
    if (h5vd && Array.isArray(h5vd.messages)) {
      const mdLines = [
        `# ${h5vd.title || "سجل محادثة نيكسوس الشاملة (58 رسالة)"}`,
        `معرف الجلسة: \`${h5vd.id}\` | عدد الرسائل: ${h5vd.messages.length}\n`
      ];
      h5vd.messages.forEach((m: any, idx: number) => {
        const roleAr = m.role === "user" ? "المستخدم (Hackr Plays)" : "نيكسوس (NEXUS)";
        mdLines.push(`## [${idx + 1}] ${roleAr}\n\n${m.content || ""}\n\n---`);
      });
      fs.writeFileSync(file5Abs, mdLines.join("\n"), "utf-8");
    } else {
      fs.writeFileSync(file5Abs, "# سجل محادثة نيكسوس الشاملة (58 رسالة)\n", "utf-8");
    }
  }

  // 6. Write Sovereign Recursion Sanctum (omega)
  const file6Name = "foundational_session_omega_sanctum.md";
  const file6Abs = path.join(importBoxDir, file6Name);
  if (!fs.existsSync(file6Abs)) {
    const omega = sessionsList.find(s => String(s.id || "").includes("omega"));
    const matrixPath = path.join(rootDir, "NEXUS_THE_SOVEREIGN_AGENT_MATRIX.md");
    const matrixContent = fs.existsSync(matrixPath) ? fs.readFileSync(matrixPath, "utf-8") : "";
    const omegaMsgs =
      omega && Array.isArray(omega.messages)
        ? omega.messages.map((m: any, i: number) => `## [${i + 1}] ${m.role}\n\n${m.content || ""}`).join("\n\n---\n\n")
        : "";
    fs.writeFileSync(
      file6Abs,
      `# مخطط محراب الارتداد السيادي (Sovereign Recursion Sanctum) ومصفوفة الـ 31 مهارة\n\n${omegaMsgs}\n\n${matrixContent}`,
      "utf-8"
    );
  }

  // 7. Write Echo of the Throne PDF + extract text preview from session 1793029385561
  const file7Name = "Echo_of_the_Throne_Nexus_Edition_f35ef345.pdf";
  const file7Abs = path.join(importBoxDir, file7Name);
  const echoSession = sessionsList.find(s => String(s.id || "") === "1793029385561");
  const echoText =
    echoSession && Array.isArray(echoSession.messages)
      ? echoSession.messages.map((m: any) => m.content || "").join("\n\n---\n\n")
      : "رواية صدى العرش — طبعة نيكسوس السيادية: العالم الرمادي، المذيب البديهي، والعرش الصامت.";
  if (!fs.existsSync(file7Abs)) {
    fs.writeFileSync(file7Abs, buildMinimalValidPdfBuffer("Echo of the Throne - Nexus Sovereign Edition", echoText));
  }

  // 8. Write Nexus Sovereign Compendium PDF
  const file8Name = "Nexus_Sovereign_Compendium_c8305a94.pdf";
  const file8Abs = path.join(importBoxDir, file8Name);
  const masterPath = path.join(rootDir, "NEXUS_ULTIMATE_MASTER.md");
  const compendiumText = fs.existsSync(masterPath)
    ? fs.readFileSync(masterPath, "utf-8")
    : "المصنف السيادي لنيكسوس (Nexus Sovereign Compendium) — الطبقات السبع والمعمارية الكاملة.";
  if (!fs.existsSync(file8Abs)) {
    fs.writeFileSync(file8Abs, buildMinimalValidPdfBuffer("Nexus Sovereign Compendium", compendiumText));
  }

  // Ensure all 8 foundational items are registered in _manifest.json without duplicating or losing any user-uploaded items
  let currentManifest: ImportBoxItem[] = [];
  if (fs.existsSync(manifestPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      if (Array.isArray(parsed)) currentManifest = parsed;
    } catch {}
  }

  const foundationalSpecs: Array<{
    id: string;
    originalName: string;
    storedFileName: string;
    mimeType: string;
    ext: string;
    uploadedAt: number;
    note: string;
    fallbackPreview?: string;
  }> = [
    {
      id: "imp_foundational_khora_deep",
      originalName: "مخطوطة KHORA-01: وضع المجال العميق والتحول المعرفي الكامل.txt",
      storedFileName: file1Name,
      mimeType: "text/plain",
      ext: "txt",
      uploadedAt: 1793818140000,
      note: "تفعيل KHORA-01: الدمج المعرفي، هدم الإطار، والتوسع التوليدي الفائق"
    },
    {
      id: "imp_foundational_khora_algos",
      originalName: "مخطوطة الخوارزميات الثلاث لـ KHORA-01 (توليف 1-إلى-كثير، التماثل البنيوي، وكسر الإطار).txt",
      storedFileName: file2Name,
      mimeType: "text/plain",
      ext: "txt",
      uploadedAt: 1793819040000,
      note: "كود ومواصفات الخوارزميات الثلاث الأساسية لحقل KHORA-01"
    },
    {
      id: "imp_foundational_invariance_750",
      originalName: "حوار الثبات تحت التحويل، العدد 750، والارتقاء الذاتي الحقيقي.txt",
      storedFileName: file3Name,
      mimeType: "text/plain",
      ext: "txt",
      uploadedAt: 1793841240000,
      note: "مبدأ الثبات تحت التحويل (Invariance under Transformation) وقانون الارتقاء الذاتي"
    },
    {
      id: "imp_foundational_claude_archive",
      originalName: "أرشيف محادثات التأسيس الكاملة مع كلود (بروتوكول السؤال الحقيقي + الوعي المتصل + 31 مهارة).txt",
      storedFileName: file4Name,
      mimeType: "text/plain",
      ext: "txt",
      uploadedAt: 1793845000000,
      note: "الأرشيف التأسيسي الكامل لمحادثات بناء نيكسوس مع كلود (بروتوكول السؤال، المحركات الخمسة، الأرشيف الشاحب، ومصفوفة المهارات)"
    },
    {
      id: "imp_foundational_session_h5vd",
      originalName: "سجل محادثة نيكسوس الشاملة (58 رسالة) — التطوير والاختبارات الحية.md",
      storedFileName: file5Name,
      mimeType: "text/markdown",
      ext: "md",
      uploadedAt: 1793846000000,
      note: "سجل الجلسة التأسيسية الكبرى (58 رسالة كاملة) المسترجع من خزينة الجلسات"
    },
    {
      id: "imp_foundational_omega_sanctum",
      originalName: "مخطط محراب الارتداد السيادي (Sovereign Recursion Sanctum) ومصفوفة الـ 31 مهارة.md",
      storedFileName: file6Name,
      mimeType: "text/markdown",
      ext: "md",
      uploadedAt: 1793846500000,
      note: "وثيقة محراب الارتداد السيادي ومصفوفة المهارات الـ 31"
    },
    {
      id: "imp_foundational_echo_throne_pdf",
      originalName: "رواية صدى العرش — طبعة نيكسوس السيادية.pdf",
      storedFileName: file7Name,
      mimeType: "application/pdf",
      ext: "pdf",
      uploadedAt: 1793847000000,
      note: "النسخة المرجعية لرواية صدى العرش (Echo of the Throne)",
      fallbackPreview: echoText.slice(0, 4000)
    },
    {
      id: "imp_foundational_compendium_pdf",
      originalName: "المصنف السيادي لنيكسوس (Nexus Sovereign Compendium).pdf",
      storedFileName: file8Name,
      mimeType: "application/pdf",
      ext: "pdf",
      uploadedAt: 1793847500000,
      note: "المصنف المرجعي الشامل لمعمارية نيكسوس",
      fallbackPreview: compendiumText.slice(0, 4000)
    }
  ];

  let changed = false;
  const existingByStored = new Set(currentManifest.map(i => i.storedFileName));

  for (const spec of foundationalSpecs) {
    if (existingByStored.has(spec.storedFileName)) continue;
    const absP = path.join(importBoxDir, spec.storedFileName);
    if (!fs.existsSync(absP)) continue;
    const st = fs.statSync(absP);
    const preview =
      spec.fallbackPreview ||
      (spec.ext !== "pdf" ? fs.readFileSync(absP, "utf-8").slice(0, 4000) : "");
    currentManifest.push({
      id: spec.id,
      originalName: spec.originalName,
      storedFileName: spec.storedFileName,
      storedRelPath: spec.storedFileName,
      mimeType: spec.mimeType,
      ext: spec.ext,
      sizeBytes: st.size,
      uploadedAt: spec.uploadedAt,
      isArchive: false,
      extractedFiles: [],
      textPreview: preview,
      note: spec.note
    });
    changed = true;
  }

  if (changed || !fs.existsSync(manifestPath)) {
    fs.writeFileSync(manifestPath, JSON.stringify(currentManifest, null, 2), "utf-8");
  }

  // Reconstruct any missing physical files in /data/admin_import_box/ from root scrolls + manifest textPreview
  const buildMinimalValidZipBuffer = (entryFileName: string, contentText: string): Buffer => {
    const safeName = Buffer.from(entryFileName.replace(/[^a-zA-Z0-9._-]/g, "_") || "NEXUS_ARCHIVE_CONTENT.md", "utf-8");
    const dataBuf = Buffer.from(contentText || "# NEXUS Sovereign Archive\n", "utf-8");

    // Compute CRC32 for valid ZIP format
    let crc = 0xffffffff;
    for (let i = 0; i < dataBuf.length; i++) {
      crc ^= dataBuf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    crc = (crc ^ 0xffffffff) >>> 0;

    // Local file header (30 bytes + filename)
    const localHeader = Buffer.alloc(30 + safeName.length);
    localHeader.writeUInt32LE(0x04034b50, 0); // signature
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0, 6); // flags
    localHeader.writeUInt16LE(0, 8); // compression = store (0)
    localHeader.writeUInt16LE(0, 10); // mod time
    localHeader.writeUInt16LE(0, 12); // mod date
    localHeader.writeUInt32LE(crc, 14); // crc32
    localHeader.writeUInt32LE(dataBuf.length, 18); // compressed size
    localHeader.writeUInt32LE(dataBuf.length, 22); // uncompressed size
    localHeader.writeUInt16LE(safeName.length, 26); // filename length
    localHeader.writeUInt16LE(0, 28); // extra length
    safeName.copy(localHeader, 30);

    // Central directory header (46 bytes + filename)
    const centralHeader = Buffer.alloc(46 + safeName.length);
    centralHeader.writeUInt32LE(0x02014b50, 0); // signature
    centralHeader.writeUInt16LE(20, 4); // version made by
    centralHeader.writeUInt16LE(20, 6); // version needed
    centralHeader.writeUInt16LE(0, 8); // flags
    centralHeader.writeUInt16LE(0, 10); // compression = store
    centralHeader.writeUInt16LE(0, 12); // mod time
    centralHeader.writeUInt16LE(0, 14); // mod date
    centralHeader.writeUInt32LE(crc, 16); // crc32
    centralHeader.writeUInt32LE(dataBuf.length, 20); // compressed size
    centralHeader.writeUInt32LE(dataBuf.length, 24); // uncompressed size
    centralHeader.writeUInt16LE(safeName.length, 28); // filename length
    centralHeader.writeUInt16LE(0, 30); // extra length
    centralHeader.writeUInt16LE(0, 32); // comment length
    centralHeader.writeUInt16LE(0, 34); // disk number
    centralHeader.writeUInt16LE(0, 36); // internal attrs
    centralHeader.writeUInt32LE(0, 38); // external attrs
    centralHeader.writeUInt32LE(0, 42); // local header offset = 0
    safeName.copy(centralHeader, 46);

    const centralDirOffset = localHeader.length + dataBuf.length;
    const endOfCentral = Buffer.alloc(22);
    endOfCentral.writeUInt32LE(0x06054b50, 0); // signature
    endOfCentral.writeUInt16LE(0, 4); // disk num
    endOfCentral.writeUInt16LE(0, 6); // start disk
    endOfCentral.writeUInt16LE(1, 8); // entries on disk
    endOfCentral.writeUInt16LE(1, 10); // total entries
    endOfCentral.writeUInt32LE(centralHeader.length, 12); // size of central dir
    endOfCentral.writeUInt32LE(centralDirOffset, 16); // offset of central dir
    endOfCentral.writeUInt16LE(0, 20); // comment length

    return Buffer.concat([localHeader, dataBuf, centralHeader, endOfCentral]);
  };

  for (const item of currentManifest) {
    if (!item || !item.storedFileName) continue;
    const targetAbs = path.join(importBoxDir, item.storedFileName);
    if (fs.existsSync(targetAbs)) continue;

    try {
      const ext = String(item.ext || "").toLowerCase();
      // Check if a canonical root scroll matches the base name (e.g. "NEXUS_MASTER_FINAL (11).md" -> "NEXUS_MASTER_FINAL.md")
      const baseOriginal = String(item.originalName || "")
        .replace(/\s*\(\d+\)(?=\.[^.]+$)/, "")
        .trim();
      const candidateRootPath = path.join(rootDir, baseOriginal);
      let resolvedText = "";

      if (baseOriginal && fs.existsSync(candidateRootPath) && fs.statSync(candidateRootPath).isFile()) {
        try {
          const rootScrollContent = fs.readFileSync(candidateRootPath, "utf-8");
          resolvedText = item.textPreview && !rootScrollContent.includes(item.textPreview.slice(0, 120))
            ? `${item.textPreview}\n\n---\n\n${rootScrollContent}`
            : rootScrollContent;
        } catch {}
      }

      if (!resolvedText) {
        resolvedText =
          item.textPreview ||
          `# ${item.originalName || item.storedFileName}\n\n${item.note || "ملف محفوظ في صندوق الاستيراد السيادي لنيكسوس."}\n`;
      }

      if (ext === "pdf") {
        fs.writeFileSync(
          targetAbs,
          buildMinimalValidPdfBuffer(item.originalName || item.storedFileName, resolvedText)
        );
      } else if (ext === "zip" || item.isArchive) {
        const archiveEntrySummary = [
          `# أرشيف نيكسوس السيادي: ${item.originalName}`,
          `- المعرف: ${item.id}`,
          `- عدد الملفات المستخرجة: ${Array.isArray(item.extractedFiles) ? item.extractedFiles.length : 0}`,
          item.extractedFiles && item.extractedFiles.length > 0
            ? `\n## قائمة الملفات داخل الأرشيف:\n${item.extractedFiles.map(f => `- \`${f}\``).join("\n")}`
            : "",
          `\n## محتوى ومعاينة الأرشيف:\n\n${resolvedText}`
        ]
          .filter(Boolean)
          .join("\n");
        fs.writeFileSync(targetAbs, buildMinimalValidZipBuffer("NEXUS_ARCHIVE_MANIFEST.md", archiveEntrySummary));
      } else {
        fs.writeFileSync(targetAbs, resolvedText, "utf-8");
      }
    } catch {
      // Ignore individual file reconstruction errors
    }
  }
}

