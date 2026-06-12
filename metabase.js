const axios = require("axios");
const { METABASE_URL, METABASE_API_KEY } = require("./config");

// Question UUID from the saved question public link
const QUESTION_UUID = "cf4fe0d5-6ba0-4ed8-a59e-207bc8a2946b";

async function fetchRecentStatusChanges() {
  try {
    const res = await axios.get(
      `${METABASE_URL}/api/public/card/${QUESTION_UUID}/query/json`,
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
