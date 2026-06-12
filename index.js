const { fetchRecentStatusChanges } = require("./metabase");
const { sendToMetaCAPI } = require("./capi");
const crypto = require("crypto");

function hash(value) {
  if (!value) return null;
  return crypto.createHash("sha256").update(value.toString().trim().toLowerCase()).digest("hex");
}

function normalizePhone(countryCode, mobile) {
  if (!mobile) return null;
  let m = mobile.toString().replace(/\D/g, "").trim();
  let cc = (countryCode || "91").toString().replace(/\D/g, "").trim();
  if (!cc) cc = "91";
  // Already has country code prefixed
  if (m.length > 10) return m;
  return cc + m;
}
const { isAlreadySent, markAsSent } = require("./dedup");
const { TRACKED_STATUSES } = require("./config");

async function run() {
  console.log(`\n[${new Date().toISOString()}] 🔄 Starting CAPI pull...`);

  const leads = await fetchRecentStatusChanges();
  console.log(`[Metabase] Found ${leads.length} leads with tracked status changes`);

  if (leads.length === 0) {
    console.log("[CAPI] Nothing to send.\n");
    process.exit(0);
  }

  const toSend = [];

  for (const lead of leads) {
    const leadId = lead.id || lead.lead_id;
    const statusId = Number(lead.lead_status_id);
    const eventName = TRACKED_STATUSES[statusId];
    if (!eventName) continue;

    const alreadySent = await isAlreadySent(leadId, statusId);
    if (alreadySent) {
      console.log(`[Dedup] Skipping lead ${lead.lead_id} (${eventName}) — already sent`);
      continue;
    }

    const normalizedPhone = normalizePhone(lead.country_code, lead.mobile);
    const phoneHash = hash(normalizedPhone);
    const emailHash = hash(lead.email);

    // Debug — remove after confirming
    console.log(`[Debug] lead ${leadId} | phone: ${normalizedPhone} | email: ${lead.email} | phoneHash: ${phoneHash?.slice(0,8)} | emailHash: ${emailHash?.slice(0,8)}`);

    toSend.push({
      leadId,
      eventName,
      eventTime: Math.floor(new Date(lead.updated_at).getTime() / 1000),
      phoneHash,
      emailHash,
      statusId,
    });
  }

  console.log(`[CAPI] ${toSend.length} new event(s) to send`);

  if (toSend.length === 0) {
    process.exit(0);
  }

  try {
    const metaRes = await sendToMetaCAPI(toSend);
    for (const e of toSend) {
      await markAsSent(e.leadId, e.statusId, e.eventName, e.phoneHash, metaRes);
    }
    console.log(`[CAPI] ✅ Done. ${toSend.length} event(s) logged to Supabase.\n`);
  } catch (err) {
    console.error("[CAPI] ❌ Failed to send batch.\n");
    process.exit(1);
  }

  process.exit(0);
}

run();
