const axios = require("axios");
const crypto = require("crypto");
const { PIXEL_ID, CAPI_ACCESS_TOKEN } = require("./config");

function hash(value) {
  if (!value) return null;
  return crypto.createHash("sha256").update(value.toString().trim().toLowerCase()).digest("hex");
}

function normalizePhone(countryCode, mobile) {
  if (!mobile) return null;
  let m = mobile.toString().replace(/\D/g, "").trim();
  let cc = (countryCode || "91").toString().replace(/\D/g, "").trim();
  if (!cc) cc = "91";
  if (m.length > 10) return m;
  return cc + m;
}

async function sendToMetaCAPI(events) {
  if (!events || events.length === 0) return;

  const payload = {
    data: events.map((e) => {
      const userData = {};
      if (e.phoneHash) userData.ph = [e.phoneHash];
      if (e.emailHash) userData.em = [e.emailHash];
      if (e.stateHash) userData.st = [e.stateHash];

      const eventData = {
        event_name: e.eventName,
        event_time: e.eventTime,
        action_source: "system_generated",
        user_data: userData,
        custom_data: {
          event_source: "crm",
          lead_event_source: "TerraTern CRM",
        },
      };

      // Free webinar events — send value:0 to satisfy Meta's price/currency diagnostic
      if (e.eventName === "WebinarBooked" || e.eventName === "WebinarAttended") {
        eventData.custom_data = {
          ...eventData.custom_data,
          currency: "INR",
          value: 0,
        };
      }

      // Purchase events — real payment amount
      if (e.eventName === "Purchase") {
        eventData.custom_data = {
          ...eventData.custom_data,
          currency: "INR",
          value: e.paymentAmount || 0,
        };
      }

      return eventData;
    }),
  };

  // Log first event payload for debugging
  console.log("[CAPI] Sample payload:", JSON.stringify(payload.data[0], null, 2));

  try {
    const res = await axios.post(
      `https://graph.facebook.com/v25.0/${PIXEL_ID}/events?access_token=${CAPI_ACCESS_TOKEN}`,
      payload
    );
    console.log(`[CAPI] ✅ Sent ${events.length} event(s):`, JSON.stringify(res.data));
    return res.data;
  } catch (err) {
    console.error("[CAPI] ❌ Error:", err.response?.data || err.message);
    throw err;
  }
}

module.exports = { sendToMetaCAPI, normalizePhone, hash };
