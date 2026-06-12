const cron = require("node-cron");
const { fetchRecentStatusChanges } = require("./metabase");
const { sendToMetaCAPI } = require("./capi");
const { isAlreadySent, markAsSent } = require("./dedup");
const { CRON_SCHEDULE, TRACKED_STATUSES } = require("./config");

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
    const statusId = lead.lead_status_id;
    const eventName = TRACKED_STATUSES[statusId];

    if (!eventName) continue;
    if (isAlreadySent(lead.lead_id, statusId)) {
      console.log(`[Dedup] Skipping lead ${lead.lead_id} (${eventName}) — already sent`);
      continue;
    }

    toSend.push({
      leadId: lead.lead_id,
      eventName,
      eventTime: Math.floor(new Date(lead.updated_at).getTime() / 1000),
      phone: lead.phone,
      email: lead.email,
      program: lead.program,
      statusId,
    });
  }

  console.log(`[CAPI] ${toSend.length} new event(s) to send`);

  if (toSend.length === 0) return;

  try {
    await sendToMetaCAPI(toSend);
    // Mark all as sent only after successful CAPI call
    for (const e of toSend) {
      markAsSent(e.leadId, e.statusId, e.eventName);
    }
    console.log(`[CAPI] ✅ Done. ${toSend.length} event(s) logged.\n`);
  } catch (err) {
    console.error("[CAPI] ❌ Failed to send batch. Will retry next cycle.\n");
  }
}

// Run once immediately on start
run();

// Schedule: hourly, Mon–Sat, 10AM–7PM IST (4:30AM–1:30PM UTC)
cron.schedule(CRON_SCHEDULE, () => {
  run();
});

console.log("🚀 TerraTern CAPI Poller running...");
console.log(`📅 Schedule: Hourly, Mon–Sat, 10AM–7PM IST`);
