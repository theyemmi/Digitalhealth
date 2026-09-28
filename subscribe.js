// Vercel serverless function: POST /api/subscribe
// Adds the person to your Mailchimp audience using the API key stored
// as an environment variable (never exposed to the browser).
//
// Required environment variables (set in Vercel → Project → Settings → Environment Variables):
//   MAILCHIMP_API_KEY        32 chars + a dash + your server prefix, e.g. -us21
//   MAILCHIMP_SERVER_PREFIX  the part after the dash in your API key, e.g. us21
//   MAILCHIMP_LIST_ID        your Audience ID (Audience > Settings > Audience name and defaults)

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const { name, email, score, weakPillar, pillars } = body || {};

  const emailOk = typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    res.status(400).json({ error: 'A valid email is required' });
    return;
  }

  const API_KEY = process.env.MAILCHIMP_API_KEY;
  const SERVER = process.env.MAILCHIMP_SERVER_PREFIX;
  const LIST_ID = process.env.MAILCHIMP_LIST_ID;

  if (!API_KEY || !SERVER || !LIST_ID) {
    console.error('Missing Mailchimp environment variables');
    res.status(500).json({ error: 'Mailchimp is not configured on the server' });
    return;
  }

  // Simple score bucket + weak pillar as tags, so you can segment in Mailchimp
  // without needing to create custom merge fields first.
  const scoreBucket =
    typeof score === 'number'
      ? score >= 80 ? 'score-80-100'
      : score >= 60 ? 'score-60-79'
      : score >= 40 ? 'score-40-59'
      : 'score-0-39'
      : null;

  const tags = ['performance-diagnostic'];
  if (weakPillar) tags.push('weak-' + String(weakPillar).toLowerCase());
  if (scoreBucket) tags.push(scoreBucket);

  try {
    const mcRes = await fetch(
      `https://${SERVER}.api.mailchimp.com/3.0/lists/${LIST_ID}/members`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `apikey ${API_KEY}`,
        },
        body: JSON.stringify({
          email_address: email,
          status: 'subscribed', // change to 'pending' if you want double opt-in
          merge_fields: {
            FNAME: name || '',
          },
          tags,
        }),
      }
    );

    const data = await mcRes.json();

    if (!mcRes.ok) {
      // Mailchimp returns 400 "Member Exists" if they already subscribed — treat as success.
      if (data.title === 'Member Exists') {
        res.status(200).json({ ok: true, note: 'already subscribed' });
        return;
      }
      console.error('Mailchimp error:', data);
      res.status(mcRes.status).json({ error: data.detail || 'Mailchimp error' });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Subscribe request failed:', err);
    res.status(500).json({ error: 'Server error contacting Mailchimp' });
  }
};
