# Put X3 Workout Tracker on a Samsung phone

## 1. Export the data currently on this Mac

1. Open the same local `index.html` file you have been using. Do not open a newly copied version in a different folder.
2. Refresh the page once so **Export Data** appears.
3. Select **Export Data**.
4. Confirm that `x3-workout-backup.json` is in your Mac's Downloads folder. Keep this file private; it contains your workout records.

## 2. Host the app free with GitHub Pages

1. Go to `github.com` and create or sign in to a free account.
2. Select the **+** menu, then **New repository**.
3. Name it `x3-workout-tracker`, choose **Public**, and select **Create repository**.
4. On the repository page, select **Add file → Upload files**.
5. Drag in these items from the app folder: `.nojekyll`, `index.html`, `styles.css`, `app.js`, `manifest.webmanifest`, `service-worker.js`, and the entire `icons` folder. Do not upload `x3-workout-backup.json`.
6. Select **Commit changes**.
7. Open **Settings → Pages**.
8. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
9. Choose the `main` branch and `/(root)` folder, then select **Save**.
10. Wait a few minutes. Your address will be `https://YOUR-GITHUB-USERNAME.github.io/x3-workout-tracker/`.

The public repository contains only the app. Your workout records remain in browser storage and are not uploaded to GitHub.

## 3. Open and install it on Samsung

1. Send the GitHub Pages address to your Samsung phone and open it in Chrome.
2. In Chrome, tap the three-dot menu.
3. Tap **Install app**. If that wording is unavailable, tap **Add to Home screen**, then **Install**.
4. Open **X3 Tracker** from the new home-screen icon once while online. After that, the app shell works offline.

## 4. Import the old data

1. Send `x3-workout-backup.json` privately to the Samsung phone—for example, by USB cable, Quick Share, or an email to yourself. Save it in the phone's Downloads folder.
2. Open the installed **X3 Tracker** app.
3. Tap **Import Data** and choose `x3-workout-backup.json` from Downloads.
4. Read the overwrite message and tap **OK**.
5. Wait for **Data imported successfully**.
6. Open **Workout History** and confirm your older sessions are present.

Do not clear Chrome site data for the hosted address; doing so would remove the phone's local records. Export a fresh backup occasionally.
