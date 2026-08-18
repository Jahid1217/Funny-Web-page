/**
 * Google Apps Script Web App that receives form submissions from the site
 * and appends them to the active Google Sheet.
 *
 * Deploy as:
 * - Type: Web app
 * - Execute as: Me
 * - Who has access: Anyone
 */

const EXPECTED_HEADERS = ['Submitted at', 'Name', 'Gender', 'Email', 'Date', 'Time', 'Food choices'];

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    ensureHeaderRow_(sheet);

    const data = parseRequest_(e);
    sheet.appendRow([
      new Date(),
      data.name || '',
      data.gender || '',
      data.email || '',
      data.date || '',
      data.time || '',
      Array.isArray(data.foods) ? data.foods.join(', ') : ''
    ]);

    return json_({ status: 'ok' });
  } catch (err) {
    console.error(err);
    return json_({
      status: 'error',
      message: err && err.message ? err.message : String(err)
    });
  }
}

function doGet() {
  return json_({ status: 'ok', message: 'Spreadsheet endpoint is ready' });
}

function parseRequest_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('Missing request body');
  }

  const data = JSON.parse(e.postData.contents);
  return {
    name: data.name || '',
    gender: data.gender || '',
    email: data.email || '',
    date: data.date || '',
    time: data.time || '',
    foods: Array.isArray(data.foods) ? data.foods : []
  };
}

function ensureHeaderRow_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(EXPECTED_HEADERS);
    return;
  }

  const firstRow = sheet.getRange(1, 1, 1, EXPECTED_HEADERS.length).getValues()[0];
  const headersMatch = EXPECTED_HEADERS.every(function (header, index) {
    return firstRow[index] === header;
  });

  if (!headersMatch) {
    sheet.getRange(1, 1, 1, EXPECTED_HEADERS.length).setValues([EXPECTED_HEADERS]);
  }
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
