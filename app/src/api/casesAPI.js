// Cases API — Firestore CRUD for case data
import {
  collection,
  getDocs,
  serverTimestamp,
  writeBatch,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  increment,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { sanitizeCasesFromFirestore } from "../utils/excelParser";

const CASES_COLLECTION = "cases";
const META_COLLECTION = "caseMeta";
const META_DOC_ID = "schema";

// Upload cases — clears ALL existing cases first, then saves new batch + headers
export const uploadCases = async (cases, headers = []) => {
  const colRef = collection(db, CASES_COLLECTION);

  // Step 1: Delete all existing cases
  const existingSnapshot = await getDocs(colRef);
  const deleteBatch = writeBatch(db);
  existingSnapshot.docs.forEach((docSnap) => {
    deleteBatch.delete(doc(db, CASES_COLLECTION, docSnap.id));
  });
  await deleteBatch.commit();

  // Step 2: Save column headers to meta document
  await setDoc(doc(db, META_COLLECTION, META_DOC_ID), {
    headers,
    updatedAt: serverTimestamp(),
  });

  // Step 3: Insert new cases in batches of 500 (Firestore limit)
  const uploadedAt = serverTimestamp();
  let batch = writeBatch(db);
  let count = 0;

  for (let i = 0; i < cases.length; i++) {
    const docRef = doc(colRef);
    batch.set(docRef, {
      ...cases[i],
      rowIndex: i,
      uploadedAt,
    });
    count++;

    if (count === 500) {
      await batch.commit();
      batch = writeBatch(db);
      count = 0;
    }
  }

  if (count > 0) await batch.commit();
};

// Get all cases sorted by original Excel row order, plus the column headers
export const getAllCases = async () => {
  const [snapshot, metaSnap] = await Promise.all([
    getDocs(collection(db, CASES_COLLECTION)),
    getDoc(doc(db, META_COLLECTION, META_DOC_ID)),
  ]);

  const cases = snapshot.docs
    .map((docSnap) => ({ firestoreId: docSnap.id, ...docSnap.data() }))
    .sort((a, b) => (a.rowIndex ?? 0) - (b.rowIndex ?? 0));

  const headers = metaSnap.exists() ? (metaSnap.data().headers ?? []) : [];

  return { cases: sanitizeCasesFromFirestore(cases, headers), headers };
};

// Real-time subscription to all cases + headers.
// callback({ cases, headers }) is called on every Firestore change.
// Returns an unsubscribe function — call on component unmount.
export const subscribeCases = (callback) => {
  const q = query(collection(db, CASES_COLLECTION), orderBy("rowIndex", "asc"));

  let latestHeaders = [];
  let unsubSnapshot = null;

  // Fetch headers first, THEN open the snapshot so the first callback
  // always delivers the real headers rather than an empty array.
  getDoc(doc(db, META_COLLECTION, META_DOC_ID))
    .then((snap) => {
      latestHeaders = snap.exists() ? (snap.data().headers ?? []) : [];
    })
    .catch(() => {})
    .finally(() => {
      unsubSnapshot = onSnapshot(q, (snapshot) => {
        const cases = snapshot.docs.map((docSnap) => ({
          firestoreId: docSnap.id,
          ...docSnap.data(),
        }));
        callback({ cases: sanitizeCasesFromFirestore(cases, latestHeaders), headers: latestHeaders });
      });
    });

  // Return an unsubscribe fn that works whether the snapshot started yet or not
  return () => {
    if (unsubSnapshot) unsubSnapshot();
  };
};

// Delete all cases (optional: reset)
export const clearAllCases = async () => {
  const snapshot = await getDocs(collection(db, CASES_COLLECTION));
  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
};

// Submit a help request from an agent
export const submitHelpRequest = async ({ caseId, reason, agentUsername }) => {
  const ref = doc(collection(db, "helpRequests"));
  await setDoc(ref, {
    caseId,
    reason,
    agentUsername,
    status: "pending",
    read: false,
    createdAt: serverTimestamp(),
  });
};

// Batch-update the agent field (and _raw mirror) for a set of cases.
// Also stamps assignedAt so the agent dashboard can compute remaining time.
// updates: [{ firestoreId, agentValue, updatedRaw }]
export const updateCasesAgent = async (updates) => {
  const batch = writeBatch(db);
  const now = serverTimestamp();
  updates.forEach(({ firestoreId, agentValue, updatedRaw }) => {
    const ref = doc(db, CASES_COLLECTION, firestoreId);
    batch.update(ref, { agent: agentValue, _raw: updatedRaw, assignedAt: now });
  });
  await batch.commit();
};

/**
 * Mark a set of cases as "Met" in Firestore.
 * Updates both the top-level `status` field (used for row/cell CSS)
 * and `_raw[statusHeaderKey]` (used for the displayed cell text).
 * @param {Array<{ firestoreId: string, currentRaw: object, statusHeaderKey: string|null }>} updates
 */
export const updateCasesStatus = async (updates) => {
  const batch = writeBatch(db);
  updates.forEach(({ firestoreId, currentRaw, statusHeaderKey }) => {
    const ref = doc(db, CASES_COLLECTION, firestoreId);
    const updatedRaw = statusHeaderKey
      ? { ...(currentRaw || {}), [statusHeaderKey]: "Met" }
      : currentRaw || {};
    batch.update(ref, { status: "Met", _raw: updatedRaw });
  });
  await batch.commit();
};

/**
 * Update the caseStatus field for a single case.
 * @param {string} firestoreId - The Firestore document ID
 * @param {string} newStatus - The new status value
 */
export const updateCaseStatus = async (firestoreId, newStatus) => {
  const ref = doc(db, CASES_COLLECTION, firestoreId);
  await setDoc(ref, { caseStatus: newStatus }, { merge: true });
};

/**
 * Update the reason field for a single case.
 * @param {string} firestoreId - The Firestore document ID
 * @param {string} reason - The reason text
 */
export const updateCaseReason = async (firestoreId, reason) => {
  const ref = doc(db, CASES_COLLECTION, firestoreId);
  await setDoc(ref, { reason: reason || "" }, { merge: true });
};

/**
 * Update the provider name field for a single case.
 * @param {string} firestoreId - The Firestore document ID
 * @param {string} providerName - The provider name
 */
export const updateProviderName = async (firestoreId, providerName) => {
  const ref = doc(db, CASES_COLLECTION, firestoreId);
  await setDoc(ref, { providerName: providerName || "" }, { merge: true });
};

/**
 * Increment the time spent on a case (in seconds).
 * Uses Firestore increment for atomic updates.
 * @param {string} firestoreId - The Firestore document ID
 * @param {number} seconds - Number of seconds to add
 */
export const updateTimeSpent = async (firestoreId, seconds) => {
  const ref = doc(db, CASES_COLLECTION, firestoreId);
  await updateDoc(ref, {
    timeSpent: increment(seconds),
  });
};
