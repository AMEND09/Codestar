# PocketBase Setup

The app now requires PocketBase auth before users can start learning.

## 1. Start PocketBase

```bash
pocketbase serve
```

## 2. Create Auth Collection

Create an auth collection named `users` with these custom fields:

- `streak` (number)
- `gems` (number)
- `lives` (number)
- `maxLives` (number)
- `startLessonId` (text)
- `completedLessons` (json)
- `lastLifeRefillDate` (text)
- `lastLessonDate` (text)

Recommended defaults:

- `streak`: `0`
- `gems`: `120`
- `lives`: `5`
- `maxLives`: `5`
- `startLessonId`: `""`
- `completedLessons`: `[]`
- `lastLifeRefillDate`: `""`
- `lastLessonDate`: `""`

## 3. Collection Rules

Use rules that allow users to manage only their own profile:

- List rule: `id = @request.auth.id`
- View rule: `id = @request.auth.id`
- Update rule: `id = @request.auth.id`
- Create rule: leave default for auth signups

## 4. Configure App

Create `.env` from `.env.example` and set your PocketBase URL:

```bash
VITE_POCKETBASE_URL=http://127.0.0.1:8090
```

## 5. Run App

```bash
npm install
npm run dev
```
