const axios = require("axios");
const { METABASE_URL, METABASE_API_KEY, METABASE_DATABASE_ID, TRACKED_STATUSES } = require("./config");

const statusIds = Object.keys(TRACKED_STATUSES).join(",");

async function fetchRecentStatusChanges() {
  const query = `
    SELECT 
      l.id AS lead_id,
      l.phone,
      l.email,
      l.lead_status_id,
      l.updated_at,
      l.program
    FROM leads l
    WHERE 
      l.lead_status_id IN (${statusIds})
      AND l.updated_at >= NOW() - INTERVAL 70 MINUTE
    ORDER BY l.updated_at DESC
  `;

  try {
    const res = await axios.post(
      `${METABASE_URL}/api/dataset`,
      {
        database: METABASE_DATABASE_ID,
        type: "native",
        native: { query },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": METABASE_API_KEY,
        },
      }
    );

    const rows = res.data?.data?.rows || [];
    const cols = res.data?.data?.cols?.map((c) => c.name) || [];

    return rows.map((row) => {
      const obj = {};
      cols.forEach((col, i) => (obj[col] = row[i]));
      return obj;
    });
  } catch (err) {
    console.error("[Metabase] ❌ Query failed:", err.response?.data || err.message);
    return [];
  }
}

module.exports = { fetchRecentStatusChanges };
