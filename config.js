module.exports = {
  // Metabase
  METABASE_URL:         "https://metabase.terratern.com",
  METABASE_API_KEY:     process.env.METABASE_API_KEY,
  METABASE_DATABASE_ID: 2,
  METABASE_QUESTION_ID: process.env.METABASE_QUESTION_ID, // Paste question ID once received

  // Meta
  PIXEL_ID:           process.env.PIXEL_ID,
  CAPI_ACCESS_TOKEN:  process.env.CAPI_ACCESS_TOKEN,

  // Supabase
  SUPABASE_URL:       "https://otzmitwvvetdzheogtkr.supabase.co",
  SUPABASE_ANON_KEY:  process.env.SUPABASE_ANON_KEY,

  // Lead Status IDs → Meta Event Names
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
