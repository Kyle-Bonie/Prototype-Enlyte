// helpRequestsAPI.js — Firestore CRUD for agent help requests
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "helpRequests";

// ─────────────────────────────────────────────
// Helper: convert a Firestore doc snapshot to a
// plain object the UI can consume directly.
// ─────────────────────────────────────────────
export const mapDoc = (docSnap) => {
  const d = docSnap.data();
  return {
    id: docSnap.id,
    agent: d.agentUsername ?? "Unknown",
    caseNumber: d.caseId ?? "",
    reason: d.reason ?? "",
    status: d.status ?? "pending",
    read: d.read ?? false,
    reply: d.reply ?? "",
    repliedBy: d.repliedBy ?? "",
    repliedAt: d.repliedAt?.toDate ? formatRelativeTime(d.repliedAt.toDate()) : "",
    reassignedTo: d.reassignedTo ?? "",
    reassignedAt: d.reassignedAt?.toDate ? formatRelativeTime(d.reassignedAt.toDate()) : "",
    time: d.createdAt?.toDate
      ? formatRelativeTime(d.createdAt.toDate())
      : "Just now",
    createdAt: d.createdAt,
  };
};

// Human-readable relative time ("5 mins ago", "2 hrs ago", etc.)
const formatRelativeTime = (date) => {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

// ─────────────────────────────────────────────
// Subscribe to help requests in real time.
// Returns an unsubscribe function — call it on
// component unmount to avoid memory leaks.
//
// Usage:
//   const unsub = subscribeHelpRequests((requests) => setHelpRequests(requests));
//   useEffect(() => () => unsub(), []);
// ─────────────────────────────────────────────
export const subscribeHelpRequests = (callback) => {
  const q = query(
    collection(db, COLLECTION),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(mapDoc));
  });
};

// ─────────────────────────────────────────────
// Mark a help request as read (no-op if already read)
// ─────────────────────────────────────────────
export const markHelpRequestRead = async (helpRequestId) => {
  await updateDoc(doc(db, COLLECTION, helpRequestId), { read: true });
};

// ─────────────────────────────────────────────
// Send a reply from a team lead to an agent
// ─────────────────────────────────────────────
export const sendReply = async (helpRequestId, replyText, teamLeadUsername) => {
  await updateDoc(doc(db, COLLECTION, helpRequestId), {
    reply: replyText,
    repliedBy: teamLeadUsername ?? "Team Lead",
    repliedAt: serverTimestamp(),
    status: "replied",
    read: true,
  });
};

// ─────────────────────────────────────────────
// Reassign the case linked to a help request
// ─────────────────────────────────────────────
export const reassignHelpRequestCase = async (helpRequestId, newAgent) => {
  await updateDoc(doc(db, COLLECTION, helpRequestId), {
    reassignedTo: newAgent,
    reassignedAt: serverTimestamp(),
    status: "reassigned",
    read: true,
  });
};

// ─────────────────────────────────────────────
// Subscribe to an AGENT's own help requests in
// real time, filtered by agentUsername.
// Detects new replies by tracking previous state.
// callback(requests: array) — called on every change.
// ─────────────────────────────────────────────
export const subscribeAgentHelpRequests = (agentUsername, callback) => {
  // Only filter by agentUsername — no orderBy on a different field, so no
  // composite index is needed. We sort client-side instead.
  const q = query(
    collection(db, COLLECTION),
    where("agentUsername", "==", agentUsername)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const docs = snapshot.docs
        .map(mapDoc)
        .sort((a, b) => {
          // newest first; fall back gracefully when createdAt is null (pending write)
          const tA = a.createdAt?.toDate?.()?.getTime() ?? 0;
          const tB = b.createdAt?.toDate?.()?.getTime() ?? 0;
          return tB - tA;
        });
      callback(docs);
    },
    (err) => {
      console.error("[subscribeAgentHelpRequests] Firestore error:", err.message);
    }
  );
};
