import { type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";

import { Form, useActionData, useLoaderData } from "react-router";

import shopify from "~/lib/shopify.server";

const json = Response.json;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await shopify.authenticate.admin(request);
  return json({});
};

type Product = {
  title: string;
  descriptionHtml?: string;
  vendor?: string;
  productType?: string;
  tags?: string[];
  variants: { sku: string; price: string; barcode?: string; inventoryQty?: number; weight?: number; weightUnit?: string }[];
};

function parseCsv(text: string): Product[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (cells[i] ?? "").trim(); });
    return {
      title: row["title"] || row["título"] || "",
      descriptionHtml: row["description"] || row["body_html"] || row["descripción"],
      vendor: row["vendor"] || row["proveedor"],
      productType: row["type"] || row["product_type"] || row["tipo"],
      tags: (row["tags"] || "").split(";").map((t) => t.trim()).filter(Boolean),
      variants: [
        {
          sku: row["sku"] || "",
          price: row["price"] || row["precio"] || "0",
          barcode: row["barcode"] || row["codigo_barras"],
          inventoryQty: row["inventory"] ? parseInt(row["inventory"], 10) : undefined,
          weight: row["weight"] || row["peso"] ? parseFloat(row["weight"] || row["peso"]) : undefined,
          weightUnit: row["weight_unit"] || row["unidad_peso"] || "kg",
        },
      ],
    } as Product;
  }).filter((p) => p.title);
}

// Simple CSV parser handling quoted fields with commas
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else inQuotes = false;
      } else cur += c;
    } else {
      if (c === ",") { out.push(cur); cur = ""; }
      else if (c === '"') inQuotes = true;
      else cur += c;
    }
  }
  out.push(cur);
  return out;
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await shopify.authenticate.admin(request);
  const form = await request.formData();
  const csv = String(form.get("csv") ?? "");
  const products = parseCsv(csv);
  if (products.length === 0) {
    return json({ ok: false, error: "CSV vacío o sin encabezado 'title'" }, { status: 400 });
  }

  // Build the bulk mutation input
  const productInputs = products.map((p) => ({
    title: p.title,
    descriptionHtml: p.descriptionHtml,
    vendor: p.vendor,
    productType: p.productType,
    tags: p.tags,
    variants: p.variants.map((v) => ({
      sku: v.sku || undefined,
      price: v.price || "0",
      barcode: v.barcode || undefined,
      inventoryItem: {
        sku: v.sku || undefined,
        tracked: v.inventoryQty !== undefined,
        measurement: v.weight ? { weight: { value: v.weight, unit: v.weightUnit?.toUpperCase() ?? "KILOGRAMS" } } : undefined,
      },
      inventoryQuantities: v.inventoryQty !== undefined ? [{ availableQuantity: v.inventoryQty, locationId: "" }] : undefined,
    })),
  }));

  // Use productSet (recommended for sync imports). For very large lists, switch to bulkOperationRunMutation.
  const errors: string[] = [];
  let created = 0;

  for (const input of productInputs) {
    const res = await admin.graphql(
      `mutation productSet($input: ProductSetInput!) {
         productSet(input: $input, synchronous: true) {
           product { id title }
           userErrors { field message }
         }
       }`,
      { variables: { input } },
    );
    const json_ = await res.json();
    const errs = json_.data.productSet.userErrors;
    if (errs?.length) {
      errors.push(`${input.title}: ${errs.map((e: any) => e.message).join("; ")}`);
    } else {
      created++;
    }
  }

  return json({ ok: true, created, total: productInputs.length, errors });
};

export default function BulkProducts() {
  const result = useActionData<typeof action>();
  return (
    <div>
      <h1 style={{ fontSize: 24, margin: "0 0 16px" }}>Subida masiva de productos</h1>
      <section style={card}>
        <p style={{ color: "#6d7175", marginTop: 0 }}>
          CSV con encabezado: <code>title,sku,price,vendor,type,tags,description,inventory,weight,barcode</code>. Una fila por producto.
        </p>
        <Form method="post" style={{ display: "grid", gap: 12 }}>
          <textarea
            name="csv"
            required
            rows={14}
            placeholder={`title,sku,price,vendor,type,tags,inventory
Camiseta Básica,SKU-001,45000,Esprit,Camisetas,verano;oferta,100
Pantalón Jean,SKU-002,89000,Esprit,Pantalones,denim,50`}
            style={{ ...inputStyle, fontFamily: "ui-monospace, monospace", fontSize: 12 }}
          />
          <div>
            <button type="submit" style={btnPrimary}>Subir productos</button>
            {result && (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 6, background: result.ok ? "#e3f1df" : "#fbeae5", color: result.ok ? "#108043" : "#bf0711", fontSize: 14 }}>
                {result.ok ? (
                  <>
                    ✓ <strong>{result.created}</strong> de {result.total} producto(s) creados.
                    {(result as any).errors?.length > 0 && (
                      <details style={{ marginTop: 8 }}>
                        <summary>{(result as any).errors.length} error(es)</summary>
                        <pre style={{ fontSize: 11, whiteSpace: "pre-wrap", margin: "6px 0" }}>{JSON.stringify((result as any).errors, null, 2)}</pre>
                      </details>
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
