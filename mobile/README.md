# Eurostar Mobile (customer app)

A native mobile app (Expo / React Native) for customers, wired to the same back
room as the web apps (`https://eurostar-api.onrender.com`).

## What it does (v0.1)
- **Login** with mobile number + OTP (test mode shows the code on screen).
- **Shop** — browse the real 28 categories from the catalogue.
- **Orders** — see your orders, live from the back room.

## Run it on your phone (easiest — no app store needed)
1. Install **Expo Go** on your phone (App Store / Play Store).
2. On a computer, in this folder:
   ```bash
   npm install
   npm start
   ```
3. A QR code appears. Scan it with your phone's camera (iOS) or the Expo Go app
   (Android). The app opens on your phone.

The app talks to the live back room, so it shares data with the website apps.

## Configuration
- API address is in `app.json` → `expo.extra.apiBaseUrl`. Change it to point at a
  different back room (e.g. a local one) if needed.

## Next steps (planned)
- Full ordering flow (grade → colour → shape → size → cart → checkout).
- Live prices (port the web pricing calculator or serve it from the API).
- Shipment notifications, RFQ, Mira assistant chat.
- App-store builds (EAS Build) for a real installable app.

## Structure
```
App.tsx              app shell + auth gate + bottom tabs
src/api.ts           API client (talks to the back room)
src/theme.ts         Eurostar colours
src/screens/         Login, Home (shop), Orders
```
