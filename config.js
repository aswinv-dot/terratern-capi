module.exports = {
  // Metabase
  METABASE_URL: "https://metabase.terratern.com",
  METABASE_API_KEY: process.env.METABASE_API_KEY,
  METABASE_DATABASE_ID: 2,

  // Meta
  PIXEL_ID: process.env.PIXEL_ID,
  CAPI_ACCESS_TOKEN: process.env.CAPI_ACCESS_TOKEN,

  // Supabase
  SUPABASE_URL: "https://otzmitwvvetdzheogtkr.supabase.co",
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,

  // Schedule: hourly, Mon–Sat, 10AM–7PM IST (4:30AM–1:30PM UTC)
  CRON_SCHEDULE: "0 4,5,6,7,8,9,10,11,12,13 * * 1-6",

  // Lead Status IDs to track
  TRACKED_STATUSES: {
    12: "WebinarBooked",
    20: "WebinarBooked",
    24: "WebinarBooked",
    15: "WebinarAttended",
    13: "CounsellingDone",
    26: "PaymentScheduled",
    8:  "Purchase",
    17: "Purchase"
  }
};
