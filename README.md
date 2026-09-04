# X3 Workout Tracker

A fast, private workout tracker made with only HTML, CSS, and JavaScript. Workout history and custom workouts are stored in your browser with `localStorage`.

## Open it locally

### Easiest method (Mac or PC)

1. Open this folder.
2. Double-click `index.html`.
3. The app opens in your default browser.

Keep the three files (`index.html`, `styles.css`, and `app.js`) together in the same folder.

### Optional local server

If your browser restricts sound or storage when opening a file directly:

1. Open Terminal on Mac, or Command Prompt / PowerShell on Windows.
2. Change into this folder.
3. Run `python3 -m http.server 8000` (or `python -m http.server 8000` on Windows).
4. Open `http://localhost:8000` in your browser.

## Edit the sample workout list

Use **Start Workout → Edit workout list** inside the app. You can add, rename, edit, or delete workouts. Those changes stay on that browser.

Developers can also edit the clearly marked `SAMPLE_WORKOUTS` section near the top of `app.js`. Clear the site's local browser storage to see updated code defaults after you have customized the list in the app.

## Move your data to another device

1. On the old device, open the app and tap **Export Data**. Keep the downloaded `x3-workout-backup.json` file.
2. On the new device, open the app and tap **Import Data**.
3. Select the backup file and confirm the overwrite.

The import only changes data after it has verified the backup and you have confirmed.

## Install on Android

PWA installation and offline mode require the app to be served from an HTTPS website (or localhost). After hosting the folder, open its HTTPS address in Chrome on Android, tap the three-dot menu, and choose **Install app** or **Add to Home screen**.
