# Entrepreneur Performance Diagnostic

Static quiz funnel (`index.html`) + one serverless function (`api/subscribe.js`)
that adds each completed lead to your Mailchimp audience.

## Deploy to Vercel

1. Push this folder to a GitHub repo (or drag-and-drop deploy on vercel.com).
2. Import the repo in Vercel. No build settings needed — it's a static
   `index.html` plus an `/api` function, which Vercel detects automatically.
3. Before your first real deploy, add the three environment variables below.

## Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | Where to find it |
|---|---|
| `MAILCHIMP_API_KEY` | Mailchimp → Account → Extras → API keys. Format: 32 letters/numbers, a dash, then your server prefix (e.g. `-us21`). |
| `MAILCHIMP_SERVER_PREFIX` | The part after the dash in your API key — e.g. `us21`. |
| `MAILCHIMP_LIST_ID` | Mailchimp → Audience → Settings → Audience name and defaults → "Audience ID". |

Add these for all three environments (Production, Preview, Development), then
redeploy — env var changes don't apply to already-running deployments.

## What gets sent to Mailchimp

For each unlocked result, the person is added (or updated) with:
- Their email and first name (`FNAME`)
- Tags: `performance-diagnostic`, `weak-<pillar>` (e.g. `weak-sleep`), and a
  score bucket tag (e.g. `score-60-79`)

This lets you build Mailchimp segments/automations off tags without creating
custom merge fields first. If you'd rather store the exact score as a merge
field, create a custom field (e.g. `SCORE`, type: number) in Mailchimp's
audience settings, then add `SCORE: score` to the `merge_fields` object in
`api/subscribe.js`.

**Opt-in mode:** the function subscribes people directly (`status: "subscribed"`).
If you need double opt-in (a confirmation email before they're added), change
`status` to `"pending"` in `api/subscribe.js`.

## Local testing

`vercel dev` will run both the static page and the `/api/subscribe` function
locally with your env vars (`vercel env pull` first to fetch them into a
`.env.local` file).
