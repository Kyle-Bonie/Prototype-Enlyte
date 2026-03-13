// Durations API — Firestore CRUD for duration tracking
import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const DURATIONS_COLLECTION = "durations";

/**
 * Record duration for a specific date
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {number} durationSeconds - Duration in seconds to add
 */
export const recordDuration = async (dateStr, durationSeconds) => {
  const docRef = doc(db, DURATIONS_COLLECTION, dateStr);
  
  // Get existing data
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    // Update existing record
    const currentData = docSnap.data();
    await setDoc(docRef, {
      ...currentData,
      totalSeconds: (currentData.totalSeconds || 0) + durationSeconds,
      updatedAt: serverTimestamp(),
    });
  } else {
    // Create new record
    await setDoc(docRef, {
      date: dateStr,
      dateTimestamp: Timestamp.fromDate(new Date(dateStr)),
      totalSeconds: durationSeconds,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
};

/**
 * Get duration data for the last N days
 * @param {number} days - Number of days to retrieve (default: 7)
 * @returns {Array} Array of duration data objects
 */
export const getLastNDaysDurations = async (days = 7) => {
  const today = new Date();
  const durations = [];
  
  // Generate last N days
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = formatDateToYYYYMMDD(date);
    
    const docRef = doc(db, DURATIONS_COLLECTION, dateStr);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      durations.push({
        id: docSnap.id,
        ...docSnap.data(),
      });
    } else {
      // No data for this day, add empty entry
      durations.push({
        id: dateStr,
        date: dateStr,
        totalSeconds: 0,
        dateTimestamp: Timestamp.fromDate(date),
      });
    }
  }
  
  return durations;
};

/**
 * Subscribe to duration data for the last N days
 * @param {number} days - Number of days to track (default: 7)
 * @param {Function} callback - Callback function that receives duration array
 * @returns {Function} Unsubscribe function
 */
export const subscribeLastNDaysDurations = (days = 7, callback) => {
  const today = new Date();
  const unsubscribers = [];
  const durationData = new Array(days).fill(null);
  
  // Subscribe to each day individually
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = formatDateToYYYYMMDD(date);
    const index = days - 1 - i; // Reverse index for oldest to newest
    
    const docRef = doc(db, DURATIONS_COLLECTION, dateStr);
    
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        durationData[index] = {
          id: docSnap.id,
          ...docSnap.data(),
        };
      } else {
        // No data for this day
        durationData[index] = {
          id: dateStr,
          date: dateStr,
          totalSeconds: 0,
          dateTimestamp: Timestamp.fromDate(date),
        };
      }
      
      // If all days have been initialized, call the callback
      if (durationData.every(d => d !== null)) {
        callback([...durationData]);
      }
    });
    
    unsubscribers.push(unsub);
  }
  
  // Return a function that unsubscribes from all listeners
  return () => {
    unsubscribers.forEach(unsub => unsub());
  };
};

/**
 * Update duration for today based on time spent on cases
 * This should be called whenever a case's timeSpent is updated
 * @param {number} additionalSeconds - Seconds to add to today's duration
 */
export const updateTodayDuration = async (additionalSeconds) => {
  const today = new Date();
  const dateStr = formatDateToYYYYMMDD(today);
  await recordDuration(dateStr, additionalSeconds);
};

/**
 * Manually set duration for a specific date (for bulk updates)
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {number} totalSeconds - Total duration in seconds for that day
 */
export const setDurationForDate = async (dateStr, totalSeconds) => {
  const docRef = doc(db, DURATIONS_COLLECTION, dateStr);
  
  await setDoc(docRef, {
    date: dateStr,
    dateTimestamp: Timestamp.fromDate(new Date(dateStr)),
    totalSeconds: totalSeconds,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

/**
 * Record duration for a specific agent on a specific date
 * @param {string} agent - Agent name
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {number} durationSeconds - Duration in seconds to add
 */
export const recordAgentDuration = async (agent, dateStr, durationSeconds) => {
  if (!agent || agent === "Unassigned") return;
  
  const docRef = doc(db, "agentDurations", `${dateStr}_${agent}`);
  
  // Get existing data
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    // Update existing record
    const currentData = docSnap.data();
    await setDoc(docRef, {
      ...currentData,
      totalSeconds: (currentData.totalSeconds || 0) + durationSeconds,
      updatedAt: serverTimestamp(),
    });
  } else {
    // Create new record
    await setDoc(docRef, {
      agent: agent,
      date: dateStr,
      dateTimestamp: Timestamp.fromDate(new Date(dateStr)),
      totalSeconds: durationSeconds,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
};

/**
 * Subscribe to agent durations for the last N days
 * Aggregates duration per agent across the time period
 * @param {number} days - Number of days to track (default: 7)
 * @param {Function} callback - Callback function that receives aggregated agent durations
 * @returns {Function} Unsubscribe function
 */
export const subscribeAgentDurations = (days = 7, callback) => {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (days - 1));
  
  const startDateStr = formatDateToYYYYMMDD(startDate);
  
  // Query all agent duration records starting from startDate
  const q = query(
    collection(db, "agentDurations"),
    orderBy("dateTimestamp", "asc")
  );
  
  const unsub = onSnapshot(q, (snapshot) => {
    const agentTotals = {};
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const docDate = data.date;
      
      // Only include data within the specified date range
      if (docDate >= startDateStr && docDate <= formatDateToYYYYMMDD(today)) {
        const agent = data.agent;
        const seconds = data.totalSeconds || 0;
        
        if (!agentTotals[agent]) {
          agentTotals[agent] = 0;
        }
        agentTotals[agent] += seconds;
      }
    });
    
    // Convert to array format
    const agentData = Object.entries(agentTotals).map(([agent, totalSeconds]) => ({
      agent,
      totalSeconds,
      totalMinutes: Math.round(totalSeconds / 60),
    }));
    
    callback(agentData);
  });
  
  return unsub;
};

/**
 * Subscribe to today's agent durations only
 * @param {Function} callback - Callback function that receives today's agent durations
 * @returns {Function} Unsubscribe function
 */
export const subscribeTodayAgentDurations = (callback) => {
  const today = new Date();
  const todayStr = formatDateToYYYYMMDD(today);
  
  const q = query(collection(db, "agentDurations"));
  
  const unsub = onSnapshot(q, (snapshot) => {
    const agentTotals = {};
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Only include today's data
      if (data.date === todayStr) {
        const agent = data.agent;
        const seconds = data.totalSeconds || 0;
        
        if (!agentTotals[agent]) {
          agentTotals[agent] = 0;
        }
        agentTotals[agent] += seconds;
      }
    });
    
    // Convert to array format
    const agentData = Object.entries(agentTotals).map(([agent, totalSeconds]) => ({
      agent,
      totalSeconds,
      totalMinutes: Math.round(totalSeconds / 60),
    }));
    
    callback(agentData);
  });
  
  return unsub;
};

/**
 * Sync existing case timeSpent data to agentDurations collection
 * This is useful for migrating data after implementing the new duration tracking
 * @param {Array} cases - Array of case objects with agent and timeSpent fields
 */
export const syncAgentDurationsFromCases = async (cases) => {
  const agentDateMap = {}; // { "agent_date": totalSeconds }
  const today = new Date();
  const todayStr = formatDateToYYYYMMDD(today);
  
  // Aggregate timeSpent by agent and date (assuming all are from today for now)
  cases.forEach(caseItem => {
    const agent = caseItem.agent;
    const timeSpent = caseItem.timeSpent || 0;
    
    if (agent && agent !== "Unassigned" && timeSpent > 0) {
      // For now, assume all timeSpent is from today
      // In a real scenario, you'd want to track the date when time was logged
      const key = `${agent}_${todayStr}`;
      
      if (!agentDateMap[key]) {
        agentDateMap[key] = { agent, date: todayStr, totalSeconds: 0 };
      }
      agentDateMap[key].totalSeconds += timeSpent;
    }
  });
  
  // Write to Firestore
  const writes = Object.values(agentDateMap).map(async ({ agent, date, totalSeconds }) => {
    const docRef = doc(db, "agentDurations", `${date}_${agent}`);
    
    await setDoc(docRef, {
      agent: agent,
      date: date,
      dateTimestamp: Timestamp.fromDate(new Date(date)),
      totalSeconds: totalSeconds,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });
  
  await Promise.all(writes);
  
  return Object.keys(agentDateMap).length;
};

/**
 * Helper function to format date to YYYY-MM-DD
 * @param {Date} date 
 * @returns {string}
 */
function formatDateToYYYYMMDD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
