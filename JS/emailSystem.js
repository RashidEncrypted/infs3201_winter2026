/**
 * @param {string} to
 * @param {string} subject
 * @param {string} body
 */
function sendEmail(to, subject, body) {
  logEmail(to, subject, body);
}

function logEmail(to, subject, body) {
  console.log("\n----- EMAIL -----");
  console.log("To:", to);
  console.log("Subject:", subject);
  console.log("Body:", body);
  console.log("-----------------\n");
}

module.exports = {
  sendEmail
};