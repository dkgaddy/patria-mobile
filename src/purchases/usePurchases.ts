import { useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { RC_API_KEY_IOS, RC_API_KEY_ANDROID, ENTITLEMENT_ID, PRODUCT_ID } from './config';
import { useAppStore } from '../store/useAppStore';

export function usePurchases() {
  const setIsPro = useAppStore(s => s.setIsPro);

  // Initialize RevenueCat once on mount
  useEffect(() => {
    const apiKey = Platform.OS === 'ios' ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;
    Purchases.setLogLevel(LOG_LEVEL.ERROR);
    Purchases.configure({ apiKey });

    // Check current entitlement status
    checkEntitlement();

    // Listen for customer info updates (e.g. renewals, refunds)
    Purchases.addCustomerInfoUpdateListener(info => {
      const active = info.entitlements.active[ENTITLEMENT_ID];
      setIsPro(!!active);
    });
  }, []);

  async function checkEntitlement() {
    try {
      const info = await Purchases.getCustomerInfo();
      const active = info.entitlements.active[ENTITLEMENT_ID];
      setIsPro(!!active);
    } catch (e) {
      console.warn('[Purchases] checkEntitlement error:', e);
    }
  }

  async function purchasePro(): Promise<boolean> {
    try {
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages.find(
        p => p.product.identifier === PRODUCT_ID,
      ) ?? offerings.current?.availablePackages[0];

      if (!pkg) {
        Alert.alert('Not available', 'Unable to load purchase options. Try again later.');
        return false;
      }

      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const active = customerInfo.entitlements.active[ENTITLEMENT_ID];
      setIsPro(!!active);
      return !!active;
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert('Purchase failed', e.message ?? 'Something went wrong. Please try again.');
      }
      return false;
    }
  }

  async function restorePurchases(): Promise<boolean> {
    try {
      const info = await Purchases.restorePurchases();
      const active = info.entitlements.active[ENTITLEMENT_ID];
      setIsPro(!!active);
      if (!active) {
        Alert.alert('No purchase found', 'No previous purchase was found for this account.');
      }
      return !!active;
    } catch (e: any) {
      Alert.alert('Restore failed', e.message ?? 'Something went wrong. Please try again.');
      return false;
    }
  }

  return { purchasePro, restorePurchases };
}
