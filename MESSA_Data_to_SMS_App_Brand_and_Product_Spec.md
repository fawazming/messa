# MESSA — Data-to-SMS Android App
## Product Design & Brand Asset Specification

> **Working product name:** MESSA  
> **Positioning:** Data-driven SMS sending for Android  
> **Tagline:** **Turn Data Into Messages.**  
> **Secondary tagline:** **Select. Personalize. Send.**  
> **Platform:** Android  
> **Frontend:** React Native + Expo  
> **Native layer:** Android/Kotlin native module for direct SMS and SIM selection  
> **Data source:** Google Sheets → `sheet.spacet.me` JSON endpoint  
> **Primary use case:** Select recipients from remotely configured data, generate personalized SMS messages from templates, choose a SIM, review, and send.

---

# 1. Product Concept

MESSA is a lightweight Android SMS operations app that turns structured data into personalized SMS messages.

The administrator maintains recipient/customer/student/member data in a Google Sheet. MESSA retrieves that data as JSON through `sheet.spacet.me`, lets the user select a message template, dynamically fills variables such as names, amounts, dates, codes, classes, balances, or reference numbers, allows all or selected recipients to be chosen, and sends the resulting SMS messages through a selected SIM on the Android device.

### Core idea

```text
Google Sheet
     ↓
sheet.spacet.me JSON
     ↓
MESSA Data Loader
     ↓
Recipient Records
     ↓
Template Engine
     ↓
Personalized Message Preview
     ↓
Recipient Selection
     ↓
SIM Selection
     ↓
Native Android SMS Module
     ↓
SMS Network
```

---

# 2. Important Technical Constraint

The application should **not** be designed around `expo-sms` for direct automated SMS sending.

Expo's `expo-sms` module opens the system SMS UI with prefilled recipients/message; it does not provide the direct per-message Android SMS control needed for this product. Android's native `SmsManager` is the appropriate layer for direct SMS sending and SIM/subscription selection.

Therefore:

- Use Expo + React Native for the application UI and most application logic.
- Use a custom Android native module written in Kotlin for direct SMS.
- Use Android `SubscriptionManager` to discover available SIM subscriptions.
- Use the selected subscription ID with the native SMS implementation.
- Request and handle the appropriate Android permissions.
- Build a development/production Android binary that includes the native module rather than relying exclusively on Expo Go.

Expo's current SMS documentation describes `expo-sms` as opening the default SMS application/UI rather than providing direct sending control. Android documentation identifies subscription IDs as the mechanism for associating functionality with individual SIM subscriptions.  
Sources: https://docs.expo.dev/versions/latest/sdk/sms/ and https://developer.android.com/identity/user-data-ids

---

# 3. Product Goals

## Primary Goals

1. Load structured recipient data remotely.
2. Avoid manually entering large recipient lists.
3. Support dynamic SMS templates.
4. Support multiple SIMs.
5. Let the operator select SIM 1, SIM 2, or another available subscription.
6. Allow all recipients or selected recipients.
7. Show the exact generated SMS before sending.
8. Provide sending progress and results.
9. Work efficiently on low-to-mid-range Android devices.
10. Keep the interface simple enough for non-technical operators.

## Secondary Goals

- Save frequently used templates locally.
- Cache the latest successful dataset.
- Validate phone numbers before sending.
- Detect missing template variables.
- Provide sending history.
- Provide retry for failed messages.
- Support CSV-like spreadsheet structures without requiring a backend database.

---

# 4. Target Users

### 4.1 School Administrators

Examples:

- Fee reminders
- Result notifications
- Attendance alerts
- Parent notices
- Exam reminders
- Admission notifications

### 4.2 Businesses

Examples:

- Customer notifications
- Payment reminders
- Order updates
- Appointment reminders
- Promotional messages

### 4.3 Organizations

Examples:

- Event reminders
- Membership notifications
- Community announcements
- Staff communication

### 4.4 Field Operators

Examples:

- Agents
- Sales teams
- Coordinators
- Survey teams

---

# 5. Recommended Brand Name

## MESSA

### Meaning

**MESSA** is derived from the idea of **Message + Data**.

It sounds close to "message" without being overly technical.

### Brand interpretation

> **MESSA = structured data transformed into useful messages.**

### Product descriptor

**MESSA — Data-to-SMS**

### Tagline

**Turn Data Into Messages.**

### Supporting phrase

**Select. Personalize. Send.**

### Brand personality

- Smart
- Practical
- Fast
- Reliable
- Clean
- Modern
- Operational
- Human
- Lightweight

### Naming note

MESSA should be treated as a working product name until trademark, Google Play availability, domain, social-handle, and app-name conflicts are checked.

---

# 6. Alternative Name Ideas

| Name | Concept |
|---|---|
| **MESSA** | Message + structured data |
| **SENDRA** | Sending + automation |
| **TEXTA** | Text + action |
| **MESGO** | Message + go |
| **ROUTA** | Routing messages to recipients |
| **SENDO** | Simple sending workflow |
| **MSGX** | Message execution |
| **DATXT** | Data + text |
| **PINGA** | Lightweight notification concept |
| **TEXIO** | Modern text communication identity |

### Preferred direction

**MESSA**

It communicates the core purpose more naturally than the more technical alternatives.

---

# 7. Brand Asset Board

## 7.1 Logo Concept

Create a clean wordmark:

```text
MESSA
```

with a compact icon built from:

- speech bubble
- data rows
- forward arrow
- SMS/message signal

### Recommended icon concept

A rounded speech bubble containing three horizontal data lines, with a small forward arrow integrated into the lower-right corner.

Concept:

```text
   ┌──────────┐
   │ ───────  │
   │ ─────    │
   │ ────  →  │
   └───────╲  │
```

The icon should communicate:

**Data → Message → Delivery**

without using a literal phone handset.

---

# 8. Color System

## Primary

### Messa Indigo

```text
#4F46E5
```

Use for:

- Primary buttons
- Active states
- Brand icon
- Navigation highlights
- Links
- Progress indicators

## Primary Dark

```text
#3730A3
```

Use for:

- Pressed buttons
- Dark emphasis
- Strong headings when required

## Accent

### Signal Cyan

```text
#06B6D4
```

Use sparingly for:

- Sending status
- SIM indicators
- Data synchronization
- Secondary highlights

## Success

```text
#16A34A
```

## Warning

```text
#F59E0B
```

## Error

```text
#DC2626
```

## Background

```text
#F8FAFC
```

## Surface

```text
#FFFFFF
```

## Primary Text

```text
#0F172A
```

## Secondary Text

```text
#64748B
```

## Border

```text
#E2E8F0
```

---

# 9. Color Usage Ratio

Recommended approximate distribution:

```text
70% Neutral surfaces
15% White cards
10% Indigo
 3% Cyan
 2% Status colors
```

The application should not look like a colorful marketing application.

It should feel like a **professional operational tool**.

---

# 10. Typography

## Primary Font

**Inter**

Use for:

- Headings
- Body text
- Buttons
- Labels
- Tables
- Numbers

## Alternative

**Plus Jakarta Sans**

Can be used if the product wants a slightly more contemporary personality.

### Typography scale

```text
Display:       30–34px / Bold
Screen Title:  24px / Bold
Section Title: 18px / SemiBold
Body:          15–16px / Regular
Small:         12–13px / Medium
Caption:       11–12px / Regular
Button:        14–15px / SemiBold
```

---

# 11. Visual Style

MESSA should feel like:

> **A modern utility app rather than a social messaging app.**

Avoid:

- Excessive gradients
- Large illustrations
- Excessive rounded cards
- Neon colors
- Heavy shadows
- Complex dashboards
- Tiny text
- Desktop-style tables on mobile

Prefer:

- White surfaces
- Soft gray backgrounds
- 12–16px corner radius
- Thin borders
- Small shadows
- Strong typography
- Clear hierarchy
- Large touch targets
- Compact information density

---

# 12. UI Design Language

## Cards

```text
Radius: 14px
Border: 1px #E2E8F0
Shadow: very subtle
Padding: 16px
```

## Buttons

Primary:

```text
Background: #4F46E5
Text: #FFFFFF
Radius: 10–12px
Height: 48–52px
```

Secondary:

```text
Background: #FFFFFF
Border: #CBD5E1
Text: #0F172A
```

Danger:

```text
Background: #DC2626
Text: #FFFFFF
```

## Chips

Use for:

- SIM status
- Dataset status
- Selected count
- Delivery status

---

# 13. App Navigation

Recommended bottom navigation:

```text
Home       Data       Templates       History
  ●          ○           ○              ○
```

Settings can be accessible from the top-right profile/settings icon.

For a very small MVP, use:

```text
Home
Templates
History
Settings
```

with Data management inside Home.

---

# 14. Main Screens

# 14.1 Splash Screen

Minimal.

```text
        [ MESSA ICON ]

           MESSA

   Turn Data Into Messages.
```

Animation:

- icon appears
- small data dots move into message bubble
- app opens

Do not use a long splash animation.

---

# 14.2 Home Dashboard

### Header

```text
Good evening

MESSA

                 ⚙
```

### Connection card

```text
DATA SOURCE

● Connected

Students / Customers
245 records

Last synced
2 minutes ago

              Refresh
```

### SIM card

```text
SENDING SIM

SIM 1
MTN Nigeria
+234 xxx xxx xxxx

Change SIM  →
```

### Quick action

```text
[ Start New Message ]
```

### Summary

```text
Today

Sent       Failed       Pending
 84           3            0
```

---

# 14.3 Data Screen

Display the remote dataset.

Example:

```text
RECIPIENTS

245 records

[ Search recipients... ]

☑ 245 selected

────────────────────────────

☑  Aisha Yusuf
   08012345678

   Class: JSS 2
   Balance: ₦25,000

────────────────────────────

☑  Ibrahim Musa
   08023456789

   Class: SS 1
   Balance: ₦12,500
```

Each record should be represented as a selectable card/list item.

---

# 14.4 Selection Controls

Top toolbar:

```text
☑ Select All

Selected: 84

[ Clear ]
```

Optional filters:

```text
Filter
 ├─ Class
 ├─ Status
 ├─ Gender
 ├─ Payment Status
 └─ Custom field
```

Filtering should happen locally after JSON data is loaded.

---

# 14.5 Template Screen

Example:

```text
MESSAGE TEMPLATES

+ Create Template

┌─────────────────────────────┐
│ Fee Reminder                │
│ {{name}}, your balance is   │
│ {{balance}}. Please...      │
│                             │
│ 128 recipients              │
└─────────────────────────────┘

┌─────────────────────────────┐
│ Exam Reminder               │
│ Dear {{name}}, your exam... │
└─────────────────────────────┘
```

---

# 14.6 Template Editor

Fields:

```text
Template name

[ Fee Reminder ]

Message

[ Dear {{name}},

  Your outstanding balance is
  {{balance}}.

  Please contact the school
  office for assistance. ]

Available variables:

{{name}}
{{phone}}
{{class}}
{{balance}}
{{school}}
{{date}}
```

Variable chips should be tappable.

Example:

```text
[ {{name}} ] [ {{balance}} ] [ {{class}} ]
```

Tapping a variable inserts it into the message.

---

# 14.7 Live Preview

Show the generated message for an actual recipient.

```text
PREVIEW

Recipient
Aisha Yusuf

Message

Dear Aisha,

Your outstanding balance is
₦25,000.

Please contact the school
office for assistance.

────────────────────────────

SMS length: 118 characters
Estimated parts: 1
```

Include:

```text
← Previous     1 / 84     Next →
```

---

# 14.8 SIM Selection

Dedicated modal/screen:

```text
SELECT SENDING SIM

○ SIM 1
  MTN Nigeria
  +234 801 xxx xxxx

○ SIM 2
  Airtel Nigeria
  +234 802 xxx xxxx

○ Ask Android each time
```

Recommended:

- Show SIM label
- Carrier
- Masked phone number where available
- Subscription ID internally
- Signal/network status where available

Do not expose raw internal subscription IDs to normal users.

Android documentation recommends Subscription ID for associating app functionality with specific mobile subscriptions. Access can involve phone-state permissions.  
Source: https://developer.android.com/identity/user-data-ids

---

# 15. Sending Workflow

Recommended flow:

```text
1. Load data
      ↓
2. Select recipients
      ↓
3. Select template
      ↓
4. Select SIM
      ↓
5. Generate personalized messages
      ↓
6. Validate records
      ↓
7. Preview
      ↓
8. Confirm
      ↓
9. Send
      ↓
10. Results
```

---

# 16. Final Confirmation Screen

Before sending:

```text
READY TO SEND

Recipients
84

Template
Fee Reminder

SIM
SIM 1 — MTN Nigeria

Messages
84

Estimated SMS parts
92

[ Cancel ]

[ Send 84 Messages ]
```

For safety, require an explicit confirmation.

For large batches, consider:

```text
Type SEND to confirm
```

---

# 17. Sending Screen

Show real-time progress.

```text
SENDING...

██████████████░░░░░░ 68%

57 / 84

✓ 54 sent
× 3 failed
• 0 pending

Current recipient

Aisha Yusuf

[ Pause ]
[ Stop ]
```

The native layer should communicate progress events to React Native.

---

# 18. Results Screen

```text
MESSAGE COMPLETE

✓ 81 Sent
× 3 Failed

Total: 84

[ View Failed ]
[ Retry Failed ]
[ Done ]
```

Failed record:

```text
Ibrahim Musa
08012345678

Reason:
SMS service unavailable
```

---

# 19. Data Architecture

## Remote data

Google Sheet acts as the operator-friendly CMS.

Example spreadsheet:

| id | name | phone | class | balance | school | status |
|---|---|---|---|---:|---|---|
| 001 | Aisha Yusuf | 08012345678 | JSS 2 | 25000 | ABC College | active |
| 002 | Ibrahim Musa | 08023456789 | SS 1 | 12500 | ABC College | active |

The sheet is exposed through:

```text
GET /sheetId/sheetName.json
```

`sheet.spacet.me` documents this JSON endpoint pattern and notes that it uses caching, so changes may not appear immediately; its current documentation says the delay can be around one minute and that the service has no uptime/support guarantee.  
Source: https://sza.vercel.app/

---

# 20. Example JSON

The application should normalize the remote response into:

```json
[
  {
    "id": "001",
    "name": "Aisha Yusuf",
    "phone": "08012345678",
    "class": "JSS 2",
    "balance": "25000",
    "school": "ABC College",
    "status": "active"
  },
  {
    "id": "002",
    "name": "Ibrahim Musa",
    "phone": "08023456789",
    "class": "SS 1",
    "balance": "12500",
    "school": "ABC College",
    "status": "active"
  }
]
```

---

# 21. Configuration JSON

Do not hard-code every dataset into the application.

Create a configuration model:

```json
{
  "app": {
    "name": "MESSA",
    "version": "1.0"
  },

  "dataSource": {
    "type": "sheet",
    "endpoint": "https://sheet.spacet.me/SHEET_ID/Recipients.json",
    "refreshInterval": 300
  },

  "fields": {
    "id": "id",
    "name": "name",
    "phone": "phone"
  },

  "templates": [
    {
      "id": "fee-reminder",
      "name": "Fee Reminder",
      "message": "Dear {{name}}, your outstanding balance is {{balance}}. Please contact {{school}}."
    }
  ]
}
```

---

# 22. Template Engine

Use simple Mustache-style variables.

Example:

```text
Dear {{name}},

Your current balance is {{balance}}.

Class: {{class}}

Regards,
{{school}}
```

Input:

```json
{
  "name": "Aisha Yusuf",
  "balance": "₦25,000",
  "class": "JSS 2",
  "school": "ABC College"
}
```

Output:

```text
Dear Aisha Yusuf,

Your current balance is ₦25,000.

Class: JSS 2

Regards,
ABC College
```

---

# 23. Supported Template Features

## MVP

Support:

```text
{{name}}
{{phone}}
{{class}}
{{balance}}
{{school}}
{{date}}
{{id}}
```

## Later

Support helper functions:

```text
{{currency balance}}
{{uppercase name}}
{{date}}
{{date+7}}
```

Example:

```text
Dear {{name}},

Your payment of {{currency amount}}
was received on {{date}}.

Reference: {{reference}}
```

Do not allow arbitrary JavaScript execution inside templates.

---

# 24. Template Validation

Before sending:

### Missing variable

```text
Template requires:

{{balance}}

But 7 records do not contain
a balance value.

[ View Records ]
```

### Invalid phone

```text
3 recipients have invalid
phone numbers.

[ Review ]
```

### Empty message

Prevent sending.

### Unresolved variable

Never send:

```text
Hello {{name}}
```

If `{{name}}` cannot be resolved, mark the record invalid.

---

# 25. SMS Length Estimation

Display:

```text
Characters: 142
Parts: 1
```

For longer messages, calculate multipart SMS approximately based on GSM-7/UCS-2 encoding.

The implementation should detect Unicode characters because messages containing characters outside GSM-7 can reduce the available character count per SMS segment.

Example UI:

```text
142 characters · 1 SMS
```

or:

```text
187 characters · 2 SMS
```

This should be treated as an estimate, not a guaranteed carrier billing calculation.

---

# 26. Local Data Model

Use a lightweight local database/storage layer.

Suggested:

```text
SQLite
```

or an Expo-compatible SQLite solution.

Tables/collections:

```text
datasets
recipients
templates
campaigns
campaign_recipients
message_logs
settings
```

### Dataset

```text
id
name
endpoint
last_synced_at
record_count
```

### Recipient

```text
id
dataset_id
remote_id
phone
payload_json
updated_at
```

### Template

```text
id
name
body
created_at
updated_at
```

### Message Log

```text
id
campaign_id
recipient_id
phone
message
sim_subscription_id
status
error
created_at
```

---

# 27. Campaign Model

Every bulk operation should become a campaign.

Example:

```text
Campaign
───────────────
Name:
September Fee Reminder

Template:
Fee Reminder

Recipients:
84

SIM:
SIM 1

Status:
Completed
```

This gives MESSA a clean history system.

---

# 28. History Screen

```text
HISTORY

September Fee Reminder
84 messages
81 sent · 3 failed
Today, 4:15 PM

Exam Reminder
120 messages
120 sent
Yesterday, 10:30 AM
```

Tap a campaign to see:

```text
Campaign details

Recipients
84

Sent
81

Failed
3

SIM
SIM 1

Started
4:15 PM

Completed
4:18 PM
```

---

# 29. Search & Filtering

Support:

```text
Search name
Search phone
Search ID
```

Filters should be generated dynamically from available data fields.

Example:

```text
FILTER

Class
☐ Primary 5
☐ JSS 1
☑ JSS 2
☐ SS 1

Status
☑ Active
☐ Inactive
```

---

# 30. Dynamic Field Discovery

Since the JSON can change, the application should inspect the first valid records and discover fields.

Example:

```json
{
  "name": "...",
  "phone": "...",
  "class": "...",
  "balance": "...",
  "guardian": "..."
}
```

MESSA can automatically expose:

```text
Available variables

{{name}}
{{phone}}
{{class}}
{{balance}}
{{guardian}}
```

This is one of the product's strongest features.

---

# 31. Configuration Strategy

There are two levels.

## Level 1 — Remote data

Google Sheet contains:

```text
Recipients
```

## Level 2 — App configuration

A second Google Sheet can contain:

```text
Templates
Settings
Filters
```

Example configuration workbook:

```text
Workbook
│
├── Recipients
├── Templates
├── Settings
└── Metadata
```

This allows an administrator to change messaging content without releasing a new Android application.

---

# 32. Suggested Google Sheet Structure

## Recipients

```text
id | name | phone | class | balance | status
```

## Templates

```text
id | name | body | active
```

Example:

```text
fee-reminder | Fee Reminder | Dear {{name}}, your balance is {{balance}}. | TRUE
```

## Settings

```text
key | value
```

Example:

```text
school_name | ABC College
default_template | fee-reminder
```

---

# 33. Remote Configuration Flow

```text
Google Sheet
      ↓
sheet.spacet.me
      ↓
HTTPS GET
      ↓
JSON Parser
      ↓
Schema Validator
      ↓
Normalizer
      ↓
Local Cache
      ↓
UI
```

Always validate remote JSON before using it.

---

# 34. Caching

The application should cache the last successful dataset.

If the network is unavailable:

```text
OFFLINE MODE

Using data from:
Today, 4:20 PM

[ Retry ]
```

The user should never lose previously loaded recipients simply because the network is temporarily unavailable.

---

# 35. Refresh Behaviour

Recommended:

```text
Pull to refresh
```

and:

```text
Refresh
```

button.

Show:

```text
Last updated:
2 minutes ago
```

Because `sheet.spacet.me` uses caching, do not promise that a Google Sheet edit becomes visible instantly.

---

# 36. Error Handling

## Network error

```text
Couldn't load data.

Check your internet connection.

[ Try Again ]
[ Use Cached Data ]
```

## JSON error

```text
The data source returned
an unexpected format.

Contact your administrator.
```

## Permission error

```text
MESSA needs SMS permission
to send messages.

[ Allow SMS Access ]
```

## SIM unavailable

```text
Selected SIM is unavailable.

Choose another SIM.
```

## SMS failure

```text
Message failed.

Recipient:
08012345678

Reason:
SMS service unavailable.
```

---

# 37. Native Android Architecture

Recommended structure:

```text
React Native / Expo
        │
        │ Native Module
        ▼
Kotlin SMS Module
        │
        ├── SubscriptionManager
        │
        ├── SmsManager
        │
        ├── Permission Handler
        │
        └── Broadcast Receivers
```

The native module should expose methods similar to:

```text
getSimSubscriptions()
sendSms()
sendBatch()
cancelBatch()
```

And events:

```text
smsSending
smsSent
smsFailed
batchProgress
batchCompleted
```

---

# 38. SIM Discovery

The native module should return a normalized structure:

```json
[
  {
    "subscriptionId": 1,
    "slotIndex": 0,
    "displayName": "SIM 1",
    "carrierName": "MTN Nigeria",
    "phoneNumber": null
  },
  {
    "subscriptionId": 2,
    "slotIndex": 1,
    "displayName": "SIM 2",
    "carrierName": "Airtel Nigeria",
    "phoneNumber": null
  }
]
```

The phone number may not always be available. Do not make it a required field for SIM selection.

---

# 39. Android Permission Strategy

The app should request only the permissions actually required by the implementation.

Potential permissions include:

```text
android.permission.SEND_SMS
android.permission.READ_PHONE_STATE
```

Additional permissions should only be introduced if the implementation genuinely needs them.

Explain permissions clearly before requesting them.

Example:

```text
Why MESSA needs SMS access

MESSA uses your selected SIM
to send the messages you approve.

[ Continue ]
```

---

# 40. Important Android Distribution Consideration

Direct SMS sending is a sensitive Android capability.

If the application is distributed through Google Play, the SMS permission and the application's declared core functionality must be reviewed against Google's current permission/policy requirements before publication.

For an internal/private deployment or controlled enterprise distribution, the implementation and distribution strategy can be different.

The product specification should therefore separate:

```text
Technical capability
```

from:

```text
Distribution / store policy
```

Do not assume that a technically functional SMS implementation automatically satisfies Google Play publishing requirements.

---

# 41. Expo Architecture

Recommended:

```text
Expo project
│
├── app/
│   ├── index.tsx
│   ├── data.tsx
│   ├── templates.tsx
│   ├── campaign/
│   ├── history.tsx
│   └── settings.tsx
│
├── components/
│   ├── MessaCard.tsx
│   ├── RecipientRow.tsx
│   ├── TemplateCard.tsx
│   ├── SimSelector.tsx
│   ├── ProgressBar.tsx
│   └── EmptyState.tsx
│
├── services/
│   ├── sheetService.ts
│   ├── templateService.ts
│   ├── smsService.ts
│   └── validationService.ts
│
├── native/
│   └── MessaSmsModule
│
├── store/
│   ├── appStore.ts
│   ├── dataStore.ts
│   └── campaignStore.ts
│
└── utils/
    ├── template.ts
    ├── phone.ts
    └── smsLength.ts
```

---

# 42. Recommended React Native Stack

```text
React Native
Expo
TypeScript
Expo Router
NativeWind / Tailwind-style styling
Zustand
Expo SQLite
React Hook Form
Zod
Lucide React Native
```

Optional:

```text
TanStack Query
```

for remote data fetching and caching.

---

# 43. Data Service

Pseudo-flow:

```ts
async function loadRecipients() {
  const response = await fetch(DATA_ENDPOINT);

  if (!response.ok) {
    throw new Error("Unable to load dataset");
  }

  const json = await response.json();

  return normalizeRecipients(json);
}
```

Never trust the remote response blindly.

Validate:

```text
is array
phone exists
record shape
maximum dataset size
```

---

# 44. Template Service

Pseudo-flow:

```ts
function renderTemplate(template, record) {
  return template.replace(
    /{{\s*([^}]+)\s*}}/g,
    (_, key) => record[key] ?? ""
  );
}
```

Production version should additionally:

- detect missing values
- trim values
- escape unsafe data where necessary
- report unresolved variables
- support formatting helpers

---

# 45. SMS Service Interface

React Native should not directly know the Android implementation details.

Expose a service:

```ts
type SimSubscription = {
  subscriptionId: number;
  slotIndex: number;
  displayName: string;
  carrierName?: string;
};

type SmsRequest = {
  subscriptionId: number;
  phone: string;
  message: string;
};

type SmsResult = {
  success: boolean;
  error?: string;
};

export interface SmsService {
  getSubscriptions(): Promise<SimSubscription[]>;
  send(request: SmsRequest): Promise<SmsResult>;
}
```

This makes the application easier to test.

---

# 46. Batch Sending

Do not blindly launch hundreds of native SMS requests simultaneously.

Use a queue:

```text
Queue
 ↓
Worker
 ↓
SMS request
 ↓
Result
 ↓
Next request
```

Recommended initial approach:

```text
Concurrency: 1
```

Then evaluate device/carrier behavior before considering controlled concurrency.

This prevents the UI and telephony subsystem from being overwhelmed.

---

# 47. Batch State Machine

Each message can have:

```text
pending
sending
sent
failed
cancelled
```

Campaign can have:

```text
draft
ready
sending
paused
completed
cancelled
failed
```

---

# 48. Pause / Resume

MVP:

```text
Stop
```

Post-MVP:

```text
Pause
Resume
```

When paused:

```text
SENDING PAUSED

57 / 84 completed

[ Resume ]
[ Cancel Campaign ]
```

---

# 49. Safety Controls

Because bulk SMS can cause accidental messaging, include:

### Preview

Always preview at least one generated message.

### Recipient count

Show exactly how many recipients will receive the campaign.

### SIM

Show the selected SIM immediately before sending.

### Confirmation

```text
Send 84 messages using SIM 1?
```

### Destructive action

Require explicit confirmation before cancellation.

---

# 50. Anti-Accidental-Send Design

Never place:

```text
Send All
```

next to:

```text
Cancel
```

with identical button styling.

Instead:

```text
[ Review Campaign ]

then

[ Send 84 Messages ]
```

---

# 51. Privacy

Remote data may contain personal information.

MESSA should:

- Avoid logging entire recipient records.
- Avoid sending recipient data to analytics providers.
- Avoid storing more data locally than necessary.
- Encrypt sensitive local data where appropriate.
- Provide a clear cache-clear option.
- Avoid exposing phone numbers in debug logs.
- Avoid screenshots containing recipient data where practical.

---

# 52. Security

Never put:

```text
Google service-account private keys
```

inside the mobile application.

For the `sheet.spacet.me` public JSON approach, only expose datasets intended to be accessible through that service.

If sensitive/private data is required, introduce a controlled backend rather than exposing a private Google Sheet through a public endpoint.

---

# 53. Google Sheet Data Security

Recommended rule:

> **If the dataset contains information that should not be publicly accessible, do not use a public JSON endpoint as the application's security boundary.**

For sensitive records, use:

```text
Mobile App
   ↓
Authenticated API
   ↓
Server
   ↓
Google Sheets / Database
```

instead.

---

# 54. Offline Strategy

Store:

```text
last successful dataset
last successful templates
last campaign status
```

When offline:

```text
Cached data available

Last synced:
Today 5:42 PM

[ Continue Offline ]
```

However, sending SMS itself still requires cellular service on the selected SIM.

---

# 55. Home Dashboard Information Architecture

Recommended hierarchy:

```text
HEADER
MESSA
Settings

DATA
Connected
245 records

SIM
SIM 1
MTN Nigeria

CAMPAIGN
84 recipients selected
Fee Reminder

ACTION
[ Continue Campaign ]

TODAY
84 sent
3 failed
```

---

# 56. Empty States

## No dataset

```text
No recipient data

Connect a Google Sheet
to start sending personalized
messages.

[ Configure Data Source ]
```

## No templates

```text
No templates yet

Create your first SMS template.

[ Create Template ]
```

## No history

```text
No campaigns yet

Your completed SMS campaigns
will appear here.
```

---

# 57. Loading States

Use skeletons rather than spinners everywhere.

Example:

```text
████████████
████████
██████████████
```

For syncing:

```text
Syncing recipient data...
```

---

# 58. Iconography

Use:

**Lucide Icons**

Recommended:

```text
MessageSquare
Send
Users
Database
FileText
Smartphone
SimCard
RefreshCw
Search
Filter
Check
X
AlertTriangle
Clock
History
Settings
ChevronRight
```

Avoid mixing multiple icon libraries.

---

# 59. Brand Icon Set

Create custom MESSA icons for:

```text
Data
Template
Recipient
SIM
Campaign
Send
Success
Failed
Sync
```

Base them on the same rounded geometry as the logo.

---

# 60. Logo Variations

Create:

### Primary logo

```text
[icon] MESSA
```

### Compact

```text
[icon]
```

### Horizontal

```text
[icon] MESSA
Data-to-SMS
```

### Monochrome

```text
BLACK
WHITE
```

### App icon

Use only the message/data icon.

---

# 61. App Icon

Recommended composition:

```text
Rounded square
      ↓
Indigo background
      ↓
White message/data symbol
      ↓
Small cyan signal/arrow detail
```

Do not put the full word MESSA inside the app icon.

---

# 62. Splash Branding

```text
[ MESSA ICON ]

MESSA
Turn Data Into Messages.
```

Background:

```text
#F8FAFC
```

Logo:

```text
#4F46E5
```

---

# 63. Microinteractions

### Data sync

Animate:

```text
cloud → database
```

### Message generation

Animate:

```text
data row → message bubble
```

### Sending

Animate a subtle progress indicator.

### Success

Use a small check animation.

Avoid excessive animations because the product is a utility tool.

---

# 64. UX Principle

Every screen should answer:

```text
What am I doing?
What data am I using?
What will happen next?
```

The user should never wonder:

> "Did this actually send?"

---

# 65. Recommended Campaign Wizard

Instead of putting everything on one screen, use a four-step wizard.

```text
01 DATA
02 MESSAGE
03 REVIEW
04 SEND
```

### Step 1

```text
Choose recipients
```

### Step 2

```text
Choose template
```

### Step 3

```text
Choose SIM + preview
```

### Step 4

```text
Send
```

Progress:

```text
●────●────○────○
Data  Message Review Send
```

---

# 66. Recommended MVP

## Must Have

- Android
- React Native + Expo
- TypeScript
- Google Sheet JSON loading
- Data caching
- Dynamic fields
- Recipient selection
- Search
- Basic filtering
- SMS templates
- Dynamic variables
- SIM selection
- Direct native SMS
- Preview
- Batch queue
- Progress
- Success/failure logs
- History
- Settings

## Version 1.1

- Advanced filters
- Template management from Google Sheets
- Campaign naming
- Pause/resume
- Retry failed messages
- Better analytics

## Version 2

- Authentication
- Remote configuration
- Multiple data sources
- Secure backend
- Scheduled campaigns
- Delivery reporting where supported
- Team accounts

---

# 67. Suggested App Screens

```text
Splash
  ↓
Home
  ├── Data
  │    ├── Search
  │    ├── Filter
  │    └── Recipient Details
  │
  ├── New Campaign
  │    ├── Select Recipients
  │    ├── Select Template
  │    ├── Select SIM
  │    ├── Preview
  │    ├── Confirm
  │    ├── Sending
  │    └── Results
  │
  ├── Templates
  │    ├── Template List
  │    ├── Create
  │    └── Edit
  │
  ├── History
  │    └── Campaign Details
  │
  └── Settings
       ├── Data Source
       ├── SMS
       ├── Cache
       └── About
```

---

# 68. Settings Screen

```text
SETTINGS

Data
  Data Source
  Sync Settings

SMS
  Default SIM
  Confirmation
  Batch Settings

Storage
  Cached Data
  Clear Cache

About
  Version
  Privacy
  Terms
```

---

# 69. Data Source Configuration

```text
DATA SOURCE

JSON Endpoint

[ https://sheet.spacet.me/... ]

Dataset name

[ Recipients ]

[ Test Connection ]

Connection status

● Connected
```

After successful test:

```text
245 records found
7 fields detected
```

---

# 70. Dynamic Field Mapping

Allow the user to define:

```text
Phone field
[ phone ▼ ]

Name field
[ name ▼ ]

ID field
[ id ▼ ]
```

The dropdown should be populated from detected JSON fields.

This makes the application reusable with different spreadsheets.

---

# 71. Automatic Phone Normalization

Support common Nigerian formats:

```text
08012345678
+2348012345678
2348012345678
```

Normalize internally to:

```text
+2348012345678
```

Do not silently alter unusual/international numbers.

Provide validation feedback.

---

# 72. Example Campaign

Dataset:

```text
name: Aisha Yusuf
phone: 08012345678
balance: 25000
class: JSS 2
```

Template:

```text
Dear {{name}}, your outstanding balance is
{{balance}}. Please contact the school office.
```

Generated:

```text
Dear Aisha Yusuf, your outstanding balance is
₦25,000. Please contact the school office.
```

---

# 73. Product Positioning

MESSA should not be marketed primarily as:

> "A bulk SMS app."

Instead:

> **A mobile data-to-message automation tool.**

This distinction leaves room for future capabilities:

```text
Google Sheets
CSV
API
Database
Forms
CRM
ERP
```

all feeding the same messaging engine.

---

# 74. Design Moodboard

Keywords:

```text
Clean
Operational
Data-driven
Mobile-first
Reliable
Fast
Focused
Professional
Friendly
Minimal
```

Visual references:

```text
Modern fintech dashboard
+
Simple Android utility
+
Spreadsheet interface
+
Messaging application
```

But do not copy any specific product's visual identity.

---

# 75. Brand Photography / Illustration Style

If illustrations are used:

- abstract data rows
- message bubbles
- mobile devices
- check marks
- network signals
- spreadsheet cards

Use flat vector illustrations.

Avoid:

- stock-photo-heavy screens
- business handshake photography
- generic smiling-office imagery

The product should be recognizable through UI and iconography.

---

# 76. Voice & Tone

MESSA speaks:

### Clearly

"84 recipients selected."

Not:

"You've successfully made a selection of 84 recipients!"

### Confidently

"Ready to send."

Not:

"Are you perhaps ready to maybe send?"

### Helpfully

"3 records are missing phone numbers."

Not:

"Invalid data."

### Concisely

"SIM 1 unavailable."

Not:

"Unfortunately, the selected SIM card appears to be unavailable at this point in time."

---

# 77. Notification Copy

### Sync completed

```text
MESSA

Recipient data updated.
245 records loaded.
```

### Campaign completed

```text
Campaign complete

81 messages sent successfully.
3 failed.
```

### Failed

```text
Some messages failed

3 of 84 messages could not be sent.
```

---

# 78. Accessibility

Implement:

- Minimum 44–48px touch targets
- High contrast
- Screen-reader labels
- Meaningful button labels
- Avoid color-only status indicators
- Clear focus states
- Dynamic font support where practical

Example:

Instead of only:

```text
●
```

use:

```text
● Connected
```

---

# 79. Performance

Target:

```text
Startup < 2 seconds
```

for normal cached state.

Avoid rendering thousands of recipients at once.

Use:

```text
FlatList
```

with:

- stable keys
- memoized rows
- pagination/virtualization
- local filtering where appropriate

---

# 80. Large Dataset Strategy

For 10,000+ records:

Do not keep everything as a large React state object.

Use:

```text
SQLite
```

for persistence/querying.

React state should contain:

```text
current filters
selected IDs
visible rows
campaign state
```

rather than the entire raw dataset.

---

# 81. Network Efficiency

Do not continuously download the JSON endpoint.

Use:

```text
manual refresh
+
controlled background refresh
+
local cache
```

Example:

```text
Refresh interval:
15 minutes
```

The actual value should be configurable.

---

# 82. Analytics

Avoid collecting recipient/message content in analytics.

Safe operational metrics:

```text
campaign_started
campaign_completed
campaign_failed
dataset_loaded
template_used
```

Do not send:

```text
recipient phone number
recipient name
message body
```

to third-party analytics.

---

# 83. Testing Strategy

## Unit tests

Test:

```text
template rendering
phone normalization
field mapping
SMS length estimation
JSON normalization
filtering
selection
```

## Native tests

Test:

```text
SIM discovery
permission handling
single SMS
failed SMS
invalid subscription
```

## Integration tests

Test:

```text
JSON → recipient
recipient → template
template → generated message
generated message → SMS request
```

---

# 84. Test Dataset

Create a development Google Sheet containing:

```text
id
name
phone
class
balance
status
guardian
reference
```

Include deliberately bad records:

```text
missing phone
invalid phone
missing name
missing balance
empty row
duplicate phone
```

This ensures validation is tested.

---

# 85. Development Phases

## Phase 1 — Brand + UI

Build:

```text
Splash
Home
Data
Templates
Settings
```

using mocked data.

## Phase 2 — JSON

Implement:

```text
sheet.spacet.me
fetch
normalize
validate
cache
```

## Phase 3 — Template Engine

Implement:

```text
variables
preview
validation
formatting
```

## Phase 4 — Native SMS

Implement:

```text
Kotlin native module
SIM discovery
permission
single SMS
```

## Phase 5 — Batch SMS

Implement:

```text
queue
progress
failure handling
retry
history
```

## Phase 6 — Production Hardening

Implement:

```text
privacy
security
large datasets
offline mode
crash handling
store/distribution compliance
```

---

# 86. Suggested Folder Structure

```text
messa/
│
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── data.tsx
│   ├── templates.tsx
│   ├── history.tsx
│   ├── settings.tsx
│   │
│   └── campaign/
│       ├── recipients.tsx
│       ├── template.tsx
│       ├── sim.tsx
│       ├── review.tsx
│       ├── sending.tsx
│       └── result.tsx
│
├── components/
├── hooks/
├── services/
├── store/
├── db/
├── utils/
├── types/
├── constants/
│
├── modules/
│   └── messa-sms/
│
├── assets/
│   ├── icon.png
│   ├── splash.png
│   └── logo/
│
├── app.json
├── eas.json
├── package.json
└── tsconfig.json
```

---

# 87. Native Module Boundary

Keep native code small.

React Native owns:

```text
UI
data
templates
campaign logic
validation
history
```

Native Android owns:

```text
SIM discovery
SMS permission
SmsManager
Android telephony integration
SMS result callbacks
```

This keeps the product maintainable.

---

# 88. Native Module API Concept

```text
MessaSms.getSubscriptions()

MessaSms.sendSms({
  subscriptionId,
  destination,
  message
})

MessaSms.sendBatch({
  subscriptionId,
  messages
})
```

Events:

```text
MessaSms.on("sent")
MessaSms.on("failed")
MessaSms.on("progress")
MessaSms.on("completed")
```

The exact implementation should follow the current Android API behavior and permission model.

---

# 89. Expo Development Approach

Because the product needs a custom native Android capability, plan the project around an Expo workflow that produces a native Android build containing the custom module.

Do not assume:

```text
Expo Go
```

will contain the custom MESSA SMS native module.

Expo documents native-module integration and provides mechanisms for projects that need native Android configuration.  
Sources: https://docs.expo.dev/brownfield/overview/ and https://docs.expo.dev/versions/latest/config/app/

---

# 90. First Prototype

The first clickable prototype should contain:

```text
Home
 ↓
Data
 ↓
Select 3 recipients
 ↓
Template
 ↓
Generate messages
 ↓
SIM selection
 ↓
Review
 ↓
Mock sending progress
 ↓
Results
```

Initially mock:

```text
SIM list
SMS sending
campaign history
```

Then replace each mock service with the real implementation.

---

# 91. Example UI Copy

## Home

```text
Good evening

Ready to send?

245 recipients
3 templates
SIM 1 connected

[ Start Campaign ]
```

## Data

```text
Recipient Data

245 records
Last synced 2 min ago

[ Search ]

84 selected
```

## Template

```text
Choose a message

Fee Reminder
Exam Reminder
Payment Confirmation
Custom Message
```

## Review

```text
Everything looks ready.

84 recipients
Fee Reminder
SIM 1

[ Send 84 Messages ]
```

---

# 92. Brand Asset Checklist

```text
☐ Primary logo
☐ Horizontal logo
☐ Icon mark
☐ App icon
☐ Splash logo
☐ Monochrome logo
☐ Dark-background logo
☐ Light-background logo
☐ Favicon
☐ Social avatar
☐ Brand color palette
☐ Typography guide
☐ Icon style
☐ UI component guide
☐ Illustration direction
☐ Tone-of-voice guide
```

---

# 93. Recommended Brand File Set

```text
brand/
├── logo-primary.svg
├── logo-horizontal.svg
├── logo-mark.svg
├── logo-white.svg
├── logo-black.svg
├── app-icon-1024.png
├── splash-logo.svg
├── favicon.svg
├── colors.md
├── typography.md
└── brand-guidelines.md
```

---

# 94. Final Product Identity

## MESSA

### Data-to-SMS

**Turn Data Into Messages.**

MESSA is a focused Android utility that connects structured data with real-world SMS communication.

Its strongest product loop is:

```text
DATA
 ↓
SELECT
 ↓
PERSONALIZE
 ↓
REVIEW
 ↓
SEND
```

The visual identity should reinforce that loop everywhere.

---

# 95. One-Sentence Product Description

> **MESSA is an Android data-to-SMS automation app that loads recipient data from configurable JSON sources, personalizes messages with dynamic templates, lets users choose a SIM, and sends approved SMS campaigns directly from the device.**

---

# 96. Technical Reference Notes

### Expo SMS

Expo's official SMS module supports launching the system SMS composer with prefilled recipients and message content. It does not provide the direct background/batch SMS behavior required by MESSA.

Reference:

https://docs.expo.dev/versions/latest/sdk/sms/

### Android Subscription IDs

Android recommends Subscription ID for associating application functionality with specific mobile subscriptions/SIMs. Permission requirements should be handled according to the Android version and exact API usage.

Reference:

https://developer.android.com/identity/user-data-ids

### Android Telephony

Android's telephony APIs expose multi-SIM/subscription concepts and related device/carrier capabilities.

Reference:

https://developer.android.com/reference/android/telephony/TelephonyManager

### Google Sheets

Google Sheets provides APIs for reading and writing spreadsheet data. For MESSA's lightweight public configuration model, the application can consume the JSON representation supplied by `sheet.spacet.me`.

References:

https://developers.google.com/workspace/sheets/api

https://sza.vercel.app/

---

# 97. Final Recommendation

Build MESSA as:

```text
React Native + Expo
        +
TypeScript
        +
Native Android Kotlin SMS module
        +
SubscriptionManager / SmsManager
        +
sheet.spacet.me JSON
        +
Google Sheets
        +
SQLite local cache
        +
Zustand
        +
Lucide
        +
Tailwind-style UI
```

The central architectural principle should be:

> **Keep the data and messaging intelligence in React Native, but keep SIM selection and direct SMS transmission in a small, isolated native Android module.**

This provides a clean separation between the product experience and Android's telephony layer while keeping the application flexible enough to support additional data sources in the future.
