const crypto = require("node:crypto");
const nodemailer = require("nodemailer");
const { env, makeToken, setCookie, json, onlyMethod, ownerEmail } = require("../../lib/auth-security");

// Basic per-instance cooldown. For high-traffic production sites, add a shared rate-limit store.
const recentRequests = globalThis.__mogOtpRequests || (globalThis.__mogOtpRequests = new Map());
module.exports = async function handler(req, res) {
  if (!onlyMethod(req, res, "POST")) return;
  try {
    const email = String((req.body || {}).email || "").trim().toLowerCase();
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(res, 400, { message: "Enter a valid email address." });
    if (email !== ownerEmail()) return json(res, 403, { message: "Access restricted. This email is not authorised as the site owner." });
    const now = Date.now();
    const last = recentRequests.get(email) || 0;
    if (now - last < 45_000) return json(res, 429, { message: "Please wait a moment before requesting another code." });
    recentRequests.set(email, now);

    const otp = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
    const expiresAt = now + 5 * 60 * 1000;
    const otpHash = crypto.createHmac("sha256", env("OTP_SECRET")).update(`${email}:${otp}`).digest("hex");
    const challenge = makeToken({ email, otpHash, exp: expiresAt, attempts: 0 }, env("OTP_SECRET"));
    setCookie(res, "mog_otp_challenge", challenge, 300);

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com", port: 465, secure: true,
      auth: { user: env("GMAIL_USER"), pass: env("GMAIL_APP_PASSWORD").replace(/\s/g, "") }
    });
    await transporter.sendMail({
      from: `MOG MEDIAZ Security <${env("GMAIL_USER")}>`,
      to: email,
      subject: "Your MOG MEDIAZ owner login code",
      text: `Your MOG MEDIAZ owner authentication code is ${otp}. It expires in 5 minutes. If you did not request this code, you can ignore this email.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:28px;color:#171717"><h2 style="letter-spacing:3px">MOG MEDIAZ</h2><p>Your owner login verification code is:</p><p style="font-size:34px;font-weight:700;letter-spacing:9px;padding:18px;background:#f2f2f2;text-align:center">${otp}</p><p>This code expires in <strong>5 minutes</strong>. Do not share it with anyone.</p><p style="color:#777;font-size:12px">If you did not request this code, ignore this message.</p></div>`
    });
    return json(res, 200, { message: "Authentication code sent." });
  } catch (error) {
    console.error("MOG OTP request failed:", error.message);
    return json(res, 500, { message: "We could not send the authentication email. Check the Vercel email environment variables and try again." });
  }
};
