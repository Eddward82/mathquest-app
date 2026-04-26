# MathQuest — Setup Guide

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone OR Android/iOS simulator

> **Note:** `@react-native-firebase` requires native code, so you need a
> **development build** (not plain Expo Go). Use `expo run:android` or
> `expo run:ios` after placing your Firebase config files.

---

## 1. Install Dependencies

```bash
cd "Maths Learning App"
npm install
```

---

## 2. Configure Firebase

### 2a. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** and follow the wizard
3. Enable **Authentication → Sign-in method → Email/Password**
4. Enable **Firestore Database** (start in production mode)

### 2b. Add native config files

**Android:**
1. In Firebase console → Project settings → Add app → Android
2. Use package name: `com.mathquest.app`
3. Download `google-services.json`
4. Place it at: `android/app/google-services.json`

**iOS:**
1. In Firebase console → Project settings → Add app → iOS
2. Use bundle ID: `com.mathquest.app`
3. Download `GoogleService-Info.plist`
4. Place it at: `ios/GoogleService-Info.plist`

### 2c. Set Firestore Security Rules

In Firebase console → Firestore → Rules, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      match /progress/{lessonId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
      match /streaks/{doc} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
      match /achievements/{achId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
  }
}
```

See `src/lib/firestore-structure.md` for the full data schema.

---

## 3. Build and Run

Because `@react-native-firebase` uses native modules, you need a dev build:

```bash
# Android
expo run:android

# iOS
expo run:ios
```

Or generate a development build with EAS:
```bash
npm install -g eas-cli
eas build --profile development --platform android
```

---

## 4. AI Tutor Setup (Optional)

The "Explain This" button calls a backend proxy to keep the API key off the device.

```bash
cd server
npm install
```

Create `server/.env`:
```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
PORT=3000
```

```bash
npm run dev
```

> Without the server, the AI modal falls back to a built-in local explanation —
> the rest of the app works fully offline.

---

## 5. Project Structure

```
Maths Learning App/
├── app/                        # Expo Router screens
│   ├── _layout.tsx
│   ├── index.tsx               # Firebase auth listener + redirect
│   ├── onboarding.tsx
│   ├── (auth)/  welcome | login | signup
│   ├── (tabs)/  index (home) | learn | profile
│   └── lesson/[id].tsx
│
├── src/
│   ├── components/
│   │   ├── ui/                 Button, Card, XPBar, StreakBadge,
│   │   │                       TextInput, FeedbackBanner, AchievementBadge
│   │   └── lesson/             AIHelpModal, ExplanationCard,
│   │                           MultipleChoiceQuestion, FillBlankQuestion,
│   │                           LessonComplete
│   ├── constants/theme.ts
│   ├── data/  lessons.ts | achievements.ts
│   ├── lib/
│   │   ├── firebase.ts         Firebase services + Firestore helpers
│   │   └── firestore-structure.md
│   ├── store/  authStore | progressStore | lessonStore
│   ├── types/index.ts
│   └── styles/global.css
│
└── server/
    ├── index.ts                Express AI proxy (Anthropic SDK)
    └── package.json
```

---

## Features

| Feature | Status |
|---------|--------|
| Firebase Auth (email/password) | ✅ |
| Guest mode | ✅ |
| Firestore user profiles | ✅ |
| Firestore progress tracking | ✅ |
| Firestore streak tracking | ✅ |
| Firestore achievements | ✅ |
| Onboarding (skill level) | ✅ |
| Home dashboard | ✅ |
| Animated XP bar + level system | ✅ |
| Daily streak | ✅ |
| Learning path (4 topics, 12 lessons) | ✅ |
| 50+ questions (MCQ + fill-blank) | ✅ |
| Instant feedback + haptics | ✅ |
| AI tutor "Explain This" (Claude) | ✅ |
| 12 achievement badges | ✅ |
| Profile screen with stats | ✅ |
| Lesson locked/unlocked system | ✅ |
| Offline-first guest mode | ✅ |
