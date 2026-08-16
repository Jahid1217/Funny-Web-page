/**
 * Google Apps Script Web App that receives form submissions from
 * index.html / date-proposal-premium.html and appends them as a row
 * in a Google Sheet.
 *
 * Setup: see README.md, section "Save submissions to a Google Sheet".
 */

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Submitted at', 'Name', 'Email', 'Date', 'Time', 'Food choices']);
  }

  const data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    new Date(),
    data.name || '',
    data.email || '',
    data.date || '',
    data.time || '',
    Array.isArray(data.foods) ? data.foods.join(', ') : ''
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}
