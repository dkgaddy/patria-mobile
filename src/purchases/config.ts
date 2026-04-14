// ── RevenueCat configuration ─────────────────────────────────────────────────
// Set these after creating your app in the RevenueCat dashboard:
//   https://app.revenuecat.com
//
// iOS key:  Project → Apps → iOS → API Key (starts with "appl_")
// Android:  Project → Apps → Android → API Key (starts with "goog_")
// Entitlement identifier: create one named "pro" in RevenueCat dashboard
// Product identifier: create a one-time purchase product in App Store Connect
//   and add it to a RevenueCat Offering, then set PRODUCT_ID below.

export const RC_API_KEY_IOS     = 'appl_yjptHvbjWqgUJEKvCzOQPRUZZAa';
export const RC_API_KEY_ANDROID = 'goog_YOUR_REVENUECAT_ANDROID_KEY';

// The entitlement identifier you created in RevenueCat dashboard
export const ENTITLEMENT_ID = 'Patria Pro';

// The product identifier from App Store Connect / Google Play Console
export const PRODUCT_ID = 'patria_pro_lifetime';
