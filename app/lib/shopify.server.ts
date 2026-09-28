import { shopifyApp } from "@shopify/shopify-app-react-router/server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: process.env.SCOPES?.split(",") ?? [
    "write_products",
    "write_discounts",
    "write_price_rules",
  ],
  hostName: process.env.HOST?.replace(/^https?:\/\//, "") ?? "esprit-shopify-tools.fly.dev",
  apiVersion: "2025-01",
  isEmbeddedApp: true,
  webhooks: {
    path: "/webhooks",
  },
});

export default shopify;
export const apiVersion = "2025-01";
