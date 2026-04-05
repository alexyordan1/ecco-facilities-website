/**
 * Cloudflare Pages Function — /api/notify-lead
 * Sends an SMS to the owner via Twilio when a high-priority lead submits a quote form.
 *
 * Required environment variables (set in Cloudflare Pages > Settings > Environment Variables):
 *   TWILIO_ACCOUNT_SID  — e.g. ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *   TWILIO_AUTH_TOKEN   — your Twilio Auth Token
 *   TWILIO_FROM         — your Twilio phone number, e.g. +19295551234
 *   NOTIFY_PHONE        — owner's phone number, e.g. +19175550000
 */
export async function onRequestPost(context) {
  try {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM, NOTIFY_PHONE } = context.env;

    // If env vars aren't configured yet, return OK so form flow is never blocked
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM || !NOTIFY_PHONE) {
      return jsonOk({ ok: false, reason: 'Twilio not configured' });
    }

    let body;
    try {
      body = await context.request.json();
    } catch {
      return jsonOk({ ok: false, reason: 'Invalid JSON' });
    }

    const { name = '', email = '', phone = '', service = '', ref = '', urgency = '' } = body;

    const urgencyLine = urgency ? `\nUrgency: ${urgency}` : '';
    const phoneLine = phone ? `\nPhone: ${phone}` : '';
    const message =
      `\uD83D\uDD14 NEW ECCO LEAD\n` +
      `Ref: ${ref}\n` +
      `Name: ${name.trim() || '(no name)'}` +
      phoneLine + `\n` +
      `Email: ${email}\n` +
      `Service: ${service}` +
      urgencyLine;

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    const params = new URLSearchParams();
    params.append('From', TWILIO_FROM);
    params.append('To', NOTIFY_PHONE);
    params.append('Body', message);

    const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const twilioRes = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const result = await twilioRes.json();

    if (!twilioRes.ok) {
      // Log on server, but always return 200 to client
      console.error(`[notify-lead] Twilio error ${result.code}: ${result.message}`);
      return jsonOk({ ok: false, twilio_error: result.message });
    }

    return jsonOk({ ok: true, sid: result.sid });

  } catch (err) {
    console.error('[notify-lead] Unexpected error:', err.message);
    return jsonOk({ ok: false });
  }
}

function jsonOk(data) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
}
