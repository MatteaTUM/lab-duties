# Lab Duties ISBM – setup

The app is a phone-friendly web app that people install to their home screen. It's hosted for free on GitHub Pages, and all entries are saved in a free **Firebase** database (Google), so everyone sees the same checklist live.

- App address: **https://matteatum.github.io/lab-duties/**
- Labmates sign in with their **Google account**. Only emails on the lab's member list get in.
- Until `config.js` is filled in, the app runs in **demo mode**: it works fully, but entries stay on that one device.

---

## 1. GitHub Pages ✅ (already done)

The files are in the repository `MatteaTUM/lab-duties`, and Pages is switched on.

## 2. Create the Firebase project (about 10 minutes, no credit card)

1. Go to **https://console.firebase.google.com** and sign in with your Google account. This account becomes the lab manager.
2. Click **Create a project** (or **Add project**), name it `lab-duties`, and click **Continue**.
3. **Turn off Google Analytics** (not needed), then click **Create project**.

### 2a. Turn on Google sign-in
1. In the left menu: **Build → Authentication → Get started**.
2. Under **Sign-in method**, click **Google**, switch it to **Enable**, choose your email as the support email, and click **Save**.
3. Go to the **Settings** tab → **Authorized domains** → **Add domain**, enter `matteatum.github.io`, and click **Add**.

### 2b. Create the database
1. In the left menu: **Build → Firestore Database → Create database**.
2. **Location:** `europe-west3 (Frankfurt)`, so the data stays in the EU. This can't be changed later.
3. Choose **Start in production mode** and click **Create**.
4. Open the **Rules** tab and delete everything in it. Paste the contents of `firestore.rules` from this folder.
5. In the line `['your.name@gmail.com']`, put **your own Google email in lowercase**. Then click **Publish**.

### 2c. Get the app's connection details
1. Click the **⚙ gear** next to "Project Overview" → **Project settings**.
2. Under **Your apps**, click the **`</>`** (Web) icon.
3. Nickname: `Lab Duties`. **Don't** tick Firebase Hosting. Click **Register app**.
4. You'll see a block like `const firebaseConfig = { apiKey: "…", authDomain: "…", … }`. Copy it.

These values are **not secret**; they only tell the app which database to use. Who may read and write is controlled by the rules from step 2b.

## 3. Connect the app

On GitHub, open `config.js`, click the ✏️ pencil, and paste the values into `firebase: { … }`:

```js
firebase: {
  apiKey: "…",
  authDomain: "lab-duties-xxxxx.firebaseapp.com",
  projectId: "lab-duties-xxxxx",
  storageBucket: "…",
  messagingSenderId: "…",
  appId: "…"
},
```

Click **Commit changes** and wait a minute.

## 4. Add your labmates

1. Open the app, tap **Sign in with Google**, and use the email you put in the rules.
2. Tap **⚙ Settings → Lab members**, enter each labmate's Google email, and tap **Add**.
3. Send them the link: **https://matteatum.github.io/lab-duties/**

Anyone who isn't on the list sees "this account isn't on the lab list yet", with their email, so they can tell you which address to add.

## 5. Install on phones

- **iPhone (Safari):** tap Share → **Add to Home Screen**. Then open the app from the home screen and sign in there once. The home-screen app keeps its own sign-in, separate from Safari.
- **Android (Chrome):** tap ⋮ → **Install app**.
- **PC (Chrome/Edge):** click the install icon in the address bar.

## 6. Daily order email (optional, free)

Every weekday at about 18:00, a small Google Apps Script reads that day's checklist and emails the **responsible person of the month**. The email lists:
- restock items marked **Order needed? yes** or ✗, with their location, min level and fill to,
- daily checks marked ✗, with comments and readings.

On days with nothing to order and no problems, no email is sent. Emails go out from the lab manager's Gmail. The email addresses are stored only in the script, never on GitHub.

1. Go to **https://script.google.com**, signed in with the **same Google account as the Firebase project**, and click **New project**. Name it `Lab Duties email`.
2. Delete the sample code in `Code.gs` and paste the contents of **`notify.gs`**.
3. At the top, fill in `RESPONSIBLE` (an email per month) and `FALLBACK_EMAIL` (yours). Save with **Ctrl+S**.
4. Click **⚙ Project Settings** (left) and tick **Show "appsscript.json" manifest file in editor**. Go back to the editor, open `appsscript.json`, replace its contents with **`appsscript.json`** from this folder, and save.
5. Choose **`testNotification`** in the function dropdown at the top and click **Run**.
   - Google asks for permission. Pick your account, click **Advanced → Go to Lab Duties email (unsafe)**, then **Allow**. The "unsafe" warning appears because it's your own unpublished script.
   - The responsible person (or you) should get a test email within a minute.
6. Choose **`installTrigger`** and click **Run** once. The email now goes out automatically every weekday evening.

To change who gets the email (e.g. a new month), edit `RESPONSIBLE` in the script and save.

---

## How it works

- **Picking a date:** the app always opens on today's date and moves on to the new day by itself, also when left open overnight or reopened from the background. To look at another day, use the Month / Day / Year dropdowns or the ‹ › arrows. Tap the date line to jump back to today.
- **What is saved where:** daily checks and restock are saved per day. Weekly tasks, duty person and signature are saved per week. Inventory and material are saved per month. The yellow restock fields and added weekly tasks are shared settings.
- **Who ticked it:** each tick shows the name of the person who made it.
- **Live updates:** changes appear on everyone's phone within a second or two. Only the changed field is saved, so two people ticking at the same time never overwrite each other.
- **Offline:** ticks are kept on the phone and uploaded automatically when the connection returns.
- **Free plan:** 50,000 reads and 20,000 writes per day, far more than a lab checklist needs.

## Changing the app later

Edit the files on GitHub; phones get the new version the next time the app is opened online. Saved ticks are stored by item **number** or list **position**: rename freely, but add new items at the end and don't renumber.

## Troubleshooting

| Problem | Fix |
|---|---|
| "Demo · this device only" | `config.js` doesn't have the Firebase values yet. |
| Sign-in error "unauthorized-domain" | Add `matteatum.github.io` under Authentication → Settings → Authorized domains. |
| "This account isn't on the lab list yet" | Add that exact email under Settings → Lab members. |
| You can't add members ("Only the lab manager…") | Your email in the rules (step 2b) doesn't match the account you're signed in with, or isn't lowercase. |
| Sign-in window doesn't open on iPhone | Open the app from the home screen and tap Sign in again. If it still fails, allow pop-ups for Safari (Settings → Safari → Block Pop-ups off). |
