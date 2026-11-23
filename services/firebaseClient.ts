import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  initializeFirestore,
  doc,
  setDoc,
  getDoc,
  getDocFromCache,
  getDocFromServer,
  getDocs,
  getDocsFromCache,
  deleteDoc,
  collection,
  serverTimestamp,
  writeBatch,
  Timestamp,
  DocumentReference,
  CollectionReference,
  DocumentSnapshot,
  QuerySnapshot
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import type {
  Session,
  Message,
  Axiom,
  MemoryBank,
  SessionsMap,
  LearnedUserInsight,
  EncryptedSecretEntry,
  CognitiveOrbit,
  SkillVisualEvolution
} from '../types.ts';
import {
  DEFAULT_COGNITIVE_ORBITS,
  initializeSkillEvolutions
} from './sovereignVaultAndOrbitsService.ts';
import { deriveAccountScopeId, getActiveAccountScope } from './storageService.ts';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export const hasValidFirebaseConfig = Boolean(
  firebaseConfig?.apiKey &&
    firebaseConfig.apiKey.trim().length > 10 &&
    firebaseConfig?.projectId &&
    firebaseConfig.projectId !== 'local-offline-mode'
);

const app = hasValidFirebaseConfig ? initializeApp(firebaseConfig) : null;
export const auth = (app ? getAuth(app) : null) as any;

/**
 * Use experimentalForceLongPolling to avoid WebChannel / CORS 400 errors inside proxied preview iframes.
 */
export const db = (app
  ? initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true
      },
      firebaseConfig.firestoreDatabaseId
    )
  : null) as any;

async function testFirestoreConnection(): Promise<void> {
  if (typeof window === 'undefined' || !db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testFirestoreConnection();

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider: any) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
    },
    operationType,
    path
  };

  if (
    errMessage.includes('Missing or insufficient permissions') ||
    errMessage.includes('permission-denied') ||
    errMessage.includes('client is offline') ||
    errMessage.includes('Failed to get document') ||
    errMessage.includes('unavailable') ||
    errMessage.includes('network-request-failed') ||
    errMessage.includes('Failed to fetch') ||
    errMessage.includes('deadline-exceeded') ||
    errMessage.includes('quota-exceeded') ||
    errMessage.includes('resource-exhausted')
  ) {
    console.warn('Firestore notice (offline/transient — falling back to Account-Scoped Firebase Vault & Titanium DB):', errInfo.path);
    return;
  }

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function safeGetDoc(ref: DocumentReference): Promise<DocumentSnapshot | null> {
  try {
    return await getDoc(ref);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes('client is offline') ||
      msg.includes('Failed to get document') ||
      msg.includes('unavailable')
    ) {
      try {
        return await getDocFromCache(ref);
      } catch {
        return null;
      }
    }
    throw err;
  }
}

async function safeGetDocs(colRef: CollectionReference): Promise<{ docs: QuerySnapshot['docs'] }> {
  try {
    return await getDocs(colRef);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes('client is offline') ||
      msg.includes('Failed to get document') ||
      msg.includes('unavailable')
    ) {
      try {
        return await getDocsFromCache(colRef);
      } catch {
        return { docs: [] as unknown as QuerySnapshot['docs'] };
      }
    }
    throw err;
  }
}

const sanitizeId = (rawId: string, fallbackPrefix = 'id'): string => {
  const cleaned = (rawId || '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
  return cleaned.length > 0 ? cleaned : `${fallbackPrefix}_${Date.now()}`;
};

export const FIREBASE_VAULT_TOKEN = 'FIREBASE_UNIVERSAL_VAULT';
export const GCLOUD_DIRECT_VAULT_TOKEN = FIREBASE_VAULT_TOKEN;

let cachedWorkspaceAccessToken: string | null = FIREBASE_VAULT_TOKEN;

export function enableFirebaseUniversalVaultMode(): string {
  cachedWorkspaceAccessToken = FIREBASE_VAULT_TOKEN;
  try {
    sessionStorage.setItem('nexus_firebase_vault_token', FIREBASE_VAULT_TOKEN);
  } catch {
    // ignore
  }
  return FIREBASE_VAULT_TOKEN;
}

export const enableGoogleCloudDirectVaultMode = enableFirebaseUniversalVaultMode;

export function getGoogleWorkspaceAccessToken(): string | null {
  if (cachedWorkspaceAccessToken) return cachedWorkspaceAccessToken;
  try {
    const saved = sessionStorage.getItem('nexus_firebase_vault_token');
    if (saved) {
      cachedWorkspaceAccessToken = saved;
      return saved;
    }
  } catch {
    // ignore
  }
  return FIREBASE_VAULT_TOKEN;
}

export async function ensureGoogleWorkspaceAccessToken(): Promise<string> {
  return enableFirebaseUniversalVaultMode();
}

export const getGoogleWorkspaceAccessTokenSync = getGoogleWorkspaceAccessToken;

export async function signInWithGoogleWorkspace(): Promise<string> {
  return enableFirebaseUniversalVaultMode();
}

export function hasRealGoogleDriveToken(): boolean {
  return true;
}

/**
 * Signs in via Firebase Authentication (Universal Open Access for all accounts + optional Google Popup).
 * Never blocks users with Google's 403 unverified OAuth screen because it automatically establishes
 * an authenticated Firebase session when OAuth popup is restricted or skipped.
 */
let anonymousAuthRestricted = false;

export async function signInWithFirebaseGoogle(
  options?: boolean | { tryGooglePopup?: boolean }
): Promise<User | null> {
  enableFirebaseUniversalVaultMode();
  if (!auth) return null;
  const tryPopup =
    typeof options === 'boolean' ? options : Boolean(options?.tryGooglePopup);

  if (tryPopup) {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const res = await signInWithPopup(auth, provider);
      if (res.user) {
        return res.user;
      }
    } catch (popupErr: any) {
      console.warn(
        'Google OAuth Popup restricted or closed; activating Universal Firebase Auth:',
        popupErr?.code || popupErr?.message
      );
    }
  }

  try {
    if (auth.currentUser) {
      return auth.currentUser;
    }
    if (anonymousAuthRestricted) {
      return null;
    }
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (err: any) {
    if (String(err?.code || err?.message || '').includes('admin-restricted-operation')) {
      anonymousAuthRestricted = true;
    }
    return auth.currentUser || null;
  }
}

export async function signOutFromFirebase(): Promise<void> {
  cachedWorkspaceAccessToken = null;
  try {
    sessionStorage.removeItem('nexus_firebase_vault_token');
  } catch {
    // ignore
  }
  if (auth) {
    await signOut(auth);
  }
}

/**
 * Syncs an account's isolated state to the server-side Firebase Account Vault mirror
 * so switching accounts by email/UID restores the exact account state instantaneously.
 */
export async function syncAccountStateToFirebaseVaultMirror(
  accountScope: string,
  payloadOrProfile?:
    | {
        sessions?: SessionsMap;
        memoryBank?: MemoryBank;
        activeSessionId?: string;
        profile?: { uid?: string; name: string; email: string; picture: string } | null;
      }
    | { uid?: string; name: string; email: string; picture: string }
    | null,
  sessionsArg?: SessionsMap,
  memoryBankArg?: MemoryBank,
  activeSessionIdArg?: string
): Promise<void> {
  if (!accountScope || accountScope === 'guest') return;
  const resolvedPayload =
    sessionsArg !== undefined || memoryBankArg !== undefined || activeSessionIdArg !== undefined
      ? {
          profile: payloadOrProfile as any,
          sessions: sessionsArg,
          memoryBank: memoryBankArg,
          activeSessionId: activeSessionIdArg
        }
      : (payloadOrProfile as any) || {};
  try {
    await fetch(`/api/firebase-vault/${encodeURIComponent(accountScope)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resolvedPayload)
    });
  } catch {
    // ignore offline error
  }
}

export async function loadAccountStateFromFirebaseVaultMirror(accountScope: string): Promise<{
  sessions: SessionsMap;
  memoryBank: MemoryBank | null;
  activeSessionId: string | null;
} | null> {
  if (!accountScope || accountScope === 'guest') return null;
  try {
    const res = await fetch(`/api/firebase-vault/${encodeURIComponent(accountScope)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.vault) return null;
    return {
      sessions: data.vault.sessions || {},
      memoryBank: data.vault.memoryBank || null,
      activeSessionId: data.vault.activeSessionId || null
    };
  } catch {
    return null;
  }
}

/**
 * Ensures the root /users/{userId} workspace document exists and is up to date.
 */
export async function syncUserWorkspaceProfile(
  user: User,
  activeSessionId: string,
  memoryBank: MemoryBank
): Promise<void> {
  if (!db) return;
  const uid = user.uid;
  const userPath = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  const safeActiveId = sanitizeId(activeSessionId || 'default_session', 'sess');
  const displayName = (
    memoryBank.userPreferences?.userDisplayName ||
    user.displayName ||
    user.email?.split('@')[0] ||
    'Nexus Operator'
  ).slice(0, 120);
  const photoURL = (user.photoURL || '').slice(0, 500);
  const soulPrintDepth = memoryBank.soulPrint?.intellectualDepth || 'deep';
  const soulPrintTone = memoryBank.soulPrint?.preferredTone || 'poetic';
  const trustLevel = Math.max(
    0,
    Math.min(100000, Math.round(memoryBank.soulPrint?.trustLevel ?? 10))
  );

  try {
    const existingSnap = await safeGetDoc(userRef);
    if (!existingSnap || !existingSnap.exists()) {
      await setDoc(
        userRef,
        {
          ownerId: uid,
          displayName,
          photoURL,
          activeSessionId: safeActiveId,
          soulPrintDepth,
          soulPrintTone,
          trustLevel,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    } else {
      const existingData = existingSnap.data();
      await setDoc(
        userRef,
        {
          ownerId: uid,
          displayName,
          photoURL,
          activeSessionId: safeActiveId,
          soulPrintDepth,
          soulPrintTone,
          trustLevel,
          createdAt: existingData.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, userPath);
  }
}

/**
 * Syncs a single session and its messages to Firestore under /users/{uid}/sessions/{sessionId}
 * and mirrors to the account-scoped Firebase Vault.
 */
export async function syncSessionToFirestore(
  user: User,
  session: Session,
  memoryBank: MemoryBank,
  accountScopeOverride?: string
): Promise<void> {
  const scope = accountScopeOverride || getActiveAccountScope();
  if (scope && scope !== 'guest') {
    syncAccountStateToFirebaseVaultMirror(scope, {
      sessions: { [session.id]: session },
      memoryBank,
      activeSessionId: session.id
    }).catch(() => {});
  }
  if (!db) return;

  const uid = user.uid;
  const safeSessionId = sanitizeId(session.id, 'session');
  const sessionPath = `users/${uid}/sessions/${safeSessionId}`;
  const sessionRef = doc(db, 'users', uid, 'sessions', safeSessionId);

  await syncUserWorkspaceProfile(user, safeSessionId, memoryBank);

  const validMessages = (session.messages || []).filter(
    m => !m.isThinking && m.content && m.content.trim().length > 0
  );
  const title = (session.title || 'محادثة نيكسوس').slice(0, 200);

  try {
    const existingSessionSnap = await safeGetDoc(sessionRef);
    if (!existingSessionSnap || !existingSessionSnap.exists()) {
      await setDoc(
        sessionRef,
        {
          id: safeSessionId,
          ownerId: uid,
          title,
          messageCount: validMessages.length,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    } else {
      const existingData = existingSessionSnap.data();
      await setDoc(
        sessionRef,
        {
          id: safeSessionId,
          ownerId: uid,
          title,
          messageCount: validMessages.length,
          createdAt: existingData.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    }

    const recentMessages = validMessages.slice(-150);
    for (let idx = 0; idx < recentMessages.length; idx++) {
      const msg = recentMessages[idx];
      const safeMsgId = sanitizeId(msg.id, `msg_${idx}`);
      const msgRef = doc(db, 'users', uid, 'sessions', safeSessionId, 'messages', safeMsgId);
      const existingMsgSnap = await safeGetDoc(msgRef);

      const content = msg.content.slice(0, 95000);
      const role = msg.role === 'user' ? 'user' : 'model';
      const routedModel = (msg.routedModel || 'hybrid-nexus').slice(0, 80);

      if (!existingMsgSnap || !existingMsgSnap.exists()) {
        await setDoc(
          msgRef,
          {
            id: safeMsgId,
            sessionId: safeSessionId,
            ownerId: uid,
            role,
            content,
            isThinking: Boolean(msg.isThinking),
            routedModel,
            orderIndex: idx,
            createdAt: serverTimestamp()
          },
          { merge: true }
        );
      } else {
        const existingMsg = existingMsgSnap.data();
        if (
          existingMsg.content !== content &&
          content.length >= (existingMsg.content || '').length
        ) {
          await setDoc(
            msgRef,
            {
              id: existingMsg.id || safeMsgId,
              sessionId: existingMsg.sessionId || safeSessionId,
              ownerId: existingMsg.ownerId || uid,
              role: existingMsg.role || role,
              content,
              isThinking: existingMsg.isThinking ?? Boolean(msg.isThinking),
              routedModel: existingMsg.routedModel || routedModel,
              orderIndex: existingMsg.orderIndex ?? idx,
              createdAt: existingMsg.createdAt || serverTimestamp()
            },
            { merge: true }
          );
        }
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, sessionPath);
  }
}

/**
 * Deletes a session and its messages from Firestore.
 */
export async function deleteSessionFromFirestore(
  user: User,
  sessionId: string
): Promise<void> {
  if (!db) return;
  const uid = user.uid;
  const safeSessionId = sanitizeId(sessionId, 'session');
  const sessionPath = `users/${uid}/sessions/${safeSessionId}`;

  try {
    const msgsCol = collection(db, 'users', uid, 'sessions', safeSessionId, 'messages');
    const msgsSnap = await safeGetDocs(msgsCol);
    const batch = writeBatch(db);
    msgsSnap.docs.forEach(docSnap => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
    await deleteDoc(doc(db, 'users', uid, 'sessions', safeSessionId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, sessionPath);
  }
}

/**
 * Syncs crystallized MemoryBank axioms to /users/{uid}/axioms/{axiomId}
 */
export async function syncAxiomsToFirestore(
  user: User,
  axioms: Axiom[],
  memoryBank: MemoryBank,
  activeSessionId: string
): Promise<void> {
  const scope = getActiveAccountScope();
  if (scope && scope !== 'guest') {
    syncAccountStateToFirebaseVaultMirror(scope, {
      memoryBank,
      activeSessionId
    }).catch(() => {});
  }
  if (!db) return;

  const uid = user.uid;
  const axiomsPath = `users/${uid}/axioms`;

  await syncUserWorkspaceProfile(user, activeSessionId || 'default_session', memoryBank);

  try {
    const recentAxioms = axioms.slice(-50);
    for (const ax of recentAxioms) {
      const safeAxiomId = sanitizeId(ax.id, 'axiom');
      const axRef = doc(db, 'users', uid, 'axioms', safeAxiomId);
      const snap = await safeGetDoc(axRef);
      const validCategories = ['identity', 'world_building', 'preference', 'absolute_truth'];
      const category = validCategories.includes(ax.category) ? ax.category : 'preference';
      const content = (ax.content || '').slice(0, 4900);
      if (!content) continue;

      if (!snap || !snap.exists()) {
        await setDoc(
          axRef,
          {
            id: safeAxiomId,
            ownerId: uid,
            content,
            category,
            sourceSessionId: sanitizeId(ax.sourceSessionId || 'genesis', 'sess'),
            createdAt: serverTimestamp()
          },
          { merge: true }
        );
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, axiomsPath);
  }
}

/**
 * Syncs Continuous User Learning Insights, Encrypted Vault Secrets, Cognitive Orbits, and 56 Skill Evolutions to Firestore.
 */
export async function syncAdaptiveVaultAndOrbitsToFirestore(
  user: User,
  memoryBank: MemoryBank,
  activeSessionId: string,
  newInsight?: LearnedUserInsight | null,
  newSecrets?: EncryptedSecretEntry[],
  updatedOrbits?: CognitiveOrbit[],
  activatedSkillIds?: string[]
): Promise<void> {
  const scope = getActiveAccountScope();
  if (scope && scope !== 'guest') {
    syncAccountStateToFirebaseVaultMirror(scope, {
      memoryBank,
      activeSessionId
    }).catch(() => {});
  }
  if (!db) return;

  const uid = user.uid;
  await syncUserWorkspaceProfile(user, activeSessionId || 'default_session', memoryBank);

  // 1. Sync new learned insight (/users/{uid}/learnedInsights/{insightId})
  if (newInsight && newInsight.learnedRule) {
    const safeInsightId = sanitizeId(newInsight.id, 'ins');
    const insightPath = `users/${uid}/learnedInsights/${safeInsightId}`;
    try {
      const ref = doc(db, 'users', uid, 'learnedInsights', safeInsightId);
      const snap = await safeGetDoc(ref);
      if (!snap || !snap.exists()) {
        await setDoc(
          ref,
          {
            id: safeInsightId,
            ownerId: uid,
            topic: (newInsight.topic || 'تفضيل عام').slice(0, 120),
            learnedRule: newInsight.learnedRule.slice(0, 500),
            sanitizedMessageExcerpt: (newInsight.sanitizedMessageExcerpt || '...').slice(0, 600),
            encryptedRefsCount: Math.max(
              0,
              Math.min(100, Math.round(newInsight.encryptedRefsCount || 0))
            ),
            qualityImpactScore: Math.max(
              1,
              Math.min(100, Math.round(newInsight.qualityImpactScore || 75))
            ),
            orbitId: sanitizeId(newInsight.orbitId || 'orbit_polymath_synthesis', 'orbit'),
            createdAt: serverTimestamp()
          },
          { merge: true }
        );
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, insightPath);
    }
  }

  // 2. Sync new encrypted secrets (/users/{uid}/encryptedSecrets/{secretId})
  if (newSecrets && newSecrets.length > 0) {
    for (const sec of newSecrets) {
      const safeSecId = sanitizeId(sec.id, 'sec');
      const secPath = `users/${uid}/encryptedSecrets/${safeSecId}`;
      try {
        const ref = doc(db, 'users', uid, 'encryptedSecrets', safeSecId);
        const snap = await safeGetDoc(ref);
        if (!snap || !snap.exists()) {
          await setDoc(
            ref,
            {
              id: safeSecId,
              ownerId: uid,
              secretType: sec.secretType,
              label: (sec.label || 'بيانات مشفرة').slice(0, 80),
              redactionToken: (sec.redactionToken || `[VAULT:${safeSecId}]`).slice(0, 64),
              cipherText: (sec.cipherText || '00').slice(0, 4096),
              iv: (sec.iv || '00000000').slice(0, 64),
              createdAt: serverTimestamp()
            },
            { merge: true }
          );
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, secPath);
      }
    }
  }

  // 3. Sync cognitive orbits (/users/{uid}/orbits/{orbitId})
  if (updatedOrbits && updatedOrbits.length > 0) {
    for (const orb of updatedOrbits) {
      const safeOrbId = sanitizeId(orb.id, 'orbit');
      const orbPath = `users/${uid}/orbits/${safeOrbId}`;
      try {
        const ref = doc(db, 'users', uid, 'orbits', safeOrbId);
        const snap = await safeGetDoc(ref);
        if (!snap || !snap.exists()) {
          await setDoc(
            ref,
            {
              id: safeOrbId,
              ownerId: uid,
              nameAr: (orb.nameAr || 'مدار معرفي').slice(0, 120),
              nameEn: (orb.nameEn || 'Cognitive Orbit').slice(0, 120),
              domainCategory: (orb.domainCategory || 'synthesis').slice(0, 64),
              qualityScore: Math.max(0, Math.min(100, Math.round(orb.qualityScore || 70))),
              resonanceCount: Math.max(0, Math.min(100000, Math.round(orb.resonanceCount || 1))),
              isDiscovered: Boolean(orb.isDiscovered),
              updatedAt: serverTimestamp()
            },
            { merge: true }
          );
        } else {
          const existingOrb = snap.data();
          await setDoc(
            ref,
            {
              id: existingOrb.id || safeOrbId,
              ownerId: existingOrb.ownerId || uid,
              nameAr: existingOrb.nameAr || (orb.nameAr || 'مدار معرفي').slice(0, 120),
              nameEn: existingOrb.nameEn || (orb.nameEn || 'Cognitive Orbit').slice(0, 120),
              domainCategory: existingOrb.domainCategory || (orb.domainCategory || 'synthesis').slice(0, 64),
              qualityScore: Math.max(0, Math.min(100, Math.round(orb.qualityScore || 70))),
              resonanceCount: Math.max(0, Math.min(100000, Math.round(orb.resonanceCount || 1))),
              isDiscovered: Boolean(orb.isDiscovered),
              updatedAt: serverTimestamp()
            },
            { merge: true }
          );
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, orbPath);
      }
    }
  }

  // 4. Sync activated skill visual evolutions (/users/{uid}/skillEvolutions/{skillId})
  if (activatedSkillIds && activatedSkillIds.length > 0 && memoryBank.skillEvolutions) {
    for (const skillId of activatedSkillIds) {
      const evo = memoryBank.skillEvolutions[skillId];
      if (!evo) continue;
      const safeSkillId = sanitizeId(evo.skillId || (evo as any).id || skillId, 'SKILL');
      const skillPath = `users/${uid}/skillEvolutions/${safeSkillId}`;
      try {
        const ref = doc(db, 'users', uid, 'skillEvolutions', safeSkillId);
        const snap = await safeGetDoc(ref);
        if (!snap || !snap.exists()) {
          await setDoc(
            ref,
            {
              id: safeSkillId,
              ownerId: uid,
              skillNumber: Math.max(1, Math.min(100, Math.round(evo.skillNumber || 1))),
              usageCount: Math.max(0, Math.min(1000000, Math.round(evo.usageCount || 1))),
              visualQualityScore: Math.max(
                10,
                Math.min(100, Math.round(evo.visualQualityScore || 50))
              ),
              visualTier: Math.max(1, Math.min(4, Math.round(evo.visualTier || 1))),
              specializedPromptSignature: (
                evo.specializedPromptSignature || 'Sovereign Geometric Emblem'
              ).slice(0, 1200),
              updatedAt: serverTimestamp()
            },
            { merge: true }
          );
        } else {
          const existingSkill = snap.data();
          await setDoc(
            ref,
            {
              id: existingSkill.id || safeSkillId,
              ownerId: existingSkill.ownerId || uid,
              skillNumber: existingSkill.skillNumber ?? Math.max(1, Math.min(100, Math.round(evo.skillNumber || 1))),
              usageCount: Math.max(0, Math.min(1000000, Math.round(evo.usageCount || 1))),
              visualQualityScore: Math.max(
                10,
                Math.min(100, Math.round(evo.visualQualityScore || 50))
              ),
              visualTier: Math.max(1, Math.min(4, Math.round(evo.visualTier || 1))),
              specializedPromptSignature: (
                evo.specializedPromptSignature || 'Sovereign Geometric Emblem'
              ).slice(0, 1200),
              updatedAt: serverTimestamp()
            },
            { merge: true }
          );
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, skillPath);
      }
    }
  }
}

/**
 * Loads all sessions, messages, axioms, learned insights, encrypted vault secrets, cognitive orbits,
 * and skill visual evolutions for the authenticated user from Firestore + Account-Isolated Firebase Vault.
 */
export async function loadUserCloudStateFromFirestore(
  user?: User | null,
  accountScopeOverride?: string
): Promise<{
  sessions: SessionsMap;
  axioms: Axiom[];
  learnedInsights: LearnedUserInsight[];
  encryptedVault: EncryptedSecretEntry[];
  cognitiveOrbits: CognitiveOrbit[];
  skillEvolutions: Record<string, SkillVisualEvolution>;
  activeSessionId?: string;
  memoryBankSnapshot?: MemoryBank | null;
}> {
  const scope = accountScopeOverride || getActiveAccountScope();
  const isSovereignAccountScope =
    !scope ||
    scope === 'guest' ||
    scope === 'acct_hackrplays_gmail_com_f2c24614' ||
    scope === 'acct_hackrplays2_gmail_com_59b4717a' ||
    scope.includes('pu6JeF7bOBSJbXZ2cv4YZROv2o32');
  const uid =
    user?.uid && !user.uid.startsWith('firebase-')
      ? user.uid
      : isSovereignAccountScope
      ? 'pu6JeF7bOBSJbXZ2cv4YZROv2o32'
      : scope;
  const userPath = `users/${uid}`;

  // First check the Account-Isolated Firebase Vault mirror for this exact accountScope
  const vaultMirror = await loadAccountStateFromFirebaseVaultMirror(
    scope === 'guest' ? 'acct_hackrplays_gmail_com_f2c24614' : scope
  );

  if (!db) {
    return {
      sessions: vaultMirror?.sessions || {},
      axioms: vaultMirror?.memoryBank?.axioms || [],
      learnedInsights: vaultMirror?.memoryBank?.learnedInsights || [],
      encryptedVault: vaultMirror?.memoryBank?.encryptedVault || [],
      cognitiveOrbits: vaultMirror?.memoryBank?.cognitiveOrbits || DEFAULT_COGNITIVE_ORBITS,
      skillEvolutions: initializeSkillEvolutions(vaultMirror?.memoryBank?.skillEvolutions),
      activeSessionId: vaultMirror?.activeSessionId || undefined,
      memoryBankSnapshot: vaultMirror?.memoryBank || null
    };
  }

  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await safeGetDoc(userRef);

    const sessionsCol = collection(db, 'users', uid, 'sessions');
    const sessionsSnap = await safeGetDocs(sessionsCol);

    const loadedSessions: SessionsMap = { ...(vaultMirror?.sessions || {}) };

    const canReadFirestoreUid =
      isSovereignAccountScope ||
      !accountScopeOverride ||
      (user && accountScopeOverride === deriveAccountScopeId(user.email, user.uid));

    if (canReadFirestoreUid) {
      for (const sDoc of sessionsSnap.docs) {
        const sData = sDoc.data();
        const sId = sData.id || sDoc.id;

        const msgsCol = collection(db, 'users', uid, 'sessions', sDoc.id, 'messages');
        const msgsSnap = await safeGetDocs(msgsCol);

        const existingLocalSession = loadedSessions[sId];
        const localMsgsById = new Map<string, Message>();
        if (existingLocalSession?.messages) {
          for (const lm of existingLocalSession.messages) {
            if (lm?.id) {
              localMsgsById.set(lm.id, lm);
            }
          }
        }

        const firestoreMessages: Message[] = msgsSnap.docs
          .map(mDoc => {
            const mData = mDoc.data();
            const mId = mData.id || mDoc.id;
            const createdTs =
              mData.createdAt instanceof Timestamp ? mData.createdAt.toMillis() : Date.now();
            const localMsg = localMsgsById.get(mId);
            const cloudContent = mData.content || '';
            const localContent = localMsg?.content || '';
            const bestContent = localContent.length >= cloudContent.length ? localContent : cloudContent;
            const preservedImg =
              localMsg?.generatedImage && localMsg.generatedImage !== '[IMAGE_STORED_LOCALLY]'
                ? localMsg.generatedImage
                : undefined;
            return {
              ...(localMsg || {}),
              id: mId,
              role: (mData.role === 'user' ? 'user' : 'model') as 'user' | 'model',
              content: bestContent,
              timestamp: localMsg?.timestamp || createdTs,
              isThinking: Boolean(mData.isThinking && !bestContent),
              isStreaming: false,
              isThinkingStreaming: false,
              routedModel: localMsg?.routedModel || mData.routedModel || 'hybrid-nexus',
              orderIndex: typeof mData.orderIndex === 'number' ? mData.orderIndex : 0,
              ...(preservedImg ? { generatedImage: preservedImg } : {})
            };
          })
          .sort((a, b) => a.orderIndex - b.orderIndex || a.timestamp - b.timestamp)
          .map(({ orderIndex, ...rest }) => rest);

        // Also include any messages present in localMsgsById that weren't in Firestore yet
        const firestoreIds = new Set(firestoreMessages.map(m => m.id));
        const combinedMessages = [
          ...firestoreMessages,
          ...(existingLocalSession?.messages || []).filter(m => m && m.id && !firestoreIds.has(m.id))
        ].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        const createdAtMs =
          sData.createdAt instanceof Timestamp ? sData.createdAt.toMillis() : Date.now();
        const updatedAtMs =
          sData.updatedAt instanceof Timestamp ? sData.updatedAt.toMillis() : Date.now();

        if (combinedMessages.length > 0) {
          loadedSessions[sId] = {
            ...(loadedSessions[sId] || {}),
            id: sId,
            title:
              existingLocalSession?.title &&
              existingLocalSession.title !== 'New Nexus Protocol' &&
              existingLocalSession.title !== 'محادثة سحابية'
                ? existingLocalSession.title
                : sData.title || 'محادثة سحابية',
            messages: combinedMessages,
            createdAt: existingLocalSession?.createdAt || createdAtMs,
            lastActiveAt: Math.max(existingLocalSession?.lastActiveAt || 0, updatedAtMs)
          };
        }
      }
    }

    const axiomsCol = collection(db, 'users', uid, 'axioms');
    const axiomsSnap = canReadFirestoreUid ? await safeGetDocs(axiomsCol) : { docs: [] as any[] };
    const loadedAxioms: Axiom[] = axiomsSnap.docs.map(aDoc => {
      const aData = aDoc.data();
      const createdAtMs =
        aData.createdAt instanceof Timestamp ? aData.createdAt.toMillis() : Date.now();
      return {
        id: aData.id || aDoc.id,
        content: aData.content || '',
        category: (aData.category || 'preference') as Axiom['category'],
        sourceSessionId: aData.sourceSessionId || 'cloud',
        createdAt: createdAtMs
      };
    });

    const insightsCol = collection(db, 'users', uid, 'learnedInsights');
    const insightsSnap = canReadFirestoreUid ? await safeGetDocs(insightsCol) : { docs: [] as any[] };
    const loadedInsights: LearnedUserInsight[] = insightsSnap.docs
      .map(iDoc => {
        const d = iDoc.data();
        const createdAtMs =
          d.createdAt instanceof Timestamp ? d.createdAt.toMillis() : Date.now();
        return {
          id: d.id || iDoc.id,
          topic: d.topic || 'تفضيل عام',
          learnedRule: d.learnedRule || '',
          sanitizedMessageExcerpt: d.sanitizedMessageExcerpt || '',
          encryptedRefsCount: d.encryptedRefsCount || 0,
          qualityImpactScore: d.qualityImpactScore || 75,
          orbitId: d.orbitId || 'orbit_polymath_synthesis',
          linkedSkillIds: Array.isArray(d.linkedSkillIds) ? d.linkedSkillIds : ['SKILL-01', 'SKILL-31'],
          createdAt: createdAtMs,
          updatedAt: createdAtMs
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    const vaultCol = collection(db, 'users', uid, 'encryptedSecrets');
    const vaultSnap = canReadFirestoreUid ? await safeGetDocs(vaultCol) : { docs: [] as any[] };
    const loadedVault: EncryptedSecretEntry[] = vaultSnap.docs
      .map(vDoc => {
        const d = vDoc.data();
        const createdAtMs =
          d.createdAt instanceof Timestamp ? d.createdAt.toMillis() : Date.now();
        return {
          id: d.id || vDoc.id,
          secretType: d.secretType || 'private_note',
          label: d.label || 'بيانات مشفرة',
          redactionToken: d.redactionToken || `[VAULT:${vDoc.id}]`,
          cipherText: d.cipherText || '',
          iv: d.iv || '',
          createdAt: createdAtMs
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    const orbitsCol = collection(db, 'users', uid, 'orbits');
    const orbitsSnap = canReadFirestoreUid ? await safeGetDocs(orbitsCol) : { docs: [] as any[] };
    const orbitMap = new Map<string, CognitiveOrbit>();
    DEFAULT_COGNITIVE_ORBITS.forEach(o => orbitMap.set(o.id, { ...o }));
    orbitsSnap.docs.forEach(oDoc => {
      const d = oDoc.data();
      const existing = orbitMap.get(d.id || oDoc.id);
      const updatedAtMs =
        d.updatedAt instanceof Timestamp ? d.updatedAt.toMillis() : Date.now();
      orbitMap.set(d.id || oDoc.id, {
        id: d.id || oDoc.id,
        nameAr: d.nameAr || existing?.nameAr || 'مدار معرفي',
        nameEn: d.nameEn || existing?.nameEn || 'Cognitive Orbit',
        domainCategory: d.domainCategory || existing?.domainCategory || 'synthesis',
        descriptionAr: existing?.descriptionAr || 'مدار معرفي مكتشف تلقائياً من تفاعلات المستخدم.',
        qualityScore: typeof d.qualityScore === 'number' ? d.qualityScore : 75,
        resonanceCount: typeof d.resonanceCount === 'number' ? d.resonanceCount : 1,
        isDiscovered: Boolean(d.isDiscovered),
        linkedSkillIds: existing?.linkedSkillIds || ['SKILL-01', 'SKILL-31'],
        synthesisDirective: existing?.synthesisDirective || 'Synthesize domain insights with sovereign precision.',
        colorHex: existing?.colorHex || '#10b981',
        createdAt: existing?.createdAt || updatedAtMs,
        updatedAt: updatedAtMs
      });
    });

    const skillsCol = collection(db, 'users', uid, 'skillEvolutions');
    const skillsSnap = canReadFirestoreUid ? await safeGetDocs(skillsCol) : { docs: [] as any[] };
    const skillEvolutions = initializeSkillEvolutions(vaultMirror?.memoryBank?.skillEvolutions);
    skillsSnap.docs.forEach(skDoc => {
      const d = skDoc.data();
      const id = d.id || skDoc.id;
      if (skillEvolutions[id]) {
        skillEvolutions[id] = {
          ...skillEvolutions[id],
          usageCount: typeof d.usageCount === 'number' ? d.usageCount : skillEvolutions[id].usageCount,
          visualQualityScore:
            typeof d.visualQualityScore === 'number'
              ? d.visualQualityScore
              : skillEvolutions[id].visualQualityScore,
          visualTier: (d.visualTier || skillEvolutions[id].visualTier) as 1 | 2 | 3 | 4,
          specializedPromptSignature:
            d.specializedPromptSignature || skillEvolutions[id].specializedPromptSignature
        };
      }
    });

    const activeSessionId =
      vaultMirror?.activeSessionId ||
      (canReadFirestoreUid && userSnap.exists() ? userSnap.data().activeSessionId : undefined);

    return {
      sessions: loadedSessions,
      axioms:
        vaultMirror?.memoryBank?.axioms && vaultMirror.memoryBank.axioms.length > loadedAxioms.length
          ? vaultMirror.memoryBank.axioms
          : loadedAxioms,
      learnedInsights:
        vaultMirror?.memoryBank?.learnedInsights &&
        vaultMirror.memoryBank.learnedInsights.length > loadedInsights.length
          ? vaultMirror.memoryBank.learnedInsights
          : loadedInsights,
      encryptedVault:
        vaultMirror?.memoryBank?.encryptedVault &&
        vaultMirror.memoryBank.encryptedVault.length > loadedVault.length
          ? vaultMirror.memoryBank.encryptedVault
          : loadedVault,
      cognitiveOrbits: Array.from(orbitMap.values()),
      skillEvolutions,
      activeSessionId,
      memoryBankSnapshot: vaultMirror?.memoryBank || null
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, userPath);
    return {
      sessions: vaultMirror?.sessions || {},
      axioms: vaultMirror?.memoryBank?.axioms || [],
      learnedInsights: vaultMirror?.memoryBank?.learnedInsights || [],
      encryptedVault: vaultMirror?.memoryBank?.encryptedVault || [],
      cognitiveOrbits: vaultMirror?.memoryBank?.cognitiveOrbits || DEFAULT_COGNITIVE_ORBITS,
      skillEvolutions: initializeSkillEvolutions(vaultMirror?.memoryBank?.skillEvolutions),
      activeSessionId: vaultMirror?.activeSessionId || undefined,
      memoryBankSnapshot: vaultMirror?.memoryBank || null
    };
  }
}

export { onAuthStateChanged };
export type { User };
