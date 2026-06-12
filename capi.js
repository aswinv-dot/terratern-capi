const axios = require("axios");
const crypto = require("crypto");

const { PIXEL_ID, CAPI_ACCESS_TOKEN } = require("./config");

// Hash phone/email for Meta privacy compliance
function hash(value) {
  if (!value) return null;
  return crypto
    .createHash("sha256")
    .update(value.toString().trim().toLowerCase())
    .digest("hex");
}

// Normalize Indian phone numbers to E.164 format
function normalizePhone(phone) {
  if (!phone) return null;
  let p = phone.toString().replace(/\D/g, "");
  if (p.length === 10) p = "91" + p;
  if (p.length === 12 && p.startsWith("91")) return p;
  return null;
}

async function sendToMetaCAPI(events) {
  if (!events || events.length === 0) return;

  const payload = {
    data: events.map((e) => ({
      event_name: e.eventName,
      event_time: e.eventTime,
      event_source_url: "https://terratern.com",
      action_source: "crm",
      user_data: {
        ph: e.phone ? [hash(normalizePhone(e.phone))] : [],
        em: e.email ? [hash(e.email)] : [],
      },
      custom_data: {
        lead_id: e.leadId,
        program: e.program || "",
      },
    })),
  };

  try {
    const res = await axios.post(
      `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${CAPI_ACCESS_TOKEN}`,
      payload
    );
    console.log(`[CAPI] ✅ Sent ${events.length} event(s):`, res.data);
    return res.data;
  } catch (err) {
    console.error("[CAPI] ❌ Error:", err.response?.data || err.message);
    throw err;
  }
}

module.exports = { sendToMetaCAPI };
