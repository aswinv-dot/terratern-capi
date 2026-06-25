const express = require("express");
const crypto  = require("crypto");
const { fetchRecentStatusChanges } = require("./metabase");
const { sendToMetaCAPI }           = require("./capi");
const { isAlreadySent, markAsSent } = require("./dedup");
const { TRACKED_STATUSES, TRIGGER_SECRET } = require("./config");

// ── Helpers ──
function hash(value) {
  if (!value) return null;
  return crypto.createHash("sha256").update(value.toString().trim().toLowerCase()).digest("hex");
}

function normalizePhone(countryCode, mobile) {
  if (!mobile) return null;
  let m  = mobile.toString().replace(/\D/g, "").trim();
  let cc = (countryCode || "91").toString().replace(/\D/g, "").trim();
  if (!cc) cc = "91";
  if (m.length > 10) return m;
  return cc + m;
}

// ── Core run logic (shared by cron and manual trigger) ──
let isRunning = false;

async function run(triggeredBy = "cron") {
  if (isRunning) {
    console.log(`[${new Date().toISOString()}] ⚠ Run already in progress — skipping`);
    return { skipped: true, reason: "already_running" };
  }

  isRunning = true;
  const startTime = Date.now();
  console.log(`\n[${new Date().toISOString()}] 🔄 Starting CAPI pull (triggered by: ${triggeredBy})...`);

  try {
    const leads = await fetchRecentStatusChanges();
    console.log(`[Metabase] Found ${leads.length} leads with tracked status changes`);

    if (leads.length === 0) {
      console.log("[CAPI] Nothing to send.");
      isRunning = false;
      return { sent: 0, skipped: 0, duration: Date.now() - startTime };
    }

    const toSend = [];

    for (const lead of leads) {
      const rawId  = lead.id || lead.lead_id;
      const leadId = rawId ? String(rawId).replace(/,/g, "").trim() : null;
      if (!leadId) { console.log(`[Skip] Lead with no ID`); continue; }

      const statusId  = Number(lead.lead_status_id);
      const eventName = TRACKED_STATUSES[statusId];
      if (!eventName) continue;

      const alreadySent = await isAlreadySent(leadId, statusId);
      if (alreadySent) {
        console.log(`[Dedup] Skipping lead ${leadId} (${eventName}) — already sent`);
        continue;
      }

      const normalizedPhone = normalizePhone(lead.country_code, lead.mobile);
      toSend.push({
        leadId,
        eventName,
        eventTime:     Math.floor(new Date(lead.updated_at).getTime() / 1000),
        phoneHash:     hash(normalizedPhone),
        emailHash:     hash(lead.email),
        stateHash:     lead.state ? hash(lead.state) : null,
        paymentAmount: lead.payment_amount || null,
        statusId,
      });
    }

    console.log(`[CAPI] ${toSend.length} new event(s) to send`);

    if (toSend.length === 0) {
      isRunning = false;
      return { sent: 0, skipped: leads.length, duration: Date.now() - startTime };
    }

    const metaRes = await sendToMetaCAPI(toSend);

    for (const e of toSend) {
      await markAsSent(e.leadId, e.statusId, e.eventName, e.phoneHash, metaRes);
    }

    console.log(`[CAPI] ✅ Done. ${toSend.length} event(s) logged to Supabase.\n`);
    isRunning = false;
    return { sent: toSend.length, skipped: leads.length - toSend.length, duration: Date.now() - startTime };

  } catch (err) {
    console.error("[CAPI] ❌ Run failed:", err.message);
    isRunning = false;
    throw err;
  }
}

// ── Express server ──
const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check — Railway uses this to confirm service is alive
app.get("/health", (req, res) => {
  res.json({ status: "ok", running: isRunning, ts: new Date().toISOString() });
});

// Manual trigger — protected by TRIGGER_SECRET header
app.post("/trigger", async (req, res) => {
  const secret = req.headers["x-trigger-secret"] || req.query.secret;
  if (!TRIGGER_SECRET || secret !== TRIGGER_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (isRunning) {
    return res.status(409).json({ error: "Run already in progress", running: true });
  }

  // Fire run async — respond immediately so dashboard doesn't time out
  res.json({ status: "triggered", ts: new Date().toISOString() });

  try {
    const result = await run("manual");
    console.log(`[Trigger] Manual run complete:`, result);
  } catch (err) {
    console.error(`[Trigger] Manual run failed:`, err.message);
  }
});

app.listen(PORT, () => {
  console.log(`[Server] TerraTern CAPI running on port ${PORT}`);
  console.log(`[Server] /health and /trigger endpoints active`);
});

// ── Scheduled cron run ──
// Railway Cron: keep the cron schedule in Railway settings (every 90 min, 6AM-11PM IST)
// On each cron invocation Railway will POST to /trigger with the secret,
// OR you can keep running `node index.js --cron` and call run() directly.
// Simple approach: just call run() on startup when invoked with --cron flag.
if (process.argv.includes("--cron")) {
  run("cron").then(() => {
    // Don't exit — keep server alive
  }).catch(err => {
    console.error("[Cron] Failed:", err.message);
  });
}
