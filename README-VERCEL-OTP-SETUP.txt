MOG MEDIAZ — VERCEL EMAIL OTP OWNER LOGIN
=========================================

FILES TO DEPLOY
- index.html, style.css, script.js (replace existing files)
- api/auth/_security.js
- api/auth/request-otp.js
- api/auth/verify-otp.js
- api/auth/session.js
- api/auth/logout.js
- package.json
- vercel.json
- Keep your existing assets/ folder unchanged.

VERCEL ENVIRONMENT VARIABLES
Add each item under Project Settings > Environment Variables. Apply to Production, Preview and Development as needed.
1. OWNER_EMAIL = the exact authorised owner email address.
2. GMAIL_USER = the Gmail account that sends the code (can be the owner email).
3. GMAIL_APP_PASSWORD = Google App Password, not your normal Gmail password.
4. OTP_SECRET = your private random OTP signing secret.
5. OWNER_SESSION_SECRET = a different private random session signing secret.
Never put these values in HTML/CSS/browser JavaScript or commit them to Git.

GMAIL APP PASSWORD
Enable 2-Step Verification on the sending Google account, then create an App Password in Google Account > Security > 2-Step Verification > App passwords (if Google makes the option available). Do not send the App Password to anyone.

DEPLOY
1. Replace the website's index.html, style.css and script.js with the supplied versions.
2. Upload the complete api/ directory and package.json and vercel.json to the project root. Do not upload only the individual API files without their folders.
3. Keep the existing assets/ directory and all its images.
4. Commit/push or redeploy the project in Vercel. Vercel should install nodemailer from package.json.
5. After deployment, open the live domain, choose Owner of this Site, enter OWNER_EMAIL, then enter the 6-digit email code.

SECURITY / BEHAVIOUR
- Only OWNER_EMAIL can request an OTP. Other emails are rejected.
- OTP is 6 digits, expires in 5 minutes, and allows up to 5 incorrect attempts.
- Session is stored in an HttpOnly, Secure (production), SameSite=Strict cookie and expires after 8 hours.
- Secrets stay server-side in Vercel environment variables.
- The OTP resend cooldown is per serverless instance; for high-volume production use a shared rate limiter.
- This protects the Add Project interface. Existing portfolio uploads still use browser IndexedDB and therefore are local to the device/browser; this package does not create shared cloud gallery storage. Do not assume uploaded projects are published to all visitors.

IMPORTANT
The earlier generated secret values were visible in this chat. For best production security, generate two fresh random secrets locally and replace OTP_SECRET and OWNER_SESSION_SECRET in Vercel before deploying. Redeploy after changing them.
