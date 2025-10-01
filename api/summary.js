export default async function handler(req, res) {
  if (req.method === 'GET') return res.status(200).json({ ok: true });

  const USE_MOCK = process.env.USE_MOCK === '1';

  let body = {};
  try { body = req.body ?? {}; } catch (_) {}

  if (USE_MOCK) {
    return res.status(200).json({
      status: 'ok',
      company_ids: ['5292732201','19274015585'],
      company_labels: ['Bruchou','Bruchou & Funes de Rioja'],
      deals_count: 2,
      deals_amount: 12500,
      top_deal_id: '18013584189',
      top_deal_amount: 5000,
      _debug: { source: 'mock' }
    });
  }

  const N8N_BASE_URL = process.env.N8N_BASE_URL || '';
  const MVP_API_KEY  = process.env.MVP_API_KEY  || '';
  const N8N_WEBHOOK_PATH = process.env.N8N_WEBHOOK_PATH || '/webhook/mvp/companies/summary';

  if (!N8N_BASE_URL || !MVP_API_KEY) {
    return res.status(500).json({ error: 'Missing env: N8N_BASE_URL or MVP_API_KEY' });
  }

  const url = new URL(N8N_WEBHOOK_PATH, N8N_BASE_URL).toString();

  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': MVP_API_KEY },
    body: JSON.stringify({
      q: body?.q ?? '',
      from_date: body?.from_date ?? null,
      to_date: body?.to_date ?? null,
    })
  });

  const data = await r.json().catch(() => ({ error: 'Invalid JSON from n8n' }));
  return res.status(r.status).json(data);
}
