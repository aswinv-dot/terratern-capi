const fs = require("fs");
const path = require("path");

const LOG_FILE = path.join(__dirname, "logs", "sent_events.json");

function loadLog() {
  if (!fs.existsSync(LOG_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(LOG_FILE, "utf8"));
  } catch {
    return {};
  }
}

function saveLog(log) {
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
}

// Key = leadId + statusId — unique per lead per stage
function getKey(leadId, statusId) {
  return `${leadId}_${statusId}`;
}

function isAlreadySent(leadId, statusId) {
  const log = loadLog();
  return !!log[getKey(leadId, statusId)];
}

function markAsSent(leadId, statusId, eventName) {
  const log = loadLog();
  log[getKey(leadId, statusId)] = {
    eventName,
    sentAt: new Date().toISOString(),
  };
  saveLog(log);
}

module.exports = { isAlreadySent, markAsSent };
