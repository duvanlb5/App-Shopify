# Esprit Shopify Tools

App de Shopify embebida (React Router 7 + Polaris + Prisma + Resend) que ofrece a Esprit/GCO:

- **Descuentos** — crear descuentos básicos (`discountCodeBasicCreate`) y ver los activos.
- **Colecciones por SKU** — pegar lista de SKUs y crear la colección automáticamente.
- **Subida masiva de productos** — CSV → `productSet`.
- **Notificaciones por correo** — webhook de creación + cron diario que avisa descuentos por vencer.
- **Configuración** — correo destino, días de aviso, plantillas (todo editable desde la app).

## Stack

- React Router 7 (anteriormente Remix) + Polaris
- Prisma + SQLite (volumen persistente `/data` en Fly.io)
- Resend para envío de correos
- Dockerfile multi-stage

## Variables de entorno (en Fly.io)

| Variable | Descripción |
|---|---|
| `SHOPIFY_API_KEY` | Client ID de la app de Shopify |
| `SHOPIFY_API_SECRET` | Client secret |
| `HOST` | `https://esprit-shopify-tools.fly.dev` |
| `SCOPES` | Lista separada por comas |
| `DATABASE_URL` | `file:/data/prisma/dev.db` (default en fly.toml) |
| `RESEND_API_KEY` | API key de resend.com |
| `NOTIFICATION_FROM_EMAIL` | Remitente de los correos |
| `CRON_SECRET` | Token para el endpoint `/cron/check-expiring` |

## Setup local

```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

## Deploy

```bash
git push     # Fly.io auto-deploys
```

Para activar el cron de "descuentos por vencer", crea un cron job externo (cron-job.org, GitHub Actions, etc.) que llame cada 24h:

```
POST https://esprit-shopify-tools.fly.dev/cron/check-expiring
Header: x-cron-secret: <CRON_SECRET>
```

## Estructura

```
app/
├─ routes/
│  ├─ app.tsx                    layout con nav
│  ├─ app._index.tsx             dashboard
│  ├─ app.discounts.tsx          crear + listar descuentos
│  ├─ app.collections.tsx        crear colección por SKU
│  ├─ app.products.bulk.tsx      subida masiva CSV
│  ├─ app.settings.tsx           config de notificaciones
│  ├─ webhooks.discounts.{create,update,delete}.tsx
│  ├─ cron.check-expiring.tsx    endpoint para cron externo
│  └─ healthcheck.tsx
├─ lib/
│  ├─ shopify.server.ts          cliente Shopify
│  ├─ db.server.ts               Prisma singleton
│  ├─ settings.server.ts         leer/escribir metafield
│  ├─ notifications.server.ts    Resend + plantillas
│  └─ scheduler.server.ts        lógica de "por vencer"
└─ root.tsx                      layout raíz

prisma/
└─ schema.prisma
```

## Migraciones

```bash
npx prisma migrate dev --name <nombre>     # local
npx prisma migrate deploy                   # producción (corre en release de Fly.io)
```
