// Excel Parser — reads .xlsx/.xls files and maps rows to case objects
import * as XLSX from "xlsx";

// Normalise a header string: trim, lowercase, collapse spaces
export const normalise = (str) =>
  String(str ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

// Map of normalised header variants → internal field name
export const HEADER_MAP = {
  // Date
  "date": "date",

  // Case Number
  "case number": "id",
  "case no": "id",
  "case #": "id",
  "caseno": "id",

  // Agent
  "agent": "agent",
  "agent name": "agent",

  // Assigned Time
  "assigned time (9am) est": "assignedTime",
  "assigned time (9am)est": "assignedTime",   // no space before "est"
  "assigned time (9am)": "assignedTime",
  "assigned time": "assignedTime",
  "assigned time est": "assignedTime",

  // Priority
  "priority": "priority",

  // Expected Time
  "expected time (est)": "expectedTime",
  "excpected time (est)": "expectedTime", // matches existing typo in headers
  "expected time": "expectedTime",

  // Touched
  "touched (est)": "touched",
  "touched": "touched",
  "touched time": "touched",

  // Touched Time Fix
  "touched time fix (est)": "touchedTimeFix",
  "touched time fix": "touchedTimeFix",
  "time fix est": "touchedTimeFix",
  "time fix": "touchedTimeFix",

  // Month / Week (date columns)
  "month": "month",
  "week": "week",

  // Status / TAT
  "met/not met tat": "status",
  "met / not met tat": "status",
  "tat": "status",
  "status": "status",
};

// Convert an Excel serial date number to a readable date string
export const excelDateToString = (serial) => {
  if (!serial && serial !== 0) return "";
  if (typeof serial === "string") return serial;

  // Excel dates: day 1 = Jan 1, 1900 (with leap-year bug offset)
  const utcDays = Math.floor(serial - 25569);
  const date = new Date(utcDays * 86400 * 1000);
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const yyyy = date.getUTCFullYear();
  return `${mm}/${dd}/${yyyy}`;
};

// Convert Excel time fraction (e.g. 0.375 = 09:00) or string to "h:MM AM/PM"
export const excelTimeToString = (val) => {
  if (!val && val !== 0) return "";
  if (typeof val === "string") return val.trim();

  // Strip the date portion (integer part) — keep only the time fraction
  // e.g. 46048.3986 → 0.3986, or 0.3986 → 0.3986
  const timeFraction = val % 1;

  // Fraction of a day → total minutes
  const totalMinutes = Math.round(timeFraction * 24 * 60);
  const totalHours = Math.floor(totalMinutes / 60) % 24;
  const mm = String(totalMinutes % 60).padStart(2, "0");
  const period = totalHours < 12 ? "AM" : "PM";
  const hh = totalHours % 12 === 0 ? 12 : totalHours % 12;
  return `${hh}:${mm} ${period}`;
};

/**
 * Sanitize cases fetched from Firestore by converting any leftover numeric
 * Excel time fractions / date serials stored in _raw back to readable strings.
 * Call this on every case returned from Firestore.
 */
export const sanitizeCasesFromFirestore = (cases, headers = []) => {
  const TIME_FIELDS = new Set(["assignedTime", "expectedTime", "touched", "touchedTimeFix"]);
  const DATE_FIELDS = new Set(["date", "month", "week"]);

  return cases.map((caseObj) => {
    if (!caseObj._raw) return caseObj;
    const sanitizedRaw = { ...caseObj._raw };
    const sanitized = { ...caseObj };

    headers.forEach((header) => {
      const field = HEADER_MAP[normalise(header)] || null;
      const rawVal = sanitizedRaw[header];

      // Accept both numeric values and string representations of decimals
      // (strings happen when the header wasn't mapped at upload time)
      let val = rawVal;
      if (typeof rawVal === "string") {
        const trimmed = rawVal.trim();
        const parsed = parseFloat(trimmed);
        // Check if it's a valid decimal string (not NaN, and looks like a number)
        if (!isNaN(parsed) && /^-?\d*\.?\d+([eE][-+]?\d+)?$/.test(trimmed)) {
          val = parsed;
        }
      }
      if (typeof val !== "number") return; // not a numeric value — skip

      if (field && TIME_FIELDS.has(field)) {
        const converted = excelTimeToString(val);
        sanitizedRaw[header] = converted;
        sanitized[field] = converted;
      } else if (field && DATE_FIELDS.has(field)) {
        const converted = excelDateToString(val);
        sanitizedRaw[header] = converted;
        sanitized[field] = converted;
      } else if (!field) {
        // Unknown column — auto-detect
        if (val > 0 && val < 1) {
          sanitizedRaw[header] = excelTimeToString(val);
        } else if (val >= 40000) {
          sanitizedRaw[header] = excelDateToString(val);
        }
      }
    });

    sanitized._raw = sanitizedRaw;
    return sanitized;
  });
};

/**
 * Parse an uploaded Excel file and return an array of case objects.
 * @param {File} file - The uploaded .xlsx/.xls file
 * @returns {Promise<Array>} Array of case objects
 */
export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {
          type: "array",
          cellDates: false,
          cellNF: false,
          cellText: false,
        });

        // Use the first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert to array of objects (first row = headers)
        const rows = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
          blankrows: false,
          raw: true,  // always return raw numbers, never auto-formatted strings
        });

        if (rows.length < 2) {
          return reject(new Error("Excel file has no data rows."));
        }

        // Map raw headers to field names
        const rawHeaders = rows[0];
        const fieldMap = rawHeaders.map((h) => HEADER_MAP[normalise(h)] || null);

        // Validate at least the case number column is found
        if (!fieldMap.includes("id")) {
          return reject(
            new Error(
              'Could not find a "Case Number" column. Check your Excel headers.'
            )
          );
        }

        const cases = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];

          // Skip completely empty rows
          if (row.every((cell) => cell === "" || cell == null)) continue;

          const caseObj = { _raw: {} };

          rawHeaders.forEach((header, colIndex) => {
            const field = fieldMap[colIndex];
            const raw = row[colIndex];
            let processedVal;

            if (field === "date" || field === "month" || field === "week") {
              processedVal = excelDateToString(raw);
            } else if (
              field === "assignedTime" ||
              field === "expectedTime" ||
              field === "touched" ||
              field === "touchedTimeFix"
            ) {
              processedVal = excelTimeToString(raw);
            } else if (!field && typeof raw === "number") {
              // Auto-detect unrecognised columns: time fraction (0–1) or date serial (>=40000)
              if (raw > 0 && raw < 1) {
                processedVal = excelTimeToString(raw);
              } else if (raw >= 40000) {
                processedVal = excelDateToString(raw);
              } else {
                processedVal = String(raw ?? "").trim();
              }
            } else {
              processedVal = String(raw ?? "").trim();
            }

            if (field) caseObj[field] = processedVal;
            if (header) caseObj._raw[String(header)] = processedVal;
          });

          // Fill in defaults for missing fields
          caseObj.id = caseObj.id || `ROW-${i}`;
          caseObj.date = caseObj.date || "";
          caseObj.agent = caseObj.agent || "";
          caseObj.assignedTime = caseObj.assignedTime || "";
          caseObj.priority = caseObj.priority || "";
          caseObj.expectedTime = caseObj.expectedTime || "";
          caseObj.touched = caseObj.touched || "";
          caseObj.touchedTimeFix = caseObj.touchedTimeFix || "";
          caseObj.month = caseObj.month || "";
          caseObj.week = caseObj.week || "";
          caseObj.status = caseObj.status || "";

          cases.push(caseObj);
        }

        if (cases.length === 0) {
          return reject(new Error("No valid rows found in the Excel file."));
        }

        resolve({ cases, headers: rawHeaders.map((h) => String(h)) });
      } catch (err) {
        reject(new Error("Failed to parse Excel file: " + err.message));
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Derive agent summary data from a list of case objects.
 * @param {Array} cases
 * @returns {Array} [{ name, assigned, urgent, intake, total }]
 */
export const deriveAgentSummary = (cases) => {
  const map = {};

  cases.forEach((c) => {
    const name = c.agent || "Unassigned";
    if (!map[name]) {
      map[name] = { name, assigned: 0, urgent: 0, intake: 0, total: 0 };
    }
    map[name].total += 1;
    if ((c.priority || "").toLowerCase() === "urgent") map[name].urgent += 1;
    if ((c.status || "").toLowerCase().includes("not met")) {
      map[name].assigned += 1; // still needs work
    } else if ((c.status || "").toLowerCase() === "met") {
      map[name].intake += 1; // completed
    }
  });

  return Object.values(map).sort((a, b) => b.total - a.total);
};
