export default async function handler(req, res) {
  if (req.method === 'GET') return res.status(200).json({ ok: true });

  const USE_MOCK = process.env.USE_MOCK === '1';
  if (USE_MOCK) {
    return res.status(200).json({
      status: 'ok',
      company_ids: ['5292732201','19274015585'],
      company_labels: ['Bruchou','Bruchou & Funes de Rioja'],
      deals_count: 2, deals_amount: 12500,
      top_deal_id: '18013584189', top_deal_amount: 5000,
      _debug: { source: 'mock' }
    });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    return res.status(500).json({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE' });
  }

  const body = req.body || {};
  const q = body.q ?? '';
  const from_date = body.from_date ?? null;
  const to_date = body.to_date ?? null;

  const rpc = async (fn, payload) => {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`
      },
      body: JSON.stringify(payload)
    });
    if (!r.ok) {
      const t = await r.text().catch(() => '');
      throw new Error(`${fn} ${r.status} ${t}`);
    }
    return r.json();
  };

  try {
    const cands = await rpc('company_candidates', { q, limit_n: 5 });
    const ids = cands?.length ? [String(cands[0].id)] : [];
    const last = ids.length ? await rpc('answer_last_deal_by_ids', { ids }) : null;
    const sum  = ids.length ? await rpc('answer_summary_period_by_ids', { ids, from_date, to_date }) : null;

    return res.status(200).json({
      status: 'ok',
      company_ids: ids,
      company_labels: ids.length ? [cands[0].label] : [],
      deals_count: sum?.deals_count ?? 0,
      deals_amount: sum?.deals_amount ?? 0,
      top_deal_id: last?.top_deal_id ?? null,
      top_deal_amount: last?.top_deal_amount ?? null
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
