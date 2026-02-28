// Cases API — Firestore CRUD for case data
import {
  collection,
  getDocs,
  serverTimestamp,
  writeBatch,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";

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

  return { cases, headers };
};

// Delete all cases (optional: reset)
export const clearAllCases = async () => {
  const snapshot = await getDocs(collection(db, CASES_COLLECTION));
  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
};

// Batch-update the agent field (and _raw mirror) for a set of cases
// updates: [{ firestoreId, agentValue, updatedRaw }]
export const updateCasesAgent = async (updates) => {
  const batch = writeBatch(db);
  updates.forEach(({ firestoreId, agentValue, updatedRaw }) => {
    const ref = doc(db, CASES_COLLECTION, firestoreId);
    batch.update(ref, { agent: agentValue, _raw: updatedRaw });
  });
  await batch.commit();
};
