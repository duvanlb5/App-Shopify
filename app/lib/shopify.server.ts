import { shopifyApp, ApiVersion } from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { db } from "./db.server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: process.env.SCOPES?.split(",") ?? [
    "write_products",
    "write_discounts",
    "write_price_rules",
  ],
  appUrl: process.env.HOST ?? "https://esprit-shopify-tools.fly.dev",
  apiVersion: ApiVersion.April25,
  isEmbeddedApp: true,
  sessionStorage: new PrismaSessionStorage(db),
});

export default shopify;
export const apiVersion = ApiVersion.April25;
