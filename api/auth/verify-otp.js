const crypto = require("node:crypto");
const { env, safeEqual, readToken, cookies, setCookie, clearCookie, json, onlyMethod, ownerEmail, makeToken } = require("../../lib/auth-security");
module.exports = async function handler(req, res) {
  if (!onlyMethod(req, res, "POST")) return;
  try {
    const email = String((req.body || {}).email || "").trim().toLowerCase();
    const otp = String((req.body || {}).otp || "").trim();
    if (email !== ownerEmail()) return json(res, 403, { message: "Access denied." });
    if (!/^[0-9]{6}$/.test(otp)) return json(res, 400, { message: "Enter the 6-digit code." });
    const challenge = readToken(cookies(req).mog_otp_challenge, env("OTP_SECRET"));
    if (!challenge || challenge.email !== email || challenge.exp <= Date.now()) {
      clearCookie(res, "mog_otp_challenge");
      return json(res, 401, { message: "The code has expired. Request a new code." });
    }
    const submittedHash = crypto.createHmac("sha256", env("OTP_SECRET")).update(`${email}:${otp}`).digest("hex");
    if (!safeEqual(submittedHash, challenge.otpHash)) {
      const attempts = Number(challenge.attempts || 0) + 1;
      if (attempts >= 5) {
        clearCookie(res, "mog_otp_challenge");
        return json(res, 429, { message: "Too many incorrect attempts. Request a new code." });
      }
      const updatedChallenge = makeToken({ ...challenge, attempts }, env("OTP_SECRET"));
      setCookie(res, "mog_otp_challenge", updatedChallenge, Math.max(1, Math.floor((challenge.exp - Date.now()) / 1000)));
      return json(res, 401, { message: `The code is incorrect. ${5 - attempts} attempts remaining.` });
    }
    const session = makeToken({ email, exp: Date.now() + 8 * 60 * 60 * 1000 }, env("OWNER_SESSION_SECRET"));
    setCookie(res, "mog_owner_session", session, 8 * 60 * 60);
    clearCookie(res, "mog_otp_challenge");
    return json(res, 200, { authenticated: true });
  } catch (error) {
    console.error("MOG OTP verification failed:", error.message);
    return json(res, 500, { message: "Authentication could not be completed." });
  }
};
