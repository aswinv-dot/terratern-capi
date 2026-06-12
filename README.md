# TerraTern Meta CAPI Signal Pusher

Pushes downstream CRM conversion signals to Meta CAPI so the ad algorithm optimizes on real buyer behavior, not just form fills.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Fill in config.js
Open `config.js` and paste:
- `METABASE_API_KEY` → Metabase → Top Right Avatar → Account Settings → API Keys
- `PIXEL_ID` → Meta Events Manager → Your Pixel → Settings
- `CAPI_ACCESS_TOKEN` → Meta Business Manager → System Users → Generate Token

### 3. Verify your leads table columns
The query in `metabase.js` assumes your leads table has:
- `id` → lead ID
- `phone` → mobile number
- `email` → email address
- `lead_status_id` → FK to lead_status table
- `updated_at` → timestamp of last update
- `program` → optional, the immigration program

If column names differ, update the query in `metabase.js`.

### 4. Run locally to test
```bash
node index.js
```

### 5. Deploy to Railway
- Push to GitHub
- Connect repo in Railway
- Set start command: `node index.js`

## Events fired to Meta

| CRM Status | Meta Event |
|---|---|
| Webinar Booked (12, 20, 24) | WebinarBooked |
| Webinar Attended (15) | WebinarAttended |
| Counselling Done - Interested (13) | CounsellingDone |
| Payment Scheduled (26) | PaymentScheduled |
| Payment Done (8, 17) | Purchase |

## Schedule
Runs hourly, Monday–Saturday, 10AM–7PM IST (9 pulls/day).

## Dedup
Every sent event is logged in `logs/sent_events.json`. Same lead + same status will never be sent twice.

## Phase 2
When direct DB access is available, replace `metabase.js` with a direct MySQL query. Everything else stays the same.
