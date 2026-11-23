# ClassNote AI

Studio (record) • Library (saved notes + audio) • Engine (model, API key, backend).

Expo (React Native + TS) app + Express backend. Record lecture → Gemini → handout, classroom questions, extra DPP, transcript → PDF/WhatsApp.

## 1. Setup
```bash
npm install
npx expo install --fix        # aligns Expo package versions
cp .env.example .env          # add GEMINI_API_KEY (and EXPO_PUBLIC_* defaults)
```

## 2. Backend (optional – skip if using "Direct Device API Key" mode)
```bash
npm run server                # http://localhost:8787
```
Deploy to **Render** (Web Service): Build `npm install`, Start `npx tsx server/index.ts`, set env vars from `.env.example`.
(Vercel's 4.5 MB request limit is too small for hour-long audio; use Render/Railway/Fly.)
In the app: Engine → turn off Direct mode → paste the backend URL.

## 3. Build the APK (cloud, no Android Studio)
```bash
npm i -g eas-cli
eas login
eas init
eas build -p android --profile preview
```
Download the `.apk` link EAS prints and install it. Background recording needs a real build (not Expo Go):
`npx expo run:android` also works with a local device.

## Notes
- Audio is copied to `documentDirectory/lectures/` before upload; failed uploads can be retried.
- Android: allow notifications and set battery to "Unrestricted" for long pocket recordings.
- For APK testing, put `EXPO_PUBLIC_GEMINI_API_KEY` in an EAS env/secret or enter it in Settings.
