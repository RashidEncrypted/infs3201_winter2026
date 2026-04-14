const crypto = require("crypto");

const sessions = [];
const twoFACodes = [];

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
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

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
      // If we find a session with the given sid, we return it immediately. We will check for expiration in the middleware before calling this function, so we can assume that if we find a session here, it is valid and not expired.
    }
  }

  return null;
  // Reaching here means no session with the given sid was found, so we return null to indicate that the session does not exist or has expired.
}

/**
 * @param {string} sid
 */
function deleteSession(sid) {
  for (let i = 0; i < sessions.length; i++) {
    if (sessions[i].sid === sid) {
      sessions.splice(i, 1);
      return;
      // Once we find the session with the given sid, we remove it from the sessions array and return immediately since there should only be one session with that sid.
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
      // Only increment i if we did not remove the current session, because if we remove it, the next session will shift into the current index and we want to check that one next.
    }
  }
}

function generate2FACode(username) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  const expiresAt = Date.now() + 3 * 60 * 1000; // 3 minutes

  twoFACodes.push({
    username: username,
    code: code,
    expiresAt: expiresAt
  });

  return code;
}

function verify2FACode(username, code) {
  for (let i = 0; i < twoFACodes.length; i++) {
    if (
      twoFACodes[i].username === username &&
      twoFACodes[i].code === code
    ) {
      if (twoFACodes[i].expiresAt < Date.now()) {
        twoFACodes.splice(i, 1);
        return false;
      }

      twoFACodes.splice(i, 1);
      return true;
    }
  }

  return false;
}

function removeExpired2FACodes() {
  let i = 0;

  while (i < twoFACodes.length) {
    if (twoFACodes[i].expiresAt < Date.now()) {
      twoFACodes.splice(i, 1);
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
  removeExpiredSessions,
  generate2FACode,
  verify2FACode,
  removeExpired2FACodes
};