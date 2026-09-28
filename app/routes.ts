import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  layout("routes/app.tsx", [
    index("routes/app._index.tsx"),
    route("discounts", "routes/app.discounts.tsx"),
    route("collections", "routes/app.collections.tsx"),
    route("products/bulk", "routes/app.products.bulk.tsx"),
    route("settings", "routes/app.settings.tsx"),
  ]),
  route("webhooks/discounts/create", "routes/webhooks.discounts.create.tsx"),
  route("webhooks/discounts/update", "routes/webhooks.discounts.update.tsx"),
  route("webhooks/discounts/delete", "routes/webhooks.discounts.delete.tsx"),
  route("cron/check-expiring", "routes/cron.check-expiring.tsx"),
  route("healthcheck", "routes/healthcheck.tsx"),
] satisfies RouteConfig;
