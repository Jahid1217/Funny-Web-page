/**
 * Google Apps Script Web App that receives form submissions from
 * index.html / date-proposal-premium.html and appends them as a row
 * in a Google Sheet.
 *
 * Setup: see README.md, section "Save submissions to a Google Sheet".
 *
 * Column order:
 *   Name | Gender | Email | Date | Time | Food choices | Submitted At | Submitted By
 */

const EXPECTED_HEADERS = ['Name', 'Gender', 'Email', 'Date', 'Time', 'Food choices', 'Submitted At', 'Submitted By'];
const SPREADSHEET_ID = '17yaU1CFsatOBddCi1wHAiMxa8y63Pfuc-nt6Z936emg';

/** Handles form submissions from the public web app deployment. */
function doPost(e) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheets()[0];

    // Ensure the header row exists and matches expected columns
    ensureHeaderRow_(sheet);

    // Parse the incoming JSON payload
    const data = parseRequest_(e);

    // Generate server-side timestamp in the spreadsheet's timezone
    const now = new Date();
    const timezone = spreadsheet.getSpreadsheetTimeZone();
    const formattedTime = Utilities.formatDate(now, timezone, 'yyyy-MM-dd HH:mm:ss');

    // Determine "Submitted By" — simplest reliable option is the Name field.
    // Alternatively, if deployed with "Execute as: Me / user accessing",
    // Session.getActiveUser().getEmail() returns the Google account email.
    // Here we use the Name field as the primary identifier, with email as fallback.
    const submittedBy = (data.name || '').trim() || (data.email || '').trim() || 'Unknown';

    // Build the row
    const row = [
      data.name || '',
      data.gender || '',
      data.email || '',
      data.date || '',
      data.time || '',
      Array.isArray(data.foods) ? data.foods.join(', ') : '',
      formattedTime,
      submittedBy
    ];

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      sheet.appendRow(row);
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log('Error in doPost: ' + err.message);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/** Accepts both the site's JSON request and form-style submissions. */
function parseRequest_(e) {
  if (!e || !e.postData) throw new Error('Missing request body');

  const raw = e.postData.contents || '';
  const contentType = (e.postData.type || '').toLowerCase();
  if (contentType.indexOf('application/json') !== -1 || contentType.indexOf('text/plain') !== -1) {
    return JSON.parse(raw);
  }

  const params = e.parameter || {};
  return {
    name: params.name || '',
    gender: params.gender || '',
    email: params.email || '',
    date: params.date || '',
    time: params.time || '',
    foods: params.foods ? params.foods.split(',') : []
  };
}

/** Lets the deployed URL be checked quickly in a browser. */
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Date planner sheet endpoint is ready' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Checks whether the first row contains the expected header labels.
 * If the sheet is empty or headers don't match, inserts the correct header row.
 */
function ensureHeaderRow_(sheet) {
  const lastRow = sheet.getLastRow();

  if (lastRow === 0) {
    // Sheet is empty — add the header row
    sheet.getRange(1, 1, 1, EXPECTED_HEADERS.length).setValues([EXPECTED_HEADERS]);
    return;
  }

  // Check if the first row matches expected headers
  const firstRow = sheet.getRange(1, 1, 1, EXPECTED_HEADERS.length).getValues()[0];
  const headersMatch = EXPECTED_HEADERS.every(function (header, i) {
    return firstRow[i] === header;
  });

  if (!headersMatch) {
    // Headers are wrong or missing — insert the correct ones
    sheet.getRange(1, 1, 1, EXPECTED_HEADERS.length).setValues([EXPECTED_HEADERS]);
  }
}
