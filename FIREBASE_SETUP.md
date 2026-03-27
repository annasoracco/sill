# 🔥 Firebase Setup Guide for Sill

This walks you through setting up Firebase so your plant data actually saves.
It takes about 10 minutes. You got this!

---

## Step 1: Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com/)
2. Sign in with your Google account
3. Click **"Create a project"** (or "Add project")
4. Name it `sill` (or whatever you want)
5. You can disable Google Analytics (we don't need it), then click **Create Project**
6. Wait for it to finish, then click **Continue**

## Step 2: Add a Web App

1. On the project overview page, click the **web icon** `</>` (it says "Add an app")
2. Give it a nickname like `sill-web`
3. Check the box **"Also set up Firebase Hosting"** if you want to deploy later (optional)
4. Click **Register app**
5. You'll see a code block with your config. It looks like this:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "sill-xxxxx.firebaseapp.com",
  projectId: "sill-xxxxx",
  storageBucket: "sill-xxxxx.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};
```

6. **Copy those values!** You'll paste them into `src/firebase.js` in a moment
7. Click **Continue to console**

## Step 3: Paste Your Config

Open `src/firebase.js` in your editor and replace the empty strings with your values:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

> **Is this safe to commit?** The API key is safe to have in frontend code.
> Firebase security comes from your security rules (Step 6), not from hiding the key.

## Step 4: Enable Google Sign-In

1. In the Firebase console, click **Authentication** in the left sidebar
2. Click **Get started**
3. Under "Sign-in method", click **Google**
4. Toggle the **Enable** switch on
5. Choose a support email (your Gmail is fine)
6. Click **Save**

## Step 5: Create the Firestore Database

1. In the left sidebar, click **Firestore Database**
2. Click **Create database**
3. Choose a location close to you (e.g., `us-east1` or `us-central1`)
4. Select **"Start in test mode"** (we'll add proper rules in Step 6)
5. Click **Create**

## Step 6: Set Up Security Rules

Once Firestore is created:

1. Click the **Rules** tab in Firestore
2. Replace the default rules with this:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Each user can only read/write their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click **Publish**

This means: you can only read/write your own plant data when signed in. Nobody else can see your plants.

## Step 7: Enable Firebase Storage (for photos)

1. In the left sidebar, click **Storage**
2. Click **Get started**
3. Select **"Start in test mode"** (we'll tighten this too)
4. Choose the same location as your Firestore
5. Click **Done**
6. Go to the **Rules** tab and replace with:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can only upload to their own folder
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

7. Click **Publish**

## Step 8: Test It!

Back in your terminal:

```bash
npm run dev
```

Open the URL Vite gives you (usually `http://localhost:5173`).
You should see the Sill landing page. Click **Continue with Google**, sign in,
and you're in!

---

## Troubleshooting

**"Firebase: Error (auth/unauthorized-domain)"**
- Go to Firebase Console > Authentication > Settings > Authorized domains
- Add `localhost` if it's not there

**"Missing or insufficient permissions"**
- Double-check your Firestore rules from Step 6
- Make sure you're signed in

**Nothing happens when I click sign in**
- Open browser DevTools (F12) > Console tab
- Look for red error messages
- Most likely: the config values in `src/firebase.js` are wrong or still empty

**Photos won't upload**
- Make sure you did Step 7 (Storage setup)
- Check the Storage rules

---

That's it! Once you paste your config and enable those 3 services
(Auth, Firestore, Storage), the whole app works. 🌿
