import shopify from "./shopify.server";

export interface NotificationSettings {
  recipientEmail: string;
  warningDaysBefore: number;
  notifyOnCreate: boolean;
  notifyOnExpiring: boolean;
  emailSubjectCreate: string;
  emailSubjectExpiring: string;
}

export const DEFAULT_SETTINGS: NotificationSettings = {
  recipientEmail: "alexmta58@gmail.com",
  warningDaysBefore: 3,
  notifyOnCreate: true,
  notifyOnExpiring: true,
  emailSubjectCreate: "Nuevo descuento creado: {code}",
  emailSubjectExpiring: "Descuento por vencer: {code}",
};

const METAFIELD_NAMESPACE = "esprit_tools";
const METAFIELD_KEY = "notification_settings";

export async function getSettings(admin: any): Promise<NotificationSettings> {
  const response = await admin.graphql(
    `query { shop { metafield(namespace: "${METAFIELD_NAMESPACE}", key: "${METAFIELD_KEY}") { value } } }`,
  );
  const { data } = (await response.json()) as { data: { shop: { metafield: { value: string } | null } } };

  const raw = data.shop.metafield?.value;
  if (!raw) return { ...DEFAULT_SETTINGS };

  try {
    const parsed = JSON.parse(raw) as Partial<NotificationSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(admin: any, settings: NotificationSettings): Promise<void> {
  await admin.graphql(
    `mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
       metafieldsSet(metafields: $metafields) {
         metafields { id }
         userErrors { field message }
       }
     }`,
    {
      variables: {
        metafields: [
          {
            ownerId: "gid://shopify/Shop/1",
            namespace: METAFIELD_NAMESPACE,
            key: METAFIELD_KEY,
            type: "json",
            value: JSON.stringify(settings),
          },
        ],
      },
    },
  );
}

export { shopify };
