const json = Response.json;
export const loader = () => json({ ok: true, ts: new Date().toISOString() });
