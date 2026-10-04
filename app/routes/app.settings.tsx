import { type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";

import { Form, useActionData, useLoaderData } from "react-router";

import shopify from "~/lib/shopify.server";
import { DEFAULT_SETTINGS, getSettings, saveSettings } from "~/lib/settings.server";

const json = Response.json;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await shopify.authenticate.admin(request);
  const settings = await getSettings(admin);
  return json({ settings });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await shopify.authenticate.admin(request);
  const form = await request.formData();
  const settings = {
    recipientEmail: String(form.get("recipientEmail") ?? DEFAULT_SETTINGS.recipientEmail).trim(),
    warningDaysBefore: Math.max(1, Math.min(60, parseInt(String(form.get("warningDaysBefore") ?? "3"), 10) || 3)),
    notifyOnCreate: form.get("notifyOnCreate") === "on",
    notifyOnExpiring: form.get("notifyOnExpiring") === "on",
    emailSubjectCreate: String(form.get("emailSubjectCreate") ?? DEFAULT_SETTINGS.emailSubjectCreate),
    emailSubjectExpiring: String(form.get("emailSubjectExpiring") ?? DEFAULT_SETTINGS.emailSubjectExpiring),
  };
  await saveSettings(admin, settings);
  return json({ ok: true, settings });
};

export default function SettingsPage() {
  const { settings } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const current = (result?.ok && result.settings) || settings;

  return (
    <div>
      <h1 style={{ fontSize: 24, margin: "0 0 16px" }}>Configuración de notificaciones</h1>

      <section style={card}>
        <Form method="post" style={{ display: "grid", gap: 16, maxWidth: 640 }}>
          <Field
            name="recipientEmail"
            label="Correo que recibe las notificaciones"
            type="email"
            defaultValue={current.recipientEmail}
            required
          />
          <Field
            name="warningDaysBefore"
            label="Días antes del vencimiento para enviar aviso"
            type="number"
            min={1}
            max={60}
            defaultValue={String(current.warningDaysBefore)}
            required
          />
          <Checkbox name="notifyOnCreate" label="Notificar cuando se crea un descuento" defaultChecked={current.notifyOnCreate} />
          <Checkbox name="notifyOnExpiring" label="Notificar cuando un descuento está por vencer" defaultChecked={current.notifyOnExpiring} />
          <Field
            name="emailSubjectCreate"
            label="Asunto del correo (creación)"
            defaultValue={current.emailSubjectCreate}
            placeholder="Nuevo descuento creado: {code}"
          />
          <Field
            name="emailSubjectExpiring"
            label="Asunto del correo (vencimiento)"
            defaultValue={current.emailSubjectExpiring}
            placeholder="Descuento por vencer: {code}"
          />
          <div>
            <button type="submit" style={btnPrimary}>Guardar configuración</button>
            {result?.ok && <span style={{ marginLeft: 12, color: "#008060", fontSize: 13 }}>✓ Guardado</span>}
          </div>
        </Form>
      </section>

      <p style={{ marginTop: 16, color: "#6d7175", fontSize: 13 }}>
        Las claves de envío (RESEND_API_KEY) y la dirección "from" se configuran como variables de entorno en Fly.io, no aquí.
      </p>
    </div>
  );
}

const card: React.CSSProperties = { background: "#fff", border: "1px solid #e1e3e5", borderRadius: 8, padding: 20 };
const btnPrimary: React.CSSProperties = { background: "#008060", color: "#fff", border: 0, padding: "10px 16px", borderRadius: 6, cursor: "pointer", fontWeight: 600 };
const inputStyle: React.CSSProperties = { padding: "8px 10px", border: "1px solid #c9cccf", borderRadius: 6, fontSize: 14 };

function Field({ name, label, type = "text", defaultValue, placeholder, required, min, max }: { name: string; label: string; type?: string; defaultValue?: string; placeholder?: string; required?: boolean; min?: number; max?: number }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
      <span style={{ fontWeight: 500 }}>{label}{required && <span style={{ color: "#bf0711" }}> *</span>}</span>
      <input name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} required={required} min={min} max={max} style={inputStyle} />
    </label>
  );
}

function Checkbox({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      <span>{label}</span>
    </label>
  );
}
