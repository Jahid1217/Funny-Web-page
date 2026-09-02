# Funny Web Page

Static single-page HTML project ready for Vercel.

## Deploy on Vercel

1. Push this repository to GitHub.
2. Import the repository in Vercel.
3. Use these settings:
   - Framework Preset: `Other`
   - Build Command: leave empty
   - Output Directory: `.`
4. Deploy.

Vercel serves `index.html` as the homepage. The original source page is kept as `date-proposal-premium.html`.

## Save submissions to a Google Sheet

When someone fills out the date/time/name step and picks food, the page can automatically
send that submission (name, optional email, date, time, food choices, plus a server-stamped
submission time) to a Google Sheet. This uses a small Google Apps Script "Web App" — no
backend server needed.

1. Create a new Google Sheet (sheets.new).
2. In the Sheet, go to **Extensions → Apps Script**.
3. Delete any starter code and paste in the contents of [`google-apps-script.js`](./google-apps-script.js).
4. Click **Deploy → New deployment**.
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**, authorize the script when prompted, then copy the **Web app URL**.
   Opening that URL in an incognito/private window must show a JSON response with
   `"status":"ok"`. If it shows **Access denied**, edit the deployment and change
   **Who has access** to **Anyone**, then create a new version and deploy again.
6. In both `index.html` and `date-proposal-premium.html`, find this line near the top of the `<script>` block:
   ```js
   const SHEET_WEB_APP_URL = '';
   ```
   and paste your Web app URL between the quotes.
7. Redeploy/publish the page. Every time someone reaches the food-selection step and taps
   "See our plan," a new row is appended to the Sheet with the submission timestamp
   (set by the script itself, not the browser), name, email (if given), date, time, and
   food choices.

Notes:
- The name field is required so every row has a clear submitter; email stays optional.
- If `SHEET_WEB_APP_URL` is left empty, the page works exactly as before and simply skips
  the Sheet write.
- The request is sent as JSON with a simple text content type and `no-cors` mode, because
  Google Apps Script web app responses are not always readable from a static site even
  when the row is saved correctly.
- If opening the Web app URL directly returns `403 Forbidden` or `Access denied`, the
  Apps Script deployment is private or stale. Create a new Web app deployment with
  **Who has access: Anyone**, paste the new `/exec` URL into both HTML files, and redeploy
  the site.
