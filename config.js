module.exports = {
  METABASE_API_KEY:   process.env.METABASE_API_KEY,
  PIXEL_ID:           process.env.PIXEL_ID,
  CAPI_ACCESS_TOKEN:  process.env.CAPI_ACCESS_TOKEN,
  SUPABASE_ANON_KEY:  process.env.SUPABASE_ANON_KEY,
  TRIGGER_SECRET:     process.env.TRIGGER_SECRET,   // set this in Railway env vars

  TRACKED_STATUSES: {
    12: "WebinarBooked",
    20: "WebinarBooked",
    24: "WebinarBooked",
    15: "WebinarAttended",
    13: "CounsellingDone",
    26: "PaymentScheduled",
    8:  "Purchase",
    17: "Purchase",
  },
};
