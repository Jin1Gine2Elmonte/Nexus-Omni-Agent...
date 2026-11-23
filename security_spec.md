# NEXUS Cloud Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Global Default Deny**: Any path not explicitly matched is unconditionally denied (`allow read, write: if false;`).
2. **Verified Owner Isolation**: Every document under `/users/{userId}` and its subcollections (`sessions`, `messages`, `axioms`) can only be read or written by an authenticated user whose `request.auth.uid == userId` AND whose `request.auth.token.email_verified == true` for writes.
3. **Master Gate Relational Sync**:
   - Creating or accessing `/users/{userId}/sessions/{sessionId}` requires that the parent `/users/{userId}` document exists and its `ownerId == request.auth.uid`.
   - Creating or accessing `/users/{userId}/sessions/{sessionId}/messages/{messageId}` requires that the parent `/users/{userId}/sessions/{sessionId}` document exists and its `ownerId == request.auth.uid`.
   - Creating or accessing `/users/{userId}/axioms/{axiomId}` requires that the parent `/users/{userId}` document exists and its `ownerId == request.auth.uid`.
4. **Anti-Update-Gap & Immutable Fields**:
   - Every `create` and `update` invokes `isValid[Entity](incoming())` enforcing strict key allowlists (`hasAll` + `hasOnly`), string length bounds, regex ID patterns (`^[a-zA-Z0-9_\-]+$`), and `incoming().ownerId == request.auth.uid`.
   - Every `update` enforces `affectedKeys().hasOnly(...)`, preserves `ownerId` and `createdAt`, and mandates `incoming().updatedAt == request.time`.
5. **Query Enforcer**:
   - Every `allow list` validates `resource.data.ownerId == request.auth.uid` without `get()`/`exists()` calls inside `list`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Write**: Writing to `/users/user_1` with `auth == null` -> `PERMISSION_DENIED`.
2. **Unverified Email Write**: Writing to `/users/user_1` with `email_verified: false` -> `PERMISSION_DENIED`.
3. **Cross-Tenant Identity Spoofing**: User `attacker_1` writing to `/users/victim_1` or setting `ownerId: 'victim_1'` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection (Create)**: Creating `/users/user_1` with an extra undeclared field `isAdmin: true` -> `PERMISSION_DENIED`.
5. **Shadow Field Injection (Update)**: Updating `/users/user_1` with an undeclared field `role: 'superuser'` -> `PERMISSION_DENIED`.
6. **ID Poisoning Attack**: Creating `/users/user_1/sessions/invalid$id!@#` with non-regex characters -> `PERMISSION_DENIED`.
7. **Denial-of-Wallet Oversized String**: Creating a session with a `title` of 5,000 characters (`> 200`) -> `PERMISSION_DENIED`.
8. **Orphaned Subcollection Write**: Creating `/users/user_1/sessions/sess_1` when `/users/user_1` does not exist -> `PERMISSION_DENIED`.
9. **Orphaned Message Write**: Creating `/users/user_1/sessions/sess_1/messages/msg_1` when `/users/user_1/sessions/sess_1` does not exist -> `PERMISSION_DENIED`.
10. **Immortal Field Mutation**: Updating `createdAt` or `ownerId` on an existing `/users/user_1/sessions/sess_1` document -> `PERMISSION_DENIED`.
11. **Forged Client Timestamp**: Creating or updating a document with a past/future `createdAt` or `updatedAt` != `request.time` -> `PERMISSION_DENIED`.
12. **Unauthorized List Scraping**: Listing `/users/victim_1/sessions` as `attacker_1` without matching `resource.data.ownerId == request.auth.uid` -> `PERMISSION_DENIED`.
