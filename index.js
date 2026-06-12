const cron = require("node-cron");
const { fetchRecentStatusChanges } = require("./metabase");
const { sendToMetaCAPI } = require("./capi");
const { isAlreadySent, markAsSent } = require("./dedup");
const { CRON_SCHEDULE, TRACKED_STATUSES } = require("./config");
const crypto = require("crypto");

function hash(value) {
  if (!value) return null;
  return crypto.createHash("sha256").update(value.toString().trim().toLowerCase()).digest("hex");
}

function normalizePhone(phone) {
  if (!phone) return null;
  let p = phone.toString().replace(/\D/g, "");
  if (p.length === 10) p = "91" + p;
  if (p.length === 12 && p.startsWith("91")) return p;
  return null;
}

async function run() {
  console.log(`\n[${new Date().toISOString()}] 🔄 Starting CAPI pull...`);

  const leads = await fetchRecentStatusChanges();
  console.log(`[Metabase] Found ${leads.length} leads with tracked status changes`);

  if (leads.length === 0) {
    console.log("[CAPI] Nothing to send.\n");
    return;
  }

  const toSend = [];

  for (const lead of leads) {
    const statusId = Number(lead.lead_status_id);
    const eventName = TRACKED_STATUSES[statusId];
    if (!eventName) continue;

    const alreadySent = await isAlreadySent(lead.lead_id, statusId);
    if (alreadySent) {
      console.log(`[Dedup] Skipping lead ${lead.lead_id} (${eventName}) — already sent`);
      continue;
    }

    const normalizedPhone = normalizePhone(lead.phone);
    toSend.push({
      leadId: lead.lead_id,
      eventName,
      eventTime: Math.floor(new Date(lead.updated_at).getTime() / 1000),
      phone: normalizedPhone,
      phoneHash: hash(normalizedPhone),
      email: lead.email,
      program: lead.program,
      statusId,
    });
  }

  console.log(`[CAPI] ${toSend.length} new event(s) to send`);
  if (toSend.length === 0) return;

  try {
    const metaRes = await sendToMetaCAPI(toSend);
    for (const e of toSend) {
      await markAsSent(e.leadId, e.statusId, e.eventName, e.phoneHash, metaRes);
    }
    console.log(`[CAPI] ✅ Done. ${toSend.length} event(s) logged to Supabase.\n`);
  } catch (err) {
    console.error("[CAPI] ❌ Failed to send batch. Will retry next cycle.\n");
  }
}

// Run once immediately on start
run();

// Schedule: hourly, Mon–Sat, 10AM–7PM IST
cron.schedule(CRON_SCHEDULE, () => { run(); });

console.log("🚀 TerraTern CAPI Poller running...");
console.log(`📅 Schedule: Hourly, Mon–Sat, 10AM–7PM IST (9 pulls/day)`);
