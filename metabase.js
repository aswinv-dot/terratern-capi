const axios = require("axios");
const { METABASE_URL, METABASE_API_KEY, METABASE_QUESTION_ID } = require("./config");

async function fetchRecentStatusChanges() {
  try {
    const res = await axios.post(
      `${METABASE_URL}/api/card/${METABASE_QUESTION_ID}/query/json`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": METABASE_API_KEY,
        },
      }
    );

    const rows = res.data || [];
    console.log(`[Metabase] ✅ Got ${rows.length} rows`);
    return rows;

  } catch (err) {
    console.error("[Metabase] ❌ Query failed:", err.response?.data || err.message);
    return [];
  }
}

module.exports = { fetchRecentStatusChanges };
