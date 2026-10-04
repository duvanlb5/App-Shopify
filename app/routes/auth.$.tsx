import type { LoaderFunctionArgs } from "react-router";
import shopify from "~/lib/shopify.server";

// Catch-all for all /auth/* routes required by the Shopify App Bridge:
//   - /auth             → OAuth begin
//   - /auth/callback    → OAuth callback (Shopify redirects here after install)
//   - /auth/session-token → session token exchange for embedded apps
//   - /auth/exit-iframe → exit iframe wrapper
//   - /auth/login       → login form
// The SDK's authenticate.admin inspects the request URL and routes internally.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await shopify.authenticate.admin(request);
  return null;
};
