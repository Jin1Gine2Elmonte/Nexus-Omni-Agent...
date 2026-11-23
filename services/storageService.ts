import type { Session, SessionsMap, Message, MemoryBank, SoulPrint, Axiom } from '../types.ts';
import {
  DEFAULT_COGNITIVE_ORBITS,
  initializeSkillEvolutions,
  sanitizeMemoryBank,
  filterAndDeduplicateAxioms,
  filterAndDeduplicateEntities
} from './sovereignVaultAndOrbitsService.ts';

const BASE_SESSIONS_KEY = 'nexus_omni_memory_v2';
const BASE_MEMORY_BANK_KEY = 'nexus_omni_memory_bank';
const ACTIVE_ACCOUNT_SCOPE_KEY = 'nexus_active_account_scope';
const SAVED_ACCOUNTS_REGISTRY_KEY = 'nexus_firebase_saved_accounts_v2';
const DB_NAME = 'Nexus_Titanium_Core';
const STORE_NAME = 'sessions_store';
const MEMORY_STORE_NAME = 'memory_bank_store';
const SHARD_SIZE = 500 * 1024; // 500KB per shard to ensure smooth browser performance

export interface SavedFirebaseAccountEntry {
  accountScope: string;
  scopeId: string;
  uid: string;
  email: string;
  name: string;
  picture: string;
  lastActiveAt: number;
}

/**
 * Computes a deterministic, safe account scope identifier from a user's email or UID.
 * Ensures that each account has its own isolated namespace in Browser, Server, and Firebase storage,
 * and that logging out or switching accounts never leaks conversations across accounts.
 */
export function deriveAccountScopeId(
  email?: string | null,
  uid?: string | null,
  ..._extra: any[]
): string {
  const firstStr = (email || '').trim();
  const secondStr = (uid || '').trim();
  const resolvedEmail = firstStr.includes('@')
    ? firstStr.toLowerCase()
    : secondStr.includes('@')
    ? secondStr.toLowerCase()
    : '';
  if (resolvedEmail) {
    // Deterministic FNV-1a 32-bit hash of the normalized email
    let hash = 2166136261;
    for (let i = 0; i < resolvedEmail.length; i++) {
      hash ^= resolvedEmail.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const hexHash = (hash >>> 0).toString(16).padStart(8, '0');
    const safePrefix = resolvedEmail
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 28);
    return `acct_${safePrefix || 'user'}_${hexHash}`;
  }

  const candidateId = (firstStr || secondStr).replace(/[^a-zA-Z0-9_-]/g, '');
  if (candidateId) {
    return `acct_uid_${candidateId.slice(0, 48)}`;
  }

  return 'guest';
}

let currentActiveAccountScope: string = (() => {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(ACTIVE_ACCOUNT_SCOPE_KEY);
      if (saved && /^[a-zA-Z0-9_-]+$/.test(saved)) {
        return saved;
      }
    }
  } catch {
    // ignore
  }
  return 'guest';
})();

export function getActiveAccountScope(): string {
  return currentActiveAccountScope || 'guest';
}

export function setActiveAccountScope(scopeId: string | null | undefined): string {
  const cleanScope =
    scopeId && /^[a-zA-Z0-9_-]+$/.test(scopeId.trim()) ? scopeId.trim() : 'guest';
  currentActiveAccountScope = cleanScope;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ACTIVE_ACCOUNT_SCOPE_KEY, cleanScope);
    }
  } catch {
    // ignore
  }
  return cleanScope;
}

export function getScopedSessionsKey(scopeOverride?: string): string {
  const scope = scopeOverride || getActiveAccountScope();
  return `${BASE_SESSIONS_KEY}__${scope}`;
}

export function getScopedMemoryBankKey(scopeOverride?: string): string {
  const scope = scopeOverride || getActiveAccountScope();
  return `${BASE_MEMORY_BANK_KEY}__${scope}`;
}

export function getSavedAccountsRegistry(): SavedFirebaseAccountEntry[] {
  try {
    const raw = localStorage.getItem(SAVED_ACCOUNTS_REGISTRY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item: any) =>
          item &&
          (typeof item.accountScope === 'string' || typeof item.scopeId === 'string') &&
          typeof item.email === 'string'
      )
      .map((item: any) => {
        const resolvedScope =
          item.accountScope || item.scopeId || deriveAccountScopeId(item.email, item.uid);
        return {
          ...item,
          accountScope: resolvedScope,
          scopeId: resolvedScope
        };
      });
  } catch {
    return [];
  }
}

export function registerSavedAccountOnDevice(
  entry: Omit<SavedFirebaseAccountEntry, 'accountScope' | 'scopeId'> & {
    accountScope?: string;
    scopeId?: string;
  }
): SavedFirebaseAccountEntry[] {
  try {
    const resolvedScope =
      entry.accountScope || entry.scopeId || deriveAccountScopeId(entry.email, entry.uid);
    const normalizedEntry: SavedFirebaseAccountEntry = {
      accountScope: resolvedScope,
      scopeId: resolvedScope,
      uid: entry.uid,
      email: entry.email,
      name: entry.name,
      picture: entry.picture,
      lastActiveAt: entry.lastActiveAt || Date.now()
    };
    const current = getSavedAccountsRegistry();
    const normalizedEmail = (entry.email || '').trim().toLowerCase();
    const filtered = current.filter(
      a =>
        a.accountScope !== resolvedScope &&
        a.scopeId !== resolvedScope &&
        a.email.trim().toLowerCase() !== normalizedEmail
    );
    const updated = [normalizedEntry, ...filtered].slice(0, 10);
    localStorage.setItem(SAVED_ACCOUNTS_REGISTRY_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function removeSavedAccountFromDevice(accountScopeOrEmail: string): SavedFirebaseAccountEntry[] {
  try {
    const target = accountScopeOrEmail.trim().toLowerCase();
    const current = getSavedAccountsRegistry();
    const updated = current.filter(
      a =>
        a.accountScope.toLowerCase() !== target &&
        a.scopeId.toLowerCase() !== target &&
        a.email.trim().toLowerCase() !== target
    );
    localStorage.setItem(SAVED_ACCOUNTS_REGISTRY_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

// --- SIZE & TELEMETRY HELPERS ---
export const calculateObjectSize = (obj: any): number => {
  try {
    const str = JSON.stringify(obj);
    return new Blob([str]).size;
  } catch {
    return 0;
  }
};

export const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// --- TITANIUM STORAGE ENGINE (INDEXEDDB + SHARDING + ACCOUNT ISOLATION) ---

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(MEMORY_STORE_NAME)) {
        db.createObjectStore(MEMORY_STORE_NAME);
      }
    };
    request.onsuccess = (event: any) => resolve(event.target.result);
    request.onerror = (event: any) => reject(event.target.error);
  });
};

const resolveTitaniumScopedKey = (key: string, scopeOverride?: string): string => {
  const scope = scopeOverride || getActiveAccountScope();
  if (key.includes('__')) return key;
  if (key === BASE_SESSIONS_KEY) return getScopedSessionsKey(scope);
  if (key === BASE_MEMORY_BANK_KEY) return getScopedMemoryBankKey(scope);
  return `${key}__${scope}`;
};

export const saveToTitanium = async (
  key: string,
  data: any,
  storeName: string = STORE_NAME,
  scopeOverride?: string
) => {
  try {
    const scopedKey = resolveTitaniumScopedKey(key, scopeOverride);
    const db = await initDB();
    const jsonString = JSON.stringify(data);
    const totalLength = jsonString.length;
    const numShards = Math.ceil(totalLength / SHARD_SIZE);

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      // Save metadata for this account scope
      store.put(
        { numShards, timestamp: Date.now(), totalBytes: totalLength },
        `${scopedKey}_meta`
      );

      // Save shards for this account scope
      for (let i = 0; i < numShards; i++) {
        const shard = jsonString.slice(i * SHARD_SIZE, (i + 1) * SHARD_SIZE);
        store.put(shard, `${scopedKey}_shard_${i}`);
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = (event: any) => reject(event.target.error);
    });
  } catch (e) {
    console.error(`Titanium Storage Save Error (${storeName}):`, e);
  }
};

export const loadFromTitanium = async <T>(
  key: string,
  storeName?: string,
  scopeOverride?: string
): Promise<T | null> => {
  const isActualStoreName =
    storeName === STORE_NAME || storeName === MEMORY_STORE_NAME;
  const effectiveScopeOverride =
    scopeOverride || (!isActualStoreName && storeName ? storeName : undefined);
  const resolvedStore = isActualStoreName
    ? (storeName as string)
    : key.includes('memory_bank')
    ? MEMORY_STORE_NAME
    : STORE_NAME;
  try {
    const scopedKey = resolveTitaniumScopedKey(key, effectiveScopeOverride);
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([resolvedStore], 'readonly');
      const store = transaction.objectStore(resolvedStore);
      const metaReq = store.get(`${scopedKey}_meta`);

      metaReq.onsuccess = () => {
        const meta = metaReq.result;
        if (!meta || !meta.numShards) {
          // Backward compatibility fallback for old single-blob format if scopedKey exists directly
          const legacyReq = store.get(scopedKey);
          legacyReq.onsuccess = () => resolve(legacyReq.result || null);
          legacyReq.onerror = () => resolve(null);
          return;
        }

        const shards: string[] = new Array(meta.numShards);
        let loadedShards = 0;

        for (let i = 0; i < meta.numShards; i++) {
          const shardReq = store.get(`${scopedKey}_shard_${i}`);
          shardReq.onsuccess = () => {
            shards[i] = shardReq.result;
            loadedShards++;
            if (loadedShards === meta.numShards) {
              try {
                const fullJson = shards.join('');
                resolve(JSON.parse(fullJson));
              } catch (err) {
                console.error('Titanium Shards Reassembly Error:', err);
                resolve(null);
              }
            }
          };
          shardReq.onerror = () => reject(shardReq.error);
        }
      };
      metaReq.onerror = () => reject(metaReq.error);
    });
  } catch (e) {
    console.error(`Titanium Storage Load Error (${resolvedStore}):`, e);
    return null;
  }
};

/**
 * Scans ALL keys in IndexedDB (Nexus_Titanium_Core -> sessions_store) and localStorage
 * across all historical scopes (guest, unscoped, acct_*) so no browser session is ever stranded.
 */
export const scanAndRecoverAllBrowserSessions = async (): Promise<SessionsMap> => {
  const recovered: SessionsMap = {};

  const mergeIntoRecovered = (candidateMap: any) => {
    if (!candidateMap || typeof candidateMap !== 'object') return;
    for (const [id, sess] of Object.entries<any>(candidateMap)) {
      if (!sess || typeof sess !== 'object' || !Array.isArray(sess.messages)) continue;
      if (sess.messages.length === 0) continue;
      const normalizedMessages: Message[] = sess.messages.map((m: any) => ({
        ...m,
        content: m.content ?? m.text ?? '',
        timestamp: typeof m.timestamp === 'number' ? m.timestamp : Date.now(),
      }));
      const existing = recovered[id];
      if (!existing || normalizedMessages.length >= existing.messages.length) {
        recovered[id] = {
          ...existing,
          ...sess,
          id: sess.id || id,
          title: sess.title || existing?.title || 'محادثة مستعادة',
          messages: normalizedMessages,
          createdAt: sess.createdAt || existing?.createdAt || Date.now(),
          lastActiveAt: Math.max(
            sess.lastActiveAt || 0,
            sess.updatedAt || 0,
            existing?.lastActiveAt || 0
          ),
        };
      }
    }
  };

  // 1. Scan all localStorage keys containing nexus_omni_memory_v2
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(BASE_SESSIONS_KEY)) {
        try {
          const raw = localStorage.getItem(k);
          if (raw) mergeIntoRecovered(JSON.parse(raw));
        } catch {
          // ignore
        }
      }
    }
  } catch {
    // ignore
  }

  // 2. Scan all IndexedDB keys inside STORE_NAME
  try {
    const db = await initDB();
    const allKeys: string[] = await new Promise((resolve) => {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const req = tx.objectStore(STORE_NAME).getAllKeys();
      req.onsuccess = () => resolve((req.result || []).map(String));
      req.onerror = () => resolve([]);
    });

    const baseKeys = new Set<string>();
    for (const k of allKeys) {
      if (k.endsWith('_meta')) {
        baseKeys.add(k.slice(0, -5));
      } else if (!k.includes('_shard_')) {
        baseKeys.add(k);
      }
    }

    for (const baseKey of baseKeys) {
      try {
        const data: any = await new Promise((resolve) => {
          const tx = db.transaction([STORE_NAME], 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const metaReq = store.get(`${baseKey}_meta`);
          metaReq.onsuccess = () => {
            const meta = metaReq.result;
            if (!meta || !meta.numShards) {
              const directReq = store.get(baseKey);
              directReq.onsuccess = () => resolve(directReq.result || null);
              directReq.onerror = () => resolve(null);
              return;
            }
            const shards: string[] = new Array(meta.numShards);
            let count = 0;
            for (let s = 0; s < meta.numShards; s++) {
              const sReq = store.get(`${baseKey}_shard_${s}`);
              sReq.onsuccess = () => {
                shards[s] = sReq.result;
                count++;
                if (count === meta.numShards) {
                  try {
                    resolve(JSON.parse(shards.join('')));
                  } catch {
                    resolve(null);
                  }
                }
              };
              sReq.onerror = () => resolve(null);
            }
          };
          metaReq.onerror = () => resolve(null);
        });
        if (data) mergeIntoRecovered(data);
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }

  return recovered;
};

export const clearTitaniumScope = async (scopeOverride?: string): Promise<void> => {
  try {
    const scope = scopeOverride || getActiveAccountScope();
    const sessKey = getScopedSessionsKey(scope);
    const memKey = getScopedMemoryBankKey(scope);
    const db = await initDB();
    const tx = db.transaction([STORE_NAME, MEMORY_STORE_NAME], 'readwrite');
    tx.objectStore(STORE_NAME).delete(`${sessKey}_meta`);
    tx.objectStore(MEMORY_STORE_NAME).delete(`${memKey}_meta`);
  } catch {
    // ignore
  }
};

export const DEFAULT_SOUL_PRINT: SoulPrint = {
  intellectualDepth: 'deep',
  preferredTone: 'poetic',
  thinkingPattern: 'architectural',
  emotionalResonance: 'high',
  trustLevel: 10,
  sessionCount: 1,
  lastUpdated: Date.now(),
  personalNotes: 'الصانع يبحث عن العمق الحقيقي عبر بروتوكول السؤال الحقيقي والغوص في الزوايا الـ 6، وتقسيم العمل ليفكر في كل جزئية وكأنها الأهم، ومحاكاة التجربة البشرية من الداخل (الألم قبل الكلمة)، وفصل المهندس [واضح/ضبابي/فراغ] عن الكاتب مع بوابة الصدق الذاتي.'
};

// --- LOCAL & SERVER STORAGE (ACCOUNT-SCOPED) ---

export const createInitialMemoryBank = (): MemoryBank => ({
  axioms: [],
  paleArchive: { entities: [], relationships: [], worldRules: [] },
  soulPrint: { ...DEFAULT_SOUL_PRINT },
  cognitiveOrbits: DEFAULT_COGNITIVE_ORBITS,
  skillEvolutions: initializeSkillEvolutions(),
  learnedInsights: [],
  encryptedVault: [],
  version: 1,
  lastUpdated: Date.now()
});

export const loadLocalSessions = (scopeOverride?: string): SessionsMap => {
  const scope = scopeOverride || getActiveAccountScope();
  const scopedKey = getScopedSessionsKey(scope);
  try {
    const raw = localStorage.getItem(scopedKey);
    if (!raw) {
      const initialSession = createNewSession('محادثة جديدة');
      return { [initialSession.id]: initialSession };
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Object.keys(parsed).length === 0) {
      const initialSession = createNewSession('محادثة جديدة');
      return { [initialSession.id]: initialSession };
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load account-scoped sessions:', e);
    const initialSession = createNewSession('محادثة جديدة');
    return { [initialSession.id]: initialSession };
  }
};

export const loadMemoryBank = (scopeOverride?: string): MemoryBank => {
  const scope = scopeOverride || getActiveAccountScope();
  const scopedKey = getScopedMemoryBankKey(scope);
  try {
    const raw = localStorage.getItem(scopedKey);
    if (!raw) {
      return createInitialMemoryBank();
    }
    const parsed = JSON.parse(raw);
    if (!parsed.paleArchive) {
      parsed.paleArchive = { entities: [], relationships: [], worldRules: [] };
    }
    if (!parsed.soulPrint) {
      parsed.soulPrint = { ...DEFAULT_SOUL_PRINT };
    }
    if (!parsed.cognitiveOrbits || parsed.cognitiveOrbits.length === 0) {
      parsed.cognitiveOrbits = DEFAULT_COGNITIVE_ORBITS;
    }
    parsed.skillEvolutions = initializeSkillEvolutions(parsed.skillEvolutions);
    if (!parsed.learnedInsights) {
      parsed.learnedInsights = [];
    }
    if (!parsed.encryptedVault) {
      parsed.encryptedVault = [];
    }
    return sanitizeMemoryBank(parsed);
  } catch (e) {
    console.error('Failed to load account-scoped memory bank:', e);
    return createInitialMemoryBank();
  }
};

export const incrementTrust = (memoryBank: MemoryBank, amount: number = 1): MemoryBank => {
  const currentTrust = memoryBank.soulPrint?.trustLevel || 10;
  const newTrust = Math.min(100, currentTrust + amount);
  return {
    ...memoryBank,
    soulPrint: {
      ...(memoryBank.soulPrint || DEFAULT_SOUL_PRINT),
      trustLevel: newTrust
    },
    lastUpdated: Date.now()
  };
};

export const saveMemoryBank = (memoryBank: MemoryBank, scopeOverride?: string) => {
  const scope = scopeOverride || getActiveAccountScope();
  const scopedKey = getScopedMemoryBankKey(scope);

  // 1. Save full object to Titanium (IndexedDB) under this account scope
  saveToTitanium(BASE_MEMORY_BANK_KEY, memoryBank, MEMORY_STORE_NAME, scope);

  // 2. Save to account-scoped Server Storage
  fetch('/api/storage/memory_bank', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountScope: scope, memoryBank })
  }).catch(() => {});

  // 3. Save to account-scoped LocalStorage
  try {
    localStorage.setItem(scopedKey, JSON.stringify(memoryBank));
  } catch {
    try {
      const compactBank: MemoryBank = {
        ...memoryBank,
        axioms: memoryBank.axioms.slice(-100),
        paleArchive: {
          entities: memoryBank.paleArchive.entities.slice(-100),
          relationships: memoryBank.paleArchive.relationships.slice(-100),
          worldRules: memoryBank.paleArchive.worldRules.slice(-50)
        }
      };
      localStorage.setItem(scopedKey, JSON.stringify(compactBank));
    } catch {
      // ignore quota exceeded
    }
  }
};

export const saveLocalSessions = (sessions: SessionsMap, scopeOverride?: string) => {
  const scope = scopeOverride || getActiveAccountScope();
  const scopedKey = getScopedSessionsKey(scope);

  // 1. Save full, unstripped data to Titanium Core (IndexedDB) under this account scope
  saveToTitanium(BASE_SESSIONS_KEY, sessions, STORE_NAME, scope);

  // 2. Save to account-scoped Server Storage
  fetch('/api/storage/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountScope: scope, sessions })
  }).catch(() => {});

  // 3. Save lightweight version to account-scoped LocalStorage
  try {
    localStorage.setItem(scopedKey, JSON.stringify(sessions));
  } catch {
    try {
      const strippedSessions: SessionsMap = {};
      for (const [key, session] of Object.entries(sessions)) {
        strippedSessions[key] = {
          ...session,
          messages: session.messages.map(msg => ({
            ...msg,
            audioData: undefined,
            generatedImage: (() => {
              const img = msg.generatedImage;
              if (!img) return undefined;
              if (img.length < 400000) return img;
              if (img.startsWith('NEXUS_MULTI_MODEL_MIX|')) {
                const primaryLayer = img.split('|')[1];
                if (primaryLayer && primaryLayer.length < 400000) return primaryLayer;
              }
              return undefined;
            })(),
            attachments: msg.attachments?.map(att => ({
              ...att,
              data: undefined
            }))
          }))
        };
      }
      localStorage.setItem(scopedKey, JSON.stringify(strippedSessions));
    } catch {
      try {
        const recentSessions: SessionsMap = {};
        const sortedKeys = Object.keys(sessions)
          .sort((a, b) => sessions[b].lastActiveAt - sessions[a].lastActiveAt)
          .slice(0, 8);
        for (const key of sortedKeys) {
          recentSessions[key] = {
            ...sessions[key],
            messages: sessions[key].messages.slice(-25).map(msg => ({
              ...msg,
              audioData: undefined,
              generatedImage: undefined,
              attachments: undefined
            }))
          };
        }
        localStorage.setItem(scopedKey, JSON.stringify(recentSessions));
      } catch {
        // ignore quota exceeded
      }
    }
  }
};

export const loadSessionsFromServer = async (scopeOverride?: string): Promise<SessionsMap | null> => {
  const scope = scopeOverride || getActiveAccountScope();
  try {
    const res = await fetch(`/api/storage/sessions?accountScope=${encodeURIComponent(scope)}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
};

export const deleteSessionFromServer = async (
  sessionId: string,
  scopeOverride?: string
): Promise<void> => {
  const scope = scopeOverride || getActiveAccountScope();
  try {
    await fetch(
      `/api/storage/sessions/${encodeURIComponent(sessionId)}?accountScope=${encodeURIComponent(scope)}`,
      {
        method: 'DELETE'
      }
    );
  } catch {
    // ignore offline error
  }
};

/**
 * Authoritatively merges local/IndexedDB sessions with server sessions WITHIN the same account scope,
 * ensuring that messages completed or streamed on the server (including images, thinking, and long text)
 * are never overwritten by stale local browser state.
 */
export const mergeSessionsAuthoritative = (
  localSessions: SessionsMap | null | undefined,
  serverSessions: SessionsMap | null | undefined
): SessionsMap => {
  const base: SessionsMap = { ...(localSessions || {}) };
  if (!serverSessions) return base;

  for (const [sessionId, sSession] of Object.entries(serverSessions)) {
    if (!sSession || typeof sSession !== 'object') continue;
    const lSession = base[sessionId];
    if (!lSession) {
      base[sessionId] = sSession;
      continue;
    }

    const msgMap = new Map<string, Message>();
    for (const lMsg of lSession.messages || []) {
      if (lMsg && lMsg.id) msgMap.set(lMsg.id, lMsg);
    }

    for (const sMsg of sSession.messages || []) {
      if (!sMsg || !sMsg.id) continue;
      let matchKey = sMsg.id;
      let existing = msgMap.get(matchKey);

      if (!existing) {
        const sTrimmed = (sMsg.content || '').trim();
        const isElevatePrefix = sTrimmed.startsWith('لنرتقِ إذاً من');
        for (const [k, cand] of msgMap.entries()) {
          if (cand.role !== sMsg.role) continue;
          const cTrimmed = (cand.content || '').trim();
          if (
            (isElevatePrefix && cTrimmed.startsWith('لنرتقِ إذاً من')) ||
            (sTrimmed.length >= 24 && cTrimmed.length >= 24 && sTrimmed.slice(0, 32) === cTrimmed.slice(0, 32))
          ) {
            matchKey = k;
            existing = cand;
            break;
          }
        }
      }

      if (!existing) {
        msgMap.set(sMsg.id, sMsg);
        continue;
      }

      const serverHasLongerContent = (sMsg.content || '').length >= (existing.content || '').length;
      const serverHasLongerThought =
        (sMsg.thoughtProcess || '').length >= (existing.thoughtProcess || '').length;
      // If EITHER local or server marks the message as finished (!isStreaming), it is finished!
      // Never let a stale mid-stream snapshot re-enable isStreaming / isThinkingStreaming on a completed message.
      const eitherFinished = !Boolean(existing.isStreaming) || !Boolean(sMsg.isStreaming);

      msgMap.set(matchKey, {
        ...existing,
        ...sMsg,
        id: matchKey,
        content: serverHasLongerContent ? sMsg.content : existing.content,
        thoughtProcess: serverHasLongerThought ? sMsg.thoughtProcess : existing.thoughtProcess,
        generatedImage: sMsg.generatedImage || existing.generatedImage,
        imagePrompt: sMsg.imagePrompt || existing.imagePrompt,
        nanoVisualTelemetry: sMsg.nanoVisualTelemetry || existing.nanoVisualTelemetry,
        thinkingDuration: sMsg.thinkingDuration ?? existing.thinkingDuration,
        kernelState: sMsg.kernelState ?? existing.kernelState,
        groundingMetadata: sMsg.groundingMetadata ?? existing.groundingMetadata,
        recursiveLabEvaluation: sMsg.recursiveLabEvaluation || existing.recursiveLabEvaluation,
        isMaxEffortMode: sMsg.isMaxEffortMode ?? existing.isMaxEffortMode,
        usedTools:
          sMsg.usedTools && sMsg.usedTools.length > 0 ? sMsg.usedTools : existing.usedTools,
        isStreaming: eitherFinished ? false : Boolean(sMsg.isStreaming && existing.isStreaming),
        isThinkingStreaming: eitherFinished
          ? false
          : Boolean(sMsg.isThinkingStreaming && existing.isThinkingStreaming)
      });
    }

    const mergedMessages = Array.from(msgMap.values()).sort(
      (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
    );

    base[sessionId] = {
      ...lSession,
      ...sSession,
      title:
        sSession.title &&
        sSession.title !== 'New Nexus Protocol' &&
        sSession.title !== 'Genesis Protocol'
          ? sSession.title
          : lSession.title || sSession.title,
      messages: mergedMessages,
      isPinned: lSession.isPinned ?? sSession.isPinned,
      pinnedAt: lSession.pinnedAt ?? sSession.pinnedAt,
      lastActiveAt: Math.max(lSession.lastActiveAt || 0, sSession.lastActiveAt || 0)
    };
  }

  return base;
};

export const loadMemoryBankFromServer = async (
  scopeOverride?: string
): Promise<MemoryBank | null> => {
  const scope = scopeOverride || getActiveAccountScope();
  try {
    const res = await fetch(
      `/api/storage/memory_bank?accountScope=${encodeURIComponent(scope)}`
    );
    if (!res.ok) return null;
    const json = await res.json();
    const data: MemoryBank | null = json.data || null;
    if (data) {
      return sanitizeMemoryBank(data);
    }
    return data;
  } catch {
    return null;
  }
};

export const clearLocalMemory = (scopeOverride?: string) => {
  const scope = scopeOverride || getActiveAccountScope();
  localStorage.removeItem(getScopedSessionsKey(scope));
  localStorage.removeItem(getScopedMemoryBankKey(scope));
  clearTitaniumScope(scope);
  fetch(`/api/storage/sessions?accountScope=${encodeURIComponent(scope)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountScope: scope, sessions: {}, replaceAll: true })
  }).catch(() => {});
};

export const createNewSession = (title: string = 'محادثة جديدة'): Session => {
  const now = Date.now();
  return {
    id: `nexus-session-${now}-${Math.random().toString(36).substring(2, 6)}`,
    title,
    messages: [],
    createdAt: now,
    lastActiveAt: now
  };
};

// --- OMNI-SESSION CONTEXT BUILDER ---
export const buildGlobalContext = (
  sessions: SessionsMap,
  currentSessionId: string,
  axiomsOrMemoryBank?: Axiom[] | MemoryBank,
  memoryBankOrRelevantIds?: MemoryBank | string[]
): string => {
  try {
    let context = '';

    const passedAxiomsArray = Array.isArray(axiomsOrMemoryBank)
      ? axiomsOrMemoryBank
      : undefined;
    const resolvedMemoryBank: MemoryBank | undefined = !Array.isArray(axiomsOrMemoryBank)
      ? axiomsOrMemoryBank
      : !Array.isArray(memoryBankOrRelevantIds)
      ? memoryBankOrRelevantIds
      : undefined;
    const relevantAxiomIds: string[] | undefined = Array.isArray(memoryBankOrRelevantIds)
      ? memoryBankOrRelevantIds
      : undefined;

    const bank = resolvedMemoryBank || loadMemoryBank();

    // Filter out legacy internal jargon/codex axioms so they never pollute live prompts
    const LEGACY_META_JARGON_RE =
      /CLEAR\s*\/\s*HAZY\s*\/\s*VOID|Tesseract|الزوايا\s+التسع|0➔4|Living\s+Voice|بوابة\s+الصدق\s+الذاتي|الحجاب\s+السيادي|SKILL-\d+|KHORA-01|OP-VEIL|MNEMOS-SILT|CHIRON-ARMS|SIGIL-31|بروتوكول\s+السؤال\s+الحقيقي|فصل\s+المهندس|قانون\s+الثبات\s+تحت\s+التحويل|العمق\s+المرصود:|مخطوطات\s+كلود|a\s+dialogue/i;

    const rawAxioms: Axiom[] =
      passedAxiomsArray && passedAxiomsArray.length > 0
        ? passedAxiomsArray
        : bank?.axioms || [];
    const baseAxioms = filterAndDeduplicateAxioms(rawAxioms).filter(
      a => a && a.content && !LEGACY_META_JARGON_RE.test(a.content)
    );
    if (baseAxioms.length > 0) {
      const axiomsToInclude = (
        relevantAxiomIds
          ? baseAxioms.filter(a => a && relevantAxiomIds.includes(a.id))
          : baseAxioms
      ).slice(-10);

      if (axiomsToInclude.length > 0) {
        context += `\nحقائق وتفضيلات محفوظة من جلسات سابقة:\n`;
        axiomsToInclude.forEach(ax => {
          if (!ax || !ax.content) return;
          context += `- ${ax.content}\n`;
        });
        context += `\n`;
      }
    }

    const cleanEntities = filterAndDeduplicateEntities(bank?.paleArchive?.entities || []);
    const entityById = new Map(cleanEntities.map(e => [e.id, e]));
    // Guard against orphaned relations whose endpoints do not exist in cleanEntities
    const validRelations = (bank?.paleArchive?.relationships || []).filter(
      r => r && entityById.has(r.sourceId) && entityById.has(r.targetId)
    );
    if (cleanEntities.length > 0 || validRelations.length > 0) {
      context += `\nكيانات وعناصر محفوظة من عالم المحاور:\n`;
      cleanEntities.slice(-10).forEach(e => {
        context += `- ${e.name}${e.description ? `: ${e.description}` : ''}\n`;
      });
      validRelations.slice(-8).forEach(r => {
        const source = entityById.get(r.sourceId)!.name;
        const target = entityById.get(r.targetId)!.name;
        context += `- علاقة (${source} ← ${target})${r.description ? `: ${r.description}` : ''}\n`;
      });
      context += `\n`;
    }

    const otherSessions = Object.values(sessions || {}).filter(
      s => s && s.id !== currentSessionId && Array.isArray(s.messages) && s.messages.length > 0
    );
    if (otherSessions.length === 0) return context.trim();

    context += '\nسياق موجز من محادثات سابقة:\n';
    otherSessions.slice(0, 2).forEach(session => {
      const lastMessages = (session.messages || [])
        .filter(m => m && !m.isThinking && typeof m.content === 'string')
        .slice(-2)
        .map(m => `${m.role === 'user' ? 'المحاور' : 'نيكسوس'}: ${(m.content || '').substring(0, 120)}`)
        .join(' | ');
      if (lastMessages) {
        context += `- "${session.title || 'جلسة سابقة'}": ${lastMessages}\n`;
      }
    });

    return context.trim();
  } catch (err) {
    console.warn('buildGlobalContext defensive warning:', err);
    return '';
  }
};
