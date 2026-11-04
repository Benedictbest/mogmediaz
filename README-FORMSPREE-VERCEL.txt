MOG MEDIAZ — FORMSPREE + VERCEL IMAGE FIX

CHANGES
- Booking form now submits to https://formspree.io/f/mdeeylla.
- JavaScript sends the full booking details to Formspree and reports provider errors.
- The About image now uses the simple relative path ./about-image.jpg.
- The image is included in this package beside index.html to avoid missing-file paths on Vercel.
- Existing page layout, rate cards, selectable services, cart, navigation, and styling are retained.

DEPLOY
1. Extract the ZIP and keep index.html, style.css, script.js, and all image files together in the same deployed site root (or move the whole set into your configured public directory together).
2. Deploy the updated files to Vercel.
3. Open the live site and submit one test booking with a real email address.
4. Check the Formspree dashboard and the connected inbox for the submission.
5. If this is the first submission to this Formspree form, check for any Formspree verification/activation email and complete it.

IMPORTANT
Do not upload only index.html and script.js. The CSS and image assets are required too. Keep filenames and capitalization exactly as supplied; Vercel hosting is case-sensitive.
