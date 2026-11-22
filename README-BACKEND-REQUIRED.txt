MOG MEDIAZ — UPDATED EVENT GALLERY

Included:
- Updated index.html, style.css and script.js.
- Existing website sections and design retained; the Event Gallery / Our Work section is added.
- Existing uploaded photos and logo copied into assets/.
- Gallery filtering, image/video preview, and a local upload manager.

IMPORTANT LIMITATION:
The upload manager in this static package uses IndexedDB in the current browser only.
It is suitable for local testing and will NOT publish files to every visitor, provide secure
administrator authentication, access a central booking database, or send email notifications.

To enable the full production workflow requested:
1. Connect a backend such as Supabase or Firebase.
2. Add secure administrator authentication and protected upload permissions.
3. Store project metadata and media in cloud database/storage.
4. Save booking records centrally (Formspree submissions alone are not a queryable client database).
5. Add a server-side publish endpoint that sends email to clients who explicitly opted in.
6. Keep API secrets server-side; never put private keys in script.js.

The existing Formspree booking form endpoint and existing site interactions are retained.
