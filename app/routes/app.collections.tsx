import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";
import shopify from "~/lib/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await shopify.authenticate.admin(request);
  return json({});
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await shopify.authenticate.admin(request);
  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const skuText = String(form.get("skus") ?? "");
  const skus = skuText.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);

  if (!name || skus.length === 0) {
    return json({ ok: false, error: "Nombre y al menos un SKU son obligatorios" }, { status: 400 });
  }

  // Step 1: Create collection
  const createRes = await admin.graphql(
    `mutation createCollection($input: CollectionInput!) {
       collectionCreate(input: $input) {
         collection { id }
         userErrors { field message }
       }
     }`,
    { variables: { input: { title: name, description } } },
  );
  const createJson = await createRes.json();
  const errs = createJson.data.collectionCreate.userErrors;
  if (errs?.length) {
    return json({ ok: false, error: errs.map((e: any) => e.message).join("; ") }, { status: 400 });
  }
  const collectionId = createJson.data.collectionCreate.collection.id;

  // Step 2: Resolve SKUs -> variant GIDs
  const lookupRes = await admin.graphql(
    `query variantsBySku($q: String!) {
       productVariants(first: 100, query: $q) {
         edges { node { id sku } }
       }
     }`,
    { variables: { q: skus.map((s) => `sku:${JSON.stringify(s)}`).join(" OR ") } },
  );
  const lookupJson = await lookupRes.json();
  const foundSkus = new Set<string>();
  const variantIds: string[] = [];
  for (const e of lookupJson.data.productVariants.edges) {
    foundSkus.add(e.node.sku);
    variantIds.push(e.node.id);
  }
  const missing = skus.filter((s) => !foundSkus.has(s));

  // Step 3: Attach variants to collection
  let attached = 0;
  if (variantIds.length) {
    const addRes = await admin.graphql(
      `mutation addProducts($id: ID!, $productIds: [ID!]!) {
         collectionAddProducts(id: $id, productIds: $productIds) {
           collection { id productCount { count } }
           userErrors { field message }
         }
       }`,
      { variables: { id: collectionId, productIds: variantIds } },
    );
    const addJson = await addRes.json();
    const addErrs = addJson.data.collectionAddProducts.userErrors;
    if (addErrs?.length) {
      return json({ ok: false, error: addErrs.map((e: any) => e.message).join("; ") }, { status: 400 });
    }
    attached = variantIds.length;
  }

  return json({ ok: true, collectionId, attached, missing });
};

export default function CollectionsPage() {
  const result = useActionData<typeof action>();
  return (
    <div>
      <h1 style={{ fontSize: 24, margin: "0 0 16px" }}>Colecciones por SKU</h1>
      <section style={card}>
        <p style={{ color: "#6d7175", marginTop: 0 }}>
          Pega el listado de SKUs (uno por línea, o separados por comas / espacios). Se creará una colección nueva con esos productos.
        </p>
        <Form method="post" style={{ display: "grid", gap: 12 }}>
          <Field name="name" label="Nombre de la colección" required />
          <Field name="description" label="Descripción (opcional)" />
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
            <span style={{ fontWeight: 500 }}>SKUs *</span>
            <textarea
              name="skus"
              required
              rows={8}
              placeholder={"SKU-001\nSKU-002\nSKU-003"}
              style={{ ...inputStyle, fontFamily: "ui-monospace, monospace", fontSize: 13 }}
            />
          </label>
          <div>
            <button type="submit" style={btnPrimary}>Crear colección</button>
            {result && (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 6, background: result.ok ? "#e3f1df" : "#fbeae5", color: result.ok ? "#108043" : "#bf0711", fontSize: 14 }}>
                {result.ok ? (
                  <>
                    ✓ Colección creada con <strong>{result.attached}</strong> producto(s).
                    {(result as any).missing?.length > 0 && (
                      <div style={{ marginTop: 6, fontSize: 13 }}>
                        SKUs no encontrados: {(result as any).missing.join(", ")}
                      </div>
                    )}
                  </>
                ) : (
                  <>✗ {(result as any).error}</>
                )}
              </div>
            )}
          </div>
        </Form>
      </section>
    </div>
  );
}

const card: React.CSSProperties = { background: "#fff", border: "1px solid #e1e3e5", borderRadius: 8, padding: 20 };
const btnPrimary: React.CSSProperties = { background: "#008060", color: "#fff", border: 0, padding: "10px 16px", borderRadius: 6, cursor: "pointer", fontWeight: 600 };
const inputStyle: React.CSSProperties = { padding: "8px 10px", border: "1px solid #c9cccf", borderRadius: 6, fontSize: 14 };

function Field({ name, label, required }: { name: string; label: string; required?: boolean }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
      <span style={{ fontWeight: 500 }}>{label}{required && <span style={{ color: "#bf0711" }}> *</span>}</span>
      <input name={name} required={required} style={inputStyle} />
    </label>
  );
}
