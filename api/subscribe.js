const crypto = require('crypto');

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed' });
  }

  const apiKey = process.env.MAILCHIMP_API_KEY;
  const listId = process.env.MAILCHIMP_LIST_ID;
  const statusIfNew = process.env.MAILCHIMP_STATUS_IF_NEW || 'subscribed';

  if (!apiKey || !listId) {
    console.error('Missing MAILCHIMP_API_KEY or MAILCHIMP_LIST_ID');
    return json(res, 500, { error: 'Mailchimp is not configured' });
  }

  if (!['pending', 'subscribed'].includes(statusIfNew)) {
    return json(res, 500, {
      error: 'MAILCHIMP_STATUS_IF_NEW must be pending or subscribed'
    });
  }

  try {
    const body = typeof req.body === 'string'
      ? JSON.parse(req.body)
      : (req.body || {});

    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const score = Number(body.score);
    const weakPillar = String(body.weakPillar || '').trim();
    const band = String(body.band || '').trim();
    const fixTitle = String(body.fixTitle || '').trim();
    const fixBody = String(body.fixBody || '').trim();
    const protocol = Array.isArray(body.protocol) ? body.protocol : [];
    const pillars = body.pillars || {};

    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json(res, 400, { error: 'Valid name and email are required' });
    }

    const dc = apiKey.split('-').pop();
    if (!dc) {
      return json(res, 500, { error: 'Invalid Mailchimp API key format' });
    }

    const subscriberHash = crypto
      .createHash('md5')
      .update(email)
      .digest('hex');

    const scoreBucket = Number.isFinite(score)
      ? score >= 80
        ? 'score-80-plus'
        : score >= 60
          ? 'score-60-79'
          : score >= 40
            ? 'score-40-59'
            : 'score-below-40'
      : 'score-unknown';

    const tags = ['performance-diagnostic', scoreBucket];

    if (weakPillar) {
      tags.push(
        `weak-${weakPillar.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      );
    }

    const url =
      `https://${dc}.api.mailchimp.com/3.0/lists/` +
      `${encodeURIComponent(listId)}/members/${subscriberHash}`;

    const auth = Buffer.from(`key:${apiKey}`).toString('base64');

    const mcResponse = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email_address: email,
        status_if_new: statusIfNew,
        merge_fields: {
          FNAME: name,
          OVERALL: Number.isFinite(score) ? score : 0,
          ENERGY: Number(pillars.Energy) || 0,
          SLEEP: Number(pillars.Sleep) || 0,
          STRESS: Number(pillars.Stress) || 0,
          DECISIONS: Number(pillars.Decisions) || 0,
          BODY: Number(pillars.Body) || 0,

          // Personalized email fields
          RESULTBAND: band,
          PRIMARYGAP: weakPillar,
          FIXTITLE: fixTitle,
          FIXBODY: fixBody,
          PROTOCOL1: String(protocol[0] || ''),
          PROTOCOL2: String(protocol[1] || ''),
          PROTOCOL3: String(protocol[2] || '')
        },
        tags
      })
    });

    const data = await mcResponse.json().catch(() => ({}));

    if (!mcResponse.ok) {
      console.error('Mailchimp error:', data);
      return json(
        res,
        mcResponse.status >= 500 ? 502 : mcResponse.status,
        {
          error: data.detail || data.title || 'Mailchimp request failed'
        }
      );
    }

    return json(res, 200, { ok: true });

  } catch (error) {
    console.error('Subscribe handler error:', error);
    return json(res, 500, { error: 'Unable to save contact' });
  }
};
