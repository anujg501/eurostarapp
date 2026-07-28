# Eurostar Academy — Candidate Mobile App

A native mobile app (Expo / React Native) for **candidates** applying to become
Eurostar sales reps. It mirrors the web candidate flow (`docs/lms` candidate UI)
and talks to the same back room (`https://eurostar-api.onrender.com`).

## The candidate journey (v0.1)
1. **Register / Login** — mobile number + OTP (test mode shows the code on screen).
2. **Apply Now** — submit your application (mobile, email, city, experience, source).
3. **Training** — watch the training modules (loaded from the back room; a demo
   set is shown if none are configured yet).
4. **Assessment** — an MCQ test; pass mark is **70%**.
5. **Result** — your score and whether you’re recommended for hiring.
6. **My Status** — a timeline of where you are in the pipeline.

## Run it on your phone (no app store needed)
1. Install **Expo Go** (App Store / Play Store).
2. On a computer, in this folder:
   ```bash
   npm install
   npm start
   ```
3. Scan the QR code with your phone. The app opens in Expo Go.

## Configuration
- API address is in `app.json` → `expo.extra.apiBaseUrl`. Point it at a local
  back room if needed (e.g. `http://<your-ip>:4000`).

## Notes / next steps
- Auth uses the shared OTP endpoints (`/auth/otp/request`, `/auth/otp/verify`).
- Training modules come from `GET /modules`.
- The candidate’s application, training progress and score are held **in-app**
  for this v0.1 — the current candidate-write API is staff-only, matching how the
  web candidate flow runs on local/seed state. When a candidate-scoped API exists
  (public register → candidate record → own status/score), swap `src/state.tsx`
  to persist server-side.
