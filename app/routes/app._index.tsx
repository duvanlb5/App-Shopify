import { json, type LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData } from "react-router";
import shopify from "~/lib/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await shopify.authenticate.admin(request);

  const counts = await admin.graphql(
    `query {
       products(first: 1) { edges { node { id } } }
       collections(first: 1) { edges { node { id } } }
       discountNodes(first: 1, query: "status:active") { edges { node { id } } }
     }`,
  );
  const c = (await counts.json()).data;
  return json({
    products: c.products.edges.length,
    collections: c.collections.edges.length,
    activeDiscounts: c.discountNodes.edges.length,
  });
};

const QUICK = [
  { to: "/app/discounts", title: "Crear descuento", desc: "Porcentaje, monto fijo, BXGY, envío gratis." },
  { to: "/app/collections", title: "Crear colección por SKU", desc: "Pega tus SKUs y se arma la colección." },
  { to: "/app/products/bulk", title: "Subida masiva de productos", desc: "CSV con título, descripción, precio y SKU." },
  { to: "/app/settings", title: "Configurar notificaciones", desc: "Correo destino, días de aviso, plantilla." },
];

export default function Dashboard() {
  const { products, collections, activeDiscounts } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1 style={{ fontSize: 24, margin: "0 0 8px" }}>Inicio</h1>
      <p style={{ color: "#6d7175", marginTop: 0 }}>Resumen de tu tienda y accesos rápidos.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, margin: "24px 0" }}>
        <Stat label="Productos" value={products} />
        <Stat label="Colecciones" value={collections} />
        <Stat label="Descuentos activos" value={activeDiscounts} />
      </div>

      <h2 style={{ fontSize: 18, marginTop: 32 }}>Acciones rápidas</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {QUICK.map((q) => (
          <Link
            key={q.to}
            to={q.to}
            style={{
              background: "#fff",
              border: "1px solid #e1e3e5",
              borderRadius: 8,
              padding: 20,
              textDecoration: "none",
              color: "#202223",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{q.title}</div>
            <div style={{ color: "#6d7175", fontSize: 13 }}>{q.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e1e3e5", borderRadius: 8, padding: 20 }}>
      <div style={{ color: "#6d7175", fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  );
}
