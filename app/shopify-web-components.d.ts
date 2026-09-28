// Type declarations for Shopify Polaris web components used in app routes.
// These are loaded at runtime; declare them so TS treats them as known tags.

declare module "react/jsx-runtime" {
  interface IntrinsicElements {
    "s-page": any;
    "s-section": any;
    "s-heading": any;
    "s-text": any;
    "s-button": any;
    "s-link": any;
    "s-form": any;
    "s-banner": any;
    "s-paragraph": any;
    "s-stack": any;
    "s-box": any;
    "s-grid": any;
    "s-checkbox": any;
    "s-text-field": any;
    "s-select": any;
    "s-option-list": any;
    "s-card": any;
    "s-divider": any;
    "s-app": any;
  }
}
