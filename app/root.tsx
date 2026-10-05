import "@shopify/polaris/build/esm/styles.css";

import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from "react-router";
import type { HeadersFunction } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

export default function App() {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

// CRITICAL for embedded Shopify apps:
// When the SDK throws a Response (e.g. bounce page, OAuth redirect, exit-iframe),
// React Router calls these boundary functions INSTEAD of rendering the default layout.
// Without these, React Router wraps the SDK's thrown HTML in the App layout above,
// causing React hydration error #418 and breaking the App Bridge script that
// exchanges the id_token for an offline session token.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
