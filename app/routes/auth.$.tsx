import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import shopify from "~/lib/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  console.log(`[auth.$.tsx] loader called for: ${url.pathname}`);
  console.log(`[auth.$.tsx] searchParams:`, Object.fromEntries(url.searchParams.entries()));
  try {
    await shopify.authenticate.admin(request);
    console.log(`[auth.$.tsx] authenticate.admin returned normally for ${url.pathname}`);
  } catch (e) {
    console.log(`[auth.$.tsx] authenticate.admin THREW for ${url.pathname}:`, e instanceof Response ? `Response status=${e.status}` : e);
    throw e;
  }
  return null;
};

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
