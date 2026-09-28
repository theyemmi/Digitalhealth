AEGIS Entrepreneur Performance Diagnostic — Vercel/Mailchimp package

Files:
- index.html — diagnostic
- api/subscribe.js — Mailchimp server-side endpoint
- vercel.json — explicitly configures the API function

Required Vercel environment variables:
- MAILCHIMP_API_KEY
- MAILCHIMP_LIST_ID
- MAILCHIMP_STATUS_IF_NEW

MAILCHIMP_STATUS_IF_NEW should be either pending or subscribed.

The Mailchimp audience must have merge tags:
ENERGY, SLEEP, STRESS, DECISIONS, BODY

The diagnostic posts to /api/subscribe.
