import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";
import shopify from "~/lib/shopify.server";

type DiscountRow = {
  id: string;
  code: string;
  title: string;
  status: string;
  endsAt: string | null;
  startsAt: string | null;
  asyncUsageCount: number;
  __typename: string;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await shopify.authenticate.admin(request);
  const res = await admin.graphql(
    `query activeDiscounts($cursor: String) {
       discountNodes(first: 50, after: $cursor, query: "status:active") {
         edges {
           node {
             id
             discount {
               __typename
               ... on DiscountCodeBasic { codes(first:1){edges{node{code}}} title status startsAt endsAt asyncUsageCount }
               ... on DiscountCodeBxgy { codes(first:1){edges{node{code}}} title status startsAt endsAt asyncUsageCount }
               ... on DiscountCodeFreeShipping { codes(first:1){edges{node{code}}} title status startsAt endsAt asyncUsageCount }
               ... on DiscountCodeApp { codes(first:1){edges{node{code}}} title status startsAt endsAt asyncUsageCount }
             }
           }
         }
       }
     }`,
  );
  const data = await res.json();
  const rows: DiscountRow[] = data.data.discountNodes.edges.map((e: any) => ({
    id: e.node.id,
    code: e.node.discount?.codes?.edges?.[0]?.node?.code ?? "(sin código)",
    title: e.node.discount?.title ?? "",
    status: e.node.discount?.status ?? "",
    endsAt: e.node.discount?.endsAt ?? null,
    startsAt: e.node.discount?.startsAt ?? null,
    asyncUsageCount: e.node.discount?.asyncUsageCount ?? 0,
    __typename: e.node.discount?.__typename ?? "",
  }));
  return json({ rows });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await shopify.authenticate.admin(request);
  const form = await request.formData();
  const code = String(form.get("code") ?? "").trim().toUpperCase();
  const title = String(form.get("title") ?? "").trim();
  const value = parseFloat(String(form.get("value") ?? "0"));
  const valueType = String(form.get("valueType") ?? "percentage"); // percentage | fixed
  const startsAt = String(form.get("startsAt") ?? "");
  const endsAt = String(form.get("endsAt") ?? "");

  if (!code || !title || !value) {
    return json({ ok: false, error: "Código, título y valor son obligatorios" }, { status: 400 });
  }

  const customerSelection = { all: true };
  const itemEntitlements = { all: true };
  const customerGets = {
    items: { all: true },
    value:
      valueType === "percentage"
        ? { percentage: value / 100 }
        : { discountAmount: { amount: String(value), appliesOnEachItem: false } },
  };
  const startsAtISO = startsAt ? new Date(startsAt).toISOString() : new Date().toISOString();
  const endsAtISO = endsAt ? new Date(endsAt).toISOString() : null;

  const res = await admin.graphql(
    `mutation createDiscount($basic: DiscountCodeBasicInput!) {
       discountCodeBasicCreate(basicCodeDiscount: $basic) {
         codeDiscountNode { id }
         userErrors { field message }
       }
     }`,
    {
      variables: {
        basic: {
          title,
          code,
          startsAt: startsAtISO,
          endsAt: endsAtISO,
          usageLimit: null,
          appliesOncePerCustomer: false,
          customerSelection,
          customerGets,
          itemEntitlements,
        },
      },
    },
  );
  const json_ = await res.json();
  const errs = json_.data.discountCodeBasicCreate.userErrors;
  if (errs?.length) {
    return json({ ok: false, error: errs.map((e: any) => e.message).join("; ") }, { status: 400 });
  }
  return json({ ok: true, id: json_.data.discountCodeBasicCreate.codeDiscountNode.id });
};

export default function DiscountsPage() {
  const { rows } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();

  return (
    <div>
      <h1 style={{ fontSize: 24, margin: "0 0 16px" }}>Descuentos</h1>

      <section style={card}>
        <h2 style={h2}>Crear descuento</h2>
        <Form method="post" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          <Field name="code" label="Código (sin espacios)" placeholder="BLACKFRIDAY25" required />
          <Field name="title" label="Título interno" placeholder="Black Friday 25%" required />
          <Select name="valueType" label="Tipo de valor" options={[{ value: "percentage", label: "Porcentaje (%)" }, { value: "fixed", label: "Monto fijo" }]} />
          <Field name="value" label="Valor" type="number" step="0.01" required />
          <Field name="startsAt" label="Inicio" type="datetime-local" />
          <Field name="endsAt" label="Fin" type="datetime-local" />
          <div style={{ gridColumn: "1 / -1" }}>
            <button type="submit" style={btnPrimary}>Crear descuento</button>
            {result && (
              <span style={{ marginLeft: 12, color: result.ok ? "#008060" : "#bf0711", fontSize: 13 }}>
                {result.ok ? "✓ Descuento creado" : `✗ ${(result as any).error}`}
              </span>
            )}
          </div>
        </Form>
      </section>

      <section style={card}>
        <h2 style={h2}>Descuentos activos ({rows.length})</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#f6f6f7", textAlign: "left" }}>
              <th style={th}>Código</th>
              <th style={th}>Título</th>
              <th style={th}>Tipo</th>
              <th style={th}>Inicio</th>
              <th style={th}>Fin</th>
              <th style={th}>Usos</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={td}><code>{r.code}</code></td>
                <td style={td}>{r.title || "—"}</td>
                <td style={td}>{r.__typename.replace("DiscountCode", "")}</td>
                <td style={td}>{r.startsAt ? new Date(r.startsAt).toLocaleDateString() : "—"}</td>
                <td style={td}>{r.endsAt ? new Date(r.endsAt).toLocaleDateString() : "—"}</td>
                <td style={td}>{r.asyncUsageCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

const card: React.CSSProperties = { background: "#fff", border: "1px solid #e1e3e5", borderRadius: 8, padding: 20, marginBottom: 24 };
const h2: React.CSSProperties = { fontSize: 16, marginTop: 0, marginBottom: 12 };
const th: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid #e1e3e5", fontSize: 12, color: "#6d7175" };
const td: React.CSSProperties = { padding: "10px", borderBottom: "1px solid #e1e3e5" };
const btnPrimary: React.CSSProperties = { background: "#008060", color: "#fff", border: 0, padding: "10px 16px", borderRadius: 6, cursor: "pointer", fontWeight: 600 };

function Field({ name, label, type = "text", placeholder, required, step }: { name: string; label: string; type?: string; placeholder?: string; required?: boolean; step?: string }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
      <span style={{ color: "#202223", fontWeight: 500 }}>{label}{required && <span style={{ color: "#bf0711" }}> *</span>}</span>
      <input name={name} type={type} placeholder={placeholder} required={required} step={step} style={inputStyle} />
    </label>
  );
}

function Select({ name, label, options }: { name: string; label: string; options: { value: string; label: string }[] }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
      <span style={{ color: "#202223", fontWeight: 500 }}>{label}</span>
      <select name={name} style={inputStyle} defaultValue={options[0].value}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

const inputStyle: React.CSSProperties = { padding: "8px 10px", border: "1px solid #c9cccf", borderRadius: 6, fontSize: 14 };
