const { createClient } = require("@supabase/supabase-js");
const { SUPABASE_URL, SUPABASE_ANON_KEY } = require("./config");

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function isAlreadySent(leadId, statusId) {
  const { data, error } = await supabase
    .from("capi_events_log")
    .select("id")
    .eq("lead_id", leadId)
    .eq("status_id", statusId)
    .limit(1);

  if (error) {
    console.error("[Supabase] isAlreadySent error:", error.message);
    return false; // Fail open — try to send rather than silently skip
  }
  return data && data.length > 0;
}

async function markAsSent(leadId, statusId, eventName, phoneHash, metaResponse) {
  const { error } = await supabase.from("capi_events_log").insert({
    lead_id: String(leadId),
    status_id: statusId,
    event_name: eventName,
    phone_hash: phoneHash || null,
    meta_response: metaResponse ? JSON.stringify(metaResponse) : null,
    sent_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[Supabase] markAsSent error:", error.message);
  }
}

module.exports = { isAlreadySent, markAsSent };
