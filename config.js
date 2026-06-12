// ─────────────────────────────────────────────
// TERRATERN META CAPI CONFIG
// Fill in your values below
// ─────────────────────────────────────────────

module.exports = {
  // Metabase
  METABASE_URL: "https://metabase.terratern.com",         // No trailing slash
  METABASE_API_KEY: "PASTE_YOUR_METABASE_API_KEY_HERE",   // Metabase → Account Settings → API Key
  METABASE_DATABASE_ID: 2,                                 // Already confirmed from your URL

  // Meta
  PIXEL_ID: "PASTE_YOUR_PIXEL_ID_HERE",                   // 15-16 digit number from Events Manager
  CAPI_ACCESS_TOKEN: "PASTE_YOUR_CAPI_ACCESS_TOKEN_HERE", // System User token from Business Manager

  // Schedule: hourly, 10AM–7PM IST (4:30AM–1:30PM UTC)
  CRON_SCHEDULE: "0 4,5,6,7,8,9,10,11,12,13 * * 1-6",   // Mon–Sat, 9 runs/day

  // Lead Status IDs to track (from your CRM)
  TRACKED_STATUSES: {
    12: "WebinarBooked",
    20: "WebinarBooked",       // Webinar Booked System
    24: "WebinarBooked",       // Webinar Booked 1:1
    15: "WebinarAttended",
    13: "CounsellingDone",     // Counselling Done - Interested
    26: "PaymentScheduled",
    8:  "Purchase",            // Payment Done
    17: "Purchase"             // Payment Done - Secondary
  }
};
