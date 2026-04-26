# MathQuest — Firestore Data Structure

No manual setup needed beyond enabling Firebase Auth and Firestore in the
Firebase console. Documents are created automatically on first use.

---

## Collections

### `users/{uid}`
Created when a new user signs up.

```json
{
  "id": "uid",
  "email": "user@example.com",
  "username": "mathwiz",
  "avatar_url": null,
  "skill_level": "beginner",
  "total_xp": 0,
  "current_level": 1,
  "created_at": "2026-04-14T00:00:00Z"
}
```

---

### `users/{uid}/progress/{lessonId}`
One document per completed lesson. Document ID = lesson ID.

```json
{
  "lesson_id": "lesson_arith_1",
  "topic_id": "topic_arithmetic",
  "completed": true,
  "xp_earned": 20,
  "mistakes": 1,
  "completed_at": "2026-04-14T12:00:00Z"
}
```

---

### `users/{uid}/streaks/data`
Single document per user tracking streak state.

```json
{
  "current_streak": 5,
  "longest_streak": 7,
  "last_activity_date": "2026-04-14"
}
```

---

### `users/{uid}/achievements/{achievementId}`
One document per unlocked achievement. Document ID = achievement ID.

```json
{
  "achievement_id": "ach_first_lesson",
  "unlocked_at": "2026-04-14T12:00:00Z"
}
```

---

## Firebase Console Setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project (or use existing)
3. Enable **Authentication → Email/Password**
4. Enable **Firestore Database** (start in production mode)
5. Add these **Firestore Security Rules**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
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

6. Download `google-services.json` (Android) → place in `android/app/`
7. Download `GoogleService-Info.plist` (iOS) → place in `ios/`
