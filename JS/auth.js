const crypto = require("crypto");

const sessions = [];

/**
 * @param {string} password
 * @returns {string}
 */
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * @param {string} username
 * @returns {string}
 */
function createSession(username) {
  const sid = crypto.randomBytes(16).toString("hex");
  const expiresAt = Date.now() + 5 * 60 * 1000;

  sessions.push({
    sid: sid,
    username: username,
    expiresAt: expiresAt
  });

  return sid;
}

/**
 * @param {string} sid
 * @returns {object|null}
 */
function getSession(sid) {
  for (let i = 0; i < sessions.length; i++) {
    if (sessions[i].sid === sid) {
      return sessions[i];
    }
  }

  return null;
}

/**
 * @param {string} sid
 */
function deleteSession(sid) {
  for (let i = 0; i < sessions.length; i++) {
    if (sessions[i].sid === sid) {
      sessions.splice(i, 1);
      return;
    }
  }
}

/**
 * @param {object} session
 */
function extendSession(session) {
  session.expiresAt = Date.now() + 5 * 60 * 1000;
}

function removeExpiredSessions() {
  let i = 0;

  while (i < sessions.length) {
    if (sessions[i].expiresAt < Date.now()) {
      sessions.splice(i, 1);
    } else {
      i++;
    }
  }
}

module.exports = {
  hashPassword,
  createSession,
  getSession,
  deleteSession,
  extendSession,
  removeExpiredSessions
};