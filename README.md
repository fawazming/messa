# MESSA — Data-to-SMS

**Turn Data Into Messages.** Select. Personalize. Send.

MESSA is an Android data-to-SMS automation app. It loads recipient data from a configurable
JSON source (e.g. Google Sheets via `sheet.spacet.me`), personalizes messages with dynamic
templates, lets the operator choose a SIM, and sends approved SMS campaigns directly from the
device through a small native Android module.

> Product/brand specification: [`MESSA_Data_to_SMS_App_Brand_and_Product_Spec.md`](./MESSA_Data_to_SMS_App_Brand_and_Product_Spec.md)

## Stack

- **Expo SDK 57** + React Native 0.86 + React 19
- **TypeScript** (strict)
- **Expo Router** (file-based routing, routes in `src/app/`)
- **Zustand** stores
- **Expo SQLite** for local cache/history
- **Lucide React Native** icons, **react-native-svg** logo
- **Native Android/Kotlin module** (`modules/messa-sms`) using `SmsManager` + `SubscriptionManager`

## Architecture

```
React Native / Expo (UI, data, templates, campaign logic)
        │
        │  services/smsService.ts
        ▼
Native Kotlin module: modules/messa-sms
        ├── SubscriptionManager  (SIM discovery)
        ├── SmsManager           (direct send per subscription)
        ├── Permission handling  (SEND_SMS, READ_PHONE_STATE)
        └── BroadcastReceiver    (sent / failed results)
```

Key rule: **data and messaging intelligence live in React Native; SIM selection and direct SMS
transmission live in a small, isolated native module.**

## Project structure

```
src/app/                     Expo Router routes
  _layout.tsx                Root stack + splash + store bootstrap
  (tabs)/                    Home · Data · Templates · History
  settings.tsx               Data source, field mapping, SMS, cache, about
  template-editor.tsx        Create/edit templates with live preview
  campaign/                  4-step wizard
    recipients.tsx  template.tsx  sim.tsx  review.tsx  sending.tsx  result.tsx
    details/[id].tsx         Campaign history detail
src/components/              Shared UI (Card, Button, Chip, RecipientRow, SimSelector, …)
src/services/                sheetService, templateService, smsService, validationService
src/store/                   appStore, dataStore, templatesStore, campaignStore
src/db/database.ts           SQLite schema + repositories
src/utils/                   template, phone, smsLength, format, id
src/types/                   Shared domain types
modules/messa-sms/           Local Expo native module (Kotlin + TS bindings)
```

## Getting started

```bash
npm install
npm start          # Expo dev server
npm run typecheck  # tsc --noEmit
```

### Running with real SMS

`expo-sms` is intentionally **not** used — it only opens the system composer. MESSA sends
directly via the native module, which is **not available in Expo Go**. Build a development or
production binary:

```bash
# Local (requires Android SDK / Android Studio)
npx expo prebuild
npx expo run:android

# Or in the cloud with EAS
npx eas-cli build --profile development --platform android
npx eas-cli build --profile preview --platform android   # installable APK
npx eas-cli build --profile production --platform android
```

In Expo Go/web the app runs in **demo mode**: SIMs are mocked and sending is simulated so the
full flow can still be exercised.

## Configuration

Open **Settings** in the app:

1. **Data Source** — paste the JSON endpoint (e.g.
   `https://sheet.spacet.me/<SHEET_ID>/Recipients.json`) and a dataset name. Use **Test
   Connection** to detect records/fields.
2. **Field Mapping** — map detected JSON fields to Phone / Name / ID.
3. **SMS** — pick the default SIM, toggle send confirmation, grant SMS permission.

### Template syntax

Mustache-style variables resolved per recipient:

```
Dear {{name}}, your outstanding balance is {{currency balance}}.
Class: {{class}}. Regards, {{school}}.
```

Supported: plain fields, `{{uppercase x}}`, `{{lowercase x}}`, `{{currency amount}}`,
`{{date}}`, `{{date+7}}`. No arbitrary JavaScript is executed. Missing variables are detected
during validation and those recipients are skipped.

## Permissions

Declared for Android: `SEND_SMS`, `READ_PHONE_STATE`, `READ_PHONE_NUMBERS`, `INTERNET`.
Runtime SMS/phone permissions are requested in-app with a clear explanation.

## Distribution note

Direct SMS sending is a sensitive Android capability. Google Play requires the SMS permission
and the app's declared core functionality to satisfy current policy. For internal/enterprise
distribution this differs. Technical capability and store policy are separate concerns —
verify Play requirements before publishing.

## Privacy & security

- Only datasets intended to be publicly accessible should be exposed via a public JSON endpoint.
- Never embed Google service-account keys in the app.
- Recipient records are cached locally in SQLite; the app avoids logging full records and
  masks phone numbers in UI where practical.
