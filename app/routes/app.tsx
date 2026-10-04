import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import shopify from "~/lib/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await shopify.authenticate.admin(request);
  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    shopDomain: session?.shop || "",
  };
};

export default function App() {
  const { apiKey, shopDomain } = useLoaderData<typeof loader>();
  return (
    <AppProvider embedded apiKey={apiKey}>
      <ui-nav-menu>
        <a href="/app" rel="home">Inicio</a>
        <a href="/app/discounts">Descuentos</a>
        <a href="/app/collections">Colecciones</a>
        <a href="/app/products/bulk">Productos</a>
        <a href="/app/settings">Configuración</a>
      </ui-nav-menu>
      {shopDomain && (
        <div style={{ padding: "10px 20px", background: "#f1f1f1", fontSize: 13, color: "#666" }}>
          Tienda: <strong>{shopDomain}</strong>
        </div>
      )}
      <Outlet />
    </AppProvider>
  );
}

// CRITICAL: Shopify needs React Router to catch some thrown responses
// so that their headers (including the session cookie) are included in the response.
// Without these two exports, embedded apps get 401 on every request after the first.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
