const crypto = require("node:crypto");

function env(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}
function b64url(value) { return Buffer.from(value).toString("base64url"); }
function sign(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}
function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
function makeToken(payload, secret) {
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body, secret)}`;
}
function readToken(token, secret) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2 || !safeEqual(sign(parts[0], secret), parts[1])) return null;
  try { return JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")); }
  catch (_) { return null; }
}
function cookies(req) {
  const raw = req.headers.cookie || "";
  return Object.fromEntries(raw.split(";").map(part => part.trim()).filter(Boolean).map(part => {
    const i = part.indexOf("=");
    return i < 0 ? [part, ""] : [part.slice(0, i), decodeURIComponent(part.slice(i + 1))];
  }));
}
function setCookie(res, name, value, maxAge) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const cookie = `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
  const existing = res.getHeader("Set-Cookie");
  res.setHeader("Set-Cookie", existing ? (Array.isArray(existing) ? [...existing, cookie] : [existing, cookie]) : cookie);
}
function clearCookie(res, name) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const cookie = `${name}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
  const existing = res.getHeader("Set-Cookie");
  res.setHeader("Set-Cookie", existing ? (Array.isArray(existing) ? [...existing, cookie] : [existing, cookie]) : cookie);
}
function json(res, status, body) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.status(status).json(body);
}
function onlyMethod(req, res, method) {
  if (req.method !== method) { json(res, 405, { message: "Method not allowed." }); return false; }
  return true;
}
function ownerEmail() { return env("OWNER_EMAIL").trim().toLowerCase(); }
function isOwnerSession(req) {
  const token = cookies(req).mog_owner_session;
  const payload = readToken(token, env("OWNER_SESSION_SECRET"));
  return !!(payload && payload.email === ownerEmail() && payload.exp > Date.now());
}
module.exports = { env, sign, safeEqual, makeToken, readToken, cookies, setCookie, clearCookie, json, onlyMethod, ownerEmail, isOwnerSession };
