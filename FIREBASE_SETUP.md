# 🔥 Firebase Setup Guide for Sill

You've already created the Firebase project (nice!). Here's exactly what to click next.
Each step tells you what to look for on screen.

---

## Step 1: Create a Firebase Project ✅ DONE

You did this already! Your project is called "sil-" and you see the "Hello, Anna" page.

---

## Step 2: Register a Web App

You should be on the Firebase project overview page ("Hello, Anna").

1. Look at the **top-left** of the page, right under "sil-"
2. Click the **"+ Add app"** button
3. You'll see icons for different platforms. Click the one that looks like **`</>`** (two angle brackets, meaning "web")
4. It'll ask for a nickname. Type: `sill`
5. You do NOT need to check "Firebase Hosting" right now
6. Click **"Register app"**
7. Now you'll see a code block with your config. It looks something like this:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "sil-xxxxx.firebaseapp.com",
  projectId: "sil-xxxxx",
  storageBucket: "sil-xxxxx.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};
```

8. **Copy all those values** (you'll paste them in Step 3)
9. Click **"Continue to console"** to go back to the main page

---

## Step 3: Paste Your Config Into the Code

1. Open the file `src/firebase.js` in VS Code (it's in your sill project)
2. You'll see empty strings like `apiKey: ""`
3. Replace each empty string with the matching value you copied from Firebase
4. Save the file

> **Is this safe to commit?** Yes! Firebase API keys are meant to be in frontend code.
> Security comes from the rules we set up in Steps 6 and 7, not from hiding the key.

---

## Step 4: Turn On Google Sign-In

1. Look at the **left sidebar** in the Firebase console
2. Click **"Authentication"** (it has a person icon)
   - If you don't see it, click "Build" first to expand that section
3. Click the **"Get started"** button
4. You'll see a list of sign-in providers. Find **"Google"** and click on it
5. Click the **toggle switch** to turn it ON (it turns blue)
6. It'll ask for a "support email". Pick your Gmail address from the dropdown
7. Click **"Save"**

That's it for auth! Users (you!) can now sign in with Google.

---

## Step 5: Create the Database

This is where your plant data will live.

1. In the **left sidebar**, click **"Firestore Database"**
   - Again, might be under "Build" if collapsed
2. Click **"Create database"**
3. It'll ask where to store data. Pick a location close to you:
   - US East Coast: `us-east1`
   - US West Coast: `us-west1`
   - Europe: `europe-west1`
4. Click **"Next"**
5. Select **"Start in test mode"** (the second option)
6. Click **"Create"**
7. Wait a few seconds for it to set up. You'll see an empty database page.

---

## Step 6: Set Database Security Rules

Right now the database is wide open (test mode). Let's lock it down so only you
can see your own plants.

1. You should be on the Firestore page. Click the **"Rules"** tab at the top
2. You'll see some default rules. **Select all the text** and **delete it**
3. Paste this instead:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

4. Click **"Publish"**

---

## Step 7: Turn On Photo Storage

This lets you upload plant photos.

1. In the **left sidebar**, click **"Storage"**
2. Click **"Get started"**
3. Select **"Start in test mode"**
4. Click **"Next"**, then pick the same location you chose for Firestore
5. Click **"Done"**
6. Once it's created, click the **"Rules"** tab at the top
7. **Select all** the default rules and **delete them**
8. Paste this:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

9. Click **"Publish"**

---

## Step 8: Try It Out! 🎉

Back in your terminal (VS Code), run:

```
npm run dev
```

Open the URL it gives you (probably `http://localhost:5173`).
You should see the Sill landing page. Click **"Continue with Google"**, sign in,
and you're in! Try adding a plant!

---

## Troubleshooting

**"Firebase: Error (auth/unauthorized-domain)"**
- In Firebase console: Authentication > Settings > Authorized domains
- Make sure `localhost` is in the list (it usually is by default)

**"Missing or insufficient permissions"**
- Go back to Firestore > Rules tab
- Make sure you pasted the rules from Step 6 and clicked "Publish"

**Nothing happens when I click "Continue with Google"**
- Press F12 in your browser to open DevTools
- Click the "Console" tab
- Look for red error messages, they usually tell you what's wrong
- Most likely: the config values in `src/firebase.js` are still empty or wrong

**Photos won't upload**
- Make sure you did Step 7 (Storage)
- Check that Storage rules were published

---

You're done! The whole app should work now. 🌿
