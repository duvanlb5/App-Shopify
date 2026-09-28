import { Resend } from "resend";
import type { NotificationSettings } from "./settings.server";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const FROM_ADDRESS = process.env.NOTIFICATION_FROM_EMAIL ?? "notificaciones@esprit-shopify-tools.fly.dev";

let resendClient: Resend | null = null;
function client(): Resend | null {
  if (!RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(RESEND_API_KEY);
  return resendClient;
}

export function renderCreateEmail(code: string, title: string, value: string, endsAt: string | null): string {
  const endLine = endsAt ? `<p>Vigente hasta: <strong>${endsAt}</strong></p>` : "<p>Sin fecha de vencimiento.</p>";
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color:#202223;">Nuevo descuento creado</h2>
      <p>Se creó un nuevo descuento en tu tienda:</p>
      <ul>
        <li><strong>Código:</strong> ${escapeHtml(code)}</li>
        <li><strong>Título:</strong> ${escapeHtml(title)}</li>
        <li><strong>Valor:</strong> ${escapeHtml(value)}</li>
      </ul>
      ${endLine}
      <p style="color:#6d7175; font-size:12px;">Enviado automáticamente por Esprit Shopify Tools.</p>
    </div>
  `;
}

export function renderExpiringEmail(items: { code: string; title: string; endsAt: string }[]): string {
  const rows = items
    .map(
      (it) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e1e3e5;">${escapeHtml(it.code)}</td>
        <td style="padding:8px;border-bottom:1px solid #e1e3e5;">${escapeHtml(it.title)}</td>
        <td style="padding:8px;border-bottom:1px solid #e1e3e5;">${escapeHtml(it.endsAt)}</td>
      </tr>`,
    )
    .join("");
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color:#202223;">Descuentos por vencer</h2>
      <p>Los siguientes descuentos están próximos a vencer:</p>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#f6f6f7;">
            <th style="padding:8px;text-align:left;">Código</th>
            <th style="padding:8px;text-align:left;">Título</th>
            <th style="padding:8px;text-align:left;">Vence</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="color:#6d7175; font-size:12px;">Enviado automáticamente por Esprit Shopify Tools.</p>
    </div>
  `;
}

function escapeHtml(s: string): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function notifyDiscountCreated(
  settings: NotificationSettings,
  payload: { code: string; title: string; value: string; endsAt: string | null },
): Promise<{ ok: boolean; error?: string }> {
  if (!settings.notifyOnCreate) return { ok: true };
  return sendEmail({
    to: settings.recipientEmail,
    subject: settings.emailSubjectCreate.replace("{code}", payload.code),
    html: renderCreateEmail(payload.code, payload.title, payload.value, payload.endsAt),
  });
}

export async function notifyExpiring(
  settings: NotificationSettings,
  items: { code: string; title: string; endsAt: string }[],
): Promise<{ ok: boolean; error?: string }> {
  if (!settings.notifyOnExpiring || items.length === 0) return { ok: true };
  return sendEmail({
    to: settings.recipientEmail,
    subject: settings.emailSubjectExpiring.replace("{code}", `${items.length} descuento(s)`),
    html: renderExpiringEmail(items),
  });
}

async function sendEmail(args: { to: string; subject: string; html: string }): Promise<{ ok: boolean; error?: string }> {
  const c = client();
  if (!c) {
    console.warn("[notifications] RESEND_API_KEY not configured; skipping email send");
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }
  try {
    const result = await c.emails.send({
      from: FROM_ADDRESS,
      to: args.to,
      subject: args.subject,
      html: args.html,
    });
    if (result.error) return { ok: false, error: result.error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}
