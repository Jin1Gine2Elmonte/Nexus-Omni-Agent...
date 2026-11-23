import fs from 'fs';
import path from 'path';

const PRIMARY_DATA_DIR = path.join(process.cwd(), 'data');
const LEGACY_TMP_DATA_DIR = '/tmp/nexus_private_runtime_data';
const DATA_DIR = PRIMARY_DATA_DIR;

export interface RecoverySummary {
  success: boolean;
  totalSessionsRecovered: number;
  totalMessagesRecovered: number;
  totalAxiomsRecovered: number;
  sessionTitles: Array<{ id: string; title: string; messageCount: number; lastActiveAt: number }>;
  scopesUpdated: string[];
}

function sanitizeScope(rawScope?: string): string {
  const cleaned = String(rawScope || 'guest')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 80);
  return cleaned.length >= 2 ? cleaned : 'guest';
}

/**
 * Recovers local disk sessions and memory bank strictly isolated to the active accountScope.
 * Never merges across accounts and contains zero hardcoded conversations or personal identifiers.
 */
export async function recoverAllCloudAndDiskSessions(
  requestedScope = 'guest'
): Promise<RecoverySummary> {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const safeScope = sanitizeScope(requestedScope);
  const mergedSessions: Record<string, any> = {};
  let totalAxioms = 0;

  const candidateDirs = fs.existsSync(LEGACY_TMP_DATA_DIR)
    ? [DATA_DIR, LEGACY_TMP_DATA_DIR]
    : [DATA_DIR];

  const sessPath = path.join(DATA_DIR, `nexus_sessions__${safeScope}.json`);
  for (const dir of candidateDirs) {
    const dirSessPath = path.join(dir, `nexus_sessions__${safeScope}.json`);
    if (fs.existsSync(dirSessPath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(dirSessPath, 'utf-8'));
        if (raw && typeof raw === 'object') {
          for (const [id, sess] of Object.entries<any>(raw)) {
            if (!mergedSessions[id] && sess) {
              mergedSessions[id] = sess;
            }
          }
        }
      } catch {
        // ignore malformed local session file
      }
    }

    const vaultPath = path.join(dir, `nexus_firebase_vault__${safeScope}.json`);
    if (fs.existsSync(vaultPath)) {
      try {
        const rawVault = JSON.parse(fs.readFileSync(vaultPath, 'utf-8'));
        if (rawVault?.sessions && typeof rawVault.sessions === 'object') {
          for (const [id, sess] of Object.entries<any>(rawVault.sessions)) {
            if (!mergedSessions[id] && sess) {
              mergedSessions[id] = sess;
            }
          }
        }
      } catch {
        // ignore malformed vault file
      }
    }

    const memPath = path.join(dir, `nexus_memory_bank__${safeScope}.json`);
    if (fs.existsSync(memPath)) {
      try {
        const rawMem = JSON.parse(fs.readFileSync(memPath, 'utf-8'));
        if (Array.isArray(rawMem?.axioms)) {
          totalAxioms = Math.max(totalAxioms, rawMem.axioms.length);
        }
      } catch {
        // ignore
      }
    }
  }

  if (Object.keys(mergedSessions).length > 0) {
    try {
      fs.writeFileSync(sessPath, JSON.stringify(mergedSessions, null, 2), 'utf-8');
    } catch {
      // ignore write error
    }
  }

  const sessionTitles = Object.values(mergedSessions)
    .map((s: any) => ({
      id: s.id,
      title: s.title || 'محادثة',
      messageCount: Array.isArray(s.messages) ? s.messages.length : 0,
      lastActiveAt: s.lastActiveAt || s.updatedAt || 0,
    }))
    .sort((a, b) => b.lastActiveAt - a.lastActiveAt);

  const totalMessagesRecovered = sessionTitles.reduce((acc, s) => acc + s.messageCount, 0);

  return {
    success: true,
    totalSessionsRecovered: sessionTitles.length,
    totalMessagesRecovered,
    totalAxiomsRecovered: totalAxioms,
    sessionTitles,
    scopesUpdated: [safeScope],
  };
}
