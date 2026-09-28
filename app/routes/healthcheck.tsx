import { json } from "react-router";

export const loader = () => json({ ok: true, ts: new Date().toISOString() });
