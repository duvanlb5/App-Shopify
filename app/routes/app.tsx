import { type LoaderFunctionArgs } from "react-router";

import { Link, Outlet, useLoaderData, useLocation } from "react-router";

import shopify from "~/lib/shopify.server";

const json = Response.json;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await shopify.authenticate.admin(request);
  const shop = shopify.utils.loadCurrentSession?.(request);
  return json({ shopDomain: shop?.shop ?? "" });
};

const NAV = [
  { to: "/app", label: "Inicio", exact: true },
  { to: "/app/discounts", label: "Descuentos" },
  { to: "/app/collections", label: "Colecciones" },
  { to: "/app/products/bulk", label: "Productos" },
  { to: "/app/settings", label: "Configuración" },
];

export default function AppLayout() {
  const { shopDomain } = useLoaderData<typeof loader>();
  const loc = useLocation();

  return (
    <div style={{ minHeight: "100vh", background: "#f6f6f7", fontFamily: "system-ui, sans-serif" }}>
      <header
        style={{
          background: "#202223",
          color: "#fff",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          gap: 24,
        }}
      >
        <strong style={{ fontSize: 16 }}>Esprit Shopify Tools</strong>
        {shopDomain && <span style={{ color: "#a4acb1", fontSize: 13 }}>{shopDomain}</span>}
      </header>

      <nav
        style={{
          background: "#fff",
          borderBottom: "1px solid #e1e3e5",
          padding: "0 24px",
          display: "flex",
          gap: 4,
        }}
      >
        {NAV.map((n) => {
          const active = n.exact ? loc.pathname === n.to : loc.pathname.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              style={{
                padding: "12px 14px",
                color: active ? "#008060" : "#202223",
                borderBottom: active ? "2px solid #008060" : "2px solid transparent",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: active ? 600 : 400,
              }}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px" }}>
        <Outlet />
      </main>
    </div>
  );
}
