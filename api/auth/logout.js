const { clearCookie, json, onlyMethod } = require("../../lib/auth-security");
module.exports = function handler(req, res) {
  if (!onlyMethod(req, res, "POST")) return;
  clearCookie(res, "mog_owner_session");
  clearCookie(res, "mog_otp_challenge");
  return json(res, 200, { authenticated: false });
};
