import type { LoaderFunctionArgs } from "react-router";
import shopify from "~/lib/shopify.server";

// Catch-all for /auth/* routes (OAuth begin, session-token exchange, callback, exit-iframe).
// The SDK inspects the request URL and throws a Response (302 redirect or 200 bounce HTML) for
// every /auth/* path. This file MUST stay minimal:
//   - Only the loader (no default export, no ErrorBoundary, no headers)
//   - React Router uses the SDK's thrown Response as-is, without rendering any React tree
//   - This is critical: any default export causes React to hydrate the bounce page as a component,
//     which throws hydration error #418 and kills the App Bridge client script that exchanges the
//     id_token for an offline session token. Without that exchange, every subsequent request returns 401.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await shopify.authenticate.admin(request);
  return null;
};
