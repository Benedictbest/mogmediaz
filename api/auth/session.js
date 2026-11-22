const { json, onlyMethod, isOwnerSession } = require("../../lib/auth-security");
module.exports = function handler(req, res) {
  if (!onlyMethod(req, res, "GET")) return;
  try { return json(res, 200, { authenticated: isOwnerSession(req) }); }
  catch (error) { console.error("MOG session check failed:", error.message); return json(res, 200, { authenticated: false }); }
};
