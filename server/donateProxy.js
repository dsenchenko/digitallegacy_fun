const DONATELLO_ORIGIN = 'https://donatello.to';
const DONATELLO_PAGE = `${DONATELLO_ORIGIN}/digitallegacyua`;

const UNLOCK_SCRIPT = `<script>(function(){function unlock(){if(typeof jQuery==='undefined'){return setTimeout(unlock,80);}jQuery(function($){$('#amount').prop('disabled',false).removeAttr('disabled');$('#message').prop('disabled',false).removeAttr('disabled');$('[name=currency]').prop('disabled',false).removeAttr('disabled');$('.preset-amount').removeClass('disabled');$('.goal-input').prop('disabled',false);});}unlock();setTimeout(unlock,400);setTimeout(unlock,1200);})();</script>`;

function buildTargetUrl(query) {
  const target = new URL(DONATELLO_PAGE);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      target.searchParams.set(key, String(value));
    }
  }
  return target;
}

export async function proxyDonateGet(req, res) {
  const target = buildTargetUrl(req.query);

  try {
    const upstream = await fetch(String(target), {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': req.headers['user-agent'] ?? 'digital-legacy-obs-menu/1.0',
      },
    });

    if (!upstream.ok) {
      return res.redirect(String(target));
    }

    let html = await upstream.text();

    if (!html.includes('<base ')) {
      html = html.replace('<head>', `<head><base href="${DONATELLO_ORIGIN}/">`);
    }

    html = html.replace('</body>', `${UNLOCK_SCRIPT}</body>`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch {
    res.redirect(String(target));
  }
}

export async function proxyDonatePost(req, res) {
  try {
    const body =
      req.body && typeof req.body === 'object'
        ? new URLSearchParams(req.body).toString()
        : '';

    const upstream = await fetch(DONATELLO_PAGE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json, text/plain, */*',
        'User-Agent': req.headers['user-agent'] ?? 'digital-legacy-obs-menu/1.0',
      },
      body,
    });

    const contentType = upstream.headers.get('content-type') ?? 'application/json';
    const payload = await upstream.text();

    res.status(upstream.status);
    res.setHeader('Content-Type', contentType);
    res.send(payload);
  } catch (err) {
    res.status(502).json({ success: false, message: err.message });
  }
}
