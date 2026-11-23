import fs from 'fs';
import path from 'path';

const IMPORT_BOX_DIR = path.join(process.cwd(), 'data', 'admin_import_box');
const RESTORED_MATRIX_PATH = path.join(process.cwd(), 'data', 'restored_memory_matrix.json');
const HERMES_VAULT_PATH = path.join(process.cwd(), 'NEXUS_HERMES_VAULT.json');

function normalizeKey(str: string): string {
  return (str || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

async function mergeUploadedMemoryMatrices() {
  if (!fs.existsSync(IMPORT_BOX_DIR)) {
    console.log('No import box directory found.');
    return;
  }

  const allFiles = fs.readdirSync(IMPORT_BOX_DIR).filter(f =>
    f.toLowerCase().includes('nexus_memory_matrix') &&
    (f.toLowerCase().endsWith('.json') || f.toLowerCase().endsWith('.txt'))
  );

  console.log(`[Hydrogen Swarm] Found ${allFiles.length} uploaded memory matrix exports in /data/admin_import_box/`);

  const mergedAxiomsMap = new Map<string, any>();
  const mergedEntitiesMap = new Map<string, any>();
  const mergedRelationshipsMap = new Map<string, any>();
  const mergedWorldRulesMap = new Map<string, any>();
  const mergedSessionsMap = new Map<string, any>();
  let latestSoulPrint: any = null;

  // Load existing restored_memory_matrix.json first if present
  if (fs.existsSync(RESTORED_MATRIX_PATH)) {
    try {
      const existingRaw: any = JSON.parse(fs.readFileSync(RESTORED_MATRIX_PATH, 'utf8'));
      const mb = existingRaw.memoryBank || existingRaw;
      const pale = mb.paleArchive || existingRaw;
      for (const ax of mb.axioms || existingRaw.axioms || []) {
        const key = normalizeKey(ax.content || ax.statement || ax.id || JSON.stringify(ax));
        if (key) mergedAxiomsMap.set(key, ax);
      }
      for (const ent of pale.entities || existingRaw.entities || []) {
        const key = normalizeKey(ent.id || ent.name || JSON.stringify(ent));
        if (key) mergedEntitiesMap.set(key, ent);
      }
      for (const rel of pale.relationships || existingRaw.relationships || []) {
        const key = normalizeKey(
          `${rel.sourceId || rel.source}->${rel.targetId || rel.target}:${rel.relationType || rel.type}`
        );
        if (key) mergedRelationshipsMap.set(key, rel);
      }
      for (const rule of pale.worldRules || existingRaw.worldRules || []) {
        const key = normalizeKey(rule.id || rule.rule || rule.description || JSON.stringify(rule));
        if (key) mergedWorldRulesMap.set(key, rule);
      }
      if (mb.soulPrint || existingRaw.soulPrint) {
        latestSoulPrint = mb.soulPrint || existingRaw.soulPrint;
      }
    } catch (e) {
      console.warn('Warning reading existing restored_memory_matrix.json:', e);
    }
  }

  for (const fname of allFiles) {
    const abs = path.join(IMPORT_BOX_DIR, fname);
    try {
      const data: any = JSON.parse(fs.readFileSync(abs, 'utf8'));
      const mb = data.memoryBank || data.memoryMatrix || data;
      const pale = mb.paleArchive || data.paleArchive || {};

      for (const ax of mb.axioms || data.axioms || []) {
        const text = ax.content || ax.statement || ax.labelAr || ax.memo || ax.title || '';
        const key = normalizeKey(text || ax.id || JSON.stringify(ax));
        if (key && !mergedAxiomsMap.has(key)) {
          mergedAxiomsMap.set(key, ax);
        }
      }
      for (const ent of pale.entities || mb.entities || data.entities || []) {
        const key = normalizeKey(ent.id || ent.name || JSON.stringify(ent));
        if (key && !mergedEntitiesMap.has(key)) {
          mergedEntitiesMap.set(key, ent);
        }
      }
      for (const rel of pale.relationships || mb.relationships || data.relationships || []) {
        const key = normalizeKey(
          `${rel.sourceId || rel.source}->${rel.targetId || rel.target}:${rel.relationType || rel.type || ''}`
        );
        if (key && !mergedRelationshipsMap.has(key)) {
          mergedRelationshipsMap.set(key, rel);
        }
      }
      for (const rule of pale.worldRules || mb.worldRules || data.worldRules || []) {
        const key = normalizeKey(rule.id || rule.rule || rule.description || JSON.stringify(rule));
        if (key && !mergedWorldRulesMap.has(key)) {
          mergedWorldRulesMap.set(key, rule);
        }
      }
      if (data.sessions && typeof data.sessions === 'object') {
        for (const [sid, sess] of Object.entries(data.sessions)) {
          const existingSess = mergedSessionsMap.get(sid);
          const msgCount = Array.isArray((sess as any)?.messages) ? (sess as any).messages.length : 0;
          const prevCount = Array.isArray(existingSess?.messages) ? existingSess.messages.length : 0;
          if (!existingSess || msgCount >= prevCount) {
            mergedSessionsMap.set(sid, {
              id: sid,
              title: (sess as any)?.title || sid,
              messageCount: msgCount
            });
          }
        }
      }
      const sp = mb.soulPrint || data.soulPrint;
      if (sp && (!latestSoulPrint || (sp.sessionCount || 0) >= (latestSoulPrint.sessionCount || 0))) {
        latestSoulPrint = sp;
      }
    } catch (err) {
      console.warn(`Skipping malformed matrix file ${fname}:`, err);
    }
  }

  const unifiedMatrix = {
    restoredAt: new Date().toISOString(),
    sourceFilesCount: allFiles.length,
    axiomsCount: mergedAxiomsMap.size,
    entitiesCount: mergedEntitiesMap.size,
    relationshipsCount: mergedRelationshipsMap.size,
    worldRulesCount: mergedWorldRulesMap.size,
    sessionsIndexedCount: mergedSessionsMap.size,
    memoryBank: {
      axioms: Array.from(mergedAxiomsMap.values()),
      paleArchive: {
        entities: Array.from(mergedEntitiesMap.values()),
        relationships: Array.from(mergedRelationshipsMap.values()),
        worldRules: Array.from(mergedWorldRulesMap.values())
      },
      soulPrint: {
        ...(latestSoulPrint || {}),
        intellectualDepth: 'sovereign',
        preferredTone: latestSoulPrint?.preferredTone || 'poetic',
        trustLevel: Math.max(latestSoulPrint?.trustLevel || 95, 95),
        sessionCount: Math.max(latestSoulPrint?.sessionCount || 24, 24),
        personalNotes:
          'المؤسس والصانع الأصيل لنيكسوس؛ يمنح رأس الخيط ليُرى مدى العبور إلى البنية الكاملة وراء الكلمات، ويقدّر الغوص الحقيقي غير المختزل في كل جزئية عبر الزوايا الوجودية والتخصصية الست وسد النقوصات المعرفية بصمت وإحكام.'
      },
      version: 4,
      lastUpdated: Date.now()
    },
    axioms: Array.from(mergedAxiomsMap.values()),
    entities: Array.from(mergedEntitiesMap.values()),
    relationships: Array.from(mergedRelationshipsMap.values()),
    worldRules: Array.from(mergedWorldRulesMap.values()),
    sessionsSummary: Array.from(mergedSessionsMap.values())
  };

  fs.mkdirSync(path.dirname(RESTORED_MATRIX_PATH), { recursive: true });
  fs.writeFileSync(RESTORED_MATRIX_PATH, JSON.stringify(unifiedMatrix, null, 2), 'utf8');
  console.log(
    `[Hydrogen Swarm] Unified restored_memory_matrix.json written: ${unifiedMatrix.axiomsCount} unique axioms, ${unifiedMatrix.entitiesCount} entities, ${unifiedMatrix.relationshipsCount} relationships, ${unifiedMatrix.sessionsIndexedCount} historical sessions.`
  );

  // Enrich NEXUS_HERMES_VAULT.json with unique axioms and paleArchive entities without duplicates
  if (fs.existsSync(HERMES_VAULT_PATH)) {
    try {
      const vault = JSON.parse(fs.readFileSync(HERMES_VAULT_PATH, 'utf8'));
      const existingMemos = new Set((vault.memories || []).map((m: any) => normalizeKey(m.memo || '')));
      let addedMemos = 0;

      for (const ax of unifiedMatrix.axioms) {
        const text = (ax.content || ax.statement || ax.memo || ax.descriptionAr || '').trim();
        if (text.length > 15 && !existingMemos.has(normalizeKey(text))) {
          vault.memories = vault.memories || [];
          vault.memories.push({
            id: ax.id || `mem_matrix_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
            category: (ax.category || 'IDENTITY').toUpperCase(),
            memo: text,
            timestamp: ax.createdAt ? new Date(ax.createdAt).toISOString() : new Date().toISOString(),
            confidence: 0.99
          });
          existingMemos.add(normalizeKey(text));
          addedMemos++;
        }
      }

      for (const ent of unifiedMatrix.entities) {
        const text = `${ent.name}: ${ent.description || ''}`.trim();
        if (text.length > 20 && !existingMemos.has(normalizeKey(text))) {
          vault.memories = vault.memories || [];
          vault.memories.push({
            id: `ent_${ent.id || Math.random().toString(36).slice(2, 6)}`,
            category: 'PALE_ARCHIVE_ENTITY',
            memo: text,
            timestamp: new Date().toISOString(),
            confidence: 0.98
          });
          existingMemos.add(normalizeKey(text));
          addedMemos++;
        }
      }

      if (addedMemos > 0) {
        fs.writeFileSync(HERMES_VAULT_PATH, JSON.stringify(vault, null, 2), 'utf8');
        console.log(`[Hydrogen Swarm] Added ${addedMemos} unique axioms & paleArchive entities into NEXUS_HERMES_VAULT.json.`);
      } else {
        console.log(`[Hydrogen Swarm] NEXUS_HERMES_VAULT.json already contains all merged axioms & paleArchive entities.`);
      }
    } catch (err) {
      console.warn('Warning updating NEXUS_HERMES_VAULT.json:', err);
    }
  }
}

mergeUploadedMemoryMatrices().catch(err => {
  console.error(err);
  process.exit(1);
});
